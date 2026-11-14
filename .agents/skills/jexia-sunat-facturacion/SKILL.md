---
name: jexia-sunat-facturacion
description: >-
  Estándares de Facturación Electrónica SUNAT Perú (UBL 2.1, CDR, XML, PDF A4 y Ticket 80mm),
  detracciones SPOT (Banco de la Nación), catálogo de códigos SUNAT y generación de libros
  electrónicos SIRE (RVIE 14.1 / RCE 8.1) y PLE 5.1 (Libro Diario PCGE 2019) para Jexia ERP.
  Usar para emisión de comprobantes, notas de crédito, validaciones tributarias y exportación contable.
---

# Jexia ERP — Facturación Electrónica SUNAT & Contabilidad

Guía especializada para la emisión, validación y cumplimiento tributario según las normativas de la **Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT) de Perú**.

---

## 📜 1. Tipos de Comprobantes & Catálogo 01 SUNAT

| Tipo Comprobante | Código SUNAT | Serie ERP | Requisito de Cliente |
| :--- | :--- | :--- | :--- |
| **Factura Electrónica** | `01` | `F001` | Requiere **RUC de 11 dígitos** con razón social válida. Aplica crédito fiscal de IGV. |
| **Boleta de Venta** | `03` | `B001` | **DNI de 8 dígitos** o venta simplificada a consumidor final sin RUC. |
| **Nota de Crédito** | `07` | `FC01` | Modifica una Factura o Boleta emitida previamente. Catálogo 09 (Motivo 01: Anulación de la operación). |
| **Cotización Comercial** | `COT` | `COT1` | Documento de propuesta mercantil, convertible a Boleta o Factura en 1 clic. |

---

## 🏷️ 2. Catálogos Clave SUNAT Implementados

* **Catálogo 06 (Documentos de Identidad):**
  * `6`: RUC (11 dígitos numéricos, empieza con 10, 15, 17 o 20).
  * `1`: DNI (8 dígitos numéricos).
* **Catálogo 07 (Afectación al IGV):**
  * `10`: Gravado - Operación Onerosa (calcula 18% IGV: $\text{Base} \times 0.18$).
  * `20`: Exonerado - Operación Onerosa (Apéndice I TUO del IGV).
  * `30`: Inafecto - Operación Onerosa.
* **Catálogo 25 (Productos y Servicios):**
  * Código UNSPSC estándar de 8 dígitos (ej. `53102902` Prendas de vestir / Polos).
* **Catálogo 54 (Detracciones SPOT):**
  * Sujeto a depósito en cuenta del Banco de la Nación cuando el monto supera `S/ 700.00` en operaciones gravadas de servicios (`022` Otros servicios empresariales - 10% / 12%).

---

## 🔐 3. Estructura UBL 2.1 & Constancia de Recepción (CDR)

* **Generador UBL 2.1:** Implementado en [`src/lib/ubl-builder.ts`](file:///d:/03.%20Jexia%20ERP/src/lib/ubl-builder.ts).
  * Genera el XML oficial con espacios de nombres `urn:oasis:names:specification:ubl:schema:xsd:Invoice-2`.
  * Calcula el `DigestValue` criptográfico SHA-256 para la firma digital.
  * Simula la respuesta y constancia de recepción **CDR de SUNAT** con código de respuesta `0` ("La Factura ha sido aceptada") y Hash CDR.
* **Visor Multi-formato ([`DocumentViewerModal.tsx`](file:///d:/03.%20Jexia%20ERP/src/components/sales/DocumentViewerModal.tsx)):**
  1. **A4 Tributario:** Con logotipo de Jexia ERP, cuadro superior SUNAT, desglose de Op. Gravada, IGV, detracción y firmas.
  2. **Ticket 80mm:** Para impresoras térmicas de punto de venta con código QR.
  3. **XML UBL 2.1:** Descargable para auditoría o envío a OSE/PSE.
  4. **CDR XML:** Descargable como constancia de aceptación fiscal.

---

## 📊 4. Contabilidad PCGE 2019 & Libros SIRE / PLE

* **Plan Contable General Empresarial (PCGE 2019):**
  * `1212`: Emitidas en cartera (Cuentas por cobrar comerciales).
  * `40111`: IGV - Cuenta propia (18% Pasivo corriente).
  * `7012`: Mercaderías - Venta local (Ingresos por ventas).
  * `6011`: Compras de mercaderías (Gastos por compras).
  * `4212`: Facturas por pagar (Cuentas por pagar comerciales).
  * `2011`: Mercaderías manufacturadas (Activo inventario).
  * `6111`: Variación de inventarios mercaderías.
* **Generadores Oficiales en TXT ([`src/lib/sire-ple.ts`](file:///d:/03.%20Jexia%20ERP/src/lib/sire-ple.ts)):**
  * **SIRE RVIE (14.1):** Registro de Ventas e Ingresos Electrónico.
  * **SIRE RCE (8.1):** Registro de Compras Electrónico.
  * **PLE 5.1:** Estructura oficial del Libro Diario general.
