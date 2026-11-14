import prisma from "@/lib/prisma";
import { InventoryTabs } from "@/components/inventory/InventoryTabs";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      stocks: true,
      kardexMovements: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Control de Inventario y Almacenes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Supervisión de stock en tiempo real, catalogación SUNAT y Kardex con costo promedio ponderado.
        </p>
      </div>

      <InventoryTabs
        productsForList={productsForList}
        productsForKardex={productsForKardex}
      />
    </div>
  );
}
