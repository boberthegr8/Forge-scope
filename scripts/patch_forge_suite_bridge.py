from pathlib import Path

path = Path('index.html')
html = path.read_text(encoding='utf-8')
marker = '<script src="/forgeSuiteBridge.js"></script>'

if marker in html:
    print('Forge Suite bridge is already injected.')
else:
    if '</body>' not in html:
        raise SystemExit('Could not find </body> in index.html')
    html = html.replace('</body>', f'  {marker}\n</body>', 1)
    path.write_text(html, encoding='utf-8')
    print('Injected Forge Suite bridge into index.html')
