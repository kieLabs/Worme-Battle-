from pathlib import Path
import re
root=Path(__file__).parent
mods=['config.js','logic.js','storage.js','worm.js','camera.js','ai.js','food.js','collision.js','powerups.js','particles.js','missions.js','achievements.js','shop.js','game.js','audio.js','ui.js','controls.js','main.js']
bundle=['(function(){\nconst __mods = Object.create(null);']
for filename in mods:
    path=root/'js'/filename
    src=path.read_text()
    # Replace the small, static named-import syntax with references to earlier module exports.
    def replace_import(m):
        names=m.group(1).strip()
        target=Path(m.group(2)).name
        return f"const {{ {names} }} = __mods[{target[:-3]!r}];"
    src=re.sub(r"^import\s*\{([^}]+)\}\s*from\s*['\"]\.\/([^'\"]+)['\"]\s*;\s*$",replace_import,src,flags=re.M)
    exports=[]
    for m in re.finditer(r'^export\s+(?:const|function|class)\s+([A-Za-z_$][\w$]*)',src,re.M):
        exports.append(m.group(1))
    for m in re.finditer(r'^export\s*\{([^}]+)\}\s*;?',src,re.M):
        exports.extend([x.strip().split(' as ')[-1] for x in m.group(1).split(',')])
    src=re.sub(r'^export\s+(?=(?:const|function|class)\s)', '', src, flags=re.M)
    src=re.sub(r'^export\s*\{[^}]+\}\s*;?\s*$', '', src, flags=re.M)
    name=filename[:-3]
    bundle.append(f"\n__mods[{name!r}] = (() => {{\n{src}\nreturn {{{', '.join(dict.fromkeys(exports))}}};\n}})();\n")
bundle.append('})();')
js='\n'.join(bundle)
html=(root/'index.html').read_text()
css=(root/'style.css').read_text()
html=html.replace('<link rel="stylesheet" href="style.css">', '<style>\n'+css+'\n</style>')
html=html.replace('<script type="module" src="js/main.js"></script>', '<script>\n'+js+'\n</script>')
(root/'blogger-single.html').write_text(html)
print(f'Wrote blogger-single.html ({len(html):,} bytes)')
