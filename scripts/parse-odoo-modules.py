import urllib.request
import re
from html import unescape

BASE = "https://www.odoo.com/documentation/19.0/es_419/"

def get_toc(rel):
    url = BASE + rel
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
        links = re.findall(r'<a\s+[^>]*?href=[\'"]([^\'"]+)[\'"][^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
        clean = []
        seen = set()
        for h, t in links:
            txt = unescape(re.sub(r'<[^>]+>', '', t)).strip()
            if not txt or h.startswith('#') or h.startswith('http') or 'genindex' in h or h in seen:
                continue
            seen.add(h)
            clean.append((txt, h))
        return clean
    except Exception as e:
        print(f"Error {rel}: {e}")
        return []

targets = [
    ("Contabilidad y Facturación", "applications/finance/accounting.html"),
    ("Inventario & Almacenes", "applications/inventory_and_mrp/inventory.html"),
    ("Compras & Abastecimiento", "applications/inventory_and_mrp/purchase.html"),
    ("Ventas & Cotizaciones", "applications/sales/sales.html"),
    ("Punto de Venta (POS)", "applications/sales/point_of_sale.html"),
    ("Comercio Electrónico", "applications/websites/ecommerce.html"),
    ("Contactos (Partners)", "applications/essentials/contacts.html"),
]

for label, t in targets:
    print(f"\n==================== {label} ({t}) ====================")
    toc = get_toc(t)
    for title, href in toc[:15]:
        print(f"  * {title} -> {href}")
