---
name: jexia-comercial-documental
description: >-
  Gestión comercial, ciclo documental (Cotización ➔ Boleta/Factura ➔ Despacho), validación de
  RUC/DNI en Perú, administración de directorio de clientes y proveedores, y formatos impresos
  oficiales (PDF A4 / Ticket 80mm) con la identidad de Jexia ERP. Usar para asesorar en flujos
  de venta, cierre de tratos, políticas de crédito/cobranza y emisión documental.
---

# Jexia ERP — Gestión Comercial & Documental

Manual operativo para el control integral de **ventas, cotizaciones, directorio comercial y ciclo documental** en **Jexia ERP**.

---

## 💼 1. Flujo del Ciclo Comercial B2B & B2C

```
[Prospecto / Cliente] 
       │
       ▼
 [1. Directorio Partner]  ──▶ Validación RUC (11 dígitos) o DNI (8 dígitos)
       │
       ▼
 [2. Cotización Comercial] ──▶ Formato A4 con JexiaLogo, validez (días) y condiciones
       │
       ▼ (1 Clic)
 [3. Conversión a Comprobante] 
   ├── Si tiene RUC  ──▶ Factura Electrónica (F001) + XML UBL 2.1 + CDR
   └── Si tiene DNI  ──▶ Boleta de Venta (B001) + Ticket / A4
       │
       ▼
 [4. Descuento Automático Kardex] ──▶ Salida de stock valorizada en Soles (S/)
       │
       ▼
 [5. Asiento Contable Automático] ──▶ Cuentas 1212, 40111, 7012 (PCGE 2019)
```

---

## 👥 2. Directorio de Partners (Clientes & Proveedores)

### 2.1. Reglas de Validación de Documentos de Identidad:
1. **RUC (Registro Único de Contribuyentes):**
   * Longitud exacta: **11 dígitos**.
   * Prefijos válidos:
     * `10`: Persona natural con negocio.
     * `15` / `17`: Personas jurídicas especiales.
     * `20`: Persona jurídica (Sociedad Anónima, S.A.C., S.R.L., E.I.R.L.).
2. **DNI (Documento Nacional de Identidad):**
   * Longitud exacta: **8 dígitos numéricos**.
3. **Validación de Razón Social / Nombre:**
   * Es mandatorio consignar la razón social exacta como figura en la Ficha RUC de SUNAT para evitar discrepancias en la emisión de Facturas Electrónicas.

---

## 📑 3. Cotizaciones Comerciales

* **Numeración:** Serie `COT1`, correlativo secuencial `COT1-000001`.
* **Atributos de una Cotización de Alto Cierre:**
  * Vigencia de la oferta (ej. 7, 15 o 30 días hábiles).
  * Moneda oficial: Soles (`PEN` - `S/`).
  * Plazo de entrega estimado y almacén de despacho (`Almacén Central Lima`).
  * Desglose de Op. Gravada, Exonerada e IGV 18%.
  * Condición de pago acordada (Contado, Crédito a 30 días, 50% anticipo).
* **Conversión Transaccional:**
  * Al hacer clic en "Convertir a Factura" o "Convertir a Boleta", se incrementa atómicamente el correlativo de la serie correspondiente (`F001` o `B001`), se descuenta el stock en Kardex y se marca la cotización como `FACTURADA`.

---

## 🖨️ 4. Formatos Impresos & Representación Gráfica

* **Encabezado Institucional:** Toda representación impresa incluye el componente oficial [`JexiaLogo.tsx`](file:///d:/03.%20Jexia%20ERP/src/components/JexiaLogo.tsx) con fondo claro en la esquina superior izquierda.
* **Formato A4 Oficial:**
  * Cuadro tributario SUNAT en recuadro doble borde a la derecha.
  * Datos del cliente, moneda, fecha de emisión y vencimiento.
  * Tabla de items con Cantidad, Unidad (`NIU`/`ZZ`), SKU, Descripción, Precio Unitario y Subtotal.
  * Resumen tributario: Op. Gravada, IGV (18%), Detracción SPOT (si aplica), Total a Pagar.
  * Código Hash del CDR y leyenda fiscal *"Representación impresa del comprobante electrónico"*.
* **Formato Ticket 80mm:**
  * Orientado a cajas rápidas y despachos retail.
  * Contiene cabecera con logotipo, RUC de la empresa, datos simplificados del cliente, desglose y código QR fiscal.
