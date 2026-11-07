"""Renders a Markdown design doc to PDF with the same content, headings and tables.
usage: python tools/md2pdf.py "<doc>.md"   (writes "<doc>.pdf" next to it; needs playwright's chromium)"""
import sys, pathlib, markdown, re, subprocess

md_path = pathlib.Path(sys.argv[1])
text = md_path.read_text(encoding='utf-8')
title = re.search(r'(?m)^# (.+)$', text).group(1)
body = markdown.markdown(text, extensions=['tables', 'fenced_code', 'sane_lists'])
css = """
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans+Telugu:wght@400;600&display=swap');
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: 'Noto Sans','Noto Sans Devanagari','Noto Sans Telugu',system-ui,sans-serif; font-size: 10.2pt; line-height: 1.5; color: #2b2724; }
h1 { font-size: 24pt; line-height: 1.15; margin: 0 0 6pt; font-weight: 600; }
h2 { font-size: 17pt; margin: 22pt 0 6pt; font-weight: 600; border-bottom: 1px solid #d8d2c6; padding-bottom: 3pt; page-break-after: avoid; }
h3 { font-size: 12.5pt; margin: 14pt 0 4pt; font-weight: 600; page-break-after: avoid; }
p { margin: 0 0 7pt; } ul, ol { margin: 0 0 8pt 18pt; padding: 0; } li { margin: 2pt 0; }
strong { font-weight: 700; } em { font-style: italic; }
blockquote { margin: 8pt 0; padding: 6pt 10pt; border-left: 3px solid #c97b4a; background: #faf4e6; }
blockquote p { margin: 0; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; font-size: 8.7pt; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th, td { border: 1px solid #d8d2c6; padding: 3pt 5pt; vertical-align: top; text-align: left; }
th { background: #f1ead9; font-weight: 600; }
code { font-family: 'Cascadia Mono', Consolas, monospace; font-size: 8.6pt; background: #f4efe3; padding: 0 2pt; border-radius: 2pt; }
pre { background: #f4efe3; padding: 7pt 9pt; border-radius: 4pt; overflow-wrap: anywhere; white-space: pre-wrap; font-size: 8.4pt; page-break-inside: avoid; }
pre code { background: none; padding: 0; }
hr { border: 0; border-top: 1px solid #d8d2c6; margin: 10pt 0; }
"""
html = f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>{title}</title><style>{css}</style></head><body>{body}</body></html>"
tmp = md_path.with_suffix('.render.html')
tmp.write_text(html, encoding='utf-8')
out = md_path.with_suffix('.pdf')
# printing is done by the project's own Node playwright (tools/print-pdf.mjs)
subprocess.run(['node', str(pathlib.Path(__file__).with_name('print-pdf.mjs')), str(tmp.resolve()), str(out.resolve()), title], check=True)
tmp.unlink()
print('wrote', out.name)
