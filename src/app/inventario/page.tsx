import prisma from "@/lib/prisma";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const [products, warehouses, rawTransfers, rawLots] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        stocks: true,
        kardexMovements: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.stockTransfer.findMany({
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productLot.findMany({
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { expirationDate: "asc" },
    }),
  ]);

  // Estructurar datos para catálogo
  const productsForList = products.map((p) => {
    const totalStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      unitCode: p.unitCode,
      avgCost: p.avgCost,
      salePrice: p.salePrice,
      minStock: p.minStock,
      isService: p.isService,
      totalStock: totalStock,
      imageUrl: p.imageUrl,
      brand: p.brand,
      sunatCode: p.sunatCode,
      isEcommerce: p.isEcommerce,
      detractionSubject: p.detractionSubject,
      detractionPercent: p.detractionPercent,
    };
  });

  // Estructurar datos para Kardex
  const productsForKardex = products
    .filter((p) => !p.isService)
    .map((p) => {
      const totalStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        unitCode: p.unitCode,
        avgCost: p.avgCost,
        totalStock: totalStock,
        movements: p.kardexMovements.map((m) => ({
          id: m.id,
          productId: m.productId,
          createdAt: m.createdAt.toISOString(),
          movementType: m.movementType,
          documentType: m.documentType,
          documentNumber: m.documentNumber,
          quantity: m.quantity,
          unitCost: m.unitCost,
          totalCost: m.totalCost,
          balanceQty: m.balanceQty,
          balanceUnitCost: m.balanceUnitCost,
          balanceTotal: m.balanceTotal,
          notes: m.notes,
        })),
      };
    });

  // Estructurar datos para Transferencias
  const productsForTransfers = products
    .filter((p) => !p.isService)
    .map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      unitCode: p.unitCode,
      avgCost: p.avgCost,
      stocks: p.stocks.map((s) => ({
        warehouseId: s.warehouseId,
        quantity: s.quantity,
      })),
    }));

  // Estructurar datos para Lotes
  const lots = rawLots.map((l) => ({
    id: l.id,
    lotNumber: l.lotNumber,
    productId: l.productId,
    warehouseId: l.warehouseId,
    initialQty: l.initialQty,
    currentQty: l.currentQty,
    manufactureDate: l.manufactureDate ? l.manufactureDate.toISOString() : null,
    expirationDate: l.expirationDate ? l.expirationDate.toISOString() : null,
    status: l.status,
    notes: l.notes,
    product: {
      id: l.product.id,
      sku: l.product.sku,
      name: l.product.name,
      unitCode: l.product.unitCode,
      category: l.product.category,
      avgCost: l.product.avgCost,
      imageUrl: l.product.imageUrl,
      hasExpiryDate: l.product.hasExpiryDate,
      alertDays: l.product.alertDays,
    },
    warehouse: {
      id: l.warehouse.id,
      name: l.warehouse.name,
      code: l.warehouse.code,
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Control de Inventario y Almacenes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Supervisión de stock en tiempo real, traslados multi-almacén con Guía de Remisión Remitente (GRE 09), lotes y Kardex valorizado.
        </p>
      </div>

      <InventoryTabs
        productsForList={productsForList}
        productsForKardex={productsForKardex}
        transfers={rawTransfers}
        warehouses={warehouses}
        productsForTransfers={productsForTransfers}
        lots={lots}
      />
    </div>
  );
}
