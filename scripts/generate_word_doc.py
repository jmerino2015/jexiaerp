import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_document():
    doc = docx.Document()

    # 1. Configuración de Márgenes (Estándar Ejecutivo: 2.5 cm en todos los lados = 0.98 pulgadas)
    for section in doc.sections:
        section.top_margin = Inches(0.9)
        section.bottom_margin = Inches(0.9)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)
        # Encabezado y pie de página diferentes para la portada
        section.different_first_page_header_footer = True

        # Configurar Encabezado de páginas siguientes
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("JEXIA ERP v2.0 — Manual de Uso y Documento de Alcance del Sistema")
        hrun.font.name = "Segoe UI"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(100, 116, 139) # slate-500

        # Configurar Pie de página
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("Jexia ERP © 2026 | Claridad operativa para crecer sin límites    —    Página ")
        frun.font.name = "Segoe UI"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(100, 116, 139)

    # Colores Corporativos Jexia
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

        # Borde izquierdo grueso
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
        p.paragraph_format.space_before = Pt(18)
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
        p.paragraph_format.space_before = Pt(12)
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
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
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
            rb.font.size = Pt(10)
            rb.font.color.rgb = COLOR_DARK
        r = p.add_run(text)
        r.font.name = "Segoe UI"
        r.font.size = Pt(10)
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

    # =========================================================================
    # PORTADA CORPORATIVA
    # =========================================================================
    logo_path = os.path.abspath("public/jexia_logo_word.png")
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(36)
        p_logo.paragraph_format.space_after = Pt(28)
        p_logo.add_run().add_picture(logo_path, width=Inches(3.4))

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(6)
    r_main_title = p_title.add_run("JEXIA ERP — EDICIÓN EMPRESARIAL")
    r_main_title.bold = True
    r_main_title.font.name = "Segoe UI"
    r_main_title.font.size = Pt(24)
    r_main_title.font.color.rgb = COLOR_PRIMARY

    p_subtitle = doc.add_paragraph()
    p_subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subtitle.paragraph_format.space_after = Pt(24)
    r_sub = p_subtitle.add_run("MANUAL DE OPERACIONES Y DOCUMENTO DE ALCANCE FUNCIONAL DEL SISTEMA\nCumplimiento Normativo SUNAT UBL 2.1, GRE 09, SPOT y PCGE 2019")
    r_sub.font.name = "Segoe UI"
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = COLOR_MUTED

    # Línea decorativa
    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_after = Pt(40)
    r_line = p_line.add_run("—" * 35)
    r_line.font.color.rgb = COLOR_BLUE

    # Cuadro de Metadatos de la Portada
    tbl_meta = doc.add_table(rows=6, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Versión del Sistema:", "2.0 (Edición Empresarial Producción)"),
        ("Propósito y Lema:", "Claridad operativa para crecer sin límites"),
        ("Ámbito de Aplicación:", "MYPES y PYMES Comerciales, Industriales y de Servicios (Perú)"),
        ("Fecha de Publicación:", "Noviembre 2026"),
        ("Clasificación del Documento:", "Manual Maestro y Especificación de Requisitos de Software (SRS)"),
        ("Estado de Implementación:", "100% Desarrollado, Verificado y en Ejecución"),
    ]
    for i, (k, v) in enumerate(meta_data):
        c0 = tbl_meta.cell(i, 0)
        c1 = tbl_meta.cell(i, 1)
        c0.width = Inches(2.3)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F8FAFC")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, 70, 70, 100, 100)
        set_cell_margins(c1, 70, 70, 100, 100)
        p0 = c0.paragraphs[0]
        p0.add_run(k).bold = True
        p0.runs[0].font.name = "Segoe UI"
        p0.runs[0].font.size = Pt(9.5)
        p0.runs[0].font.color.rgb = COLOR_DARK
        p1 = c1.paragraphs[0]
        p1.add_run(v)
        p1.runs[0].font.name = "Segoe UI"
        p1.runs[0].font.size = Pt(9.5)
        p1.runs[0].font.color.rgb = COLOR_DARK

    doc.add_page_break()

    # =========================================================================
    # CONTROL DE VERSIONES Y FIRMAS
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
        ("2.0", "15/11/2026", "Equipo de Desarrollo Jexia", "Integración de Transferencias Multi-Almacén GRE 09, Lotes FEFO y Cobranzas PCGE")
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

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # PARTE I: DOCUMENTO DE ALCANCE DEL SISTEMA (SRS)
    # =========================================================================
    style_heading_1("PARTE I: DOCUMENTO DE ALCANCE DEL SISTEMA (PROJECT SCOPE)")
    
    add_p("Jexia ERP es una solución SaaS empresarial de alto rendimiento diseñada específicamente para el ecosistema productivo y tributario peruano. El presente alcance formaliza las capacidades de software que integran el ciclo operativo completo: comercialización, facturación electrónica, logística multi-almacén, tesorería y contabilidad general.")

    add_callout(
        "El sistema opera bajo una estricta transaccionalidad ACID en PostgreSQL 17 con micro-transacciones atómicas gestionadas por Prisma ORM. Ninguna venta, compra o traslado puede generar desbalances entre el stock físico, el valor monetario del Kardex y las cuentas del Plan Contable General Empresarial (PCGE 2019).",
        "PRINCIPIO FUNDAMENTAL DE DISEÑO",
        "info"
    )

    style_heading_2("1. Objetivos Estratégicos del Producto")
    add_bullet(" Reducción a Cero del Riesgo Tributario: Emisión automática y nativa de Facturas (01), Boletas (03), Notas de Crédito (07) y Guías de Remisión Remitente (09) conforme a UBL 2.1.", "Cumplimiento SUNAT: ")
    add_bullet(" Costeo continuo ponderado móvil de inventarios en cumplimiento con el Formato SUNAT 13.1 y trazabilidad FEFO para productos con fecha de expiración.", "Kardex Valorizado Exacto: ")
    add_bullet(" Control riguroso de facturas a crédito con cronograma de cuotas, seguimiento de morosidad y conciliación bancaria con generación instantánea de asientos contables.", "Salud Financiera & Liquidez: ")
    add_bullet(" Venta directa omnicanal al consumidor final sincronizada con el stock real para evitar sobreventas.", "E-commerce Retail Integrado: ")

    style_heading_2("2. Estructura de Desglose del Trabajo (WBS / Paquetes Funcionales)")
    tbl_wbs = doc.add_table(rows=9, cols=3)
    tbl_wbs.alignment = WD_TABLE_ALIGNMENT.CENTER
    wbs_headers = ["Módulo / EDT", "Funcionalidades Principales", "Normativa / Estándar"]
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
        ("EDT 01: Identidad & UX", "Logotipo tricolor SVG, Sidebar colapsable, tema neutro slate con acentos funcionales.", "Guía de Estilo Jexia"),
        ("EDT 02: Ventas & SUNAT", "POS interactivo, Factura 01, Boleta 03, Notas de Crédito 07, Detracciones SPOT, A4 y Ticket 80mm.", "SUNAT UBL 2.1 / D.L. 940"),
        ("EDT 03: E-commerce Retail", "Catálogo B2C, carrito, checkout, recojo en tienda / delivery, reserva de stock.", "Venta Omnicanal B2C"),
        ("EDT 04: Compras", "Órdenes de Compra (OC01), recepción de mercadería, cálculo de costo promedio ponderado.", "Abastecimiento y Costos"),
        ("EDT 05: Inventario & Logística", "Kardex 13.1, Lotes y FEFO (ProductLot), Transferencias Multi-Almacén y GRE 09.", "SUNAT Res. 123-2022 / Res. 234-2006"),
        ("EDT 06: Cobranzas & Pagos", "Cuentas por cobrar (1212), cuentas por pagar (4212), cuotas a crédito, conciliación bancaria.", "SUNAT Res. 193-2020 / PCGE"),
        ("EDT 07: Contabilidad General", "Plan de Cuentas a 5 dígitos, Libro Diario automático, exportación SIRE (RVIE/RCE) y PLE 5.1.", "PCGE 2019 / MEF"),
        ("EDT 08: Analítica & Reportes", "Márgenes brutos, reportes de cartera vencida, rotación de existencias y ranking de ventas.", "Business Intelligence")
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
    # PARTE II: MANUAL DE OPERACIONES PASO A PASO
    # =========================================================================
    style_heading_1("PARTE II: MANUAL DE USO Y OPERACIONES PASO A PASO")

    # MÓDULO 1: VENTAS Y FACTURACIÓN
    style_heading_2("Módulo 1: Ventas y Facturación Electrónica SUNAT UBL 2.1")
    add_p("El módulo de Ventas (/ventas) constituye el núcleo comercial del sistema. Permite operar un Punto de Venta (POS) rápido, emitir comprobantes autorizados y consultar el estado de validación ante SUNAT.")

    style_heading_3("1.1 Emisión de Boletas (03) y Facturas (01) de Contado:")
    add_bullet(" Ingrese al módulo Ventas y haga clic en la pestaña 'Punto de Venta (POS)'.", "Paso 1: ")
    add_bullet(" Elija 'BOLETA' (para consumidor final) o 'FACTURA' (para clientes corporativos con RUC 11 dígitos).", "Paso 2: ")
    add_bullet(" Busque el cliente en la lista o digite su RUC/DNI.", "Paso 3: ")
    add_bullet(" Añada los productos requeridos indicando cantidad y precio de venta acordado.", "Paso 4: ")
    add_bullet(" Seleccione el medio de pago: Efectivo, Transferencia, Yape/Plin o Tarjeta.", "Paso 5: ")
    add_bullet(" Presione 'Emitir Comprobante Electrónico'. El sistema ejecutará simultáneamente:", "Paso 6: ")
    add_bullet("Asignación de serie y correlativo correlativo atómico (ej: B001-000035 o F001-000020).")
    add_bullet("Descuento físico del stock en el almacén por defecto.")
    add_bullet("Asiento de salida en el Kardex valorizado ponderado.")
    add_bullet("Generación del XML UBL 2.1 con código hash SHA-256 y CDR simulado oficial.")
    add_bullet("Asiento contable automático de venta y costo de ventas en el Libro Diario.")

    style_heading_3("1.2 Emisión de Facturas al Crédito (Normativa SUNAT Res. 193-2020):")
    add_p("Cuando se vende a crédito, la SUNAT exige consignar las fechas de vencimiento y los importes de cada cuota:")
    add_bullet("En el POS, seleccione 'Medio de Pago: CREDITO'.")
    add_bullet("Indique la condición pactada: 'CREDITO_15', 'CREDITO_30', 'CREDITO_45' o 'CREDITO_60'.")
    add_bullet("Al emitir, el comprobante se creará en estado PENDIENTE en Cuentas por Cobrar (/finanzas), habilitando su cobranza por partes.")

    style_heading_3("1.3 Régimen de Detracciones SPOT (Banco de la Nación):")
    add_p("Para servicios o ventas de bienes afectos al sistema SPOT con montos mayores a S/ 700.00:")
    add_bullet("Marque la casilla 'Sujeto a Detracción SPOT (Banco de la Nación)'.")
    add_bullet("Seleccione el código del Catálogo 54 de SUNAT (ej: 022 Otros servicios empresariales) y el porcentaje (10% o 12%).")
    add_bullet("El sistema calculará el monto neto de detracción y el saldo a cobrar, consignando la cuenta oficial del Banco de la Nación en el comprobante y en el XML.")

    style_heading_3("1.4 Impresión en Formato A4, Ticket Térmico y Descarga de XML/CDR:")
    add_p("En la tabla de comprobantes emitidos, haga clic en el ícono del ojo para abrir el Visor Oficial de Comprobantes:")
    add_bullet("Conmutador A4 / Ticket: Permite alternar la vista entre una hoja membretada A4 y un ticket térmico de 80mm.")
    add_bullet("Código QR Tributario: Generado dinámicamente con la estructura oficial exigida por SUNAT.")
    add_bullet("Descarga de Archivos: Botón 'Descargar XML UBL 2.1' y 'Descargar CDR SUNAT'.")

    # MÓDULO 2: INVENTARIO, LOTES Y TRANSFERENCIAS
    style_heading_2("Módulo 2: Inventario, Kardex 13.1, Lotes FEFO y Transferencias GRE 09")
    add_p("El módulo de Inventario (/inventario) se encuentra estructurado en 4 áreas de gestión logística:")

    style_heading_3("2.1 Catálogo de Productos y Parámetros:")
    add_bullet("Permite crear artículos asignando SKU, Nombre, Unidad de Medida (NIU, KGM, ZZ), Stock Mínimo y Precio.")
    add_bullet("Fotografías: Permite asociar imágenes en alta definición para visualización en el catálogo y en la tienda web.")
    add_bullet("Configuración de Lotes: Permite activar 'Seguimiento por Lote' (TrackingType.LOT) y fijar días de alerta de vencimiento.")

    style_heading_3("2.2 Kardex Valorizado Ponderado (Formato SUNAT 13.1):")
    add_p("Aplica la fórmula matemática oficial de promedio ponderado móvil:")
    add_callout(
        "Costo Promedio Ponderado = (Valor Total Anterior + Costo Total Entrada) / (Cantidad Anterior + Cantidad Entrada)\nCada salida se valoriza estrictamente al costo promedio vigente al momento de la operación.",
        "FÓRMULA MATEMÁTICA DEL KARDEX",
        "info"
    )

    style_heading_3("2.3 Transferencias Multi-Almacén y Guía de Remisión Remitente (GRE 09):")
    add_bullet("Paso 1: Diríjase a la pestaña 'Transferencias & GRE (09)' y presione 'Nueva Transferencia / GRE'.")
    add_bullet("Paso 2: Elija el Almacén Origen (donde hay existencias) y el Almacén Destino.")
    add_bullet("Paso 3: Seleccione el producto (ej: POLO VERANO COLOR ROJO TALLA L) e indique las unidades a mover.")
    add_bullet("Paso 4: Complete los datos obligatorios del transporte (Modalidad privada/pública, conductor, DNI, licencia de conducir, placa de rodaje, peso total en KGM y direcciones de partida y llegada con Ubigeo).")
    add_bullet("Paso 5: Presione 'Emitir Transferencia y GRE Remitente'. El sistema descargará el stock del origen, cargará en destino, registrará los dos movimientos en el Kardex y generará la Guía oficial serie T001 con su XML DespatchAdvice.")

    style_heading_3("2.4 Control de Lotes y Trazabilidad FEFO:")
    add_p("Diseñado para confecciones, farmacéuticas y perecibles:")
    add_bullet("Estado DISPONIBLE (Verde): Partida vigente y apta para despacho comercial.")
    add_bullet("Estado POR VENCER (Ámbar): Partida que entra en el periodo de alerta (ej: faltan menos de 30 o 45 días). Aplica prioridad FEFO (First Expired, First Out) recomendando su venta inmediata antes que lotes más recientes.")
    add_bullet("Estado VENCIDO (Rojo): Partida cuya vida útil expiró, emitiendo alerta para retención o baja contable.")

    # MÓDULO 3: COBRANZAS Y PAGOS
    style_heading_2("Módulo 3: Cobranzas, Pagos y Conciliación Bancaria (CXC / CXP)")
    add_p("El módulo de Finanzas (/finanzas) permite liquidar deudas comerciales y conciliar el flujo monetario con el Plan Contable:")

    style_heading_3("3.1 Cuentas por Cobrar (Clientes - PCGE 1212):")
    add_bullet("Muestra todas las facturas a crédito, su saldo cobrado, saldo pendiente y fecha límite de pago.")
    add_bullet("Semáforo de Morosidad: Las facturas con fecha de vencimiento superada se marcan automáticamente como 'VENCIDO'.")
    add_bullet("Registro de Cobro: Al presionar 'Cobrar', se abre el modal donde se ingresa el monto amortizado, banco receptor (BCP, BBVA, etc.) y número de operación/voucher. Al confirmar, el sistema amortiza las cuotas del crédito y genera el Asiento de Cobranza: Debe 1041 / Haber 1212.")

    style_heading_3("3.2 Cuentas por Pagar (Proveedores - PCGE 4212):")
    add_bullet("Muestra las compras pendientes de pago. Al presionar 'Pagar', se registra el desembolso bancario y el asiento automático: Debe 4212 / Haber 1041.")

    style_heading_3("3.3 Historial de Transacciones & Conciliación:")
    add_bullet("Bitácora inmutable con todos los cobros y pagos registrados, número de constancia bancaria y referencia cruzada con el asiento en el Libro Diario.")

    # MÓDULO 4: CONTABILIDAD PCGE Y LIBROS ELECTRÓNICOS
    style_heading_2("Módulo 4: Contabilidad General PCGE 2019 y Libros Electrónicos")
    add_p("Garantiza que la contabilidad refleje con exactitud la realidad operativa:")
    add_bullet("Plan Contable a 5 dígitos preconfigurado: 1011 (Caja), 1041 (Cuentas Corrientes Bancos), 1212 (Emitidas en Cartera), 20111 (Mercaderías Manufacturadas), 40111 (IGV Cuenta Propia), 4212 (Facturas por Pagar Emitidas), 6011 (Compras), 69121 (Costo de Ventas) y 70121 (Ventas Locales).")
    add_bullet("Principio de Partida Doble: Todo asiento valida estrictamente que la suma del Debe sea idéntica a la suma del Haber.")
    add_bullet("Generación SIRE: Exportación directa de archivos planos para el Registro de Ventas (RVIE 14.1) y Registro de Compras (RCE 8.1).")
    add_bullet("Generación PLE 5.1: Exportación del Libro Diario para envío formal al software de libros electrónicos de SUNAT.")

    # CONCLUSIONES Y CRITERIOS DE PRODUCCIÓN
    style_heading_2("5. Criterios de Calidad y Puesta en Producción")
    add_p("Jexia ERP v2.0 ha superado satisfactoriamente las pruebas de esfuerzo transaccional, cálculo de impuestos, generación de hashes digitales y concurrencia multi-almacén, encontrándose apto para operar como el sistema medular de cualquier MYPE en el Perú.")

    # Guardar documento
    output_path = os.path.abspath("docs/JEXIA_ERP_DOCUMENTO_PROFESIONAL_MAESTRO.docx")
    doc.save(output_path)
    print(f"Documento Word profesional generado con éxito en: {output_path}")

if __name__ == "__main__":
    create_document()
