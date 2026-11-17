import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_document():
    doc = docx.Document()

    # 1. Configuración de Márgenes y Páginas (Estándar Ejecutivo A4 / Carta: 2.5 cm en todos los márgenes)
    for section in doc.sections:
        section.top_margin = Inches(0.85)
        section.bottom_margin = Inches(0.85)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        section.different_first_page_header_footer = True

        # Encabezado (páginas siguientes a portada)
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("JEXIA ERP v2.0 — Manual de Operaciones y Alcance Funcional")
        hrun.font.name = "Segoe UI"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(100, 116, 139) # slate-500

        # Pie de página
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("Jexia ERP © 2026 | Claridad operativa para crecer sin límites    —    Página ")
        frun.font.name = "Segoe UI"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(100, 116, 139)

    # Colores de la Solución Jexia
    COLOR_PRIMARY = RGBColor(15, 23, 42)    # #0F172A Slate 900
    COLOR_BLUE = RGBColor(37, 99, 235)      # #2563EB Blue 600
    COLOR_GREEN = RGBColor(16, 185, 129)    # #10B981 Emerald 500
    COLOR_MUTED = RGBColor(100, 116, 139)   # #64748B Slate 500
    COLOR_DARK = RGBColor(30, 41, 59)       # #1E293B Slate 800

    def set_cell_background(cell, hex_color):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin_name, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{margin_name}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    def add_callout(text, title="NOTA IMPORTANTE", callout_type="info"):
        bg_color = "F0F9FF" if callout_type == "info" else ("FEF3C7" if callout_type == "warning" else "ECFDF5")
        border_color = "2563EB" if callout_type == "info" else ("F59E0B" if callout_type == "warning" else "10B981")
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
        tcPr.append(borders)

        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(2)
        cp.paragraph_format.space_after = Pt(2)
        r_title = cp.add_run(f"[{title}] ")
        r_title.bold = True
        r_title.font.name = "Segoe UI"
        r_title.font.size = Pt(9.5)
        r_title.font.color.rgb = RGBColor(37, 99, 235) if callout_type == "info" else (RGBColor(217, 119, 6) if callout_type == "warning" else RGBColor(5, 150, 105))

        r_text = cp.add_run(text)
        r_text.font.name = "Segoe UI"
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = COLOR_DARK
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def style_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Segoe UI"
        run.font.size = Pt(16)
        run.font.color.rgb = COLOR_BLUE
        return p

    def style_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Segoe UI"
        run.font.size = Pt(12.5)
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def style_heading_3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(9)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.bold = True
        run.font.name = "Segoe UI"
        run.font.size = Pt(10.5)
        run.font.color.rgb = COLOR_DARK
        return p

    def add_p(text, bold_prefix=None, space_after=4):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.bold = True
            rb.font.name = "Segoe UI"
            rb.font.size = Pt(9.5)
            rb.font.color.rgb = COLOR_DARK
        r = p.add_run(text)
        r.font.name = "Segoe UI"
        r.font.size = Pt(9.5)
        r.font.color.rgb = COLOR_DARK
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.bold = True
            rb.font.name = "Segoe UI"
            rb.font.size = Pt(9.5)
            rb.font.color.rgb = COLOR_DARK
        r = p.add_run(text)
        r.font.name = "Segoe UI"
        r.font.size = Pt(9.5)
        r.font.color.rgb = COLOR_DARK
        return p

    def add_screenshot(img_rel_path, caption):
        img_path = os.path.abspath(img_rel_path)
        if os.path.exists(img_path):
            tbl = doc.add_table(rows=1, cols=1)
            tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            cell = tbl.cell(0, 0)
            set_cell_background(cell, "FFFFFF")
            set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
            # Borde sutil alrededor de la captura
            tcPr = cell._tc.get_or_add_tcPr()
            borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/><w:top w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/><w:right w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/></w:tcBorders>')
            tcPr.append(borders)

            cp = cell.paragraphs[0]
            cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
            cp.paragraph_format.space_before = Pt(4)
            cp.paragraph_format.space_after = Pt(4)
            cp.add_run().add_picture(img_path, width=Inches(6.4))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(3)
            p_cap.paragraph_format.space_after = Pt(12)
            r_cap = p_cap.add_run(f"Figura: {caption}")
            r_cap.font.name = "Segoe UI"
            r_cap.font.size = Pt(8.5)
            r_cap.font.italic = True
            r_cap.font.color.rgb = COLOR_MUTED

    # =========================================================================
    # 1. PORTADA CORPORATIVA
    # =========================================================================
    logo_path = os.path.abspath("public/jexia_logo_word.png")
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(30)
        p_logo.paragraph_format.space_after = Pt(20)
        p_logo.add_run().add_picture(logo_path, width=Inches(3.3))

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(8)
    p_title.paragraph_format.space_after = Pt(4)
    r_main_title = p_title.add_run("JEXIA ERP — EDICIÓN EMPRESARIAL")
    r_main_title.bold = True
    r_main_title.font.name = "Segoe UI"
    r_main_title.font.size = Pt(23)
    r_main_title.font.color.rgb = COLOR_PRIMARY

    p_subtitle = doc.add_paragraph()
    p_subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subtitle.paragraph_format.space_after = Pt(20)
    r_sub = p_subtitle.add_run("MANUAL DE OPERACIONES Y DOCUMENTO DE ALCANCE FUNCIONAL DEL SISTEMA\nEstructurado bajo los Estándares de Documentación Odoo 19 y Defontana ERP\nCumplimiento Normativo SUNAT UBL 2.1, GRE 09, SPOT y PCGE 2019")
    r_sub.font.name = "Segoe UI"
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = COLOR_MUTED

    # Línea decorativa
    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_after = Pt(28)
    r_line = p_line.add_run("—" * 38)
    r_line.font.color.rgb = COLOR_BLUE

    # Cuadro de Metadatos de la Portada
    tbl_meta = doc.add_table(rows=6, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Versión del Software:", "Jexia ERP v2.0 (Edición Empresarial Producción)"),
        ("Lema y Filosofía:", "Claridad operativa para crecer sin límites"),
        ("Público Objetivo:", "MYPES y PYMES de Retail, Comercio, Manufactura Textil y Servicios (Perú)"),
        ("Fecha de Publicación:", "Noviembre 2026"),
        ("Nivel de Documentación:", "Manual Técnico-Funcional Detallado Paso a Paso (Odoo / Defontana Style)"),
        ("Conformidad Tributaria:", "SUNAT Facturación Electrónica UBL 2.1, GRE 09, SIRE y PLE 5.1"),
    ]
    for i, (k, v) in enumerate(meta_data):
        c0 = tbl_meta.cell(i, 0)
        c1 = tbl_meta.cell(i, 1)
        c0.width = Inches(2.3)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F8FAFC")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, 60, 60, 90, 90)
        set_cell_margins(c1, 60, 60, 90, 90)
        p0 = c0.paragraphs[0]
        p0.add_run(k).bold = True
        p0.runs[0].font.name = "Segoe UI"
        p0.runs[0].font.size = Pt(9)
        p0.runs[0].font.color.rgb = COLOR_DARK
        p1 = c1.paragraphs[0]
        p1.add_run(v)
        p1.runs[0].font.name = "Segoe UI"
        p1.runs[0].font.size = Pt(9)
        p1.runs[0].font.color.rgb = COLOR_DARK

    doc.add_page_break()

    # =========================================================================
    # 2. CONTROL DE VERSIONES Y APROBACIONES
    # =========================================================================
    style_heading_2("CONTROL DE VERSIONES Y APROBACIONES DEL DOCUMENTO")
    tbl_rev = doc.add_table(rows=3, cols=4)
    tbl_rev.alignment = WD_TABLE_ALIGNMENT.CENTER
    rev_headers = ["Versión", "Fecha", "Autor / Responsable", "Descripción de Cambios"]
    for j, h in enumerate(rev_headers):
        cell = tbl_rev.cell(0, j)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)

    rev_rows = [
        ("1.0", "14/11/2026", "Equipo de Arquitectura Jexia", "Diseño inicial, Core ERP, Facturación SUNAT UBL 2.1 y Kardex 13.1"),
        ("2.0", "15/11/2026", "Equipo de Desarrollo Jexia", "Transferencias Multi-Almacén GRE 09, Lotes FEFO, Cobranzas PCGE y Screenshots")
    ]
    for i, row in enumerate(rev_rows, start=1):
        for j, val in enumerate(row):
            cell = tbl_rev.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 60, 60, 90, 90)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8.5)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # =========================================================================
    # 3. PANTALLA PRINCIPAL DEL SISTEMA (PRINT DE PANTALLA DE INICIO)
    # =========================================================================
    style_heading_1("INTERFAZ GRÁFICA Y PANTALLA DE INICIO DEL SISTEMA")
    add_p("A continuación se presenta la captura real del Dashboard Ejecutivo de Jexia ERP (/inicio). Esta pantalla centraliza en una sola vista los indicadores vitales de la empresa, alertas de stock mínimo, gráfico de ventas y comprobantes emitidos en tiempo real.")

    add_screenshot("public/screenshots/dashboard_inicio.png", "Pantalla de Inicio de Jexia ERP — Dashboard Ejecutivo con KPIs en Tiempo Real, Alertas de Stock Crítico y Menú Lateral Plegable con Logotipo Oficial.")

    add_callout(
        "La interfaz ha sido diseñada para optimizar la toma de decisiones: en la parte superior se observa el logotipo corporativo tricolor con el lema empresarial, el botón de colapso de menú para maximizar el área de trabajo, y cuatro tarjetas inteligentes de métricas financieras y operativas.",
        "DISEÑO EJECUTIVO",
        "info"
    )

    doc.add_page_break()

    # =========================================================================
    # 4. PARTE I: ALCANCE INTEGRAL DEL SISTEMA (SRS)
    # =========================================================================
    style_heading_1("PARTE I: DOCUMENTO DE ALCANCE DEL SISTEMA (PROJECT SCOPE / SRS)")
    
    add_p("El objetivo del sistema Jexia ERP es erradicar el descontrol operativo y tributario en las empresas peruanas mediante una arquitectura transaccional de micro-acciones ACID construida sobre Next.js 15, PostgreSQL 17 y Prisma ORM.")

    style_heading_2("1. Arquitectura de Integración de Procesos (End-to-End)")
    add_p("Inspirado en la ingeniería de flujos de Odoo 19 y Defontana ERP, Jexia ERP conecta de forma indivisible los siguientes eslabones:")
    add_bullet(" Al recibir una orden o vender en POS, el sistema reserva o descuenta existencias en el almacén físico seleccionado.", "Inventario en Tiempo Real: ")
    add_bullet(" Toda entrada o salida actualiza el costo ponderado del producto y genera el registro en el Formato SUNAT 13.1.", "Kardex Permanente: ")
    add_bullet(" Generación de XML UBL 2.1 con firma digital, hash SHA-256 y Constancia de Recepción (CDR) oficial.", "Facturación Electrónica: ")
    add_bullet(" Si la operación es a crédito, se programan cuotas con fecha de vencimiento conforme a la Res. SUNAT 193-2020.", "Cuentas por Cobrar/Pagar: ")
    add_bullet(" En el mismo milisegundo en que se crea el comprobante o se concilia un cobro, se genera el asiento de partida doble en el Libro Diario.", "Contabilidad Oficial PCGE: ")

    style_heading_2("2. Estructura de Desglose del Trabajo (WBS / EDT)")
    tbl_wbs = doc.add_table(rows=9, cols=3)
    tbl_wbs.alignment = WD_TABLE_ALIGNMENT.CENTER
    wbs_headers = ["Paquete EDT", "Módulos y Capacidades del Sistema", "Base Normativa"]
    for j, h in enumerate(wbs_headers):
        cell = tbl_wbs.cell(0, j)
        set_cell_background(cell, "1E3A5F")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)

    wbs_data = [
        ("EDT 01: Datos Maestros (MDM)", "Directorio de Clientes (RUC/DNI/Ubigeo), Proveedores (CCI/Banco de la Nación SPOT) y Catálogo de Productos (SKU/EAN-13/UNSPSC).", "R.S. 193-2020 / Cat. 03, 07, 25, 54"),
        ("EDT 02: Ventas & Facturación", "POS, Facturas 01, Boletas 03, Cotizaciones, Notas de Crédito 07, Detracciones SPOT, A4 y Ticket.", "SUNAT UBL 2.1 / D.L. 940"),
        ("EDT 03: E-commerce Retail", "Catálogo B2C online, carrito, checkout delivery/pickup, pasarelas de pago y facturación.", "Comercio Electrónico"),
        ("EDT 04: Compras & Costos", "Órdenes de Compra (OC01), recepción de mercadería, cálculo automático de costo promedio.", "Abastecimiento"),
        ("EDT 05: Inventario & Logística", "Kardex 13.1, Lotes y FEFO (ProductLot), Transferencias Multi-Almacén y GRE 09.", "SUNAT Res. 123-2022"),
        ("EDT 06: Cobranzas & Pagos", "Cuentas por cobrar (1212), cuentas por pagar (4212), cuotas a crédito, conciliación bancaria.", "SUNAT Res. 193-2020 / PCGE"),
        ("EDT 07: Contabilidad General", "Plan contable a 5 dígitos, Libro Diario automático, exportación SIRE (RVIE/RCE) y PLE 5.1.", "PCGE 2019 / MEF"),
        ("EDT 08: Analítica & KPIs", "Márgenes brutos, envejecimiento de cartera, rotación de existencias y ranking de productos.", "Gestión Gerencial")
    ]
    for i, row in enumerate(wbs_data, start=1):
        for j, val in enumerate(row):
            cell = tbl_wbs.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 60, 60, 90, 90)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8.5)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    style_heading_2("3. Gestión Integral de Datos Maestros (Master Data Management - MDM)")
    add_p("El principio rector de Jexia ERP establece que la calidad de los procesos transaccionales (facturación, compras, inventario y contabilidad) depende estrictamente del gobierno centralizado y la consistencia de sus Datos Maestros. El sistema estructura la información base en tres entidades maestras inviolables:")
    
    add_bullet("Centraliza los datos de personas naturales y jurídicas. Incluye validación de RUC (11 dígitos, Tipo 6 SUNAT) y DNI (8 dígitos, Tipo 1) con verificación de estado tributario (Activo/Habido), georreferenciación oficial por código de Ubigeo INEI a 6 dígitos (Departamento, Provincia, Distrito), asignación de listas de precios (Minorista, Mayorista, Distribuidor), límites de crédito comercial en PEN/USD, plazos a crédito normados (Res. 193-2020) y buzón de correo para despacho electrónico automático del XML, CDR y PDF.", "3.1 Maestro de Clientes (Directorio Comercial): ")

    add_bullet("Homologación rigurosa de empresas proveedoras de bienes y servicios para garantizar la deducibilidad tributaria del crédito fiscal de IGV y gasto del Impuesto a la Renta. Administra cuentas bancarias comerciales con Código de Cuenta Interbancario (CCI a 20 dígitos) para pagos masivos y Cuenta Corriente de Detracciones del Banco de la Nación (11 dígitos) obligatoria para transacciones sujetas a SPOT (D.L. 940).", "3.2 Maestro de Proveedores (Directorio de Abastecimiento): ")

    add_bullet("Matriz central de bienes tangibles y servicios. Incorpora triple codificación (SKU interno único, Código de barras universal EAN-13/UPC para lectores ópticos y Código de Producto SUNAT UNSPSC a 8 dígitos según Catálogo 25), unidad de medida estándar (Catálogo 03: NIU, ZZ, BX, KGM, MTR), régimen tributario de afectación al IGV (10 Gravado, 20 Exonerado, 30 Inafecto), sujeción a detracción SPOT (Catálogo 54), mapeo contable PCGE automático (Cuentas 70121, 60111, 20111, 69121, 61111), costeo promedio ponderado móvil en Kardex 13.1, stocks mínimos por almacén, trazabilidad de lotes con caducidad FEFO y sincronización directa con la tienda E-commerce retail.", "3.3 Catálogo Maestro de Productos y Servicios: ")

    doc.add_page_break()

    # =========================================================================
    # 5. PARTE II: MANUAL DETALLADO DE OPERACIONES (ODOO / DEFONTANA STYLE)
    # =========================================================================
    style_heading_1("PARTE II: MANUAL DE OPERACIONES Y FUNCIONALIDADES DETALLADAS")
    add_p("La presente sección documenta cada proceso bajo la estructura técnica de los manuales de referencia mundial (Odoo y Defontana), desglosando objetivo, prerrequisitos, campos del formulario, reglas de negocio, impacto contable y kardex.")

    # -------------------------------------------------------------------------
    # PROCESO 0.1: MAESTRO DE CLIENTES
    # -------------------------------------------------------------------------
    style_heading_2("Proceso 0.1: Gestión y Alta de Datos Maestros de Clientes")
    add_p("0.1.1 Objetivo del Proceso: ", "A. ")
    add_p("Registrar, normalizar y administrar el directorio de clientes corporativos y consumidores finales, asegurando la validez tributaria del documento de identidad ante SUNAT/RENIEC, configurando políticas de crédito comercial y habilitando los canales para la entrega automática de comprobantes electrónicos.")

    add_p("0.1.2 Prerrequisitos de Operación: ", "B. ")
    add_bullet("Contar con el número de RUC (11 dígitos) o DNI (8 dígitos) del cliente.")
    add_bullet("Definición previa de las listas de precios de la empresa y políticas de crédito.")

    add_p("0.1.3 Estructura de Campos del Formulario Maestro de Clientes: ", "C. ")
    tbl_cli_fields = doc.add_table(rows=8, cols=4)
    tbl_cli_fields.alignment = WD_TABLE_ALIGNMENT.CENTER
    cli_f_headers = ["Campo", "Tipo / Formato", "Obligatorio", "Descripción y Regla de Negocio"]
    for j, h in enumerate(cli_f_headers):
        cell = tbl_cli_fields.cell(0, j)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 70, 70, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    cli_fields = [
        ("Tipo de Documento", "Selector (RUC, DNI, CE, PASAPORTE)", "Sí", "Define el tipo de documento según Catálogo 06 de SUNAT (6=RUC, 1=DNI, 4=CE, 7=Pasaporte)."),
        ("Número de Documento", "Texto numérico (11 o 8 dígitos)", "Sí", "Valida longitud y algoritmo de dígito verificador. Consulta condición Habido y Activo."),
        ("Razón Social / Nombres", "Texto libre", "Sí", "Nombre legal del cliente. Se imprime en el encabezado de la Factura o Boleta."),
        ("Nombre Comercial / Alias", "Texto opcional", "No", "Nombre de fantasía o sucursal para búsqueda ágil en mostrador POS."),
        ("Dirección y Ubigeo INEI", "Texto y selector a 6 dígitos", "Sí (Factura)", "Domicilio fiscal estructurado (Dep/Prov/Dist) exigido por SUNAT para traslado y entrega."),
        ("Correo de Facturación", "Email válido", "Sí (FE)", "Buzón electrónico donde el sistema envía automáticamente el XML, CDR y PDF oficial."),
        ("Línea de Crédito y Plazo", "Moneda (S/ PEN) y Días", "No", "Monto máximo autorizado y plazo acordado (15, 30, 45 días) para cuotas a crédito.")
    ]
    for i, row in enumerate(cli_fields, start=1):
        for j, val in enumerate(row):
            cell = tbl_cli_fields.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 50, 50, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------------------
    # PROCESO 0.2: MAESTRO DE PROVEEDORES
    # -------------------------------------------------------------------------
    style_heading_2("Proceso 0.2: Homologación y Registro del Maestro de Proveedores")
    add_p("0.2.1 Objetivo del Proceso: ", "A. ")
    add_p("Homologar y registrar a los proveedores de bienes y servicios de la empresa, validando su condición de contribuyente Habido ante SUNAT para proteger el derecho al crédito fiscal del IGV, y estructurando sus cuentas bancarias comerciales y de detracciones SPOT para tesorería.")

    add_p("0.2.2 Prerrequisitos de Operación: ", "B. ")
    add_bullet("RUC activo del proveedor verificado en el portal SUNAT.")
    add_bullet("Certificación bancaria con Código de Cuenta Interbancario (CCI) y número de cuenta de detracciones BN si aplica.")

    add_p("0.2.3 Estructura de Campos del Formulario Maestro de Proveedores: ", "C. ")
    tbl_prov_fields = doc.add_table(rows=7, cols=4)
    tbl_prov_fields.alignment = WD_TABLE_ALIGNMENT.CENTER
    for j, h in enumerate(cli_f_headers):
        cell = tbl_prov_fields.cell(0, j)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 70, 70, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    prov_fields = [
        ("RUC del Proveedor", "Numérico 11 dígitos", "Sí", "Identificador tributario Tipo 6 SUNAT. Valida obligatoriamente condición de Habido."),
        ("Razón Social y Dirección", "Texto alfanumérico", "Sí", "Nombre legal del proveedor y dirección de recojo o despacho con código de Ubigeo."),
        ("Cuentas Comerciales y CCI", "Texto (20 dígitos CCI)", "Sí", "Cuentas bancarias (BCP, BBVA, Interbank, etc.) para abono y transferencias masivas."),
        ("Cuenta Detracciones BN", "Texto (11 dígitos)", "Condicional", "Cuenta Corriente en el Banco de la Nación para depósito obligatorio de SPOT (D.L. 940)."),
        ("Términos de Compra", "Selector (Contado / Crédito)", "Sí", "Condición contractual habitual (ej. Factura a 30 días con cuotas pactadas)."),
        ("Contacto y Teléfono", "Texto y número", "No", "Ejecutivo de cuentas para seguimiento de órdenes de compra y facturación electrónica.")
    ]
    for i, row in enumerate(prov_fields, start=1):
        for j, val in enumerate(row):
            cell = tbl_prov_fields.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 50, 50, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------------------
    # PROCESO 0.3: MAESTRO DE PRODUCTOS Y SERVICIOS
    # -------------------------------------------------------------------------
    style_heading_2("Proceso 0.3: Catalogación y Parametrización del Maestro de Productos")
    add_p("0.3.1 Objetivo del Proceso: ", "A. ")
    add_p("Parametrizar de forma integral los artículos comerciales y servicios de la empresa, definiendo su tipología fiscal, códigos de trazabilidad (SKU, EAN-13, UNSPSC), parámetros de inventario multialmacén, control de vencimiento FEFO y vinculación contable automática.")

    add_p("0.3.2 Prerrequisitos de Operación: ", "B. ")
    add_bullet("Estructura de categorías y marcas definida en el sistema.")
    add_bullet("Determinación de la afectación tributaria al IGV (Gravado 10, Exonerado 20 o Inafecto 30) y código SUNAT.")

    add_p("0.3.3 Estructura de Campos del Formulario de Catálogo de Productos: ", "C. ")
    tbl_prod_fields = doc.add_table(rows=10, cols=4)
    tbl_prod_fields.alignment = WD_TABLE_ALIGNMENT.CENTER
    for j, h in enumerate(cli_f_headers):
        cell = tbl_prod_fields.cell(0, j)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 70, 70, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    prod_fields = [
        ("Código SKU", "Alfanumérico único", "Sí", "Código interno de referencia rápida en la empresa para control de inventarios."),
        ("Código de Barras (EAN-13)", "Numérico 13 dígitos", "No", "Código de barras óptico escaneable con pistolas lectoras en mostrador POS."),
        ("Código SUNAT (UNSPSC)", "Numérico 8 dígitos", "Sí (FE)", "Código del Catálogo 25 de SUNAT exigido para emisión de Facturación UBL 2.1."),
        ("Descripción / Nombre", "Texto descriptivo", "Sí", "Denominación comercial del producto. Se imprime en comprobantes y tienda web."),
        ("Tipo de Ítem", "Bien Físico / Servicio", "Sí", "Determina si el producto afecta el Kardex físico o es un intangible sin stock."),
        ("Unidad de Medida", "Selector Catálogo 03 SUNAT", "Sí", "Unidad oficial: NIU (Unidades), ZZ (Servicios), BX (Cajas), KGM (Kilogramos)."),
        ("Tipo de Afectación IGV", "Selector Catálogo 07", "Sí", "10=Gravado Oneroso (18%), 20=Exonerado (Apéndice I), 30=Inafecto por ley."),
        ("Sujeción a SPOT", "Check y Código Cat. 54", "Condicional", "Si aplica detracción, consigna el código de servicio y porcentaje (ej. 12%)."),
        ("Precios y Stock Mínimo", "Valores numéricos en S/", "Sí", "Precio de Venta al Público (PVP con IGV) y umbral de alerta para reposición.")
    ]
    for i, row in enumerate(prod_fields, start=1):
        for j, val in enumerate(row):
            cell = tbl_prod_fields.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 50, 50, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------------------
    # PROCESO 1: VENTAS Y FACTURACIÓN ELECTRÓNICA
    # -------------------------------------------------------------------------
    style_heading_2("Proceso 1: Emisión de Facturas y Boletas Electrónicas (UBL 2.1)")
    add_p("1.1 Objetivo del Proceso: ", "A. ")
    add_p("Emitir comprobantes de pago electrónicos con plena validez tributaria ante SUNAT, formalizando la transferencia de bienes o prestación de servicios, garantizando el descuento físico de stock y la contabilización automática del ingreso y el débito fiscal.")

    add_p("1.2 Prerrequisitos de Operación: ", "B. ")
    add_bullet("Cliente registrado en el sistema con RUC (11 dígitos para Facturas) o DNI (8 dígitos para Boletas).")
    add_bullet("Productos dados de alta en el Catálogo con precio de venta y stock disponible en el almacén emisor.")
    add_bullet("Serie correlativa autorizada configurada (F001 para Facturas, B001 para Boletas).")

    add_p("1.3 Descripción Detallada de Campos del Formulario de Venta (POS): ", "C. ")
    tbl_pos_fields = doc.add_table(rows=7, cols=4)
    tbl_pos_fields.alignment = WD_TABLE_ALIGNMENT.CENTER
    pos_f_headers = ["Campo", "Tipo / Formato", "Obligatorio", "Descripción y Regla de Negocio"]
    for j, h in enumerate(pos_f_headers):
        cell = tbl_pos_fields.cell(0, j)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 70, 70, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    pos_fields = [
        ("Tipo de Documento", "Selector (BOLETA / FACTURA / NOTA_CREDITO / COTIZACION)", "Sí", "Define el código SUNAT (03, 01, 07 o COT) y la serie correlativa a utilizar."),
        ("Cliente", "Buscador con autocompletado", "Sí", "Asocia el documento al receptor. Si es Factura, valida que el RUC sea válido."),
        ("Líneas de Producto", "Selector de Ítems", "Sí", "Permite ingresar múltiples productos. Valida existencia de stock en almacén."),
        ("Cantidad", "Numérico (mayor a 0)", "Sí", "Número de unidades a despachar. Genera el decremento en el almacén físico."),
        ("Precio Unitario", "Moneda (S/ PEN)", "Sí", "Precio de venta pactado. Incluye IGV del 18% para cálculo inverso o directo."),
        ("Medio de Pago", "Selector (EFECTIVO / TRANSFERENCIA / YAPE / CREDITO)", "Sí", "Si se elige CREDITO, habilita condición a plazos (15, 30, 45, 60 días).")
    ]
    for i, row in enumerate(pos_fields, start=1):
        for j, val in enumerate(row):
            cell = tbl_pos_fields.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 50, 50, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_p("1.4 Impacto Contable Automático (Asiento en Libro Diario): ", "D. ")
    add_p("Al confirmar la emisión del comprobante, Jexia ERP genera automáticamente en el Libro Diario el siguiente asiento contable cuadrado:")
    add_bullet("Debe: Cuenta 1212 (Facturas, Boletas y otros comprobantes por cobrar - Emitidas en cartera) por el Total (100%).")
    add_bullet("Haber: Cuenta 40111 (IGV - Cuenta propia 18%) por el débito fiscal.")
    add_bullet("Haber: Cuenta 70121 (Venta local de mercaderías) por el subtotal gravado.")
    add_bullet("Asiento de Costo de Ventas Simultáneo: Debe 69121 (Costo de ventas) vs. Haber 20111 (Mercaderías manufacturadas) valorizado al costo promedio exacto del Kardex.")

    add_p("1.5 Impacto en Almacenes e Inventario (Kardex 13.1): ", "E. ")
    add_bullet("Decremento inmediato de las unidades en el almacén de despacho.")
    add_bullet("Generación de una línea de salida en el Kardex tipo SALIDA_VENTA vinculada al número de comprobante emitido.")

    # -------------------------------------------------------------------------
    # PROCESO 2: CONTROL DE LOTES Y VENCIMIENTOS (FEFO)
    # -------------------------------------------------------------------------
    style_heading_2("Proceso 2: Control de Lotes y Fechas de Vencimiento (Trazabilidad FEFO)")
    add_p("2.1 Objetivo del Proceso: ", "A. ")
    add_p("Monitorear el ciclo de vida de productos con vencimiento o partidas de producción (alimentos, cosméticos, químicos, prendas de vestir por lote de confección), garantizando que las partidas próximas a caducar se despachen primero conforme al método FEFO (First Expired, First Out).")

    add_screenshot("public/screenshots/inventario_lotes.png", "Módulo de Inventario de Jexia ERP — Control de Lotes y Fechas de Vencimiento con Indicadores Visuales Semánticos (Disponible, Por Vencer y Vencido).")

    add_p("2.2 Clasificación de Estados y Alertas Inteligentes: ", "B. ")
    tbl_lotes = doc.add_table(rows=4, cols=3)
    tbl_lotes.alignment = WD_TABLE_ALIGNMENT.CENTER
    lotes_headers = ["Estado del Lote", "Criterio de Cálculo Temporal", "Comportamiento del Sistema y Acción Recomendada"]
    for j, h in enumerate(lotes_headers):
        cell = tbl_lotes.cell(0, j)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 70, 70, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    lotes_data = [
        ("DISPONIBLE (Verde)", "Fecha de Vencimiento > Fecha Actual + Días de Alerta", "Partida con vida útil óptima. Habilitada para venta y transferencias regulares."),
        ("POR VENCER (Ámbar)", "Fecha Actual <= Fecha de Vencimiento <= Fecha Actual + Alerta", "Alerta preventiva. Aplica política FEFO sugiriendo su despacho prioritario o promoción."),
        ("VENCIDO (Rojo)", "Fecha de Vencimiento < Fecha Actual", "Partida caducada. El sistema bloquea su despacho comercial y sugiere dar de baja o merma.")
    ]
    for i, row in enumerate(lotes_data, start=1):
        for j, val in enumerate(row):
            cell = tbl_lotes.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 50, 50, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # PROCESO 3: TRANSFERENCIAS MULTI-ALMACÉN Y GRE REMITENTE (09)
    # -------------------------------------------------------------------------
    style_heading_2("Proceso 3: Transferencias Multi-Almacén y Guías de Remisión Remitente (GRE 09)")
    add_p("3.1 Objetivo del Proceso: ", "A. ")
    add_p("Permitir el traslado formal de existencias entre diferentes sucursales, plantas o depósitos de la empresa, cumpliendo con la obligación tributaria de emitir la Guía de Remisión Electrónica Remitente (GRE - Tipo SUNAT 09) bajo el estándar UBL 2.1 DespatchAdvice.")

    add_p("3.2 Paso a Paso Operativo: ", "B. ")
    add_bullet("Paso 1: Diríjase a /inventario y presione la pestaña 'Transferencias & GRE (09)'.")
    add_bullet("Paso 2: Presione el botón 'Nueva Transferencia / GRE'.")
    add_bullet("Paso 3: Seleccione el Almacén Origen (ej: ALM01 Almacén Central Lima) y el Almacén Destino (ej: ALM02 Tienda Gamarra).")
    add_bullet("Paso 4: Seleccione el producto (ej: POLO VERANO COLOR ROJO TALLA L) e indique la cantidad a trasladar.")
    add_bullet("Paso 5: Ingrese la información del transporte (Modalidad privada 02 o pública 01, datos del conductor con DNI y Licencia de conducir, vehículo con placa de rodaje, peso total en kilogramos y direcciones con código de Ubigeo).")
    add_bullet("Paso 6: Presione 'Emitir Transferencia y GRE Remitente'.")

    add_p("3.3 Validación y Salidas Oficiales de la GRE: ", "C. ")
    add_bullet("Se genera el archivo XML DespatchAdvice firmado digitalmente con código Hash SHA-256.")
    add_bullet("Se descuenta el stock en el Almacén Origen y se abona en el Almacén Destino en una única transacción atómica.")
    add_bullet("Se generan dos movimientos en el Kardex: TRANSFERENCIA_SALIDA y TRANSFERENCIA_ENTRADA manteniendo el costo promedio ponderado.")
    add_bullet("La guía puede visualizarse e imprimirse en formato A4 con su código QR tributario para ser portada por el transportista.")

    # -------------------------------------------------------------------------
    # PROCESO 4: COBRANZAS, PAGOS Y CONCILIACIÓN BANCARIA
    # -------------------------------------------------------------------------
    style_heading_2("Proceso 4: Cobranzas, Pagos y Conciliación Bancaria (CXC / CXP)")
    add_p("4.1 Objetivo del Proceso: ", "A. ")
    add_p("Monitorear el flujo monetario de la empresa, controlando las facturas a crédito pendientes de cobro a clientes (PCGE 1212) y las deudas con proveedores (PCGE 4212), permitiendo registrar amortizaciones totales o parciales y conciliando con las cuentas bancarias.")

    add_screenshot("public/screenshots/finanzas_cxc.png", "Módulo de Finanzas de Jexia ERP — Control de Cuentas por Cobrar (CXC), Cuentas por Pagar (CXP) y Registro de Pagos con Conciliación Bancaria.")

    add_p("4.2 Guía Paso a Paso para Registrar un Cobro de Factura: ", "B. ")
    add_bullet("Paso 1: Ingrese al módulo /finanzas en la pestaña 'Cuentas por Cobrar (Clientes)'.")
    add_bullet("Paso 2: Localice la factura a amortizar (ej: F001-000020 de Corporación Textil del Sur S.A.C.).")
    add_bullet("Paso 3: Presione el botón azul 'Cobrar' para desplegar el modal de conciliación.")
    add_bullet("Paso 4: Verifique el saldo pendiente actual. El sistema sugiere el saldo total, pero permite ingresar cualquier importe parcial.")
    add_bullet("Paso 5: Indique la fecha de la operación, el medio de pago (Transferencia Bancaria, Depósito, Yape, Tarjeta o Efectivo).")
    add_bullet("Paso 6: Especifique la cuenta bancaria de destino (ej: BCP Soles Cta Cte) y el N° de Operación Bancaria / Voucher (ej: OP-9842103).")
    add_bullet("Paso 7: Presione 'Confirmar Operación'.")

    add_p("4.3 Dinámica Contable de la Cobranza (Partida Doble Automática): ", "C. ")
    add_bullet("Debe: Cuenta 1041 (Cuentas Corrientes Operativas en Bancos) por el importe cobrado.")
    add_bullet("Haber: Cuenta 1212 (Facturas y Boletas Emitidas en Cartera) por el importe cobrado.")
    add_bullet("Si la factura tenía cuotas programadas (PaymentSchedule), el sistema las amortiza automáticamente bajo el método cronológico FIFO.")

    # -------------------------------------------------------------------------
    # PROCESO 5: COMPRAS Y GESTIÓN DE PROVEEDORES
    # -------------------------------------------------------------------------
    style_heading_2("Proceso 5: Compras y Abastecimiento de Mercaderías")
    add_p("5.1 Objetivo del Proceso: ", "A. ")
    add_p("Administrar la cadena de suministro, desde la emisión de la Orden de Compra (OC) hasta la recepción física en bodega y la vinculación de la factura emitida por el proveedor.")

    add_p("5.2 Recálculo Automático del Costo Promedio Ponderado: ", "B. ")
    add_p("Al presionar 'Recibir Mercadería' en una Orden de Compra, Jexia ERP ejecuta la siguiente fórmula en milisegundos:")
    add_callout(
        "Nuevo Costo Promedio = [(Stock Físico Actual x Costo Promedio Actual) + (Cantidad Ingresada x Costo Unitario de Compra)] / (Stock Físico Actual + Cantidad Ingresada)\nEsto garantiza que las valorizaciones de inventario para balances generales y SUNAT reflejen con precisión matemática la realidad económica.",
        "ACTUALIZACIÓN AUTOMÁTICA DE COSTOS",
        "info"
    )

    # -------------------------------------------------------------------------
    # PROCESO 6: CONTABILIDAD PCGE Y LIBROS ELECTRÓNICOS SIRE / PLE
    # -------------------------------------------------------------------------
    style_heading_2("Proceso 6: Contabilidad General PCGE 2019 y Libros Electrónicos")
    add_p("6.1 Objetivo del Proceso: ", "A. ")
    add_p("Mantener la contabilidad al día sin intervención manual repetitiva, garantizando que el Libro Diario registre cada transacción con partida doble y generando los archivos oficiales para los sistemas de libros electrónicos de SUNAT.")

    add_p("6.2 Generación de Archivos para SIRE y PLE 5.1: ", "B. ")
    add_bullet("SIRE RVIE (Formato 14.1): Archivo estructurado de texto plano con el registro detallado de todas las ventas emitidas en el periodo tributario.")
    add_bullet("SIRE RCE (Formato 8.1): Archivo estructurado con las adquisiciones y compras recibidas en el periodo tributario.")
    add_bullet("PLE Libro Diario (Formato 5.1): Exportación de todos los asientos contables con sus códigos de cuenta a 5 dígitos y glosas explicativas.")

    doc.add_page_break()

    # =========================================================================
    # 6. MATRIZ DE PREGUNTAS FRECUENTES Y CASOS ESPECIALES
    # =========================================================================
    style_heading_1("PREGUNTAS FRECUENTES, ERRORES COMUNES Y RESOLUCIÓN")
    
    tbl_faq = doc.add_table(rows=5, cols=3)
    tbl_faq.alignment = WD_TABLE_ALIGNMENT.CENTER
    faq_headers = ["Situación Operativa", "Causa o Explicación", "Procedimiento de Solución en Jexia ERP"]
    for j, h in enumerate(faq_headers):
        cell = tbl_faq.cell(0, j)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 70, 70, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    faq_data = [
        ("Cliente solicita anular una factura ya aceptada por SUNAT", "No es posible eliminar el registro físico debido a la inmutabilidad tributaria.", "Emita una Nota de Crédito (07) en /ventas seleccionando motivo '01 Anulación de la operación'. El sistema reintegrará el stock y generará el asiento de ajuste."),
        ("El sistema no permite emitir un comprobante por falta de existencias", "La regla de control de stock impide que el almacén quede con existencias negativas.", "Verifique si hay una compra pendiente por recepcionar o realice una Transferencia Multi-Almacén desde otra sede con stock disponible."),
        ("Un lote figura con semáforo rojo (VENCIDO)", "La fecha de vencimiento configurada en el lote ha sido superada por la fecha actual.", "Retenga la partida para evitar su despacho comercial. Si corresponde mermar el producto, registre la baja contable."),
        ("El cliente paga una factura a crédito en dos partes", "Venta emitida bajo condición de crédito (ej: CREDITO_30).", "Ingrese a /finanzas, presione 'Cobrar' y digite el monto del primer abono. La factura quedará en estado PARCIAL hasta el pago del saldo final.")
    ]
    for i, row in enumerate(faq_data, start=1):
        for j, val in enumerate(row):
            cell = tbl_faq.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 50, 50, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # =========================================================================
    # 7. PARTE III: ESTRATEGIA COMERCIAL Y PLANES DE SUSCRIPCIÓN SAAS
    # =========================================================================
    doc.add_page_break()
    style_heading_1("PARTE III: ESTRATEGIA COMERCIAL Y MODELO DE PRECIOS SAAS")

    add_p("Jexia ERP opera bajo un modelo de suscripción como servicio (SaaS - Software as a Service), optimizado para ofrecer a las micro, pequeñas y medianas empresas peruanas acceso a tecnología de clase mundial a un costo predecible, accesible y con un retorno de inversión inmediato.")

    add_callout(
        "Gracias a la implementación de la Conexión Directa Web Service SOAP con SUNAT (Camino 1), Jexia ERP no traslada costos de intermediación por comprobante a sus clientes. Esto permite estructurar planes con generosos paquetes de comprobantes mensuales sin sobrecostos por timbrado de terceros.",
        "VENTAJA COMPETITIVA DE PRECIOS",
        "info"
    )

    style_heading_2("1. Matriz de Planes y Niveles de Suscripción")
    add_p("La propuesta comercial se estructura en 3 niveles de servicio diseñados para acompañar la madurez y volumen operativo de cada empresa, situando el plan de S/ 300.00 como el estándar y núcleo de mayor valor del mercado:")

    tbl_pricing = doc.add_table(rows=12, cols=4)
    tbl_pricing.alignment = WD_TABLE_ALIGNMENT.CENTER
    pricing_headers = ["Característica / Módulo", "PLAN EMPRENDEDOR\n(Inicial)", "PLAN PYME PRO\n★ RECOMENDADO ★", "PLAN CORPORATIVO\n(Avanzado)"]
    for j, h in enumerate(pricing_headers):
        cell = tbl_pricing.cell(0, j)
        bg = "2563EB" if j == 2 else "0F172A"
        set_cell_background(cell, bg)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    pricing_data = [
        ("Tarifa Mensual (Suscripción)", "S/ 180.00 + IGV / mes", "S/ 300.00 + IGV / mes", "S/ 490.00 + IGV / mes"),
        ("Tarifa Anual (Pago Adelantado)", "S/ 1,800.00 + IGV / año", "S/ 3,000.00 + IGV / año\n(Ahorro de S/ 600)", "S/ 4,900.00 + IGV / año\n(Ahorro de S/ 980)"),
        ("Usuarios Incluidos", "2 Usuarios concurrentes", "5 Usuarios concurrentes", "10 Usuarios concurrentes"),
        ("Empresas (RUCs)", "1 Empresa (RUC)", "1 Empresa (RUC)", "1 Empresa (Multi-RUC opcional)"),
        ("Capacidad de Almacenes", "1 Almacén principal", "ALMACENES ILIMITADOS", "ALMACENES ILIMITADOS"),
        ("Comprobantes de Pago al Mes", "Hasta 500 comprobantes/mes", "HASTA 2,000 / MES", "COMPROBANTES ILIMITADOS"),
        ("Guías de Remisión Remitente (GRE 09)", "No incluido / Básico", "GRE 09 ILIMITADAS (SOAP)", "GRE 09 ILIMITADAS (SOAP)"),
        ("Inventario y Trazabilidad", "Kardex valorizado estándar", "Kardex 13.1 + Lotes FEFO", "Kardex 13.1 + Lotes FEFO"),
        ("Cuentas por Cobrar/Pagar (CXC/CXP)", "Control de saldos simple", "Cronograma de cuotas + Conciliación PCGE", "Gestión multi-banco avanzada"),
        ("Contabilidad & Libros Electrónicos", "Reporte de ventas básico", "SIRE (RVIE/RCE) + PLE 5.1 Libro Diario", "SIRE + PLE 5.1 + Auditoría"),
        ("Tienda E-commerce Retail B2C", "Opcional con recargo", "Incluida con stock en vivo", "Incluida con pasarelas integradas")
    ]

    for i, row in enumerate(pricing_data, start=1):
        for j, val in enumerate(row):
            cell = tbl_pricing.cell(i, j)
            # Resaltar la columna del plan recomendado
            if j == 2:
                bg = "EFF6FF" if i % 2 == 1 else "DBEAFE"
            else:
                bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 55, 55, 80, 80)
            p = cell.paragraphs[0]
            if j == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                r = p.add_run(val)
                r.bold = True
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(val)
                if j == 2:
                    r.bold = True
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    style_heading_2("2. Desglose del Plan Promedio Recomendado: PLAN PYME PRO (S/ 300.00)")
    add_p("El Plan PYME Pro representa la columna vertebral de la oferta de Jexia ERP. Con una tarifa fija de S/ 300.00 + IGV al mes (equivalente a solo S/ 10.00 soles diarios), cubre holgadamente el 95% de las necesidades operativas de una empresa comercial, textil o de distribución en crecimiento:")
    add_bullet("5 Licencias de Usuario incluidas: Permite habilitar simultáneamente al Administrador, Cajero/Vendedor, Jefe de Almacén, Encargado de Compras y Contador externo.", "Equipo de Trabajo Completo: ")
    add_bullet("Almacenes Ilimitados: La empresa puede crear y gestionar sin costo adicional su Almacén Central, Tiendas físicas, Puntos de Venta y Depósitos de Tránsito, realizando transferencias internas fluidas.", "Cero Restricción de Sucursales: ")
    add_bullet("2,000 Comprobantes de Pago Electrónicos mensuales: Cobertura amplia para emitir Facturas (01), Boletas (03) y Notas de Crédito (07) con envío directo a SUNAT y recepción de CDR oficial.", "Volumen Operativo Holgado: ")
    add_bullet("Guías de Remisión Remitente (GRE 09) Ilimitadas: Despacho y traslado de mercadería entre almacenes y a clientes cumpliendo la normativa de transporte de SUNAT sin límites mensuales.", "Logística de Despacho sin Freno: ")
    add_bullet("Gestión Financiera & Libros SUNAT: Control de cobros a crédito a 15/30/60 días (Res. 193-2020), pagos a proveedores, exportación de archivos SIRE RVIE/RCE y PLE 5.1.", "Cumplimiento Contable Total: ")

    style_heading_2("3. Servicios Adicionales y Puesta en Marcha (Onboarding)")
    tbl_addons = doc.add_table(rows=4, cols=3)
    tbl_addons.alignment = WD_TABLE_ALIGNMENT.CENTER
    addons_headers = ["Servicio / Recurso Adicional", "Tarifa Vigente", "Descripción del Entregable"]
    for j, h in enumerate(addons_headers):
        cell = tbl_addons.cell(0, j)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 70, 70, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    addons_data = [
        ("Puesta en Marcha & Onboarding (Pago Único)", "S/ 700.00 a S/ 1,000.00 + IGV", "Aprovisionamiento Cloud 24/7, configuración de RUC, Certificado Digital .pfx y credenciales SOL SUNAT, migración asistida de catálogos (Excel), parametrización de almacenes y capacitación por roles con soporte VIP."),
        ("Usuario Concurrente Adicional", "S/ 35.00 + IGV / mes", "Licencia de acceso adicional para un nuevo colaborador con permisos personalizados por módulo."),
        ("Bloque Extra de Comprobantes (Plan Promedio)", "S/ 40.00 + IGV / mes por 500 cpe", "Ampliación de capacidad mensual si la empresa supera temporalmente los 2,000 comprobantes antes de migrar al Plan Corporativo.")
    ]
    for i, row in enumerate(addons_data, start=1):
        for j, val in enumerate(row):
            cell = tbl_addons.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 50, 50, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------------------
    # SECCIÓN COMERCIAL ESTRATÉGICA PARA CIERRE DE IMPLEMENTACIÓN
    # -------------------------------------------------------------------------
    style_heading_2("4. ¿Por qué implementar Jexia ERP hoy? Retorno de Inversión Inmediato (ROI)")
    add_p("La implementación de Jexia ERP no representa un gasto de software, sino una inversión con retorno positivo desde el primer mes de operación. El sistema genera ahorros tangibles y cuantificables en cuatro frentes críticos:")

    tbl_roi = doc.add_table(rows=5, cols=3)
    tbl_roi.alignment = WD_TABLE_ALIGNMENT.CENTER
    roi_headers = ["Frente de Impacto", "Problema Común sin ERP", "Beneficio y Ahorro Cuantificable con Jexia ERP"]
    for j, h in enumerate(roi_headers):
        cell = tbl_roi.cell(0, j)
        set_cell_background(cell, "1E3A5F")
        set_cell_margins(cell, 70, 70, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    roi_data = [
        ("Control de Mermas y Vencimientos", "Pérdidas de mercadería por partidas vencidas o mermas no detectadas en bodega.", "Ahorro estimado de S/ 1,500 a S/ 3,500 / mes gracias al control de lotes con alertas preventivas FEFO y Kardex en tiempo real."),
        ("Velocidad de Facturación y Atención", "Demoras de 10 a 15 minutos emitiendo facturas en el portal de SUNAT o sistemas lentos.", "Reducción del 90% en tiempos operativos: emisión de comprobantes en menos de 15 segundos desde el POS o módulo de ventas."),
        ("Blindaje Tributario SUNAT", "Riesgo de multas por comprobantes rechazados, inconsistencias en SIRE o retrasos en el Libro Diario.", "Cero multas tributarias. Timbrado directo vía SOAP oficial, validaciones automáticas de RUC y generación de SIRE RVIE/RCE al día."),
        ("Recuperación de Cobranzas Morosas", "Descontrol en fechas de vencimiento de facturas a crédito y falta de seguimiento.", "Recuperación de hasta un 35% de cartera vencida mediante cronogramas automáticos de cuotas y semáforo visual de morosidad.")
    ]
    for i, row in enumerate(roi_data, start=1):
        for j, val in enumerate(row):
            cell = tbl_roi.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 50, 50, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    style_heading_2("5. Metodología de Puesta en Marcha Acelerada (Go-Live en 5 Días)")
    add_p("A diferencia de los ERPs tradicionales que tardan meses en configurarse con altos costos ocultos, Jexia ERP aplica una metodología ágil 'Fast-Track' de 5 días hábiles que garantiza la salida en vivo sin interrumpir las operaciones diarias de la empresa:")

    tbl_onboarding = doc.add_table(rows=6, cols=3)
    tbl_onboarding.alignment = WD_TABLE_ALIGNMENT.CENTER
    onb_headers = ["Fase y Cronograma", "Actividades Principales", "Entregable Concreto"]
    for j, h in enumerate(onb_headers):
        cell = tbl_onboarding.cell(0, j)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 70, 70, 90, 90)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    onb_data = [
        ("Día 1: Kickoff y Configuración Cloud", "Aprovisionamiento del entorno Cloud 24/7 y base de datos. Alta de datos de la empresa, sucursales y vinculación de credenciales SOL y Certificado Digital.", "Instancia Cloud 100% activa y conectada a SUNAT."),
        ("Día 2: Migración de Datos Maestros", "Entrega de plantillas Excel estructuradas. Carga y depuración masiva de Catálogo de Productos con precios, Directorio de Clientes y Proveedores.", "Datos Maestros cargados y validados algorítmicamente."),
        ("Día 3: Parametrización y Pruebas", "Configuración de cuentas bancarias, almacenes, series correlativas y reglas de crédito. Ejecución de pruebas de emisión de comprobantes y guías GRE.", "Entorno homologado listo para operar."),
        ("Día 4: Capacitación por Roles", "Entrenamiento práctico guiado para cajeros/vendedores, encargados de logística/almacén y administradores/contadores.", "Personal capacitado con manuales y grabaciones."),
        ("Día 5: Salida en Vivo (Go-Live)", "Acompañamiento técnico especializado en tiempo real durante la primera jornada de facturación y movimientos de almacén reales.", "Jexia ERP operando en producción con éxito.")
    ]
    for i, row in enumerate(onb_data, start=1):
        for j, val in enumerate(row):
            cell = tbl_onboarding.cell(i, j)
            bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 50, 50, 80, 80)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    style_heading_2("6. Detalle del Paquete de Puesta en Marcha (S/ 700 a S/ 1,000 + IGV)")
    add_p("El paquete de Puesta en Marcha (inversión única de S/ 700.00 a S/ 1,000.00 + IGV según la complejidad del catálogo) es un servicio 'llave en mano' que asegura que la empresa comience a operar desde el primer día con absoluta certeza técnica. Comprende los siguientes entregables:")
    add_bullet("Despliegue de la infraestructura SaaS en servidores de alta disponibilidad con certificado de seguridad SSL y respaldos diarios automáticos.", "1. Aprovisionamiento Cloud 24/7 Garantizado: ")
    add_bullet("Configuración del emisor electrónico, carga del certificado digital (.pfx), enlace con la clave SOL de SUNAT y pruebas de recepción de CDR.", "2. Homologación Tributaria Oficial: ")
    add_bullet("Revisión, limpieza y carga de listas de artículos, existencias iniciales por almacén, clientes habituales y saldos pendientes.", "3. Migración Asistida de Información: ")
    add_bullet("Capacitación interactiva en vivo por videoconferencia, acceso a manuales en PDF y sesiones grabadas para futuras consultas del equipo.", "4. Programa de Formación de Usuarios: ")
    add_bullet("Canal directo y prioritario vía WhatsApp y llamadas para resolución inmediata de dudas durante el primer mes de operación.", "5. Soporte VIP Post-Implementación (30 Días): ")

    style_heading_2("7. Garantías Comerciales y de Continuidad Operativa")
    add_bullet("El cliente no está atado a contratos anuales forzosos. La calidad, el ahorro y el beneficio diario del sistema son la única razón de renovación mensual.", "Sin Contratos Forzosos: ")
    add_bullet("La base de datos se respalda automáticamente en la nube todos los días, garantizando disponibilidad del 99.9% frente a cualquier imprevisto.", "Seguridad y Respaldo Continuo: ")
    add_bullet("Acceso desde cualquier dispositivo (computadora de escritorio, laptop, tablet o celular) sin necesidad de instalaciones complicadas en redes locales.", "100% Accesible en la Nube: ")
    add_bullet("Equipo de soporte y consultoría localizado en Perú, con dominio pleno de las normativas vigentes de SUNAT, SIRE y el PCGE.", "Soporte Especializado Local: ")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    output_path1 = os.path.abspath("docs/JEXIA_ERP_DOCUMENTO_PROFESIONAL_MAESTRO.docx")
    output_path2 = os.path.abspath("docs/Documento de alcance JEXIA ERP.docx")
    
    try:
        doc.save(output_path1)
        print(f"Documento Word actualizado con éxito en: {output_path1}")
    except PermissionError:
        print(f"AVISO: {output_path1} está abierto en Word.")

    try:
        doc.save(output_path2)
        print(f"Documento Word actualizado con éxito en: {output_path2}")
    except PermissionError:
        fallback_path = os.path.abspath("docs/Documento de alcance JEXIA ERP_ACTUALIZADO.docx")
        doc.save(fallback_path)
        print(f"AVISO: {output_path2} está abierto en Word. Se guardó una copia idéntica lista en: {fallback_path}")

if __name__ == "__main__":
    create_document()
