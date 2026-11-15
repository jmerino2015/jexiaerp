# JEXIA ERP — MANUAL DE USO Y DOCUMENTACIÓN FUNCIONAL INTEGRAL
**Versión del Sistema:** 2.0 (Edición Empresarial Perú)  
**Lema:** *"Claridad operativa para crecer sin límites"*  
**Normativa de Cumplimiento:** SUNAT Facturación Electrónica UBL 2.1, GRE 09, SPOT Detracciones, SIRE / PLE 5.1 y Plan Contable General Empresarial (PCGE 2019).  
**Formato:** Manual de Operaciones Paso a Paso (Sin imágenes - Texto estructurado de alta fidelidad).

---

## ÍNDICE GENERAL

1. [INTRODUCCIÓN Y ARQUITECTURA DE JEXIA ERP](#1-introducción-y-arquitectura-de-jexia-erp)
2. [ACCESO AL SISTEMA Y CONTROL DE NAVEGACIÓN](#2-acceso-al-sistema-y-control-de-navegación)
   - 2.1 Inicio de Sesión y Roles de Usuario
   - 2.2 Barra de Navegación Lateral Plegable (Sidebar)
   - 2.3 Identidad Corporativa y Logotipo Jexia ERP
3. [MÓDULO DE INICIO (DASHBOARD EJECUTIVO)](#3-módulo-de-inicio-dashboard-ejecutivo)
   - 3.1 Indicadores Clave de Desempeño (KPIs)
   - 3.2 Gráficos de Tendencia y Monitoreo en Tiempo Real
4. [MÓDULO DE VENTAS Y FACTURACIÓN ELECTRÓNICA SUNAT (UBL 2.1)](#4-módulo-de-ventas-y-facturación-electrónica-sunat-ubl-21)
   - 4.1 Punto de Venta Rápido (POS)
   - 4.2 Emisión de Facturas Electrónicas (Código SUNAT 01)
   - 4.3 Emisión de Boletas de Venta Electrónicas (Código SUNAT 03)
   - 4.4 Gestión de Cotizaciones y Conversión Directa a Factura/Boleta
   - 4.5 Notas de Crédito Electrónicas (Código SUNAT 07)
   - 4.6 Régimen de Detracciones SPOT (Banco de la Nación)
   - 4.7 Visor Oficial de Comprobantes, Descarga de XML UBL 2.1 y CDR Oficial
5. [MÓDULO DE E-COMMERCE RETAIL B2C](#5-módulo-de-e-commerce-retail-b2c)
   - 5.1 Catálogo Virtual para Clientes
   - 5.2 Carrito de Compras y Métodos de Entrega (Delivery / Pickup)
   - 5.3 Procesamiento de Pasarelas y Emisión Automática de Comprobante
6. [MÓDULO DE COMPRAS Y GESTIÓN DE PROVEEDORES](#6-módulo-de-compras-y-gestión-de-proveedores)
   - 6.1 Registro de Órdenes de Compra (OC)
   - 6.2 Recepción de Mercadería e Impacto en Almacén
   - 6.3 Vinculación de Factura del Proveedor
7. [MÓDULO DE INVENTARIO, ALMACENES Y LOGÍSTICA INTEGRAL](#7-módulo-de-inventario-almacenes-y-logística-integral)
   - 7.1 Catálogo de Productos, Parámetros y Fotografías
   - 7.2 Kardex Valorizado Ponderado (Formato SUNAT 13.1)
   - 7.3 Transferencias Multi-Almacén y Guías de Remisión Remitente (GRE 09)
   - 7.4 Control de Lotes y Fechas de Vencimiento (Trazabilidad FEFO)
8. [MÓDULO DE COBRANZAS, PAGOS Y TESORERÍA (CXC / CXP)](#8-módulo-de-cobranzas-pagos-y-tesorería-cxc--cxp)
   - 8.1 Cuentas por Cobrar a Clientes (PCGE 1212)
   - 8.2 Cuentas por Pagar a Proveedores (PCGE 4212)
   - 8.3 Cronograma de Cuotas para Ventas a Crédito
   - 8.4 Registro de Cobros, Pagos y Conciliación Bancaria
9. [DIRECTORIO DE CLIENTES Y PROVEEDORES (PARTNERS)](#9-directorio-de-clientes-y-proveedores-partners)
   - 9.1 Validación y Registro de RUC / DNI
   - 9.2 Historial de Operaciones Comerciales
10. [MÓDULO CONTABLE SEGÚN NORMATIVAS SUNAT Y PCGE 2019](#10-módulo-contable-según-normativas-sunat-y-pcge-2019)
    - 10.1 Plan de Cuentas Contables y Dinámica de Asientos
    - 10.2 Libro Diario Electrónico
    - 10.3 Generación de Libros Electrónicos SIRE y PLE 5.1
11. [MÓDULO DE REPORTES Y ANALÍTICA DE NEGOCIOS](#11-módulo-de-reportes-y-analítica-de-negocios)
12. [ADMINISTRACIÓN, SEGURIDAD Y CONFIGURACIÓN](#12-administración-seguridad-y-configuración)

---

## 1. INTRODUCCIÓN Y ARQUITECTURA DE JEXIA ERP

**Jexia ERP** es una plataforma integral de gestión empresarial bajo modelo SaaS, desarrollada con tecnología Next.js 15, PostgreSQL 17, Prisma ORM y arquitectura orientada a micro-acciones ACID.

Su principal objetivo es otorgar a las Micro, Pequeñas y Medianas Empresas (MYPES) peruanas una herramienta ágil, robusta y completamente conectada con las normativas fiscales de la SUNAT, eliminando los errores operativos, las discrepancias en el Kardex y las complicaciones contables.

### Principios Fundamentales del Sistema:
1. **Transaccionalidad ACID Estricta:** Ninguna operación de inventario o financiera se registra de forma aislada. Todo movimiento de stock genera su asiento en el Kardex ponderado y su correspondiente impacto contable.
2. **Validación Electrónica UBL 2.1 en Tiempo Real:** Emisión y generación instantánea de XML firmados digitalmente, cálculo de resumen hash (SHA-256) y Constancia de Recepción (CDR) de SUNAT.
3. **Flujo de Trabajo Inspirado en Estándares Mundiales (Odoo 19 / SAP):** Integración natural entre Ventas, Logística, Compras, Tesorería y Contabilidad.

---

## 2. ACCESO AL SISTEMA Y CONTROL DE NAVEGACIÓN

### 2.1 Inicio de Sesión y Roles de Usuario
- El acceso se realiza a través de la ruta `/login`.
- Ingrese su correo electrónico corporativo y su contraseña asignada.
- **Roles admitidos en el sistema:**
  - `ADMIN`: Control total del sistema, configuración de empresa, almacenes y usuarios.
  - `GERENTE`: Visualización ejecutiva, reportes financieros, aprobación de compras y ventas.
  - `CONTADOR`: Gestión contable, emisión de libros SIRE/PLE, plan contable y conciliación.
  - `VENDEDOR`: Acceso al Punto de Venta (POS), cotizaciones y cobranzas.
  - `ALMACENERO`: Control de inventario, recepción de compras, transferencias multi-almacén y lotes.

### 2.2 Barra de Navegación Lateral Plegable (Sidebar)
- En la zona izquierda de la pantalla se ubica el menú de navegación principal.
- **Botón de Colapso/Expansión:** Permite replegar la barra lateral hacia la izquierda haciendo clic en el ícono de panel superior derecho, maximizando el espacio de trabajo en pantallas de escritorio y dispositivos móviles.
- Los módulos principales accesibles son:
  - *Inicio:* `/inicio`
  - *Ventas:* `/ventas`
  - *E-commerce Retail:* `/ecommerce`
  - *Compras:* `/compras`
  - *Inventario:* `/inventario`
  - *Cobranzas & Pagos:* `/finanzas`
  - *Clientes:* `/clientes`
  - *Proveedores:* `/proveedores`
  - *Contabilidad:* `/contabilidad`
  - *Reportes:* `/reportes`

### 2.3 Identidad Corporativa y Logotipo Jexia ERP
- El encabezado del Sidebar y todas las plantillas impresas incorporan el logotipo oficial de **Jexia ERP** compuesto por la base de soporte, las tres barras de crecimiento (Naranja `#F97316`, Azul `#2563EB`, Verde `#10B981`) y la tipografía con el lema *"Ordena, controla y haz crecer tu negocio"*.

---

## 3. MÓDULO DE INICIO (DASHBOARD EJECUTIVO)

Ruta de acceso: `/inicio`

### 3.1 Indicadores Clave de Desempeño (KPIs)
El tablero principal resume en tarjetas de alto impacto los datos más relevantes de la jornada:
1. **Total de Ventas del Mes:** Importe acumulado en Soles (PEN) por comprobantes emitidos y liquidados.
2. **Cuentas por Cobrar Pendientes:** Saldo adeudado por clientes con alerta visual de morosidad.
3. **Valor del Inventario Físico:** Valorización total de existencias calculada por el costo promedio ponderado de cada producto.
4. **Margen Bruto Operativo:** Porcentaje de rentabilidad entre el valor de venta y el costo de mercadería vendida.

### 3.2 Gráficos y Listados Rápidos
- Gráfico cronológico de ventas diarias vs. compras.
- Listado de los últimos comprobantes emitidos con su estado SUNAT.
- Alertas de stock crítico (productos con existencias menores o iguales a su stock mínimo configurado).

---

## 4. MÓDULO DE VENTAS Y FACTURACIÓN ELECTRÓNICA SUNAT (UBL 2.1)

Ruta de acceso: `/ventas`

El módulo se compone de 3 áreas de trabajo:
1. **Comprobantes Electrónicos Emitidos:** Bandeja de monitoreo de Facturas, Boletas y Notas de Crédito.
2. **Punto de Venta Rápido (POS):** Interfaz para facturación inmediata de mostrador o venta telefónica.
3. **Cotizaciones y Proformas:** Presupuestos comerciales con validez temporal.

---

### 4.1 Paso a Paso: Emisión de una Boleta de Venta Electrónica (Código SUNAT 03)
1. Diríjase a `/ventas` y presione la pestaña **"Punto de Venta (POS)"**.
2. En el selector de tipo de documento, elija **"BOLETA"**.
3. Seleccione el cliente de la lista desplegable o ingrese un cliente con DNI o RUC.
4. En la sección de productos, seleccione el artículo (ej: `POLO VERANO COLOR ROJO TALLA L`).
5. Indique la cantidad a vender y confirme el precio de venta unitario.
6. Elija el medio de pago: `EFECTIVO`, `TRANSFERENCIA`, `YAPE_PLIN` o `TARJETA`.
7. Si el cliente paga de contado, deje la condición en `CONTADO`.
8. Presione el botón azul **"Emitir Comprobante Electrónico"**.
9. **Resultado del Sistema:**
   - Se asigna automáticamente la serie correlativa (ej: `B001-000035`).
   - Se descuenta el stock de las existencias del almacén predeterminado.
   - Se crea el movimiento de salida en el Kardex valorizado.
   - Se genera el archivo XML UBL 2.1 con su firma digital y código Hash SHA-256.
   - Se genera la Constancia de Recepción (CDR) de SUNAT con estado `ACEPTADO`.
   - Se genera el asiento contable en el Libro Diario (Debe `1212` / Haber `40111` / Haber `70121`) y el asiento de costo de ventas (Debe `69121` / Haber `20111`).

---

### 4.2 Paso a Paso: Emisión de una Factura Electrónica (Código SUNAT 01) a Crédito
1. En `/ventas` ➔ pestaña **"POS"**, seleccione **"FACTURA"**.
2. Seleccione un cliente con RUC válido (11 dígitos).
3. Añada las líneas de producto deseadas.
4. En **Medio de Pago**, seleccione **"CREDITO"**.
5. Indique la condición de crédito (ej: `CREDITO_30` o `CREDITO_15`).
6. El sistema calculará automáticamente la fecha de vencimiento y programará la cuota en el módulo de Cobranzas.
7. Presione **"Emitir Comprobante Electrónico"**.
8. El comprobante quedará registrado con estado `PENDIENTE` en Cuentas por Cobrar hasta que se registre su cobranza.

---

### 4.3 Régimen de Detracciones SPOT (Banco de la Nación)
- Aplica para servicios o venta de bienes afectos al sistema de detracciones con importes mayores a S/ 700.00.
- **Cómo operarlo:**
  1. Active la casilla de verificación **"Sujeto a Detracción SPOT (Banco de la Nación)"**.
  2. Seleccione el código del Catálogo 54 de SUNAT (ej: `022 - Otros servicios empresariales`).
  3. Indique el porcentaje aplicable (ej: `10%` o `12%`).
  4. El sistema calculará el monto neto de detracción y el saldo neto a cobrar. En la representación impresa y en el XML UBL 2.1 se incluirán los datos obligatorios del Banco de la Nación.

---

### 4.4 Emisión de Notas de Crédito Electrónicas (Código SUNAT 07)
- Para devoluciones de mercadería o anulación de operaciones.
- **Pasos:**
  1. En el POS, elija el tipo de documento **"NOTA_CREDITO"**.
  2. Seleccione el comprobante de referencia que se va a modificar (Factura `01` o Boleta `03`).
  3. Ingrese el número del documento afectado (ej: `F001-000020`).
  4. Seleccione el motivo del Catálogo 09 de SUNAT (ej: `01 - Anulación de la operación` o `07 - Devolución total`).
  5. Agregue los productos que retornan a la empresa.
  6. Al confirmar, el sistema reintegrará las unidades al Kardex y generará el asiento de ajuste contable correspondiente.

---

### 4.5 Visor Oficial de Comprobantes, Impresión A4 / Ticket y Descarga de XML/CDR
- En la tabla de comprobantes emitidos, haga clic en cualquier fila o en el botón del ojo.
- Se abrirá el modal con:
  - Vista previa en **Formato A4 Oficial** y conmutador a **Formato Ticket Térmico de 80mm**.
  - Código QR tributario SUNAT interactivo.
  - Botón **"Imprimir"** con estilos CSS optimizados para impresoras láser o térmicas.
  - Botón **"Descargar XML UBL 2.1"** (archivo `.xml` oficial).
  - Botón **"Descargar CDR SUNAT"** (constancia de recepción oficial `.xml`).

---

## 5. MÓDULO DE E-COMMERCE RETAIL B2C

Ruta de acceso: `/ecommerce`

Permite a los clientes finales comprar en línea los productos marcados con la opción `isEcommerce = true`.

### Funcionalidades:
1. **Catálogo de Productos:** Muestra las fotografías subidas en el catálogo, precios de venta con IGV, descripción comercial y disponibilidad de stock.
2. **Filtros por Categoría y Búsqueda Instantánea:** Búsqueda por palabra clave o selección de categorías (Textil, Tecnología, Alimentos, etc.).
3. **Carrito de Compras:** Cálculo instantáneo de subtotal, IGV y costos de envío.
4. **Checkout Integrado:**
   - Selección de método de entrega: `DELIVERY` (a domicilio) o `PICKUP` (recojo en tienda).
   - Datos del comprador: DNI o RUC, Nombres, Correo, Celular y Dirección.
   - Métodos de pago aceptados: Yape / Plin, Transferencia Bancaria o Tarjeta.
5. **Generación del Pedido y Facturación Automática:** Al confirmar la compra se genera la orden en estado `PAGADO_PREPARANDO` y se reserva el stock en almacén.

---

## 6. MÓDULO DE COMPRAS Y GESTIÓN DE PROVEEDORES

Ruta de acceso: `/compras`

### 6.1 Registro de una Orden de Compra (OC)
1. Ingrese a `/compras` y presione el botón **"Nueva Orden de Compra"**.
2. Seleccione el proveedor del catálogo (o cree uno nuevo con su número de RUC).
3. Seleccione el almacén de destino donde ingresarán los artículos.
4. Agregue los ítems a adquirir, indicando cantidad pactada y costo unitario de compra (sin IGV).
5. Opcionalmente, ingrese el número de factura emitida por el proveedor (ej: `F001-9921`).
6. Si la compra es a crédito, defina la condición (ej: `CREDITO_30` o `CREDITO_45`).
7. Presione **"Guardar Orden de Compra"**.

### 6.2 Recepción de Mercadería e Impacto en Almacén
1. Cuando el proveedor entregue los artículos, localice la orden de compra y presione **"Recibir Mercadería"**.
2. El sistema ejecutará las siguientes acciones transaccionales:
   - Incrementará las unidades en el almacén de destino.
   - Recalculará el **Costo Promedio Ponderado** del producto en el catálogo.
   - Creará el movimiento de entrada tipo `ENTRADA_COMPRA` en el Kardex.
   - Generará la Cuenta por Pagar al proveedor en el módulo de Finanzas.

---

## 7. MÓDULO DE INVENTARIO, ALMACENES Y LOGÍSTICA INTEGRAL

Ruta de acceso: `/inventario`

El módulo de inventario centraliza la logística de la empresa a través de 4 pestañas especializadas:
1. **Catálogo de Productos & Almacén**
2. **Kardex Valorizado Ponderado (SUNAT 13.1)**
3. **Transferencias & GRE (09)**
4. **Control de Lotes & Vencimientos**

---

### 7.1 Catálogo de Productos y Parametrización
- **Creación de Productos:**
  1. Presione **"Nuevo Producto"**.
  2. Complete los datos obligatorios: Código SKU, Nombre descriptivo, Unidad de Medida (NIU, KGM, ZZ, etc.) y Categoría.
  3. Parametrice los valores clave:
     - **Precio de Venta:** Importe al público con o sin IGV.
     - **Costo Promedio Inicial:** Para apertura de saldos.
     - **Stock Mínimo:** Umbral para disparo de alertas de reposición.
     - **Tipo de Afectación IGV:** Gravado (10), Exonerado (20) o Inafecto (30).
     - **Código SUNAT (Catálogo 25):** Para validaciones tributarias.
     - **Publicar en E-commerce:** Habilita el artículo en la tienda en línea.
     - **Fotografía del Producto:** Permite adjuntar archivos SVG, PNG o JPG que se almacenan en el servidor (`/uploads/products/`) y se renderizan tanto en el catálogo administrativo como en la tienda web.
     - **Tipo de Seguimiento:** `NONE` (Sin lote), `LOT` (Control por número de lote) o `SERIAL` (Número de serie único).
     - **Fecha de Vencimiento:** Alerta en días previos para política FEFO.

---

### 7.2 Kardex Valorizado Ponderado (Formato SUNAT 13.1)
- Muestra el historial completo de entradas, salidas y saldos finales de cada producto.
- Permite seleccionar cualquier producto del catálogo para ver su tabla valorizada.
- Cada línea detalla: Fecha, Tipo de Operación SUNAT (12 Tabla 10), Comprobante de Respaldo, Cantidad Entrada/Salida, Costo Unitario, Saldo Físico y Saldo Valorizado Total.

---

### 7.3 Transferencias Multi-Almacén y Guías de Remisión Electrónica Remitente (GRE 09)
Permite trasladar mercadería entre diferentes sucursales o depósitos de la empresa cumpliendo la obligatoriedad de la Guía de Remisión Electrónica de SUNAT.

#### Procedimiento para realizar una Transferencia:
1. En `/inventario`, presione la pestaña **"Transferencias & GRE (09)"**.
2. Presione el botón **"Nueva Transferencia / GRE"**.
3. Seleccione el **Almacén Origen** (donde hay stock disponible) y el **Almacén Destino**.
4. Seleccione el producto (ej: `POLO VERANO COLOR ROJO TALLA L`) e indique la cantidad a trasladar.
5. Ingrese los datos de transporte:
   - **Modalidad:** Transporte Privado (02) o Transporte Público (01).
   - **Motivo de Traslado:** Catálogo 20 (ej: `04 - Traslado entre establecimientos de la misma empresa`).
   - **Datos del Conductor:** N° DNI, Nombres y Apellidos, N° de Licencia de Conducir.
   - **Vehículo:** Número de Placa de rodaje.
   - **Punto de Partida y Llegada:** Direcciones y código de Ubigeo.
6. Presione **"Emitir Transferencia y GRE Remitente"**.
7. **Acciones automáticas:**
   - Se descuenta el stock del almacén origen y se abona en el almacén destino.
   - Se crean dos movimientos en el Kardex: `TRANSFERENCIA_SALIDA` y `TRANSFERENCIA_ENTRADA`.
   - Se asigna la serie correlativa de guía (ej: `T001-000003`).
   - Se genera el XML UBL 2.1 estándar `DespatchAdvice` y su constancia CDR.
   - Puede ver e imprimir la Guía A4 oficial con código QR y firmas presionando el botón **"Ver GRE"**.

---

### 7.4 Control de Lotes y Fechas de Vencimiento (Trazabilidad FEFO)
Ruta: `/inventario` ➔ Pestaña **"Control de Lotes & Vencimientos"**.

Diseñado para empresas de confección, farmacéuticas, alimentos o perecibles:
- **Estados del Lote:**
  - 🟢 **DISPONIBLE:** Lote dentro de su periodo de vida útil, apto para despacho o venta.
  - 🟡 **POR VENCER:** Lote que se encuentra dentro del rango de días de alerta previa (ej: faltan menos de 30 o 45 días). Aplica prioridad **FEFO (*First Expired, First Out*)** para sugerir su venta inmediata antes que lotes más nuevos.
  - 🔴 **VENCIDO:** Lote cuya fecha de vencimiento ya expiró. El sistema emite alertas visuales para retenerlo y evitar despachos erróneos.
  - ⚪ **AGOTADO:** Lote con stock en cero.
- **Creación de un Lote:**
  1. Presione el botón **"Nuevo Lote"**.
  2. Seleccione el producto y el almacén.
  3. Ingrese el número de lote (o presione **"Auto"** para generar un código estándar como `LOT-2026-POL-849`).
  4. Indique la fecha de fabricación y la fecha de expiración.
  5. Ingrese la cantidad inicial que ingresa en dicho lote.
  6. Presione **"Crear Lote y Aplicar Apertura"**.

---

## 8. MÓDULO DE COBRANZAS, PAGOS Y TESORERÍA (CXC / CXP)

Ruta de acceso: `/finanzas`

Centraliza el flujo de caja operativo, la morosidad y la conciliación bancaria.

### 8.1 Pestaña Cuentas por Cobrar (Clientes - PCGE 1212)
- Lista todas las facturas y boletas emitidas a crédito o con saldo pendiente.
- Columnas informativas: Comprobante, RUC/Cliente, Fecha de Emisión, Fecha de Vencimiento, Término pactado, Importe Total, Saldo Cobrado, Saldo Pendiente y Estado (`PENDIENTE`, `PARCIAL`, `COBRADO`, `VENCIDO`).
- **Semáforo de Alerta:** Los comprobantes cuya fecha de vencimiento haya pasado sin liquidarse se marcan automáticamente con la etiqueta roja **"VENCIDO"**.

### 8.2 Paso a Paso: Registrar un Cobro de Factura
1. En la tabla de Cuentas por Cobrar, ubique la factura deseada (ej: `F001-000020`).
2. Presione el botón azul **"Cobrar"**.
3. Se abrirá el modal de conciliación mostrando los datos del cliente y el saldo pendiente exacto.
4. En **"Importe a Cobrar"**, ingrese el monto que el cliente abonó (puede ser el total o un abono parcial).
5. Seleccione la fecha del abono.
6. Seleccione el medio de pago: `Transferencia Bancaria`, `Depósito en Cuenta`, `Yape/Plin`, `Tarjeta` o `Efectivo en Caja`.
7. Especifique el Banco receptor (ej: `BCP Soles Cta. Cte.`) y el **N° de Operación Bancaria / Voucher** (ej: `OP-994821`).
8. Presione **"Confirmar Operación"**.
9. **Resultado del Sistema:**
   - Se actualiza el saldo de la factura. Si se cancela el 100%, pasa a estado `COBRADO`. Si es un abono, pasa a estado `PARCIAL`.
   - Se amortizan las cuotas correspondientes del cronograma.
   - Se crea el registro histórico en Tesorería.
   - **Se genera el Asiento Contable automático en el Libro Diario:**
     - **Debe:** Cuenta `1041` (Cuentas Corrientes Operativas) por el monto cobrado.
     - **Haber:** Cuenta `1212` (Facturas y Boletas Emitidas en Cartera) por el monto cobrado.

---

### 8.3 Pestaña Cuentas por Pagar (Proveedores - PCGE 4212)
- Supervisa los compromisos de pago con proveedores de insumos o servicios.
- Permite presionar el botón **"Pagar"** para registrar cancelaciones o anticipos bancarios.
- Genera el Asiento Contable automático:
  - **Debe:** Cuenta `4212` (Facturas por Pagar Emitidas).
  - **Haber:** Cuenta `1041` (Cuentas Corrientes Operativas).

---

### 8.4 Pestaña Historial de Pagos & Tesorería
- Bitácora inmutable de todas las transacciones de entrada y salida monetaria.
- Detalla: Fecha, Tipo de Operación (`COBRO CXC` o `PAGO CXP`), Comprobante asociado, Cliente/Proveedor, Medio de Pago, Banco, Código de Operación Bancaria y las Cuentas Contables afectadas (`1041 ➔ 1212` o `4212 ➔ 1041`).

---

## 9. DIRECTORIO DE CLIENTES Y PROVEEDORES (PARTNERS)

Rutas de acceso: `/clientes` y `/proveedores`

### 9.1 Administración de Clientes (`/clientes`)
- Permite el alta, edición y consulta de clientes personas naturales (DNI) y jurídicas (RUC).
- Incluye validación de formato numérico de 8 dígitos para DNI y 11 dígitos para RUC.
- Almacena dirección fiscal, departamento, provincia, distrito, correo de facturación electrónica y número telefónico.

### 9.2 Administración de Proveedores (`/proveedores`)
- Registro centralizado de casas comerciales, mayoristas y prestadores de servicios.
- Base para la vinculación automática con las Órdenes de Compra y Cuentas por Pagar.

---

## 10. MÓDULO CONTABLE SEGÚN NORMATIVAS SUNAT Y PCGE 2019

Ruta de acceso: `/contabilidad`

### 10.1 Plan Contable General Empresarial (PCGE 2019)
- El sistema cuenta con el catálogo preconfigurado a nivel de 5 dígitos de cuentas oficiales:
  - Elemento 1: Cuentas `1011` (Caja), `1041` (Bancos), `1212` (Cuentas por cobrar comerciales).
  - Elemento 2: Cuentas `20111` (Mercaderías manufacturadas).
  - Elemento 4: Cuentas `40111` (IGV Cuenta Propia), `4212` (Cuentas por pagar comerciales).
  - Elemento 6: Cuentas `6011` (Compras de mercaderías), `69121` (Costo de ventas).
  - Elemento 7: Cuentas `70121` (Ventas locales de mercaderías).

### 10.2 Libro Diario Electrónico
- Cada vez que se emite una venta, se recibe una compra o se realiza un cobro/pago, Jexia ERP genera el asiento con glosa descriptiva y validación estricta de partida doble:
  $$\sum \text{Debe} = \sum \text{Haber}$$
- Los asientos no cuadrados son rechazados a nivel de motor de base de datos.

### 10.3 Generación de Libros Electrónicos SIRE y PLE 5.1
- **SIRE (Sistema Integrado de Registros Electrónicos):**
  - Generación del archivo plano del **RVIE (Registro de Ventas e Ingresos Electrónicos - Formato 14.1)**.
  - Generación del archivo plano del **RCE (Registro de Compras Electrónico - Formato 8.1)**.
- **PLE 5.1:**
  - Exportación del archivo de texto estructurado para el **Libro Diario (Formato 5.1)** para su envío al programa de libros electrónicos de SUNAT.

---

## 11. MÓDULO DE REPORTES Y ANALÍTICA DE NEGOCIOS

Ruta de acceso: `/reportes`

Proporciona información estratégica para la toma de decisiones:
- **Reporte de Ventas por Período y Vendedor:** Discriminación entre ventas gravadas, exoneradas e IGV.
- **Reporte de Rentabilidad por Producto:** Comparativo entre precio de venta y costo promedio histórico.
- **Reporte de Antigüedad de Deuda (Aging de Cartera):** Deuda corriente vs. vencida a 30, 60 y 90+ días.
- **Reporte de Rotación de Inventario:** Detección de productos de baja rotación o sobrestock.

---

## 12. ADMINISTRACIÓN, SEGURIDAD Y CONFIGURACIÓN

1. **Configuración de Empresa:**
   - RUC, Razón Social, Nombre Comercial, Dirección Fiscal y Ubigeo.
   - Cuenta del Banco de la Nación para Detracciones.
   - Credenciales SOL secundarias (Usuario y Clave SOL para facturación SUNAT).
   - Certificado Digital Tributario (.pfx).
2. **Seguridad y Respaldos:**
   - Encriptación de contraseñas mediante algoritmo `bcrypt`.
   - Motor de persistencia PostgreSQL 17 con soporte para réplicas y copias de seguridad automatizadas.
   - Trazabilidad de autoría en cada comprobante mediante el campo `userId`.

---
*Manual oficial generado automáticamente para Jexia ERP v2.0.*
