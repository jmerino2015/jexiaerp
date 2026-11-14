import prisma from "@/lib/prisma";
import { PurchasesManager } from "@/components/purchases/PurchasesManager";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const [orders, suppliers, products] = await Promise.all([
    prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { number: "desc" },
    }),
    prisma.partner.findMany({
      where: { isSupplier: true, isActive: true },
      orderBy: { legalName: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, isService: false },
      orderBy: { name: "asc" },
    }),
  ]);

  const ordersData = orders.map((o) => ({
    id: o.id,
    fullNumber: o.fullNumber,
    supplier: {
      legalName: o.supplier.legalName,
      docNumber: o.supplier.docNumber,
    },
    issueDate: o.issueDate.toISOString(),
    status: o.status,
    supplierInvoice: o.supplierInvoice,
    subtotal: o.subtotal,
    igv: o.igv,
    total: o.total,
    notes: o.notes,
    items: o.items.map((it) => ({
      id: it.id,
      product: {
        sku: it.product.sku,
        name: it.product.name,
        unitCode: it.product.unitCode,
      },
      quantity: it.quantity,
      receivedQty: it.receivedQty,
      unitCost: it.unitCost,
      total: it.total,
    })),
  }));

  const suppliersData = suppliers.map((s) => ({
    id: s.id,
    docNumber: s.docNumber,
    legalName: s.legalName,
  }));

  const productsData = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    avgCost: p.avgCost,
    unitCode: p.unitCode,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gestión de Compras y Proveedores
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Órdenes de compra, recepción de facturas comerciales e impacto automático en Kardex.
        </p>
      </div>

      <PurchasesManager
        orders={ordersData}
        suppliers={suppliersData}
        products={productsData}
      />
    </div>
  );
}
