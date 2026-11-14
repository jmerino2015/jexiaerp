---
name: jexia-erp-core
description: >-
  Arquitectura, modelos relacionales, lógica transaccional ACID y sistema de diseño
  para Jexia ERP ("Claridad operativa para crecer sin límites") con Next.js 15, PostgreSQL 17,
  Prisma ORM, Kardex Valorizado y E-commerce retail. Usar para tareas de desarrollo core,
  ajustes de base de datos, consultas de inventario, compras y diseño corporativo.
---

# Jexia ERP Core — Arquitectura & Desarrollo

Guía de referencia técnica para el mantenimiento, extensión y optimización del núcleo transaccional de **Jexia ERP**.

---

## 🏗️ 1. Stack Tecnológico & Arquitectura

* **Framework:** Next.js 15 (App Router con Server Components y Server Actions).
* **Lenguaje:** TypeScript 5.7 con tipado estricto.
* **ORM:** Prisma 5.22 con `@prisma/client`.
* **Base de Datos:** PostgreSQL 17 relacional en `localhost:5432/jexia_erp`.
* **Estilos & UI:** Tailwind CSS 3.4 + Lucide Icons + Recharts.
* **Integridad Transaccional:** Todas las operaciones críticas de inventario, correlativos y compras deben ejecutarse dentro de `prisma.$transaction(async (tx) => { ... })`.

---

## 🎨 2. Sistema de Diseño Corporativo (Tokens Visuales)

* **Fondo Principal de la App:** `#F8FAFC` (`bg-slate-50`).
* **Tarjetas & Contenedores:** Fondo `#FFFFFF` con borde suave `#E2E8F0` (`border-slate-200`) y sombra suave `shadow-xs`.
* **Sidebar Navegación:**
  * Fondo institucional: Gradiente `#0F172A` (Azul Noche Profundo) a `#0F4C81` (Azul Corporativo Jexia).
  * Cabecera del Logo: Fondo blanco puro `#FFFFFF` con borde inferior `#E2E8F0` para máximo contraste con el logotipo SVG tricolor.
  * Ítem Activo: Fondo `#2563EB` con texto blanco.
* **Botones Primarios (CTA):** Azul Eléctrico `#2563EB` (Hover: `#1D4ED8`).
* **Colores Semánticos de Badges & KPIs:**
  * 🟢 **Verde Esmeralda (`#10B981`):** Ventas, Comprobante Aceptado SUNAT, Pedido Entregado, Stock Óptimo.
  * 🟡 **Ámbar (`#F59E0B`):** Stock Mínimo / Alerta de Reposición, Pedido Pendiente de Despacho o Recepción.
  * 🔴 **Rojo (`#EF4444`):** Stock Agotado, Comprobante Anulado, Rechazo.
* **Tipografía Financiera:** Obligatorio activar `tabular-nums` en montos monetarios (`S/`), cantidades de Kardex y correlativos.

---

## 📦 3. Reglas de Negocio de Inventario & Kardex

### 3.1. Fórmula Oficial del Costo Promedio Ponderado:
Al confirmar la recepción de una Orden de Compra (`receivePurchaseOrder`):
$$\text{Nuevo Costo Promedio} = \frac{(\text{Stock Actual} \times \text{Costo Actual}) + (\text{Cantidad Recibida} \times \text{Precio Compra})}{\text{Stock Actual} + \text{Cantidad Recibida}}$$

### 3.2. Movimientos en `KardexMovement`:
1. `INICIAL`: Apertura de inventario al crear un nuevo producto con stock.
2. `COMPRA`: Entrada originada por recepción de mercadería con factura de proveedor.
3. `VENTA`: Salida automática originada por emisión de Factura/Boleta (POS o E-commerce).
4. `AJUSTE_POSITIVO` / `AJUSTE_NEGATIVO`: Ajustes manuales por sobrantes o mermas con sustento de auditoría.

---

## 🛒 4. Integración E-commerce Retail $\leftrightarrow$ ERP

* **Canal Público (`/tienda`):** Muestra productos con `isActive: true` y `isEcommerce: true`.
* **Checkout Atómico (`processEcommerceCheckout`):** En una sola transacción:
  1. Registra o actualiza al cliente final (`Partner`).
  2. Crea el pedido e-commerce `ECO-2025-XXXX`.
  3. Emite el comprobante electrónico SUNAT (Boleta `B001` o Factura `F001`).
  4. Descuenta el stock físico y registra la salida en el Kardex Valorizado.
  5. Genera el asiento contable en el Libro Diario (PCGE 2019).
* **Panel de Despacho (`/ecommerce`):** Permite cambiar estados (`PENDIENTE`, `EN_PREPARACION`, `ENVIADO`, `ENTREGADO`).
