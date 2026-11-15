import urllib.request
import subprocess
import os

routes = [
    ("http://localhost:3000/inicio", "public/screenshots/dashboard_inicio.png", "public/screenshots/inicio_render.html"),
    ("http://localhost:3000/finanzas", "public/screenshots/finanzas_cxc.png", "public/screenshots/finanzas_render.html"),
    ("http://localhost:3000/inventario", "public/screenshots/inventario_lotes.png", "public/screenshots/inventario_render.html"),
]

os.makedirs("public/screenshots", exist_ok=True)
edge = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

for url, png_rel, html_rel in routes:
    png_file = os.path.abspath(png_rel)
    html_file = os.path.abspath(html_rel)
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')

    html = html.replace('href="/', 'href="http://localhost:3000/')
    html = html.replace('src="/', 'src="http://localhost:3000/')

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html)

    cmd = [
        edge,
        "--headless",
        "--disable-gpu",
        "--window-size=1366,820",
        f"--screenshot={png_file}",
        f"file:///{html_file.replace(os.sep, '/')}"
    ]

    subprocess.run(cmd, capture_output=True)
    if os.path.exists(png_file):
        print(f"Capturado {png_rel}: {os.path.getsize(png_file)} bytes")
    else:
        print(f"Error capturando {png_rel}")
