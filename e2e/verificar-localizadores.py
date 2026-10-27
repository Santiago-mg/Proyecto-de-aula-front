#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica, SIN navegador, que lo que las pruebas E2E buscan en pantalla existe en el código.

Comprueba:
  1. Cada localizador (id, data-testid, clase, texto de botón/título) de los casos Selenese
     y del mapa de interfaz de Serenity/JS aparece en el código del frontend.
  2. Cada mensaje que se espera ver aparece en el frontend o en el backend.
  3. Reglas de la Clase 18: todo caso verifica algo (assert*) y empieza con la sesión limpia.

Uso:  python3 verificar-localizadores.py [ruta/al/frontend/src] [ruta/al/backend/src]   (o BACKEND_SRC=...)
Sale con código 1 si algo no se encuentra. Es una red de seguridad: avisa cuando un cambio en la
interfaz dejaría rotas las pruebas, pero NO sustituye ejecutarlas en un navegador.
"""
import glob, html, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
# Este script vive en <frontend>/e2e/: el código del frontend está un nivel arriba. El del backend se
# indica como segundo argumento o con la variable BACKEND_SRC (por ejemplo ../../Proyecto-de-aula-mario/src).
FRONT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, '..', 'src')
BACK = sys.argv[2] if len(sys.argv) > 2 else os.environ.get('BACKEND_SRC', os.path.join(AQUI, '..', '..', 'Proyecto-de-aula-mario', 'src'))

def leer(raiz):
    texto = []
    for f in glob.glob(os.path.join(raiz, '**', '*'), recursive=True):
        if os.path.isfile(f) and f.endswith(('.ts', '.tsx', '.css')):
            texto.append(open(f, encoding='utf-8-sig', errors='replace').read())
    return '\n'.join(texto)

if not os.path.isdir(FRONT):
    sys.exit(f'No encuentro el frontend en {FRONT}. Pasa la ruta como primer argumento.')
codigo_front, codigo_back = leer(FRONT), (leer(BACK) if os.path.isdir(BACK) else '')

def _clases_en_mayusculas(css):
    clases = set()
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        if re.search(r'text-transform:\s*uppercase', m.group(2)):
            clases.update(re.findall(r'\.([A-Za-z][\w-]*)', m.group(1)))
    return clases
_css = '\n'.join(open(f, encoding='utf-8-sig', errors='replace').read() for f in glob.glob(os.path.join(FRONT, '**', '*.css'), recursive=True))
MAYUSCULAS = _clases_en_mayusculas(_css)

def _titulos_h1():
    """Todos los <h1> del frontend: (texto fijo, ¿texto dinámico?, ¿se muestra en MAYÚSCULAS?, archivo)."""
    out = []
    for f in glob.glob(os.path.join(FRONT, '**', '*.tsx'), recursive=True):
        t = open(f, encoding='utf-8-sig', errors='replace').read()
        for attrs, cuerpo in re.findall(r'<h1((?:[^>{{]|\{\{.*?\}\})*)>(.*?)</h1>', t, re.S):
            clases = re.findall(r'className="([^"]+)"', attrs)
            clases = clases[0].split() if clases else []
            fijo = ' '.join(re.sub(r'\{[^}]*\}', ' ', cuerpo).split())
            en_mayus = any(c in MAYUSCULAS for c in clases) or 'textTransform' in attrs
            out.append((fijo, '{' in cuerpo, en_mayus, os.path.basename(f)))
    return out
H1 = _titulos_h1()

def revisar_h1(esperado, mostrado, donde):
    """mostrado=True: la prueba lee el texto TAL COMO SE VE (assertText, Text.of): importan las mayúsculas del CSS.
       mostrado=False: la prueba lee el texto del DOM (XPath contains): solo importa que esté escrito igual."""
    base = 'Hola,' if esperado.startswith('Hola,') else esperado.strip()
    candidatos = [h for h in H1 if base in h[0]]
    comprobar(f'existe un <h1> con el texto "{base}" escrito exactamente así (mayúsculas y minúsculas)', bool(candidatos), donde)
    if mostrado and candidatos:
        comprobar(f'el <h1> "{base}" NO se muestra en mayúsculas por el CSS (la prueba lee el texto mostrado)', not any(h[2] for h in candidatos), donde)
todo = codigo_front + '\n' + codigo_back

fallos, comprobaciones = [], 0
def comprobar(descripcion, ok, donde):
    global comprobaciones
    comprobaciones += 1
    if not ok: fallos.append((descripcion, donde))

def existe_id(x): return re.search(r'id=["\']' + re.escape(x) + r'["\']', codigo_front) is not None
def existe_testid(x): return f'data-testid="{x}"' in codigo_front
def existe_clase(x): return x in codigo_front
def existe_texto(x):
    # El saludo del panel es "Hola, " + el nombre: se comprueba la parte fija.
    if x.startswith('Hola, '): x = 'Hola, '
    return x in todo

def revisar_selector(selector, donde):
    for i in re.findall(r'(?<![\w-])#([A-Za-z][\w-]*)', selector): comprobar(f'id #{i}', existe_id(i), donde)
    for t in re.findall(r'data-testid=["\']([^"\']+)["\']', selector): comprobar(f'data-testid "{t}"', existe_testid(t), donde)
    for c in re.findall(r'\.(cp-[\w-]+)', selector): comprobar(f'clase .{c}', existe_clase(c), donde)

def revisar_xpath(xp, donde):
    for t in re.findall(r"normalize-space\(\)\s*=\s*['\"]([^'\"]+)['\"]", xp): comprobar(f'texto de botón "{t}"', existe_texto(t), donde)
    for t in re.findall(r"contains\(\s*\.\s*,\s*['\"]([^'\"$]+)['\"]", xp):
        if t.startswith('QA ') or xp.startswith('//h1'): continue  # dinámico, o título ya revisado con la regla estricta
        comprobar(f'texto "{t}"', existe_texto(t.split(',')[0]) , donde)
    for t in re.findall(r"@aria-label\s*=\s*['\"]([A-Za-zÁÉÍÓÚñ]+)", xp): comprobar(f'aria-label que empieza con "{t}"', f'aria-label={{`{t}' in codigo_front, donde)
    if "@data-testid='alerta'" in xp: comprobar('data-testid "alerta"', existe_testid('alerta'), donde)

# ───────────── 1 y 2: casos Selenese ─────────────
casos = sorted(glob.glob(os.path.join(AQUI, 'katalon', 'TC*.html')))
sin_asercion, sin_limpieza = [], []
for ruta in casos:
    nombre = os.path.basename(ruta)[:-5]
    pasos = [[html.unescape(c).strip() for c in fila] for fila in re.findall(r'<tr><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>', open(ruta, encoding='utf-8').read(), re.S)]
    if not any(p[0].startswith('assert') for p in pasos): sin_asercion.append(nombre)
    if not any(p[0] == 'runScript' and 'localStorage.clear' in p[1] for p in pasos): sin_limpieza.append(nombre)
    for cmd, objetivo, valor in pasos:
        if objetivo.startswith('xpath=//h1'):
            for t in re.findall(r"contains\(\s*\.\s*,\s*'([^'$]+)'", objetivo): revisar_h1(t, False, nombre)
        if cmd == 'assertText' and objetivo == 'css=h1':
            revisar_h1(valor[5:].strip('*') if valor.startswith('glob:') else valor, True, nombre)
        if objetivo.startswith('id='): comprobar(f'id {objetivo[3:]}', existe_id(objetivo[3:]), nombre)
        elif objetivo.startswith('css='): revisar_selector(objetivo[4:], nombre)
        elif objetivo.startswith('xpath='): revisar_xpath(objetivo[6:], nombre)
        if cmd == 'assertText':
            esperado = valor[5:].strip('*') if valor.startswith('glob:') else valor
            ignora_mayusculas = valor.startswith('regexpi:')
            if valor.startswith(('regexp:', 'regexpi:')):          # patrón: se verifica el texto que contiene
                esperado = valor.split(':', 1)[1].strip('^$')
            if '${' in esperado: continue
            ultima = [q for q in pasos if q[0] == 'assertText'][-1]
            if 'FALLA_CONTROLADA' in nombre and [cmd, objetivo, valor] == ultima:  # solo la aserción final es la equivocada a propósito
                comprobar(f'el caso fallido espera "{esperado}", que NO debe existir (así falla a propósito)', not existe_texto(esperado), nombre)
            elif ignora_mayusculas:
                comprobar(f'mensaje "{esperado}" (sin distinguir mayúsculas)', esperado.lower() in todo.lower(), nombre)
            else:
                comprobar(f'mensaje "{esperado}"', existe_texto(esperado), nombre)

# El aviso de confirmación (toast) lleva textTransform: uppercase en línea: assertText exacto fallaría.
_toast = open(os.path.join(FRONT, 'context', 'ToastContext.tsx'), encoding='utf-8-sig').read() if os.path.exists(os.path.join(FRONT, 'context', 'ToastContext.tsx')) else ''
if "textTransform: 'uppercase'" in _toast:
    for ruta in casos:
        for cmd, objetivo, valor in [[html.unescape(c).strip() for c in f] for f in re.findall(r'<tr><td>(.*?)</td><td>(.*?)</td><td>(.*?)</td></tr>', open(ruta, encoding='utf-8').read(), re.S)]:
            if cmd == 'assertText' and 'toast' in objetivo:
                comprobar('el aviso se muestra en MAYÚSCULAS: la aserción usa regexpi: (sin distinguir mayúsculas)', valor.startswith('regexpi:'), os.path.basename(ruta)[:-5])
    _p = os.path.join(AQUI, 'serenityjs', 'features', 'step-definitions', 'web.steps.ts')
    if os.path.exists(_p):
        _s = open(_p, encoding='utf-8').read()
        _c = _s.split("ve la confirmación")[1][:300] if "ve la confirmación" in _s else ''
        comprobar('el paso "ve la confirmación" compara sin distinguir mayúsculas', 'toLowerCase' in _c or 'confirmationLower' in _c, 'web.steps.ts')

# ───────────── Serenity/JS: mapa de interfaz ─────────────
pages = os.path.join(AQUI, 'serenityjs', 'test', 'ui', 'Pages.ts')
if os.path.exists(pages):
    src = open(pages, encoding='utf-8').read()
    for sel in re.findall(r"css\('([^']+)'", src): revisar_selector(sel, 'Serenity Pages.ts')
    for xp in re.findall(r'By\.xpath\(`([^`]+)`\)', src): revisar_xpath(xp.replace('${ texto }', 'X'), 'Serenity Pages.ts')
    for t in re.findall(r'boton\(\'([^\']+)\'\)', src): comprobar(f'texto de botón "{t}"', existe_texto(t), 'Serenity Pages.ts')
# mensajes de los escenarios Gherkin
for ruta in glob.glob(os.path.join(AQUI, 'serenityjs', 'features', '*.feature')):
    for linea in open(ruta, encoding='utf-8').read().splitlines():
        if not re.search(r'\b(observa|ve)\b.*"', linea) and '|' not in linea: continue
        if linea.strip().startswith('#'): continue
        candidatos = re.findall(r'"([^"]+)"', linea)
        if '|' in linea and not candidatos:                      # fila de una tabla de ejemplos
            celdas = [c.strip() for c in linea.strip().strip('|').split('|')]
            candidatos = [c for c in celdas if len(c) > 25]      # solo las celdas que son mensajes
        for m in candidatos:
            if m.startswith('/') or m.startswith('<') or m.startswith('Hola,') or len(m) < 8: continue
            comprobar(f'mensaje Gherkin "{m}"', existe_texto(m) or existe_texto(m.rstrip('.')), os.path.basename(ruta))

# Los títulos del panel se muestran en mayúsculas: los pasos de Serenity que los leen deben comparar sin distinguirlas.
_pasos = os.path.join(AQUI, 'serenityjs', 'features', 'step-definitions', 'web.steps.ts')
if os.path.exists(_pasos):
    _s = open(_pasos, encoding='utf-8').read()
    for paso in ('ve el saludo', 've el título'):
        bloque = re.search(r"Then\('\{persona\} " + paso + r"[^']*'.*?\}\);", _s, re.S)
        comprobar(f'el paso "{paso}" compara sin distinguir mayúsculas', bool(bloque) and 'toLowerCase' in bloque.group(0), 'web.steps.ts')
    _alerta = _s.split("ve que la alerta del celular es")[1][:500] if "ve que la alerta del celular es" in _s else ''
    comprobar('la espera del título de alertas compara sin distinguir mayúsculas', 'toLowerCase' in _alerta or 'headingLower' in _alerta, 'web.steps.ts')

# ───────────── 3: reglas de la Clase 18 ─────────────
for n in sin_asercion: comprobar('el caso verifica algo (assert*)', False, n)
for n in sin_limpieza: comprobar('el caso empieza con la sesión limpia', False, n)
comprobar('hay al menos un caso fallido controlado', os.path.exists(os.path.join(AQUI, 'katalon', 'Suite_Falla_Controlada.html')), 'katalon')

print(f'Casos Selenese revisados: {len(casos)}')
print(f'Comprobaciones realizadas: {comprobaciones}')
if fallos:
    print(f'\nNO SE ENCONTRARON ({len(fallos)}):')
    for d, donde in fallos: print(f'  ✘ {d}   [{donde}]')
    sys.exit(1)
print('✔ Todo localizador, mensaje y regla de la Clase 18 existe en el código.')
