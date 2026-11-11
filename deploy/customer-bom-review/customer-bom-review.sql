
create schema if not exists forge_portal_review;
revoke all on schema forge_portal_review from public,anon;
grant usage on schema forge_portal_review to authenticated;

create table forge_portal_review.responses (
 id uuid primary key default gen_random_uuid(),
 project_id uuid not null references public.projects(id) on delete cascade,
 version text not null,
 item_id text not null,
 response text not null check (response in ('approved','changes_requested')),
 note text not null default '' check (length(note)<=4000),
 user_id uuid not null references auth.users(id),
 signer text not null,
 created_at timestamptz not null default clock_timestamp()
);
create index responses_project_version on forge_portal_review.responses(project_id,version,created_at desc);
alter table forge_portal_review.responses enable row level security;
revoke all on forge_portal_review.responses from public,anon,authenticated;

create function forge_portal_review.build_package(meta jsonb, scope_data jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare
 pkg jsonb; flags jsonb := '[]'; field record; entry jsonb; txt text; group_key text;
 report jsonb := coalesce(scope_data->'autoScopeAI'->'report','{}');
 version text;
begin
 pkg := coalesce(meta->'portal','{}');
 if jsonb_typeof(meta->'portalDraft')='object' and
   (not (pkg ? 'report') or coalesce(meta->'portalDraft'->>'publishedAt','') > coalesce(pkg->>'publishedAt',''))
 then pkg := meta->'portalDraft'; end if;
 for field in select key,value from jsonb_each(coalesce(scope_data->'fields','{}')) order by key loop
  if coalesce(field.value->>'value','')<>'' and
   (lower(coalesce(field.value->>'status','')) ~ '(verify|rfi|review|conflict|unknown|tbc|check)' or field.key in ('rfi','conflicts'))
  then
   flags := flags || jsonb_build_array(jsonb_build_object('id','scope:'||field.key,'title',field.key,
    'detail',field.value->>'value','source',field.value->>'source','kind','Scope confirmation'));
  end if;
 end loop;
 foreach group_key in array array['verify','warnings','scopeCorrections'] loop
  if jsonb_typeof(report->group_key)='array' then
   for entry in select value from jsonb_array_elements(report->group_key) loop
    txt := case when jsonb_typeof(entry)='string' then entry#>>'{}' else coalesce(entry->>'reason',entry->>'message',entry->>'item',entry::text) end;
    if coalesce(txt,'')<>'' then flags:=flags||jsonb_build_array(jsonb_build_object(
     'id','report:'||group_key||':'||md5(entry::text),'title',coalesce(entry->>'item',entry->>'field','Forge review'),
     'detail',txt,'source',entry->>'source','kind','Forge review')); end if;
   end loop;
  end if;
 end loop;
 if jsonb_typeof(report->'review')='array' then
  for entry in select value from jsonb_array_elements(report->'review') loop
   if upper(coalesce(entry->>'action','')) in ('VERIFY','CHECK','REVIEW') then
    flags:=flags||jsonb_build_array(jsonb_build_object('id','review:'||md5(entry::text),
     'title',coalesce(entry->>'item','Material review'),'detail',coalesce(entry->>'reason','')||
       case when entry ? 'scopeRequirement' then E'\nDrawing requirement: '||(entry->>'scopeRequirement') else '' end,
     'source',entry->>'source','kind','Material confirmation'));
   end if;
  end loop;
 end if;
 if jsonb_array_length(flags)=0 and upper(coalesce(meta->'aiTakeoff'->>'verdict','')) ~ '(REVIEW|DO NOT QUOTE)' then
   flags:=jsonb_build_array(jsonb_build_object('id','review:general','title','Forge review required',
    'detail','Forge marked this package for review. Please record your confirmation or request clarification from your rep.','kind','Forge review'));
 end if;
 version:=md5(jsonb_build_object('model',pkg->'model','report',pkg->'report','flags',flags)::text);
 return jsonb_build_object('portal',pkg,'flags',flags,'version',version,'verdict',meta->'aiTakeoff'->>'verdict');
end $$;
revoke all on function forge_portal_review.build_package(jsonb,jsonb) from public,anon,authenticated;

create function forge_portal_review.get_package(p_project uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 p public.projects%rowtype; uid uuid:=auth.uid(); staff boolean; allowed boolean;
 scope_data jsonb; pkg jsonb; results jsonb; pending int; requested int; bom_approved boolean; state text;
begin
 if uid is null then raise exception 'Sign in to view this job.' using errcode='42501'; end if;
 select * into p from public.projects where id=p_project;
 if not found then raise exception 'Job not available.' using errcode='42501'; end if;
 select exists(select 1 from public.organization_memberships where user_id=uid and organization_id=p.organization_id and status='active') into staff;
 if not staff and not exists(select 1 from public.portal_access_grants where project_id=p.id and organization_id=p.organization_id
   and user_id=uid and status='active' and can_view_documents and (expires_at is null or expires_at>now()))
 then raise exception 'This job is not shared with your account.' using errcode='42501'; end if;
 select (not staff) and exists(select 1 from public.portal_access_grants where project_id=p.id and organization_id=p.organization_id
   and user_id=uid and status='active' and can_view_documents and can_approve and (expires_at is null or expires_at>now())) into allowed;
 select structured_data into scope_data from public.scopes
 where project_id=p.id and organization_id=p.organization_id
 order by (structured_data->>'id'=p.metadata->'aiTakeoff'->>'scopeLocalId') desc nulls last,updated_at desc limit 1 for share;
 pkg:=forge_portal_review.build_package(p.metadata,coalesce(scope_data,'{}'));
 select coalesce(jsonb_agg(to_jsonb(r) order by r.item_id),'[]') into results from (
  select distinct on (item_id) item_id,response,note,signer,created_at,user_id
  from forge_portal_review.responses where project_id=p.id and version=pkg->>'version'
  order by item_id,created_at desc,id desc
 ) r;
 select count(*) into pending from jsonb_array_elements(pkg->'flags') f where not exists
  (select 1 from jsonb_array_elements(results) r where r->>'item_id'=f->>'id' and r->>'response'='approved');
 select count(*) into requested from jsonb_array_elements(results) r where r->>'response'='changes_requested';
 select exists(select 1 from jsonb_array_elements(results) r where r->>'item_id'='bom' and r->>'response'='approved') into bom_approved;
 state:=case when requested>0 then 'changes_requested' when pending=0 and bom_approved then 'customer_approved' else 'awaiting_customer_approval' end;
 return pkg||jsonb_build_object('responses',results,'pending',pending,'status',state,'canApprove',allowed,'staff',staff,
 'hasPreviousVersion',exists(select 1 from forge_portal_review.responses where project_id=p.id and version<>pkg->>'version'));
end $$;
revoke all on function forge_portal_review.get_package(uuid) from public,anon;
grant execute on function forge_portal_review.get_package(uuid) to authenticated;

create function forge_portal_review.respond(p_project uuid,p_version text,p_item text,p_response text,p_note text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pkg jsonb; p public.projects%rowtype; signer text; old_response record;
begin
 if auth.uid() is null then raise exception 'Sign in first.' using errcode='42501'; end if;
 select * into p from public.projects where id=p_project for update;
 pkg:=forge_portal_review.get_package(p_project);
 if not (pkg->>'canApprove')::boolean then raise exception 'Only an authorized customer can approve this BOM.' using errcode='42501'; end if;
 if p_version is distinct from pkg->>'version' then raise exception 'The BOM or model changed. Reload and review the latest version.' using errcode='40001'; end if;
 if p_response is null or p_response not in ('approved','changes_requested') then raise exception 'Choose approve or request changes.'; end if;
 if p_item is null or (p_item<>'bom' and not exists(select 1 from jsonb_array_elements(pkg->'flags') f where f->>'id'=p_item)) then raise exception 'Review item not found.'; end if;
 p_note:=trim(coalesce(p_note,''));
 if length(p_note)>4000 then raise exception 'Keep your response under 4000 characters.'; end if;
 if (p_response='changes_requested' or p_item<>'bom') and length(p_note)<3 then raise exception 'Enter your confirmation, selected specification, or requested change.'; end if;
 if p_item='bom' and p_response='approved' then
  if coalesce(jsonb_array_length(pkg->'portal'->'report'->'bom'),0)=0 then raise exception 'No saved BOM is available to approve.'; end if;
  if (pkg->>'pending')::int>0 then raise exception 'Respond to every flagged item before approving the BOM.'; end if;
 end if;
 select email into signer from auth.users where id=auth.uid();
 select response,note into old_response from forge_portal_review.responses where project_id=p.id and version=p_version and item_id=p_item
  order by created_at desc,id desc limit 1;
 if old_response.response=p_response and old_response.note=p_note then return pkg; end if;
 insert into forge_portal_review.responses(project_id,version,item_id,response,note,user_id,signer)
 values(p.id,p_version,p_item,p_response,p_note,auth.uid(),signer);
 insert into public.activities(organization_id,project_id,customer_id,activity_type,title,body,created_by,source,metadata)
 values(p.organization_id,p.id,p.customer_id,'portal_bom_response',
  case when p_response='approved' then 'Customer approved ' else 'Customer requested changes to ' end||
   case when p_item='bom' then 'BOM' else 'BOM review item' end||' — '||p.name,
  signer||': '||p_note,auth.uid(),'forge-portal',jsonb_build_object('version',p_version,'item',p_item,'response',p_response));
 return forge_portal_review.get_package(p_project);
end $$;
revoke all on function forge_portal_review.respond(uuid,text,text,text,text) from public,anon;
grant execute on function forge_portal_review.respond(uuid,text,text,text,text) to authenticated;

create function public.portal_get_bom_review(p_project uuid)
returns jsonb language sql security invoker set search_path='' as $$
 select forge_portal_review.get_package(p_project);
$$;
create function public.portal_respond_bom_review(p_project uuid,p_version text,p_item text,p_response text,p_note text default '')
returns jsonb language sql security invoker set search_path='' as $$
 select forge_portal_review.respond(p_project,p_version,p_item,p_response,p_note);
$$;
revoke all on function public.portal_get_bom_review(uuid) from public,anon;
revoke all on function public.portal_respond_bom_review(uuid,text,text,text,text) from public,anon;
grant execute on function public.portal_get_bom_review(uuid) to authenticated;
grant execute on function public.portal_respond_bom_review(uuid,text,text,text,text) to authenticated;
