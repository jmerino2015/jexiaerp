# DOCUMENTO DE ALCANCE DEL SISTEMA (PROJECT SCOPE DOCUMENT)
## JEXIA ERP — EDICIÓN EMPRESARIAL PARA MYPES PERÚ
**Código del Proyecto:** JEXIA-ERP-2026-V2  
**Versión del Documento:** 1.0  
**Lema del Producto:** *"Claridad operativa para crecer sin límites"*  
**Fecha de Emisión:** Noviembre 2026  
**Metodología:** Ágil / Transaccionalidad ACID / Cumplimiento Tributario SUNAT UBL 2.1  

---

## 1. RESUMEN EJECUTIVO Y PROPÓSITO DEL SISTEMA

El presente documento formaliza el **Alcance Integral del Sistema Jexia ERP**, estableciendo los límites, entregables, funcionalidades, arquitectura técnica y criterios de aceptación acordados para la solución empresarial.

**Jexia ERP** ha sido diseñado como un sistema de planificación de recursos empresariales bajo arquitectura SaaS, enfocado en resolver las tres grandes fricciones operativas que experimentan las micro, pequeñas y medianas empresas (MYPES) en el Perú:
1. **La dispersión de información y descuadre de inventarios:** Carencia de un Kardex valorizado en tiempo real y traslados sin control de origen/destino.
2. **La complejidad y riesgo tributario ante SUNAT:** Desalineación en la emisión de Facturación Electrónica UBL 2.1, Guías de Remisión Remitente (GRE 09), Detracciones SPOT y libros electrónicos (SIRE / PLE).
3. **El descontrol en el flujo de caja y morosidad:** Facturas emitidas a crédito sin seguimiento de cuotas, cobranzas no conciliadas y pagos a proveedores desconectados de la contabilidad.

Inspirado en la madurez funcional de **Odoo 19** y adaptado estrictamente a la realidad tributaria y contable peruana, Jexia ERP unifica la cadena de valor: **Venta ➔ Almacén ➔ Traslado ➔ Factura Electrónica ➔ Cobranza / Pago ➔ Asiento Contable PCGE**.

---

## 2. VISIÓN, OBJETIVOS Y BENEFICIARIOS

### 2.1 Declaración de Visión
*"Convertir a Jexia ERP en la plataforma de gestión líder para las MYPES peruanas, democratizando el acceso a tecnología empresarial de clase mundial, automatizando el cumplimiento tributario ante SUNAT y brindando absoluta claridad operativa para tomar decisiones con certeza."*

### 2.2 Objetivos Estratégicos del Proyecto
- **O1:** Automatizar el 100% de la emisión y validación electrónica de comprobantes de pago (Factura, Boleta, Notas de Crédito y Guías de Remisión Remitente) con SUNAT bajo el estándar UBL 2.1.
- **O2:** Garantizar la precisión del inventario mediante el costeo promedio ponderado automatizado (Kardex Formato 13.1), control de lotes con alertas preventivas FEFO y traslados multi-almacén.
- **O3:** Implementar una gestión financiera rigurosa de cuentas por cobrar y pagar (CXC/CXP), programando cuotas a crédito y generando asientos contables en el Libro Diario en el mismo milisegundo en que se concilia una operación.
- **O4:** Proporcionar un canal de ventas omnicanal mediante un módulo de E-commerce Retail B2C directamente integrado al inventario físico.

### 2.3 Partes Interesadas (Stakeholders) y Usuarios Clave
| Rol de Usuario | Necesidades Principales en el Sistema | Impacto en el Negocio |
|---|---|---|
| **Gerente General / Directorio** | Visión 360° del negocio, rentabilidad bruta, rotación de productos y flujo de caja en tiempo real. | Dirección estratégica y crecimiento sostenido. |
| **Jefe de Almacén / Logística** | Control de existencias, gestión de lotes por vencer, transferencias entre sucursales con GRE 09 y Kardex al día. | Cero pérdidas por mermas o quiebres de stock. |
| **Jefe de Ventas / Cajero POS** | Facturación ágil en mostrador, emisión rápida de boletas/facturas, cotizaciones y cobro por Yape/Plin o tarjetas. | Velocidad de atención y satisfacción del cliente. |
| **Contador / Asesor Tributario** | Partida doble automática, conciliación bancaria, exportación a SIRE (RVIE/RCE) y PLE 5.1 Libro Diario. | Cero multas tributarias y auditorías limpias. |
| **Administrador Financiero** | Control de cuentas por cobrar, alertas de morosidad, cronogramas de cuotas y programación de pagos a proveedores. | Liquidez y salud financiera. |

---

## 3. ALCANCE FUNCIONAL DETALLADO (WBS / EDT)

### PAQUETE DE TRABAJO 1: IDENTIDAD CORPORATIVA Y NAVEGACIÓN (UI/UX)
- **1.1 Componente JexiaLogo:** Logotipo SVG oficial con las 3 barras de crecimiento tricolor (Naranja `#F97316`, Azul `#2563EB`, Verde `#10B981`), soporte elíptico base y lema *"Ordena, controla y haz crecer tu negocio"*. Implementado en Sidebar, Login, favicon y encabezados PDF.
- **1.2 Sidebar Plegable:** Barra lateral con animación suave (`translate-x`), persistencia de estado mediante `SidebarContext`, badges informativos y capacidad de colapso para visualización óptima en pantallas pequeñas.
- **1.3 Sistema de Diseño Semántico:** Paleta neutra slate (`#F8FAFC`, `#E2E8F0`, `#0F172A`) combinada con acentos funcionales: Verde Esmeralda `#10B981` (Disponible / Aceptado), Azul `#2563EB` (Primario / Operativo), Ámbar `#F59E0B` (Alerta FEFO / Parcial) y Rojo Carmín `#EF4444` (Vencido / Error).

---

### PAQUETE DE TRABAJO 2: GESTIÓN DE DATOS MAESTROS (MASTER DATA MANAGEMENT - MDM)
- **2.1 Directorio Maestro de Clientes (`Partner` - `isCustomer = true`):**
  - **Identificación Oficial:** Soporte normado para RUC (11 dígitos, Tipo 6 SUNAT), DNI (8 dígitos, Tipo 1), Carnet de Extranjería (Tipo 4) y Pasaporte (Tipo 7) con validación algorítmica de longitud y dígito de control.
  - **Validación de Condición Tributaria:** Detección automática de Razón Social / Nombres, condición de domicilio (Habido / No Habido) y estado de contribuyente (Activo / Baja de Oficio) para garantizar la deducibilidad tributaria.
  - **Georreferenciación y Ubigeo INEI:** Registro de domicilio fiscal y sedes de entrega estructuradas con código de Ubigeo oficial de 6 dígitos (Departamento, Provincia, Distrito) para emisión precisa de comprobantes y guías de remisión.
  - **Perfil Financiero y Políticas de Crédito:** Asignación de listas de precios diferenciadas (Minorista, Mayorista, Distribuidor), línea de crédito máxima aprobada (monto en PEN / USD), días de gracia o plazo de crédito otorgado (15, 30, 45, 60 días), e indicadores tributarios de Agente de Retención o Percepción.
  - **Canales de Entrega Digital:** Registro de correos electrónicos corporativos para distribución automática del trinomio digital (XML firmado, CDR oficial y PDF/Ticket), contacto de tesorería y números de mensajería (WhatsApp).
  - **Visión 360° del Cliente:** Resumen integrado en tiempo real de facturas emitidas, cotizaciones activas, cuotas por cobrar, días promedio de pago y saldo de crédito disponible.

- **2.2 Directorio Maestro de Proveedores (`Partner` - `isSupplier = true`):**
  - **Homologación Fiscal y RUC:** Registro y validación estricta de proveedores con RUC vigente ante SUNAT, alertando de inmediato si el proveedor se encuentra "No Habido" para mitigar contingencias de reparos tributarios en el crédito fiscal del IGV y costo/gasto de renta.
  - **Estructura Financiera y Cuentas Bancarias:**
    - Cuentas corrientes comerciales en Soles (PEN) y Dólares (USD) con número de cuenta y Código de Cuenta Interbancario (CCI de 20 dígitos) para pagos masivos y transferencias interbancarias.
    - Cuenta Corriente de Detracciones del Banco de la Nación (11 dígitos) vinculada obligatoriamente para compras de bienes o servicios sujetos a detracciones SPOT (D.L. 940).
  - **Términos Comerciales de Abastecimiento:** Condiciones de pago predeterminadas (Contado, Crédito a 30 días, Consignación), moneda de compra habitual y acuerdos de descuento por pronto pago.
  - **Historial y Trazabilidad de Proveedor:** Panel consolidado de órdenes de compra (OC) emitidas, cumplimiento de despachos físicos a almacén, cuentas por pagar (CXP / PCGE 4212) y retenciones o detracciones efectuadas.

- **2.3 Catálogo Maestro de Productos y Servicios (`Product`):**
  - **Identificación y Codificación Universal:**
    - Código SKU interno alfanumérico único para control corporativo.
    - Código de Barras estándar EAN-13 / UPC para lectura óptica con pistolas escáner en cajas POS y terminales de almacén.
    - Código de Producto SUNAT (estándar internacional UNSPSC a 8 dígitos según Catálogo 25 de SUNAT) obligatorio para facturación UBL 2.1.
  - **Naturaleza del Ítem:** Distinción operativa entre Bien Físico (control estricto de existencias, Kardex, lotes y traslados) y Servicio Intangible (`isService = true`, sin inventario físico pero con trazabilidad contable y tributaria).
  - **Unidades de Medida Normalizadas (Catálogo 03 SUNAT):** Unidades (`NIU`), Servicios (`ZZ`), Cajas (`BX`), Kilogramos (`KGM`), Metros (`MTR`), con soporte para factores de empaque y conversión.
  - **Clasificación y Jerarquía:** Parametrización por Categoría, Subcategoría, Línea de Negocio y Marca comercial.
  - **Tratamiento Tributario y Mapeo Contable PCGE:**
    - Tipo de Afectación al IGV (Catálogo 07): Código 10 (Gravado 18%), Código 20 (Exonerado - Apéndice I del TUO IGV), Código 30 (Inafecto).
    - Régimen de Detracciones SPOT (Catálogo 54 SUNAT): Indicador `detractionSubject`, código de servicio (ej: transporte, arrendamiento, mantenimiento) y porcentaje aplicable (4%, 10%, 12%).
    - Asociación Contable Automática al PCGE 2019: Venta (70121), Compra (60111), Existencias (20111), Costo de Ventas (69121) y Variación (61111).
  - **Costeo, Precios y Control Multialmacén:**
    - Costo unitario promedio ponderado móvil calculado automáticamente por el Kardex 13.1 y registro del costo de última compra.
    - Precio de venta al público (PVP) con desglose paramétrico de base imponible e IGV del 18%.
    - Parámetros de inventario por almacén: Stock mínimo para disparo de alertas de reposición oportuna y stock máximo para prevención de sobre-stock.
  - **Trazabilidad por Lotes y Política FEFO:** Flag `trackingType = LOT`, enlace a tabla `ProductLot`, registro de fecha de vencimiento y margen de días (`alertDays`) para advertencias visuales semánticas.
  - **Parámetros Omnicanal E-commerce:** Flag `isEcommerce = true`, galería de imágenes fotográficas, descripción comercial ampliada y publicación instantánea en la tienda web retail.

---

### PAQUETE DE TRABAJO 3: VENTAS Y FACTURACIÓN ELECTRÓNICA SUNAT (UBL 2.1)
- **3.1 Punto de Venta (POS) y Facturación Directa:** Emisión interactiva de Facturas (`01`) y Boletas de Venta (`03`) con series correlativas automáticas (`F001`, `B001`).
- **3.2 Motor UBL 2.1 (`UblBuilder`):** Generación de documentos XML estándar UBL 2.1 (`Invoice`, `CreditNote`, `DespatchAdvice`), cálculo de digest value (SHA-256) y generación de Constancia de Recepción (CDR) oficial.
- **3.3 Notas de Crédito Electrónicas (`07`):** Anulación total o parcial de comprobantes según Catálogo 09 de SUNAT, reintegrando automáticamente el stock físico al Kardex y revirtiendo el impacto contable.
- **3.4 Régimen de Detracciones SPOT (Banco de la Nación):** Detección de operaciones gravadas con servicios sujetos a detracción (Catálogo 54), cálculo de porcentaje y monto neto, y consignación de la cuenta del Banco de la Nación en el XML y PDF.
- **3.5 Formatos de Salida Oficiales:** Visor con alternador interactivo entre Formato PDF A4 y Ticket Térmico de 80mm, código QR tributario y botones de descarga de XML y CDR.

---

### PAQUETE DE TRABAJO 4: E-COMMERCE RETAIL B2C
- **4.1 Catálogo Web Sincronizado:** Publicación de artículos parametrizados para venta online (`isEcommerce = true`), con fotografías, stock en vivo y precios finales con IGV.
- **4.2 Carrito y Checkout:** Selección de entrega a domicilio o recojo en tienda, validación de datos del comprador y soporte de pagos digitales (Yape, Plin, Transferencia y Tarjeta).
- **4.3 Reserva de Stock y Despacho:** Creación inmediata de la orden comercial y descuento en tiempo real para evitar sobreventa.

---

### PAQUETE DE TRABAJO 5: COMPRAS Y GESTIÓN DE ABASTECIMIENTO
- **5.1 Órdenes de Compra (OC):** Registro de pedidos a proveedores con series (`OC01`), asignación de almacén receptor y condiciones de pago.
- **5.2 Recepción de Mercadería e Impacto Logístico:** Recepción total o parcial de artículos, actualización automática del costo promedio ponderado y creación de movimiento `ENTRADA_COMPRA` en Kardex.
- **5.3 Cuentas por Pagar Automáticas:** Generación del pasivo comercial con el proveedor y programación de fecha de vencimiento.

---

### PAQUETE DE TRABAJO 6: INVENTARIO, LOGÍSTICA MULTI-ALMACÉN Y TRAZABILIDAD (FEFO)
- **6.1 Catálogo de Productos Paramétrico:** Gestión de SKUs, unidades de medida normalizadas (NIU, KGM, ZZ, etc.), tipos de afectación al IGV (10, 20, 30), stock mínimo y fotografías asociadas.
- **6.2 Kardex Valorizado Ponderado (Formato SUNAT 13.1):** Registro inmutable de cada entrada, salida y saldo valorizado con su respectivo costo unitario ponderado móvil.
- **6.3 Transferencias Multi-Almacén y Guía de Remisión Remitente (GRE 09):** Traslado físico de mercadería entre almacenes de la empresa con generación simultánea de la Guía de Remisión Electrónica Remitente UBL 2.1 `DespatchAdvice`, registro de transportista, conductor, vehículo, pesos y puntos de partida/llegada.
- **6.4 Control de Lotes y Fechas de Vencimiento (`ProductLot`):** Asignación de partidas de producción o compra a lotes específicos, cálculo dinámico de días de vigencia, alertas preventivas de caducidad y despacho priorizado por política FEFO (*First Expired, First Out*).

---

### PAQUETE DE TRABAJO 7: COBRANZAS, PAGOS, CUOTAS Y CONCILIACIÓN (CXC / CXP)
- **7.1 Cuentas por Cobrar (Clientes - PCGE 1212):** Monitoreo de facturas emitidas a crédito, semáforo de morosidad y cálculo de saldos pendientes en tiempo real.
- **7.2 Cuentas por Pagar (Proveedores - PCGE 4212):** Supervisión de deudas comerciales y pagos pendientes por recepción de mercaderías.
- **7.3 Cronograma de Cuotas (`PaymentSchedule`):** División del saldo en cuotas con fechas de vencimiento preestablecidas para cumplimiento de la normativa SUNAT de crédito.
- **7.4 Registro de Cobros/Pagos y Conciliación Bancaria (`PaymentRecord`):** Ingreso de comprobantes de pago bancarios (BCP, BBVA, etc.), vouchers u operaciones de caja, con amortización cronológica (FIFO) y generación inmediata del asiento contable en el Libro Diario.

---

### PAQUETE DE TRABAJO 8: CONTABILIDAD GENERAL EMPRESARIAL (PCGE 2019) Y LIBROS ELECTRÓNICOS
- **8.1 Plan Contable Integral:** Cuentas predefinidas a 5 dígitos para Elementos 1, 2, 4, 6 y 7 del PCGE 2019.
- **8.2 Asientos Automáticos en Tiempo Real:** Asiento de Venta, Asiento de Costo de Ventas, Asiento de Compra, Asiento de Cobranza (`1041 ➔ 1212`) y Asiento de Pago a Proveedor (`4212 ➔ 1041`).
- **8.3 Exportación a SIRE y PLE:** Generación de estructuras de datos para SIRE RVIE 14.1, SIRE RCE 8.1 y PLE Libro Diario 5.1.

---

### PAQUETE DE TRABAJO 9: ANALÍTICA Y REPORTES GERENCIALES
- **9.1 Reportes de Ventas:** Resúmenes mensuales, trimestrales y anuales desagregados por producto, cliente y vendedor.
- **9.2 Reportes de Cartera y Morosidad:** Antigüedad de saldos (por vencer, 1-30 días, 31-60 días y 60+ días de retraso).
- **9.3 Reportes de Inventario:** Valorización global por almacén y alertas de rotación baja.

---

## 4. ARQUITECTURA TECNOLÓGICA Y STACK TÉCNICO

```
+-------------------------------------------------------------------------------+
|                                JEXIA ERP UI/UX                                |
|          Next.js 15 (App Router) + React 19 + Tailwind CSS + Lucide Icons    |
+-------------------------------------------------------------------------------+
                                        | (Server Actions & Micro-Transacciones)
                                        v
+-------------------------------------------------------------------------------+
|                            CAPA DE NEGOCIO & SERVICIOS                        |
|  - Sales / Invoicing Engine (UBL 2.1)       - Transfer & GRE Builder (09)     |
|  - Payment & Cashflow Reconciler (PCGE)     - FEFO Lot Management Engine      |
|  - Weighted Average Kardex 13.1 Service     - SUNAT Digital Signature Engine  |
+-------------------------------------------------------------------------------+
                                        | (Prisma Client ORM)
                                        v
+-------------------------------------------------------------------------------+
|                            CAPA DE PERSISTENCIA ACID                          |
|                     PostgreSQL 17 (Relacional / Concurrencia)                 |
+-------------------------------------------------------------------------------+
```

- **Frontend & Framework:** Next.js 15.1 con TypeScript 5, React Server Components (RSC) y Tailwind CSS.
- **Base de Datos:** PostgreSQL 17 relacional con índices únicos por empresa y correlativos numéricos.
- **Capa ORM:** Prisma ORM 5.22 garantizando tipado estricto y soporte para transacciones ACID compuestas (`prisma.$transaction`).
- **Seguridad:** Hashing criptográfico de contraseñas con `bcrypt`, sesiones de usuario autenticadas y validación de roles en servidor.

---

## 5. MATRIZ DE CUMPLIMIENTO REGULATORIO Y NORMATIVO

| Organismo / Norma | Requisito Regulado | Solución Implementada en Jexia ERP |
|---|---|---|
| **SUNAT - Res. 097-2012/SUNAT** | Estándar XML UBL 2.1 para Facturas y Boletas | Generador UBL 2.1 nativo con DigestValue SHA-256 y CDR simulado/real. |
| **SUNAT - Res. 123-2022/SUNAT** | Guías de Remisión Electrónica Remitente (GRE 09) | Serie `T001`, XML `DespatchAdvice`, registro de ubigeos, conductores y placas. |
| **SUNAT - Res. 193-2020/SUNAT** | Facturación al Crédito con Cronograma de Cuotas | Registro obligatorio de condición `CREDITO`, cuotas programadas y fechas de vencimiento. |
| **SUNAT - D.L. 940 (SPOT)** | Régimen de Detracciones Banco de la Nación | Cálculo de porcentaje (10%/12%), código Catálogo 54 y cuenta del Banco de la Nación en comprobante. |
| **SUNAT - Res. 112-2021/SUNAT** | Sistema Integrado de Registros Electrónicos (SIRE) | Generación de tramas de texto oficiales para RVIE (14.1) y RCE (8.1). |
| **MEF - CNC Res. 002-2019-EF/30** | Plan Contable General Empresarial (PCGE 2019) | Asientos automatizados en cuentas a 5 dígitos (`1041`, `1212`, `20111`, `40111`, `4212`, `69121`, `70121`). |

---

## 6. LÍMITES DEL ALCANCE Y EXCLUSIONES (OUT OF SCOPE)

A fin de asegurar la entrega oportuna y el foco estratégico del sistema, se definen explícitamente los siguientes elementos fuera del alcance de la versión actual:
1. **Módulo de Planilla Electrónica (PLAME):** El cálculo de aportes a ESSALUD, AFP/ONP y retenciones de quinta categoría se gestiona externamente; Jexia ERP no emite boletas de remuneraciones de personal.
2. **Manufactura Discreta Avanzada (BOM con fórmulas químicas multinivel):** Se incluye control de órdenes de compra, insumos y lotes, pero no control de rutas de máquinas industriales en tiempo real.
3. **Facturación Offline sin conectividad a Base de Datos:** Jexia ERP requiere conexión a su servidor PostgreSQL 17 local o en la nube para garantizar la transaccionalidad ACID del Kardex.

---

## 7. CRITERIOS DE ACEPTACIÓN DEL SISTEMA

El sistema se considerará formalmente aprobado cuando se cumpla con:
1. **Emisión de Comprobantes:** Capacidad de emitir Facturas, Boletas, Cotizaciones y Notas de Crédito visualizables en formato A4 y Ticket de 80mm con código QR y descarga de XML/CDR.
2. **Kardex Confiable:** Registro exacto de entradas por compras y salidas por ventas con recálculo dinámico del costo promedio ponderado sin descuadres en cantidad ni valorización monetaria.
3. **Operatividad de Lotes FEFO:** Clasificación automática de partidas en Disponible, Por Vencer (amarillo) y Vencido (rojo) según la fecha de expiración configurada.
4. **Transferencias con GRE:** Traslado de existencias entre dos almacenes con descuento en origen, abono en destino y generación de la Guía de Remisión Remitente (09).
5. **Cuentas por Cobrar y Pagar Cuadradas:** Registro de abonos parciales y totales con amortización de cuotas y generación de asientos contables PCGE balanceados ($Debe = Haber$).

---

## 8. ROADMAP EVOLUTIVO (FASES FUTURAS)

- **Fase 2.1:** Integración directa con pasarelas de pago peruanas (Culqi, Niubiz, Mercado Pago) mediante Webhooks automáticos.
- **Fase 2.2:** Envío automatizado de comprobantes electrónicos PDF y XML por correo electrónico y WhatsApp Business API.
- **Fase 2.3:** Aplicación móvil nativa para toma de pedidos en ruta por vendedores de campo con sincronización en segundo plano.

---
*Documento de Alcance oficial para Jexia ERP v2.0.*
