import prisma from "@/lib/prisma";
import { PartnersManager } from "@/components/partners/PartnersManager";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const customers = await prisma.partner.findMany({
    where: { isCustomer: true, isActive: true },
    orderBy: { legalName: "asc" },
  });

  const customersData = customers.map((c) => ({
    id: c.id,
    docType: c.docType,
    docNumber: c.docNumber,
    legalName: c.legalName,
    tradeName: c.tradeName,
    address: c.address,
    phone: c.phone,
    email: c.email,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Directorio de Clientes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Base de datos de clientes corporativos y personas naturales con validación RUC (11) y DNI (8).
        </p>
      </div>

      <PartnersManager partners={customersData} type="CLIENTE" />
    </div>
  );
}
