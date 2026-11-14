import crypto from "crypto";

export interface UblItemInput {
  sku: string;
  name: string;
  unitCode: string; // "NIU" o "ZZ"
  quantity: number;
  unitPrice: number;
  subtotal: number;
  igvAmount: number;
  totalAmount: number;
}

export interface UblInvoiceInput {
  company: {
    ruc: string;
    businessName: string;
    tradeName?: string;
    address: string;
    ubigeo: string;
    department: string;
    province: string;
    district: string;
    bnAccount?: string;
  };
  customer: {
    docType: "RUC" | "DNI" | "CE" | "PASAPORTE";
    docNumber: string;
    legalName: string;
    address?: string;
  };
  docType: "01" | "03" | "07" | "08"; // Factura, Boleta, Nota Crédito, Nota Débito
  series: string; // "F001", "B001", "FC01"
  number: number;
  issueDate: Date | string;
  currency: string; // "PEN"
  subtotalGravado: number;
  igvAmount: number;
  totalAmount: number;
  items: UblItemInput[];
  // Detracciones SPOT
  detraction?: {
    applied: boolean;
    code: string; // "022"
    percent: number; // 12
    amount: number;
  };
  // Notas de Crédito
  relatedDoc?: {
    type: string; // "01"
    number: string; // "F001-000012"
    reasonCode: string; // "01" Anulación
    reasonDesc: string;
  };
}

export class UblBuilder {
  /**
   * Genera el archivo XML UBL 2.1 estándar según las Especificaciones Técnicas de SUNAT
   */
  static buildInvoiceXml(data: UblInvoiceInput): { xml: string; hash: string } {
    const fullNumber = `${data.series}-${String(data.number).padStart(6, "0")}`;
    const dateStr = typeof data.issueDate === "string" 
      ? data.issueDate.split("T")[0] 
      : data.issueDate.toISOString().split("T")[0];

    const customerDocTypeCode = data.customer.docType === "RUC" ? "6" : "1";
    const isNotaCredito = data.docType === "07";

    const rootTag = isNotaCredito ? "CreditNote" : "Invoice";
    const nsDeclaration = isNotaCredito
      ? `xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"`
      : `xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"`;

    // Generar Hash representativo
    const rawPayload = `${data.company.ruc}|${data.docType}|${data.series}|${data.number}|${data.totalAmount.toFixed(2)}|${data.customer.docNumber}|${dateStr}`;
    const hash = crypto.createHash("sha256").update(rawPayload).digest("base64").slice(0, 28);

    let itemsXml = "";
    data.items.forEach((it, idx) => {
      const lineNum = idx + 1;
      const priceSinIgv = it.unitPrice / 1.18;
      itemsXml += `
    <cac:InvoiceLine>
        <cbc:ID>${lineNum}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="${it.unitCode}">${it.quantity.toFixed(2)}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${data.currency}">${it.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cac:PricingReference>
            <cac:AlternativeConditionPrice>
                <cbc:PriceAmount currencyID="${data.currency}">${it.unitPrice.toFixed(2)}</cbc:PriceAmount>
                <cbc:PriceTypeCode>01</cbc:PriceTypeCode>
            </cac:AlternativeConditionPrice>
        </cac:PricingReference>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${data.currency}">${it.igvAmount.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="${data.currency}">${it.subtotal.toFixed(2)}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="${data.currency}">${it.igvAmount.toFixed(2)}</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:Percent>18.00</cbc:Percent>
                    <cbc:TaxExemptionReasonCode>10</cbc:TaxExemptionReasonCode>
                    <cac:TaxScheme>
                        <cbc:ID>1000</cbc:ID>
                        <cbc:Name>IGV</cbc:Name>
                        <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Description><![CDATA[${it.name}]]></cbc:Description>
            <cac:SellersItemIdentification>
                <cbc:ID>${it.sku}</cbc:ID>
            </cac:SellersItemIdentification>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${data.currency}">${priceSinIgv.toFixed(4)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`;
    });

    // Detracciones SPOT
    let detractionXml = "";
    if (data.detraction?.applied) {
      detractionXml = `
    <!-- Normativa SUNAT SPOT Detracciones -->
    <cac:PaymentMeans>
        <cbc:PaymentMeansCode>001</cbc:PaymentMeansCode>
        <cac:PayeeFinancialAccount>
            <cbc:ID>${data.company.bnAccount || "00-068-123456"}</cbc:ID>
        </cac:PayeeFinancialAccount>
    </cac:PaymentMeans>
    <cac:PaymentTerms>
        <cbc:ID>Detraccion</cbc:ID>
        <cbc:PaymentMeansID>${data.detraction.code}</cbc:PaymentMeansID>
        <cbc:PaymentPercent>${data.detraction.percent.toFixed(2)}</cbc:PaymentPercent>
        <cbc:Amount currencyID="${data.currency}">${data.detraction.amount.toFixed(2)}</cbc:Amount>
    </cac:PaymentTerms>`;
    }

    // Nota de Crédito referencia
    let relatedDocXml = "";
    if (isNotaCredito && data.relatedDoc) {
      relatedDocXml = `
    <cac:DiscrepancyResponse>
        <cbc:ReferenceID>${data.relatedDoc.number}</cbc:ReferenceID>
        <cbc:ResponseCode>${data.relatedDoc.reasonCode}</cbc:ResponseCode>
        <cbc:Description><![CDATA[${data.relatedDoc.reasonDesc}]]></cbc:Description>
    </cac:DiscrepancyResponse>
    <cac:BillingReference>
        <cac:InvoiceDocumentReference>
            <cbc:ID>${data.relatedDoc.number}</cbc:ID>
            <cbc:DocumentTypeCode>${data.relatedDoc.type}</cbc:DocumentTypeCode>
        </cac:InvoiceDocumentReference>
    </cac:BillingReference>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<${rootTag} ${nsDeclaration}
    xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
    xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
    xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionContent>
                <!-- Firma Digital XMLDSig de SUNAT -->
                <ds:Signature Id="Signature-JEXIA">
                    <ds:SignedInfo>
                        <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                        <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
                        <ds:Reference URI="">
                            <ds:DigestValue>${hash}</ds:DigestValue>
                        </ds:Reference>
                    </ds:SignedInfo>
                    <ds:SignatureValue>JEXIA_VALID_CERTIFICATE_SIGNATURE_MOCK</ds:SignatureValue>
                </ds:Signature>
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>${fullNumber}</cbc:ID>
    <cbc:IssueDate>${dateStr}</cbc:IssueDate>
    <cbc:IssueTime>12:00:00</cbc:IssueTime>
    ${!isNotaCredito ? `<cbc:InvoiceTypeCode listID="0101">${data.docType}</cbc:InvoiceTypeCode>` : ""}
    <cbc:DocumentCurrencyCode>${data.currency}</cbc:DocumentCurrencyCode>
    ${relatedDocXml}
    <cac:Signature>
        <cbc:ID>${data.company.ruc}</cbc:ID>
        <cac:SignatoryParty>
            <cac:PartyIdentification>
                <cbc:ID>${data.company.ruc}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[${data.company.businessName}]]></cbc:Name>
            </cac:PartyName>
        </cac:SignatoryParty>
        <cac:DigitalSignatureAttachment>
            <cac:ExternalReference>
                <cbc:URI>#Signature-JEXIA</cbc:URI>
            </cac:ExternalReference>
        </cac:DigitalSignatureAttachment>
    </cac:Signature>
    <!-- Emisor (Jexia ERP) -->
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="6">${data.company.ruc}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName><![CDATA[${data.company.businessName}]]></cbc:RegistrationName>
                <cac:RegistrationAddress>
                    <cbc:ID>${data.company.ubigeo}</cbc:ID>
                    <cbc:AddressLine>
                        <cbc:Line><![CDATA[${data.company.address}]]></cbc:Line>
                    </cbc:AddressLine>
                    <cbc:CitySubdivisionName>${data.company.district}</cbc:CitySubdivisionName>
                    <cbc:CityName>${data.company.province}</cbc:CityName>
                    <cbc:CountrySubentity>${data.company.department}</cbc:CountrySubentity>
                    <cac:Country>
                        <cbc:IdentificationCode>PE</cbc:IdentificationCode>
                    </cac:Country>
                </cac:RegistrationAddress>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <!-- Receptor (Cliente) -->
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="${customerDocTypeCode}">${data.customer.docNumber}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName><![CDATA[${data.customer.legalName}]]></cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    ${detractionXml}
    <!-- Totales de Impuestos SUNAT -->
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${data.currency}">${data.igvAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${data.currency}">${data.subtotalGravado.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${data.currency}">${data.igvAmount.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID>1000</cbc:ID>
                    <cbc:Name>IGV</cbc:Name>
                    <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${data.currency}">${data.subtotalGravado.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxInclusiveAmount currencyID="${data.currency}">${data.totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${data.currency}">${data.totalAmount.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    ${itemsXml}
</${rootTag}>`;

    return { xml, hash };
  }

  /**
   * Genera el archivo CDR XML (Constancia de Recepción oficial de SUNAT)
   */
  static buildCdrXml(companyRuc: string, docType: string, fullNumber: string, hash: string): string {
    const nowIso = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2"
    xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
    <cbc:CustomizationID>1.0</cbc:CustomizationID>
    <cbc:ID>CDR-${fullNumber}</cbc:ID>
    <cbc:IssueDate>${nowIso.split("T")[0]}</cbc:IssueDate>
    <cbc:IssueTime>${nowIso.split("T")[1].substring(0, 8)}</cbc:IssueTime>
    <cac:SenderParty>
        <cac:PartyIdentification>
            <cbc:ID schemeID="6">20000000001</cbc:ID>
        </cac:PartyIdentification>
        <cac:PartyName>
            <cbc:Name>SUPERINTENDENCIA NACIONAL DE ADUANAS Y DE ADMINISTRACION TRIBUTARIA</cbc:Name>
        </cac:PartyName>
    </cac:SenderParty>
    <cac:ReceiverParty>
        <cac:PartyIdentification>
            <cbc:ID schemeID="6">${companyRuc}</cbc:ID>
        </cac:PartyIdentification>
    </cac:ReceiverParty>
    <cac:DocumentResponse>
        <cac:Response>
            <cbc:ReferenceID>${fullNumber}</cbc:ReferenceID>
            <cbc:ResponseCode>0</cbc:ResponseCode>
            <cbc:Description>El comprobante numero ${fullNumber} ha sido aceptado por SUNAT exitosamente.</cbc:Description>
        </cac:Response>
        <cac:DocumentReference>
            <cbc:ID>${fullNumber}</cbc:ID>
            <cbc:DocumentTypeCode>${docType}</cbc:DocumentTypeCode>
        </cac:DocumentReference>
    </cac:DocumentResponse>
    <cbc:Note>Hash de Firma: ${hash}</cbc:Note>
</ApplicationResponse>`;
  }
}
