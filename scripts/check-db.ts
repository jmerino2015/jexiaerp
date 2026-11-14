import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [c, u, pa, pr, ps, k, po, s, j] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.partner.count(),
    prisma.product.count(),
    prisma.productStock.count(),
    prisma.kardexMovement.count(),
    prisma.purchaseOrder.count(),
    prisma.salesDocument.count(),
    prisma.journalEntry.count(),
  ]);

  console.log("=== ESTADO DE CONEXION POSTGRESQL ===");
  console.log("Base de Datos: jexia_erp (PostgreSQL 17 en localhost:5432)");
  console.log(`Empresas registradas: ${c}`);
  console.log(`Usuarios activos: ${u}`);
  console.log(`Clientes y Proveedores (RUC/DNI): ${pa}`);
  console.log(`Catálogo de Productos: ${pr}`);
  console.log(`Registros de Stock en Almacenes: ${ps}`);
  console.log(`Movimientos Transaccionales en Kardex: ${k}`);
  console.log(`Órdenes de Compra: ${po}`);
  console.log(`Comprobantes de Venta SUNAT: ${s}`);
  console.log(`Asientos Contables (PCGE 2019): ${j}`);
}

main().finally(() => prisma.$disconnect());
