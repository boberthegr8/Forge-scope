from pathlib import Path

path = Path('index.html')
text = path.read_text()
old = '  <script src="/forgeSuiteBridge.js"></script>\n  <script src="/forgeCoreScope.js"></script>'
new = '  <script src="/forgeSuiteBridge.js"></script>\n  <script src="/forgeSuiteNav.js"></script>\n  <script src="/forgeCoreScope.js"></script>'
if old not in text:
    raise SystemExit('Expected Scope integration script block was not found; refusing to patch blindly.')
path.write_text(text.replace(old, new, 1))
