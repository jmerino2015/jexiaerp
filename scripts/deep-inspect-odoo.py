import urllib.request
import re
from html import unescape

BASE = "https://www.odoo.com/documentation/19.0/es_419/"

def get_page_summary(rel):
    url = BASE + rel
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        html = urllib.request.urlopen(req, timeout=12).read().decode("utf-8", errors="ignore")
        title_m = re.search(r'<title>(.*?)</title>', html, re.I | re.S)
        title = unescape(title_m.group(1)).split('—')[0].strip() if title_m else rel

        # Buscar títulos principales del contenido
        headings = re.findall(r'<h[23][^>]*>(.*?)</h[23]>', html, re.I | re.S)
        clean_headings = []
        for h in headings:
            clean = unescape(re.sub(r'<[^>]+>', '', h)).strip().replace('¶', '')
            if clean and clean not in ['Navegación', 'Índice'] and clean not in clean_headings:
                clean_headings.append(clean)

        # Buscar enlaces internos específicos de este módulo
        body_m = re.search(r'<section[^>]*>(.*?)</section>', html, re.I | re.S)
        body = body_m.group(1) if body_m else html
        internal_links = re.findall(r'<a\s+[^>]*?href=[\'"]([^\'"]+)[\'"][^>]*>(.*?)</a>', body, re.I | re.S)
        clean_links = []
        seen = set()
        for h, t in internal_links:
            txt = unescape(re.sub(r'<[^>]+>', '', t)).strip()
            if not txt or h.startswith('#') or h.startswith('http') or h.startswith('../..') or h in seen:
                continue
            seen.add(h)
            clean_links.append((txt, h))

        return {
            "title": title,
            "headings": clean_headings[:8],
            "links": clean_links[:15]
        }
    except Exception as e:
        return {"title": rel, "headings": [], "links": []}

modules = [
    ("Contabilidad & Facturación", "applications/finance/accounting.html"),
    ("Inventario & Almacenes", "applications/inventory_and_mrp/inventory.html"),
    ("Compras & Abastecimiento", "applications/inventory_and_mrp/purchase.html"),
    ("Ventas & Cotizaciones", "applications/sales/sales.html"),
    ("Punto de Venta (POS)", "applications/sales/point_of_sale.html"),
    ("E-commerce Retail", "applications/websites/ecommerce.html"),
    ("Contactos (Directorio Partner)", "applications/essentials/contacts.html"),
    ("Arquitectura ORM & APIs", "developer/reference/backend/orm.html"),
]

for name, rel in modules:
    info = get_page_summary(rel)
    print(f"\n### {name} [{info['title']}]")
    print(f"URL: {BASE}{rel}")
    if info['headings']:
        print("  Secciones Clave:", ", ".join(info['headings'][:6]))
    if info['links']:
        print("  Enlaces Internos de Procesos:")
        for t, h in info['links'][:8]:
            print(f"    - {t} -> {h}")
