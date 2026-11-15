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
        ("EDT 01: Identidad & UX", "Logotipo tricolor SVG, Sidebar colapsable animado, semáforo visual de colores.", "Guía de Estilo Jexia"),
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

    doc.add_page_break()

    # =========================================================================
    # 5. PARTE II: MANUAL DETALLADO DE OPERACIONES (ODOO / DEFONTANA STYLE)
    # =========================================================================
    style_heading_1("PARTE II: MANUAL DE OPERACIONES Y FUNCIONALIDADES DETALLADAS")
    add_p("La presente sección documenta cada proceso bajo la estructura técnica de los manuales de referencia mundial (Odoo y Defontana), desglosando objetivo, prerrequisitos, campos del formulario, reglas de negocio, impacto contable y kardex.")

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

    style_heading_2("Conclusión del Manual de Operaciones")
    add_p("Jexia ERP v2.0 proporciona un control 360° sobre la operativa comercial, logística y financiera. Con este documento, cualquier usuario nuevo o supervisor de área cuenta con la guía paso a paso para operar con máxima precisión y total tranquilidad tributaria.")

    output_path = os.path.abspath("docs/JEXIA_ERP_DOCUMENTO_PROFESIONAL_MAESTRO.docx")
    doc.save(output_path)
    print(f"Documento Word enriquecido y actualizado con éxito en: {output_path}")

if __name__ == "__main__":
    create_document()
