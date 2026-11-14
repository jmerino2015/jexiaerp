import prisma from "@/lib/prisma";
import { EcommerceStorefront } from "@/components/ecommerce/EcommerceStorefront";

export const dynamic = "force-dynamic";

export default async function TiendaPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      stocks: true,
    },
    orderBy: { name: "asc" },
  });

  const productsData = products.map((p) => {
    const totalStock = p.stocks.reduce((acc, s) => acc + s.quantity, 0);
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      salePrice: p.salePrice,
      totalStock: totalStock,
      unitCode: p.unitCode,
    };
  });

  return <EcommerceStorefront products={productsData} />;
}
