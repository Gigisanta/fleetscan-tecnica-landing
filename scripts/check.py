from html.parser import HTMLParser
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'styles.css').read_text(encoding='utf-8')
js = (ROOT / 'script.js').read_text(encoding='utf-8')

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = 0
        self.ids = set()
        self.anchor_hrefs = []
        self.img_without_alt = []
        self.meta = []
        self.jsonld = []
        self.in_script_jsonld = False
        self.script_buf = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h1':
            self.h1 += 1
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'a' and attrs.get('href','').startswith('#'):
            self.anchor_hrefs.append(attrs['href'][1:])
        if tag == 'img' and not attrs.get('alt'):
            self.img_without_alt.append(attrs.get('src','<inline>'))
        if tag == 'meta':
            self.meta.append(attrs)
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.in_script_jsonld = True
            self.script_buf = []
    def handle_data(self, data):
        if self.in_script_jsonld:
            self.script_buf.append(data)
    def handle_endtag(self, tag):
        if tag == 'script' and self.in_script_jsonld:
            self.jsonld.append(''.join(self.script_buf))
            self.in_script_jsonld = False

p = Parser(); p.feed(html)
errors = []
if p.h1 != 1:
    errors.append(f'expected exactly one h1, found {p.h1}')
for anchor in p.anchor_hrefs:
    if anchor and anchor not in p.ids:
        errors.append(f'broken anchor #{anchor}')
if p.img_without_alt:
    errors.append(f'images missing alt: {p.img_without_alt}')
required_files = ['styles.css', 'script.js', 'favicon.svg', 'og-image.svg', 'robots.txt', 'sitemap.xml']
for name in required_files:
    if not (ROOT / name).exists():
        errors.append(f'missing {name}')
required_html = [
    '<meta name="description"', 'application/ld+json', 'FAQPage', 'AutoRepair',
    'og:image', 'twitter:card', 'canonical', 'Escaneo vehicular', 'diagnóstico electrónico'
]
for token in required_html:
    if token not in html:
        errors.append(f'missing html token {token}')
for blob in p.jsonld:
    try:
        json.loads(blob)
    except json.JSONDecodeError as exc:
        errors.append(f'invalid json-ld: {exc}')
if '@media (prefers-reduced-motion:reduce)' not in css:
    errors.append('missing reduced-motion CSS')
if len(re.findall(r'#[0-9a-fA-F]{3,6}', css)) < 8:
    errors.append('expected explicit color system')
if 'mailto:' not in js:
    errors.append('lead form does not prepare outbound contact')
if 'contacto@fleetscan-tecnica.com' not in js:
    errors.append('missing contact placeholder marker')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print('check ok: h1=1 anchors=%d jsonld=%d files=%d css=%dB js=%dB' % (len(p.anchor_hrefs), len(p.jsonld), len(required_files), len(css), len(js)))
