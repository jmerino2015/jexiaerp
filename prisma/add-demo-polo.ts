import { PrismaClient, ProductUnitCode, KardexType, SalesDocType, SalesStatus, SunatStatus, PaymentMethod, PaymentStatus, PurchaseStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando registro de material demo: POLO VERANO COLOR ROJO TALLA L...");

  const company = await prisma.company.findFirst();
  if (!company) {
    throw new Error("No se encontró ninguna empresa en la base de datos.");
  }

  const warehouse = await prisma.warehouse.findFirst({
    where: { companyId: company.id },
  });
  if (!warehouse) {
    throw new Error("No se encontró ningún almacén.");
  }

  const user = await prisma.user.findFirst({
    where: { companyId: company.id },
  });

  // 1. Upsert Proveedor Textil para las compras
  const supplierTextil = await prisma.partner.upsert({
    where: {
      companyId_docNumber: {
        companyId: company.id,
        docNumber: "20556789123",
      },
    },
    update: {
      legalName: "CONFECCIONES Y TEXTILES DEL PERU S.A.C.",
      tradeName: "Textiles Perú",
      address: "Av. Gamarra 840, La Victoria, Lima",
    },
    create: {
      companyId: company.id,
      docType: "RUC",
      docNumber: "20556789123",
      legalName: "CONFECCIONES Y TEXTILES DEL PERU S.A.C.",
      tradeName: "Textiles Perú",
      address: "Av. Gamarra 840, La Victoria, Lima",
      email: "ventas@textilesperu.com.pe",
      phone: "+51 1 474-5500",
      isSupplier: true,
      isCustomer: false,
    },
  });

  // 2. Upsert Producto Principal Demo: POLO VERANO COLOR ROJO TALLA L
  const poloProduct = await prisma.product.upsert({
    where: {
      companyId_sku: {
        companyId: company.id,
        sku: "POLO-ROJ-L",
      },
    },
    update: {
      name: "POLO VERANO COLOR ROJO TALLA L",
      category: "Textil y Moda",
      unitCode: ProductUnitCode.NIU,
      avgCost: 22.0,
      lastCost: 22.0,
      salePrice: 45.0,
      minStock: 15,
      isActive: true,
    },
    create: {
      companyId: company.id,
      sku: "POLO-ROJ-L",
      name: "POLO VERANO COLOR ROJO TALLA L",
      category: "Textil y Moda",
      unitCode: ProductUnitCode.NIU,
      avgCost: 22.0,
      lastCost: 22.0,
      salePrice: 45.0,
      minStock: 15,
      isActive: true,
    },
  });

  // 3. Stock en Almacén
  const existingStock = await prisma.productStock.findUnique({
    where: {
      productId_warehouseId: {
        productId: poloProduct.id,
        warehouseId: warehouse.id,
      },
    },
  });

  if (existingStock) {
    await prisma.productStock.update({
      where: { id: existingStock.id },
      data: { quantity: 150 },
    });
  } else {
    await prisma.productStock.create({
      data: {
        productId: poloProduct.id,
        warehouseId: warehouse.id,
        quantity: 150,
      },
    });
  }

  // 4. Movimiento de Kardex Inicial
  await prisma.kardexMovement.deleteMany({
    where: {
      productId: poloProduct.id,
      documentNumber: "INV-INICIAL-POLO-ROJO",
    },
  });

  await prisma.kardexMovement.create({
    data: {
      companyId: company.id,
      productId: poloProduct.id,
      warehouseId: warehouse.id,
      movementType: KardexType.INICIAL,
      documentType: "INICIAL",
      documentNumber: "INV-INICIAL-POLO-ROJO",
      quantity: 150,
      unitCost: 22.0,
      totalCost: 3300.0,
      balanceQty: 150,
      balanceUnitCost: 22.0,
      balanceTotal: 3300.0,
      notes: "Stock inicial demo: POLO VERANO COLOR ROJO TALLA L",
    },
  });

  // 5. Orden de Compra Demo con el Polo
  const existingPO = await prisma.purchaseOrder.findFirst({
    where: {
      companyId: company.id,
      fullNumber: "OC-2025-0010",
    },
  });

  if (!existingPO) {
    await prisma.purchaseOrder.create({
      data: {
        companyId: company.id,
        warehouseId: warehouse.id,
        supplierId: supplierTextil.id,
        series: "OC",
        number: 10,
        fullNumber: "OC-2025-0010",
        issueDate: new Date(),
        status: PurchaseStatus.COMPLETADA,
        supplierInvoice: "F001-000452",
        subtotal: 1100.0,
        igv: 198.0,
        total: 1298.0,
        notes: "Pedido especial de temporada: 50 unidades de Polo Verano Color Rojo Talla L",
        items: {
          create: [
            {
              productId: poloProduct.id,
              quantity: 50,
              receivedQty: 50,
              unitCost: 22.0,
              subtotal: 1100.0,
              igv: 198.0,
              total: 1298.0,
            },
          ],
        },
      },
    });
  }

  // 6. Factura / Boleta de Venta Demo con el Polo para visualización en A4 / Ticket
  const customer = await prisma.partner.findFirst({
    where: { companyId: company.id, isCustomer: true },
  });

  if (customer && user) {
    const existingDoc = await prisma.salesDocument.findFirst({
      where: {
        companyId: company.id,
        fullNumber: "B001-000088",
      },
    });

    if (!existingDoc) {
      await prisma.salesDocument.create({
        data: {
          companyId: company.id,
          warehouseId: warehouse.id,
          customerId: customer.id,
          userId: user.id,
          docType: SalesDocType.BOLETA,
          sunatCode: "03",
          series: "B001",
          number: 88,
          fullNumber: "B001-000088",
          issueDate: new Date(),
          subtotalGravado: 90.0,
          igvAmount: 16.2,
          totalAmount: 106.2,
          status: SalesStatus.EMITIDO,
          sunatStatus: SunatStatus.ACEPTADO,
          sunatResponseCode: "0",
          sunatDescription: "La Boleta B001-000088 ha sido aceptada por SUNAT",
          sunatCdrHash: "7xP8q/jXkYVvXGgT+k1M=",
          detractionApplied: false,
          paymentMethod: PaymentMethod.EFECTIVO,
          paymentStatus: PaymentStatus.PAGADO,
          items: {
            create: [
              {
                productId: poloProduct.id,
                sku: poloProduct.sku,
                name: poloProduct.name,
                quantity: 2,
                unitCost: 22.0,
                unitPrice: 45.0,
                subtotal: 90.0,
                igvAmount: 16.2,
                totalAmount: 106.2,
              },
            ],
          },
        },
      });
    }
  }

  console.log("✅ Material demo creado con éxito: POLO VERANO COLOR ROJO TALLA L (SKU: POLO-ROJ-L, Stock: 150, Precio: S/ 45.00)");
}

main()
  .catch((e) => {
    console.error("Error al registrar producto:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
