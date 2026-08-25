from pathlib import Path

path = Path('forgeCoreScope.js')
text = path.read_text(encoding='utf-8')

bad_reader = "source: row.source === 'forge-scope-reader' ? 'forge-reader' : 'forge-scope'"
if bad_reader not in text:
    raise SystemExit('Unexpected Reader source marker not found')
text = text.replace(bad_reader, "source: 'forge-reader'", 1)

open_marker = """      sourceDocumentId: row.source_document_id || restored.core?.sourceDocumentId || null,
      source: 'forge-reader'
"""
open_fixed = """      sourceDocumentId: row.source_document_id || restored.core?.sourceDocumentId || null,
      source: row.source === 'forge-scope-reader' ? 'forge-reader' : 'forge-scope'
"""
if open_marker not in text:
    raise SystemExit('openCoreScope source marker not found')
text = text.replace(open_marker, open_fixed, 1)

path.write_text(text, encoding='utf-8')
print('Fixed Reader and generic Scope source labels.')
