import AdmZip from "adm-zip";

export interface ParsedCdr {
  success: boolean;
  responseCode: string; // "0" = Aceptado, otros = Rechazado/Observado
  description: string;
  cdrHash: string;
  xmlDigest: string;
  rawXml: string;
  notes: string[];
}

/**
 * Parser de Constancia de Recepción (CDR) oficial de SUNAT u OSE
 */
export class CdrParser {
  /**
   * Descomprime el archivo ZIP devuelto por el Web Service y parsea el XML ApplicationResponse
   */
  static parseCdrZip(zipBufferOrBase64: Buffer | string): ParsedCdr {
    try {
      const buffer = typeof zipBufferOrBase64 === "string" 
        ? Buffer.from(zipBufferOrBase64, "base64") 
        : zipBufferOrBase64;

      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();
      const xmlEntry = zipEntries.find((entry) => entry.entryName.toLowerCase().endsWith(".xml"));

      if (!xmlEntry) {
        return {
          success: false,
          responseCode: "ERROR_NO_XML",
          description: "El paquete CDR devuelto no contiene un archivo XML válido.",
          cdrHash: "",
          xmlDigest: "",
          rawXml: "",
          notes: [],
        };
      }

      const rawXml = xmlEntry.getData().toString("utf-8");

      // Extraer ResponseCode
      const codeMatch = rawXml.match(/<cac:Response>[\s\S]*?<cbc:ResponseCode>([\s\S]*?)<\/cbc:ResponseCode>/i)
        || rawXml.match(/<cbc:ResponseCode>([\s\S]*?)<\/cbc:ResponseCode>/i);
      const responseCode = codeMatch ? codeMatch[1].trim() : "0";

      // Extraer Description
      const descMatch = rawXml.match(/<cac:Response>[\s\S]*?<cbc:Description>([\s\S]*?)<\/cbc:Description>/i)
        || rawXml.match(/<cbc:Description>([\s\S]*?)<\/cbc:Description>/i);
      const description = descMatch ? descMatch[1].trim() : "El comprobante ha sido procesado por SUNAT.";

      // Extraer DigestValue del CDR
      const digestMatch = rawXml.match(/<ds:DigestValue>([\s\S]*?)<\/ds:DigestValue>/i);
      const cdrHash = digestMatch ? digestMatch[1].trim() : "";

      // Extraer Notas / Observaciones si las hay
      const notes: string[] = [];
      const noteRegex = /<cbc:Note>([\s\S]*?)<\/cbc:Note>/gi;
      let noteMatch;
      while ((noteMatch = noteRegex.exec(rawXml)) !== null) {
        notes.push(noteMatch[1].trim());
      }

      return {
        success: responseCode === "0",
        responseCode,
        description,
        cdrHash,
        xmlDigest: cdrHash,
        rawXml,
        notes,
      };
    } catch (error: any) {
      console.error("Error al desempaquetar CDR:", error);
      return {
        success: false,
        responseCode: "PARSE_ERROR",
        description: error.message || "Error al interpretar la constancia de recepción de SUNAT.",
        cdrHash: "",
        xmlDigest: "",
        rawXml: "",
        notes: [],
      };
    }
  }
}
