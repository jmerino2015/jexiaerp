export interface SireSaleLine {
  companyRuc: string;
  companyName: string;
  periodo: string; // "20251100"
  carSire?: string; // Código de Anotación de Registro (27 dígitos)
  issueDate: string; // "03/11/2025"
  dueDate?: string;
  docType: string; // "01", "03", "07"
  series: string; // "F001"
  number: number;
  customerDocType: string; // "6" RUC, "1" DNI
  customerDocNumber: string;
  customerName: string;
  baseGravada: number;
  igv: number;
  total: number;
  moneda: string; // "PEN"
  tipoCambio?: number;
  docModificadoFecha?: string;
  docModificadoTipo?: string;
  docModificadoSerie?: string;
  docModificadoNumero?: string;
}

export interface SirePurchaseLine {
  periodo: string;
  issueDate: string;
  docType: string;
  series: string;
  number: string;
  supplierDocType: string; // "6"
  supplierDocNumber: string;
  supplierName: string;
  baseGravada: number;
  igv: number;
  total: number;
}

export interface PleJournalLine {
  periodo: string; // "20251100"
  entryNumber: number; // M000000001
  asientoCorrelativo: string; // M1
  accountCode: string; // "1212"
  fechaOperacion: string; // "03/11/2025"
  glosa: string;
  debe: number;
  haber: number;
  docReference: string;
}

export class SirePleService {
  /**
   * Genera el archivo TXT para el SIRE RVIE de SUNAT (Formato 14.1)
   * Estructura oficial delimitada por pipes (|)
   */
  static generateSireRvieTxt(sales: SireSaleLine[]): string {
    const lines = sales.map((s, index) => {
      const numStr = String(s.number);
      const car = s.carSire || `${s.companyRuc}140000${s.periodo}${String(index + 1).padStart(10, "0")}`;
      
      // Campos estándar SIRE RVIE SUNAT (Resolución de Superintendencia 000112-2021/SUNAT)
      return [
        s.companyRuc,
        s.companyName,
        s.periodo,
        car,
        s.issueDate,
        s.dueDate || "",
        s.docType,
        s.series,
        numStr,
        "", // Nro final si es ticket
        s.customerDocType,
        s.customerDocNumber,
        s.customerName.replace(/\|/g, ""),
        "", // Exportación
        s.baseGravada.toFixed(2),
        "0.00", // Descuento base
        s.igv.toFixed(2),
        "0.00", // Descuento IGV
        "0.00", // Exonerada
        "0.00", // Inafecta
        "0.00", // ISC
        "0.00", // Arroz pilado
        "0.00", // ICBPER bolsa
        "0.00", // Otros tributos
        s.total.toFixed(2),
        s.moneda,
        "1.000", // Tipo de cambio
        s.docModificadoFecha || "",
        s.docModificadoTipo || "",
        s.docModificadoSerie || "",
        s.docModificadoNumero || "",
        "", // ID Proyecto
        "", // Error tipo 1
        "1", // Estado (1 = Operación normal del mes)
      ].join("|") + "|";
    });

    return lines.join("\r\n");
  }

  /**
   * Genera el archivo TXT para el SIRE RCE de SUNAT (Registro de Compras Formato 8.1 / 8.2)
   */
  static generateSireRceTxt(purchases: SirePurchaseLine[]): string {
    const lines = purchases.map((p, idx) => {
      return [
        "20608945123",
        "JEXIA TECH SOLUTIONS S.A.C.",
        p.periodo,
        `20608945123080000${p.periodo}${String(idx + 1).padStart(10, "0")}`,
        p.issueDate,
        "",
        p.docType,
        p.series,
        "",
        p.number,
        "",
        p.supplierDocType,
        p.supplierDocNumber,
        p.supplierName.replace(/\|/g, ""),
        p.baseGravada.toFixed(2),
        p.igv.toFixed(2),
        "0.00",
        "0.00",
        "0.00",
        "0.00",
        "0.00",
        "0.00",
        p.total.toFixed(2),
        "PEN",
        "1.000",
        "",
        "",
        "",
        "",
        "",
        "",
        "1",
      ].join("|") + "|";
    });

    return lines.join("\r\n");
  }

  /**
   * Genera el archivo TXT para el PLE 5.1 (Libro Diario Oficial SUNAT)
   */
  static generatePleDiarioTxt(lines: PleJournalLine[]): string {
    const txtLines = lines.map((l) => {
      return [
        l.periodo,
        `M${String(l.entryNumber).padStart(9, "0")}`,
        l.asientoCorrelativo,
        l.accountCode,
        "", // Código de Unidad de Operación
        "", // Código de Centro de Costos
        "PEN",
        "", // Tipo doc identidad emisor
        "", // Num doc identidad emisor
        "", // Tipo de comprobante de pago
        "", // Serie comprobante
        l.docReference || "",
        l.fechaOperacion,
        "", // Fecha de vencimiento
        l.fechaOperacion,
        l.glosa.replace(/\|/g, ""),
        "", // Glosa referencial
        l.debe.toFixed(2),
        l.haber.toFixed(2),
        "", // Dato estructurado
        "1", // Estado de la operación
      ].join("|") + "|";
    });

    return txtLines.join("\r\n");
  }
}
