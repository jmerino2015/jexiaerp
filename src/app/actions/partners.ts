"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PartnerDocType } from "@prisma/client";
import { validateDocNumber } from "@/lib/utils";

export async function createPartner(formData: {
  docType: "DNI" | "RUC";
  docNumber: string;
  legalName: string;
  tradeName?: string;
  address?: string;
  phone?: string;
  email?: string;
  isCustomer: boolean;
  isSupplier: boolean;
}) {
  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No hay empresa registrada.");

    const val = validateDocNumber(formData.docType, formData.docNumber);
    if (!val.isValid) {
      throw new Error(val.message);
    }

    if (!formData.legalName || formData.legalName.trim().length === 0) {
      throw new Error("La Razón Social o Nombre Completo es obligatorio.");
    }

    const partner = await prisma.partner.create({
      data: {
        companyId: company.id,
        docType: formData.docType === "RUC" ? PartnerDocType.RUC : PartnerDocType.DNI,
        docNumber: formData.docNumber.trim(),
        legalName: formData.legalName.trim().toUpperCase(),
        tradeName: formData.tradeName?.trim() || null,
        address: formData.address?.trim() || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        isCustomer: formData.isCustomer,
        isSupplier: formData.isSupplier,
      },
    });

    if (formData.isSupplier) revalidatePath("/proveedores");
    if (formData.isCustomer) revalidatePath("/clientes");
    revalidatePath("/inicio");

    return { success: true, data: partner };
  } catch (error: any) {
    console.error("Error creating partner:", error);
    return { success: false, error: error.message || "Error al registrar cliente/proveedor" };
  }
}
