from pathlib import Path

path = Path('forgeCoreScope.js')
text = path.read_text(encoding='utf-8')
original = text

old = """  function worksheetForCore(scope) {
    const clean = JSON.parse(JSON.stringify(scope || {}));
    delete clean.coreVersion;
    if (clean.readerAnalysis?.extractedData?.pages) delete clean.readerAnalysis.extractedData.pages;
    return clean;
  }
"""
new = """  function worksheetForCore(scope) {
    const clean = JSON.parse(JSON.stringify(scope || {}));
    // Local UI/cache timestamps are intentionally excluded from Core content hashing/versioning.
    delete clean.updatedAt;
    delete clean.coreVersion;
    delete clean.coreSyncedAt;
    if (clean.readerAnalysis?.extractedData?.pages) delete clean.readerAnalysis.extractedData.pages;
    return clean;
  }
"""
if old not in text:
    raise SystemExit('worksheetForCore marker not found')
text = text.replace(old, new, 1)

old = ".eq('organization_id',context.organizationId).eq('source','forge-scope-reader').order('updated_at',{ascending:false}).limit(100)"
new = ".eq('organization_id',context.organizationId).in('source',['forge-scope','forge-scope-reader']).order('updated_at',{ascending:false}).limit(100)"
if old not in text:
    raise SystemExit('Core scope query marker not found')
text = text.replace(old, new, 1)

start = text.index("  async function syncScope(scope = (typeof current !== 'undefined' ? current : null)) {")
end = text.index("\n  function templateOptions", start)
new_sync = """  async function syncScope(scope = (typeof current !== 'undefined' ? current : null)) {
    if (!scope) return null;
    const context = await getContext();
    if (!context?.organizationId) throw new Error('Sign into Forge Core before saving this scope.');

    if (!scope.coreScopeId) {
      scope.coreScopeId = crypto.randomUUID();
      scope.core = {
        ...(scope.core || {}),
        organizationId: context.organizationId,
        locationId: context.locationId || null,
        projectId: scope.core?.projectId || null,
        customerId: scope.core?.customerId || null,
        sourceDocumentId: scope.core?.sourceDocumentId || null,
        source: scope.core?.sourceDocumentId ? 'forge-reader' : 'forge-scope'
      };
      if (typeof upsertCurrent === 'function' && typeof current !== 'undefined' && current?.id === scope.id) upsertCurrent();
    } else {
      scope.core = {
        ...(scope.core || {}),
        organizationId: context.organizationId,
        locationId: context.locationId || scope.core?.locationId || null,
        projectId: scope.core?.projectId || null,
        customerId: scope.core?.customerId || null,
        sourceDocumentId: scope.core?.sourceDocumentId || null,
        source: scope.core?.sourceDocumentId ? 'forge-reader' : 'forge-scope'
      };
    }

    const client = await coreClient();
    const { data, error } = await client.rpc('commit_scope_v1', {
      p_scope_id: scope.coreScopeId,
      p_organization_id: context.organizationId,
      p_location_id: context.locationId || null,
      p_project_id: scope.core.projectId || null,
      p_customer_id: scope.core.customerId || null,
      p_source_document_id: scope.core.sourceDocumentId || null,
      p_scope_type: scope.type,
      p_title: scope.fields?.projectName?.value || 'Untitled Scope',
      p_structured_data: worksheetForCore(scope)
    });
    if (error) throw error;

    const result = data?.[0];
    if (result) {
      scope.coreVersion = result.version_number;
      scope.coreSyncedAt = new Date().toISOString();
      if (typeof upsertCurrent === 'function' && typeof current !== 'undefined' && current?.id === scope.id) upsertCurrent();
      if (typeof notifySaved === 'function') {
        notifySaved(result.changed
          ? `Saved to Forge Core • v${result.version_number}`
          : `Forge Core already current • v${result.version_number}`);
      }
    }
    return result;
  }
"""
text = text[:start] + new_sync + text[end:]

old = "source: 'forge-reader'"
new = "source: row.source === 'forge-scope-reader' ? 'forge-reader' : 'forge-scope'"
if old not in text:
    raise SystemExit('openCoreScope source marker not found')
text = text.replace(old, new, 1)

text = text.replace("No Reader-linked Core scopes yet.", "No Core scopes yet.", 1)
text = text.replace("<strong>Core-linked scopes</strong><span>Reopen Reader-linked worksheets from another browser.</span>", "<strong>Core scopes</strong><span>Reopen manual, AI-assisted or Reader-linked worksheets from another browser.</span>", 1)
text = text.replace("<h2>Reader → Scope</h2>", "<h2>Forge Scope + Reader</h2>", 1)
text = text.replace("${coreState.context?.organizationId?'Core Reader':'Connect Core'}", "${coreState.context?.organizationId?'Forge Core':'Connect Core'}", 1)

old = """  if (typeof saveCurrent === 'function') {
    const priorSaveCurrent = saveCurrent;
    saveCurrent = function forgeCoreScopeSaveWrapper() {
      priorSaveCurrent();
      if (typeof current !== 'undefined' && current?.coreScopeId && current?.core?.sourceDocumentId) {
        void syncScope(current).catch(error => {
          console.error('Forge Core Scope save failed', error);
          if (typeof notifySaved === 'function') notifySaved('Saved locally • Core sync failed');
        });
      }
    };
  }

  window.ForgeScopeCore = { openPanel, loadCore, syncScope, getContext };
"""
new = """  if (typeof saveCurrent === 'function') {
    const priorSaveCurrent = saveCurrent;
    saveCurrent = function forgeCoreScopeSaveWrapper() {
      priorSaveCurrent();
      if (typeof current !== 'undefined' && current && coreState.context?.organizationId) {
        void syncScope(current).catch(error => {
          console.error('Forge Core Scope save failed', error);
          if (typeof notifySaved === 'function') notifySaved('Saved locally • Core sync failed');
        });
      }
    };
  }

  if (typeof duplicateProject === 'function') {
    const priorDuplicateProject = duplicateProject;
    duplicateProject = function forgeCoreSafeDuplicateProject(id) {
      priorDuplicateProject(id);
      const copy = typeof saved !== 'undefined' ? saved?.[0] : null;
      if (!copy || copy.id === id) return;
      delete copy.coreScopeId;
      delete copy.coreVersion;
      delete copy.coreSyncedAt;
      if (copy.core) {
        copy.core = {
          ...copy.core,
          source: copy.core.sourceDocumentId ? 'forge-reader' : 'forge-scope'
        };
      }
      if (typeof persist === 'function') persist();
      if (typeof render === 'function') render();
    };
  }

  window.ForgeScopeCore = { openPanel, loadCore, syncScope, getContext };
"""
if old not in text:
    raise SystemExit('save wrapper marker not found')
text = text.replace(old, new, 1)

if text == original:
    raise SystemExit('No changes made')
path.write_text(text, encoding='utf-8')
print('Patched Forge Scope generic Core persistence.')
