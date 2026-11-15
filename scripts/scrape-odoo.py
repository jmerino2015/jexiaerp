import urllib.request
import re
import os
from html import unescape

BASE_URL = "https://www.odoo.com/documentation/19.0/es_419/"

def fetch_page(rel_url):
    full_url = BASE_URL + rel_url if not rel_url.startswith("http") else rel_url
    try:
        req = urllib.request.Request(full_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Error fetching {full_url}: {e}")
        return ""

def get_links_from_html(html, current_dir=""):
    links = re.findall(r'<a\s+[^>]*?href=[\'"]([^\'"]+)[\'"][^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
    results = []
    seen = set()
    for href, text in links:
        clean_text = unescape(re.sub(r'<[^>]+>', '', text)).strip()
        if not clean_text or href.startswith('#') or href.startswith('mailto:') or href.startswith('http'):
            continue
        # Normalizar link relativo
        href = href.split('#')[0]
        if not href or href in seen or 'genindex' in href or 'py-modindex' in href:
            continue
        seen.add(href)
        results.append((clean_text, href))
    return results

def main():
    print("=== EXPLORANDO INDICE DE ODOO 19.0 ===")
    index_html = fetch_page("index.html")
    index_links = get_links_from_html(index_html)
    for title, href in index_links:
        print(f"[INDEX] {title} -> {href}")

    print("\n=== EXPLORANDO APPLICATIONS.HTML ===")
    app_html = fetch_page("applications.html")
    app_links = get_links_from_html(app_html)
    for title, href in app_links:
        print(f"[APP] {title} -> {href}")

if __name__ == "__main__":
    main()
