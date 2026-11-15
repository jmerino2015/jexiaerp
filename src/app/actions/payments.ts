"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  PaymentType,
  PaymentMethod,
  PaymentStatus,
  JournalOrigin,
} from "@prisma/client";

export interface RegisterPaymentInput {
  paymentType: "COBRO_VENTA" | "PAGO_COMPRA";
  salesDocumentId?: string;
  purchaseOrderId?: string;
  paymentScheduleId?: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: "EFECTIVO" | "TRANSFERENCIA" | "YAPE_PLIN" | "TARJETA" | "DEPOSITO_CUENTA";
  bankName?: string;
  operationNumber?: string;
  notes?: string;
}

export async function registerPayment(input: RegisterPaymentInput) {
  try {
    const company = await prisma.company.findFirst();
    if (!company) {
      return { success: false, error: "No se encontró empresa configurada." };
    }

    if (!input.amount || input.amount <= 0) {
      return { success: false, error: "El importe debe ser mayor a 0." };
    }

    const payDate = input.paymentDate ? new Date(input.paymentDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      let partnerId: string;
      let docRef: string;
      let partnerName: string;

      if (input.paymentType === "COBRO_VENTA") {
        if (!input.salesDocumentId) {
          throw new Error("Debe especificar la factura o comprobante de venta a cobrar.");
        }

        const saleDoc = await tx.salesDocument.findUnique({
          where: { id: input.salesDocumentId },
          include: { customer: true, schedules: { orderBy: { installmentNumber: "asc" } } },
        });

        if (!saleDoc) throw new Error("Comprobante de venta no encontrado.");

        const currentBalance = saleDoc.balanceAmount > 0
          ? saleDoc.balanceAmount
          : Math.max(0, saleDoc.totalAmount - saleDoc.paidAmount);

        if (input.amount > currentBalance + 0.05) {
          throw new Error(
            `El monto a cobrar (S/ ${input.amount.toFixed(2)}) supera el saldo pendiente (S/ ${currentBalance.toFixed(2)}).`
          );
        }

        partnerId = saleDoc.customerId;
        docRef = saleDoc.fullNumber;
        partnerName = saleDoc.customer.legalName;

        const newPaidAmount = saleDoc.paidAmount + input.amount;
        const newBalance = Math.max(0, saleDoc.totalAmount - newPaidAmount);
        const newStatus: PaymentStatus =
          newBalance <= 0.02 ? PaymentStatus.PAGADO : PaymentStatus.PARCIAL;

        // Amortizar cuotas cronológicamente (FIFO) si existen
        let remainingToApply = input.amount;
        for (const sched of saleDoc.schedules) {
          if (remainingToApply <= 0) break;
          const schedBalance = sched.balance;
          if (schedBalance > 0.01) {
            const applyAmount = Math.min(schedBalance, remainingToApply);
            const schedPaid = sched.paidAmount + applyAmount;
            const schedNewBalance = Math.max(0, sched.amount - schedPaid);
            const schedStatus = schedNewBalance <= 0.02 ? PaymentStatus.PAGADO : PaymentStatus.PARCIAL;

            await tx.paymentSchedule.update({
              where: { id: sched.id },
              data: {
                paidAmount: schedPaid,
                balance: schedNewBalance,
                status: schedStatus,
              },
            });

            remainingToApply -= applyAmount;
          }
        }

        // Crear registro de cobro
        const paymentRecord = await tx.paymentRecord.create({
          data: {
            companyId: company.id,
            paymentType: PaymentType.COBRO_VENTA,
            salesDocumentId: saleDoc.id,
            paymentScheduleId: input.paymentScheduleId || null,
            partnerId: partnerId,
            amount: input.amount,
            paymentDate: payDate,
            paymentMethod: input.paymentMethod as PaymentMethod,
            bankName: input.bankName?.trim() || "Caja Operativa",
            operationNumber: input.operationNumber?.trim() || null,
            notes: input.notes?.trim() || null,
          },
        });

        // Actualizar comprobante de venta
        await tx.salesDocument.update({
          where: { id: saleDoc.id },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            paymentStatus: newStatus,
          },
        });

        // Generar asiento contable de Cobranza PCGE 2019
        const periodStr = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, "0")}`;
        const lastEntry = await tx.journalEntry.findFirst({
          where: { companyId: company.id, period: periodStr },
          orderBy: { entryNumber: "desc" },
        });
        const entryNum = (lastEntry?.entryNumber || 0) + 1;

        const isEfectivo = input.paymentMethod === "EFECTIVO";
        const accountAssetCode = isEfectivo ? "1011" : "1041";
        const accountAssetName = isEfectivo ? "Caja Principal Soles" : "Cuentas Corrientes Operativas (Bancos)";

        const journalEntry = await tx.journalEntry.create({
          data: {
            companyId: company.id,
            entryNumber: entryNum,
            period: periodStr,
            date: payDate,
            glosa: `Cobranza de ${saleDoc.docType} ${docRef} - ${partnerName} (${input.bankName || input.paymentMethod}) ${input.operationNumber ? `Op. ${input.operationNumber}` : ""}`.trim(),
            originType: JournalOrigin.COBRANZA,
            originId: saleDoc.id,
            totalDebit: input.amount,
            totalCredit: input.amount,
            isBalanced: true,
            lines: {
              create: [
                {
                  accountCode: accountAssetCode,
                  accountName: accountAssetName,
                  debit: input.amount,
                  credit: 0.0,
                  docReference: docRef,
                  partnerName: partnerName,
                },
                {
                  accountCode: "1212",
                  accountName: "Facturas y Boletas Emitidas en Cartera",
                  debit: 0.0,
                  credit: input.amount,
                  docReference: docRef,
                  partnerName: partnerName,
                },
              ],
            },
          },
        });

        // Vincular el asiento al PaymentRecord
        await tx.paymentRecord.update({
          where: { id: paymentRecord.id },
          data: { journalEntryId: journalEntry.id },
        });

        return { paymentRecord, docRef, partnerName, newBalance, newStatus };
      } else {
        // PAGO_COMPRA a Proveedor
        if (!input.purchaseOrderId) {
          throw new Error("Debe especificar la orden de compra o factura del proveedor.");
        }

        const purchase = await tx.purchaseOrder.findUnique({
          where: { id: input.purchaseOrderId },
          include: { supplier: true, schedules: { orderBy: { installmentNumber: "asc" } } },
        });

        if (!purchase) throw new Error("Orden de compra o proveedor no encontrado.");

        const currentBalance = purchase.balanceAmount > 0
          ? purchase.balanceAmount
          : Math.max(0, purchase.total - purchase.paidAmount);

        if (input.amount > currentBalance + 0.05) {
          throw new Error(
            `El monto a pagar (S/ ${input.amount.toFixed(2)}) supera el saldo adeudado (S/ ${currentBalance.toFixed(2)}).`
          );
        }

        partnerId = purchase.supplierId;
        docRef = purchase.fullNumber;
        partnerName = purchase.supplier.legalName;

        const newPaidAmount = purchase.paidAmount + input.amount;
        const newBalance = Math.max(0, purchase.total - newPaidAmount);
        const newStatus: PaymentStatus =
          newBalance <= 0.02 ? PaymentStatus.PAGADO : PaymentStatus.PARCIAL;

        // Amortizar cuotas cronológicamente (FIFO) si existen
        let remainingToApply = input.amount;
        for (const sched of purchase.schedules) {
          if (remainingToApply <= 0) break;
          const schedBalance = sched.balance;
          if (schedBalance > 0.01) {
            const applyAmount = Math.min(schedBalance, remainingToApply);
            const schedPaid = sched.paidAmount + applyAmount;
            const schedNewBalance = Math.max(0, sched.amount - schedPaid);
            const schedStatus = schedNewBalance <= 0.02 ? PaymentStatus.PAGADO : PaymentStatus.PARCIAL;

            await tx.paymentSchedule.update({
              where: { id: sched.id },
              data: {
                paidAmount: schedPaid,
                balance: schedNewBalance,
                status: schedStatus,
              },
            });

            remainingToApply -= applyAmount;
          }
        }

        // Crear registro de pago
        const paymentRecord = await tx.paymentRecord.create({
          data: {
            companyId: company.id,
            paymentType: PaymentType.PAGO_COMPRA,
            purchaseOrderId: purchase.id,
            paymentScheduleId: input.paymentScheduleId || null,
            partnerId: partnerId,
            amount: input.amount,
            paymentDate: payDate,
            paymentMethod: input.paymentMethod as PaymentMethod,
            bankName: input.bankName?.trim() || "Caja Operativa",
            operationNumber: input.operationNumber?.trim() || null,
            notes: input.notes?.trim() || null,
          },
        });

        // Actualizar compra
        await tx.purchaseOrder.update({
          where: { id: purchase.id },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            paymentStatus: newStatus,
          },
        });

        // Generar asiento contable de Pago a Proveedor PCGE 2019
        const periodStr = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, "0")}`;
        const lastEntry = await tx.journalEntry.findFirst({
          where: { companyId: company.id, period: periodStr },
          orderBy: { entryNumber: "desc" },
        });
        const entryNum = (lastEntry?.entryNumber || 0) + 1;

        const isEfectivo = input.paymentMethod === "EFECTIVO";
        const accountAssetCode = isEfectivo ? "1011" : "1041";
        const accountAssetName = isEfectivo ? "Caja Principal Soles" : "Cuentas Corrientes Operativas (Bancos)";

        const journalEntry = await tx.journalEntry.create({
          data: {
            companyId: company.id,
            entryNumber: entryNum,
            period: periodStr,
            date: payDate,
            glosa: `Pago a proveedor ${partnerName} según ${docRef} (${input.bankName || input.paymentMethod}) ${input.operationNumber ? `Op. ${input.operationNumber}` : ""}`.trim(),
            originType: JournalOrigin.PAGO,
            originId: purchase.id,
            totalDebit: input.amount,
            totalCredit: input.amount,
            isBalanced: true,
            lines: {
              create: [
                {
                  accountCode: "4212",
                  accountName: "Facturas por Pagar Emitidas en Cartera",
                  debit: input.amount,
                  credit: 0.0,
                  docReference: docRef,
                  partnerName: partnerName,
                },
                {
                  accountCode: accountAssetCode,
                  accountName: accountAssetName,
                  debit: 0.0,
                  credit: input.amount,
                  docReference: docRef,
                  partnerName: partnerName,
                },
              ],
            },
          },
        });

        await tx.paymentRecord.update({
          where: { id: paymentRecord.id },
          data: { journalEntryId: journalEntry.id },
        });

        return { paymentRecord, docRef, partnerName, newBalance, newStatus };
      }
    });

    revalidatePath("/finanzas");
    revalidatePath("/ventas");
    revalidatePath("/compras");
    revalidatePath("/contabilidad");

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error al registrar pago:", error);
    return { success: false, error: error.message || "Error al procesar el pago." };
  }
}
