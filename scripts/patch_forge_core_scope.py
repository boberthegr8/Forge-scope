from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
bridge_tag = '  <script src="/forgeSuiteBridge.js"></script>\n'
core_tag = '  <script src="/forgeCoreScope.js"></script>\n'

if core_tag in text:
    print('Forge Core Scope script already attached.')
elif bridge_tag not in text:
    raise SystemExit('Could not find Forge Suite Bridge script tag in index.html')
else:
    path.write_text(text.replace(bridge_tag, bridge_tag + core_tag, 1), encoding='utf-8')
    print('Attached Forge Core Scope script after Forge Suite Bridge.')
