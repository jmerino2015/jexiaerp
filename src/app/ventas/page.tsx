import prisma from "@/lib/prisma";
import { SalesManager } from "@/components/sales/SalesManager";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const [documents, customers, products] = await Promise.all([
    prisma.salesDocument.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { number: "desc" },
    }),
    prisma.partner.findMany({
      where: { isCustomer: true, isActive: true },
      orderBy: { legalName: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        stocks: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const documentsData = documents.map((doc) => ({
    id: doc.id,
    fullNumber: doc.fullNumber,
    docType: doc.docType,
    sunatCode: doc.sunatCode,
    issueDate: doc.issueDate.toISOString(),
    subtotalGravado: doc.subtotalGravado,
    igvAmount: doc.igvAmount,
    totalAmount: doc.totalAmount,
    sunatStatus: doc.sunatStatus,
    sunatCdrHash: doc.sunatCdrHash,
    xmlContent: doc.xmlContent,
    cdrXmlContent: doc.cdrXmlContent,
    paymentMethod: doc.paymentMethod,
    notes: doc.notes,
    detractionApplied: doc.detractionApplied,
    detractionCode: doc.detractionCode,
    detractionPercent: doc.detractionPercent,
    detractionAmount: doc.detractionAmount,
    bnAccount: doc.bnAccount,
    relatedDocType: doc.relatedDocType,
    relatedDocNumber: doc.relatedDocNumber,
    creditDebitReason: doc.creditDebitReason,
    customer: {
      docType: doc.customer.docType,
      docNumber: doc.customer.docNumber,
      legalName: doc.customer.legalName,
      address: doc.customer.address,
    },
    items: doc.items.map((it) => ({
      id: it.id,
      sku: it.sku,
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotal: it.subtotal,
      igvAmount: it.igvAmount,
      totalAmount: it.totalAmount,
    })),
  }));

  const customersData = customers.map((c) => ({
    id: c.id,
    docType: c.docType,
    docNumber: c.docNumber,
    legalName: c.legalName,
  }));

  const productsData = products.map((p) => {
    const totalStock = p.stocks.reduce((acc, s) => acc + s.quantity, 0);
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      salePrice: p.salePrice,
      totalStock: totalStock,
      unitCode: p.unitCode,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Facturación Electrónica SUNAT UBL 2.1 y Ventas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Emisión de Facturas (01), Boletas (03), Notas de Crédito (07), Cotizaciones, Detracciones SPOT y CDR oficial.
        </p>
      </div>

      <SalesManager
        documents={documentsData}
        customers={customersData}
        products={productsData}
      />
    </div>
  );
}
