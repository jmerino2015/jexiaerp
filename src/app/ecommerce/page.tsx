import prisma from "@/lib/prisma";
import { EcommerceAdminManager } from "@/components/ecommerce/EcommerceAdminManager";

export const dynamic = "force-dynamic";

export default async function EcommercePage() {
  const orders = await prisma.ecommerceOrder.findMany({
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const ordersData = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerDocType: o.customerDocType,
    customerDocNumber: o.customerDocNumber,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    deliveryMethod: o.deliveryMethod,
    deliveryAddress: o.deliveryAddress,
    deliveryCity: o.deliveryCity,
    shippingCost: o.shippingCost,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    total: o.total,
    salesDocumentNumber: o.salesDocumentNumber,
    salesDocumentId: o.salesDocumentId,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((it) => ({
      id: it.id,
      productName: it.productName,
      sku: it.sku,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gestión de Pedidos Retail E-commerce
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Supervisión de pedidos online, estados de despacho y trazabilidad con facturación electrónica SUNAT.
        </p>
      </div>

      <EcommerceAdminManager orders={ordersData} />
    </div>
  );
}
