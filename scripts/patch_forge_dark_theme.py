from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
tag = '  <link rel="stylesheet" href="/forgeTheme.css">\n'

if tag in text:
    print('Forge dark theme already attached.')
elif '</head>' not in text:
    raise SystemExit('Could not find </head> in index.html')
else:
    path.write_text(text.replace('</head>', tag + '</head>', 1), encoding='utf-8')
    print('Attached Forge dark theme stylesheet.')
