import { PrismaClient } from "@prisma/client";
import { UblBuilder } from "../src/lib/ubl-builder";
import { XmlSigner } from "../src/lib/xml-signer";
import { SunatSoapClient } from "../src/lib/sunat-soap-client";

const prisma = new PrismaClient();

async function main() {
  console.log("================================================================================");
  console.log("TEST DE CONEXIÓN DIRECTA SOAP - SUNAT / OSE (CAMINO 1)");
  console.log("================================================================================");

  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No hay empresa configurada.");

  console.log(`1. Empresa Emisora: ${company.businessName} (RUC: ${company.ruc})`);
  console.log(`2. Usuario SOL configurado: ${company.solUser}`);
  console.log(`3. Modo de Conexión: SUNAT BETA Oficial (Endpoint SOAP: https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService)`);

  const demoNumber = Math.floor(1000 + Math.random() * 9000);
  const series = "F001";
  const fullNumber = `${series}-${String(demoNumber).padStart(6, "0")}`;

  console.log(`\nGenerando Factura Electrónica de prueba: ${fullNumber}...`);

  // 1. Generar XML UBL 2.1
  const ubl = UblBuilder.buildInvoiceXml({
    company: {
      ruc: company.ruc,
      businessName: company.businessName,
      address: company.fiscalAddress,
      ubigeo: company.ubigeo || "150131",
      department: company.department || "Lima",
      province: company.province || "Lima",
      district: company.district || "San Isidro",
    },
    customer: {
      docType: "RUC",
      docNumber: "20556677881",
      legalName: "CORPORACIÓN TEXTIL DEL SUR S.A.C.",
      address: "Av. Los Rosales 450, San Isidro, Lima",
    },
    docType: "01",
    series: series,
    number: demoNumber,
    issueDate: new Date(),
    currency: "PEN",
    subtotalGravado: 100.0,
    igvAmount: 18.0,
    totalAmount: 118.0,
    items: [
      {
        sku: "POLO-ROJ-L",
        name: "POLO VERANO COLOR ROJO TALLA L",
        unitCode: "NIU",
        quantity: 2,
        unitPrice: 59.0,
        subtotal: 100.0,
        igvAmount: 18.0,
        totalAmount: 118.0,
      },
    ],
  });

  console.log("✔ XML UBL 2.1 estructurado con éxito.");

  // 2. Firmar Digitalmente
  const signed = XmlSigner.signUblXml(ubl.xml);
  console.log(`✔ XML firmado digitalmente. DigestValue SHA-256: ${signed.digestValue}`);

  // 3. Empaquetar y Enviar vía SOAP a SUNAT Beta
  console.log("\nEnviando sobre SOAP a SUNAT (sendBill)...");
  const result = await SunatSoapClient.sendBill({
    companyRuc: company.ruc,
    solUser: company.solUser || "MODDATOS",
    solPass: company.solPass || "moddatos",
    docType: "01",
    series: series,
    number: demoNumber,
    signedXmlContent: signed.signedXml,
    environment: "BETA",
  });

  console.log("\n================================================================================");
  console.log("RESULTADO DE LA COMUNICACIÓN CON SUNAT:");
  console.log("================================================================================");
  console.log(`• Estado SUNAT: ${result.sunatStatus}`);
  console.log(`• Código de Respuesta: ${result.responseCode} (${result.responseCode === "0" ? "ACEPTADO" : "OBSERVADO/RECHAZADO"})`);
  console.log(`• Glosa Oficial: ${result.description}`);
  console.log(`• Hash del CDR: ${result.cdrHash}`);
  console.log(`• XML del CDR recibido: ${result.cdrXmlContent ? `${result.cdrXmlContent.length} caracteres` : "No disponible"}`);
  console.log("================================================================================\n");
}

main()
  .catch((e) => {
    console.error("Error en test SUNAT SOAP:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
