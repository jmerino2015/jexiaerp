import os
import subprocess
from PIL import Image

html_content = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #FFFFFF;
    width: 700px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
  }
  svg {
    width: 650px;
    height: 180px;
  }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 96" fill="none">
  <defs>
    <linearGradient id="barOrangeLight" x1="18" y1="54" x2="32" y2="78" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>
    <linearGradient id="barBlueLight" x1="38" y1="40" x2="52" y2="78" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#1E40AF" />
    </linearGradient>
    <linearGradient id="barGreenLight" x1="58" y1="18" x2="72" y2="78" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>
  <path d="M25 71C25 77 34 80 45 80C56 80 65 77 65 71" stroke="#CBD5E1" stroke-width="4.5" stroke-linecap="round" />
  <rect x="18" y="54" width="14" height="24" rx="7" fill="url(#barOrangeLight)" />
  <rect x="38" y="40" width="14" height="38" rx="7" fill="url(#barBlueLight)" />
  <rect x="58" y="18" width="14" height="60" rx="7" fill="url(#barGreenLight)" />
  <text x="88" y="55" fill="#0F172A" font-family="'Segoe UI', Inter, system-ui, sans-serif" font-size="37" font-weight="900" letter-spacing="-0.03em">Jexia</text>
  <text x="188" y="55" fill="#10B981" font-family="'Segoe UI', Inter, system-ui, sans-serif" font-size="37" font-weight="700" letter-spacing="-0.02em">ERP</text>
  <text x="90" y="74" fill="#64748B" font-family="'Segoe UI', Inter, system-ui, sans-serif" font-size="11.5" font-weight="600" letter-spacing="0.03em">Ordena, controla y haz crecer tu negocio</text>
</svg>
</body>
</html>"""

html_path = os.path.abspath("scripts/logo_render.html")
png_raw_path = os.path.abspath("scripts/logo_raw.png")
png_final_path = os.path.abspath("public/jexia_logo_word.png")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
cmd = [
    edge_exe,
    "--headless",
    "--disable-gpu",
    "--window-size=700,200",
    f"--screenshot={png_raw_path}",
    f"file:///{html_path.replace(os.sep, '/')}"
]

print("Ejecutando msedge headless para renderizar logo...")
subprocess.run(cmd, check=True)

if os.path.exists(png_raw_path):
    img = Image.open(png_raw_path)
    # Recortar bordes si es necesario o guardar
    bbox = img.getbbox()
    if bbox:
        # Añadir pequeño margen
        w, h = img.size
        cropped = img.crop((max(0, bbox[0]-10), max(0, bbox[1]-10), min(w, bbox[2]+10), min(h, bbox[3]+10)))
        cropped.save(png_final_path, "PNG")
        print(f"Logo guardado exitosamente en: {png_final_path} ({cropped.size})")
    else:
        img.save(png_final_path, "PNG")
        print(f"Logo guardado exitosamente en: {png_final_path}")
