import crypto from "crypto";

export interface SunatEmissionResponse {
  success: boolean;
  sunatCode: string; // "01", "03"
  fullNumber: string; // "F001-000013"
  responseCode: string; // "0" = Aceptado
  description: string;
  cdrHash: string;
  ticket?: string;
  xmlDigest: string;
}

export class SunatService {
  /**
   * Genera el Hash CDR y simulación de respuesta SUNAT UBL 2.1
   */
  static emitElectronicDocument(params: {
    companyRuc: string;
    docType: "01" | "03" | "COT";
    series: string;
    number: number;
    customerDocType: string;
    customerDocNumber: string;
    totalAmount: number;
  }): SunatEmissionResponse {
    const fullNumber = `${params.series}-${String(params.number).padStart(6, "0")}`;

    if (params.docType === "COT") {
      return {
        success: true,
        sunatCode: "COT",
        fullNumber,
        responseCode: "NO_APLICA",
        description: "Cotización comercial interna (no requiere envío a SUNAT)",
        cdrHash: "",
        xmlDigest: "",
      };
    }

    // Generar Hash criptográfico SHA-256 representativo del XML UBL 2.1
    const rawPayload = `${params.companyRuc}|${params.docType}|${params.series}|${params.number}|${params.totalAmount.toFixed(2)}|${params.customerDocNumber}|${Date.now()}`;
    const hash = crypto.createHash("sha256").update(rawPayload).digest("base64").slice(0, 28);
    const xmlDigest = crypto.createHash("sha1").update(rawPayload).digest("base64");

    const docName = params.docType === "01" ? "Factura" : "Boleta de Venta";

    return {
      success: true,
      sunatCode: params.docType,
      fullNumber,
      responseCode: "0",
      description: `La ${docName} número ${fullNumber} ha sido aceptada por SUNAT`,
      cdrHash: hash,
      xmlDigest: xmlDigest,
    };
  }

  /**
   * Conversión de importe numérico a texto formal en Soles
   */
  static amountToWords(amount: number): string {
    const enteros = Math.floor(amount);
    const decimales = Math.round((amount - enteros) * 100);
    const decStr = String(decimales).padStart(2, "0");

    // Formateo simplificado representativo
    return `SON: ${enteros} Y ${decStr}/100 SOLES`;
  }
}
