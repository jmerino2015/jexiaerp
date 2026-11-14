import prisma from "@/lib/prisma";
import { PartnersManager } from "@/components/partners/PartnersManager";

export const dynamic = "force-dynamic";

export default async function ProveedoresPage() {
  const suppliers = await prisma.partner.findMany({
    where: { isSupplier: true, isActive: true },
    orderBy: { legalName: "asc" },
  });

  const suppliersData = suppliers.map((s) => ({
    id: s.id,
    docType: s.docType,
    docNumber: s.docNumber,
    legalName: s.legalName,
    tradeName: s.tradeName,
    address: s.address,
    phone: s.phone,
    email: s.email,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Directorio de Proveedores
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Registro de proveedores con validación de RUC 11 dígitos y estado de contribuyente.
        </p>
      </div>

      <PartnersManager partners={suppliersData} type="PROVEEDOR" />
    </div>
  );
}
