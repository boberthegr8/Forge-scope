# Customer BOM review release
Adds customer approval on saved job pages, including unpublished saved drafts. Shows persisted scope Verify/RFI fields and unresolved AI review items. Approval is separate from quotes and requires an active, unexpired project grant with can_view_documents and can_approve. Staff review responses but cannot approve as a customer.

Responses are append-only and versioned against the model, report and review flags. Project and scope locks protect stale submissions. Material edits are requested changes; approvals update review state, not engineering geometry or quantities. Responses also enter the existing activities feed. No emails are sent.

Source provenance: live production dpl_B7a3z8e6t6bK7zoLcZ2QD1Yovjsf was API deployed and contains files absent from main. Release reuses the EXACT archived source site.gz SHA 701ef63966f7219cc4419907f1a5c6d9e1f1ed7d and overlays only job.html, bom-review.js/css, customers.html/js and core-client.js using deploy/customer-bom-review/build.cjs. Do not deploy the old main root as a replacement for this live archive.

Database: deploy/customer-bom-review/customer-bom-review.sql contains the combined schema/functions migration, including the qualification fix. Private response table is deny-all under RLS; explicitly authorized RPCs are its only client interface. Existing grants are preserved.

Validation: SQL transaction rollback tests cover unshared users, view-only access, expired grants, owner read-only, individual approvals, final approval gating, change requests, stale-version rejection and fresh approval after BOM revision. No real customer approval or persistent test grant was created. Job script and module syntax checked; archived viewer, auth bridge and customer script preserved in first preview.
