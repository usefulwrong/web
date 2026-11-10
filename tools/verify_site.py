#!/usr/bin/env python3
"""Validate the exact static directory deployed by GitHub Pages.

Run: python3 tools/verify_site.py site
No third-party packages or network access are required.
"""
from __future__ import annotations
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else 'site').resolve()
ISSUES: list[str] = []

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.resources: list[tuple[str,str]] = []
        self.ids: set[str] = set()
        self.headings: list[str] = []
        self.description = False
        self.canonical = False
        self.main = False
        self.html_lang = False
        self._heading = None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html' and a.get('lang') == 'en': self.html_lang = True
        if tag == 'main': self.main = True
        if tag == 'h1': self.headings.append('h1')
        if tag == 'meta' and a.get('name') == 'description': self.description = True
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical = True
        if 'id' in a:
            if a['id'] in self.ids: ISSUES.append(f'Duplicate id: {a["id"]}')
            self.ids.add(a['id'])
        for key in ['href','src','poster']:
            if a.get(key): self.resources.append((tag,a[key]))
        if a.get('srcset'):
            for item in a['srcset'].split(','):
                src=item.strip().split(' ')[0]
                if src: self.resources.append((tag,src))
        if tag == 'img' and 'alt' not in a: ISSUES.append('Image missing alt text')

def local_file(here: Path, uri: str):
    if uri.startswith(('http://','https://','mailto:','tel:','data:','javascript:','blob:')): return None
    try: s=urlsplit(uri)
    except ValueError: return None
    if not s.path and not s.fragment: return None
    raw=unquote(s.path)
    if raw.startswith('//'): return None
    f = ROOT/raw.lstrip('/') if raw.startswith('/') else here.parent/raw
    if not raw: f=here
    if raw.endswith('/') or f.is_dir(): f=f/'index.html'
    return f.resolve(),s.fragment

if not ROOT.is_dir() or not (ROOT/'index.html').is_file():
    sys.exit('Missing site/ directory or root index.html')

pages=list(ROOT.rglob('*.html'))
for html in pages:
    raw=html.read_text(encoding='utf-8')
    if re.search('[\u0400-\u052f]', raw): ISSUES.append(f'Non-English Cyrillic content: {html.relative_to(ROOT)}')
    p=Page()
    try: p.feed(raw)
    except Exception as exc: ISSUES.append(f'Parse failed: {html}: {exc}')
    for ok,reason in [(p.html_lang,'lang=en'),(p.description,'description'),(p.canonical,'canonical'),(p.main,'main element'),(len(p.headings)==1,'exactly one h1')]:
        # The king's standalone interactive desk has its own no-JS heading.
        if not ok and html.relative_to(ROOT).as_posix()!='works/king-desk/index.html': ISSUES.append(f'{html.relative_to(ROOT)}: missing {reason}')
    for tag,href in p.resources:
        result=local_file(html,href)
        if result is None: continue
        file,fragment=result
        if not file.is_relative_to(ROOT): ISSUES.append(f'{html.relative_to(ROOT)}: escaped site root: {href}'); continue
        if not file.is_file(): ISSUES.append(f'{html.relative_to(ROOT)}: missing {href}'); continue
        if file.suffix=='.html' and fragment and fragment!='top':
            dest=Page();dest.feed(file.read_text(encoding='utf-8'))
            if unquote(fragment) not in dest.ids:
                ISSUES.append(f'{html.relative_to(ROOT)}: missing anchor {href}')

for css in ROOT.rglob('*.css'):
    text=css.read_text(encoding='utf-8')
    if re.search('[\u0400-\u052f]', text): ISSUES.append(f'Non-English CSS: {css.relative_to(ROOT)}')
    for url in re.findall(r'url\(\s*[\'"]?([^\)\'\"]+)',text):
        f=local_file(css,url.strip())
        if f and not f[0].is_file(): ISSUES.append(f'{css.relative_to(ROOT)}: missing url {url}')
for js in list(ROOT.rglob('*.js'))+list(ROOT.rglob('*.mjs')):
    text=js.read_text(encoding='utf-8')
    if re.search('[\u0400-\u052f]',text): ISSUES.append(f'Non-English code: {js.relative_to(ROOT)}')
    for uri in re.findall(r'(?:from\s*|import\s*\()\s*[\'"]([^\'"]+)',text):
        if uri.startswith('.'):
            f=(js.parent/uri).resolve()
            if not f.is_file(): ISSUES.append(f'{js.relative_to(ROOT)}: missing import {uri}')

for forbidden in ['experiments/index.html','assets/studio.js','assets/studio.css','assets/room-study-v1.png']:
    if (ROOT/forbidden).exists(): ISSUES.append(f'Development-only file found in deploy: {forbidden}')
if any((ROOT/'.agents').exists() for _ in [0]): ISSUES.append('Internal skills are in public site')
if ISSUES:
    print('FAILED — '+str(len(ISSUES))+' issue(s)')
    for x in ISSUES: print(' - '+x)
    sys.exit(1)
print(f'PASS: {len(pages)} pages, {len(list(ROOT.rglob("*")))} deploy paths, all checked local references and code language.')
print('Deploy size: %.2f MiB' % (sum(p.stat().st_size for p in ROOT.rglob('*') if p.is_file())/1024**2))
