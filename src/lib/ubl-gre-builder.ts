import crypto from "crypto";

export interface GreTransferData {
  company: {
    ruc: string;
    businessName: string;
    tradeName?: string;
    fiscalAddress: string;
    ubigeo: string;
  };
  greSeries: string;
  greNumber: number;
  greFullNumber: string;
  issueDate: Date | string;
  transferReason: string; // '04' Traslado entre establecimientos, '01' Venta, etc.
  transferReasonDesc: string;
  transportMode: string; // '02' Privado, '01' Público
  originAddress: string;
  originUbigeo: string;
  destAddress: string;
  destUbigeo: string;
  driverDocType?: string;
  driverDocNumber?: string;
  driverName?: string;
  driverLicense?: string;
  vehiclePlate?: string;
  carrierRuc?: string;
  carrierName?: string;
  totalWeight: number;
  packagesCount: number;
  items: {
    id: string;
    sku: string;
    name: string;
    unitCode: string;
    quantity: number;
  }[];
}

export function buildGreUblXml(data: GreTransferData): { xml: string; digestValue: string; cdrHash: string } {
  const issueDateStr = typeof data.issueDate === "string" 
    ? data.issueDate.split("T")[0] 
    : data.issueDate.toISOString().split("T")[0];

  const rawXmlForDigest = `${data.company.ruc}|09|${data.greFullNumber}|${issueDateStr}|${data.totalWeight}|${data.items.length}`;
  const digestValue = crypto.createHash("sha256").update(rawXmlForDigest).digest("base64");
  const cdrHash = crypto.createHash("sha256").update(digestValue + "SUNAT_CDR_ACCEPTED").digest("base64");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DespatchAdvice xmlns="urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <ds:Signature Id="Jexia-Sign-${data.greFullNumber}">
          <ds:SignedInfo>
            <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
            <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
            <ds:Reference URI="">
              <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
              <ds:DigestValue>${digestValue}</ds:DigestValue>
            </ds:Reference>
          </ds:SignedInfo>
          <ds:SignatureValue>GRE-DIGITAL-SIGNATURE-${digestValue.substring(0, 32)}</ds:SignatureValue>
        </ds:Signature>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>

  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${data.greFullNumber}</cbc:ID>
  <cbc:IssueDate>${issueDateStr}</cbc:IssueDate>
  <cbc:IssueTime>08:00:00</cbc:IssueTime>
  <cbc:DespatchAdviceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01">09</cbc:DespatchAdviceTypeCode>

  <!-- Remitente -->
  <cac:DespatchSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="6" schemeName="Documento de Identidad" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${data.company.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${data.company.businessName}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DespatchSupplierParty>

  <!-- Destinatario (Misma empresa en traslados entre establecimientos) -->
  <cac:DeliveryCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="6" schemeName="Documento de Identidad" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${data.company.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${data.company.businessName}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:DeliveryCustomerParty>

  <!-- Datos del Traslado -->
  <cac:Shipment>
    <cbc:ID>1</cbc:ID>
    <cbc:HandlingCode listAgencyName="PE:SUNAT" listName="Motivo de Traslado" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo20">${data.transferReason}</cbc:HandlingCode>
    <cbc:Information>${data.transferReasonDesc}</cbc:Information>
    <cbc:GrossWeightMeasure unitCode="KGM">${data.totalWeight.toFixed(2)}</cbc:GrossWeightMeasure>
    <cbc:TotalPackageQuantity>${data.packagesCount}</cbc:TotalPackageQuantity>

    <cac:ShipmentStage>
      <cbc:TransportModeCode listAgencyName="PE:SUNAT" listName="Modalidad de Traslado" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo18">${data.transportMode}</cbc:TransportModeCode>
      <cac:TransitPeriod>
        <cbc:StartDate>${issueDateStr}</cbc:StartDate>
      </cac:TransitPeriod>

      ${data.transportMode === "02" && data.driverDocNumber ? `
      <cac:DriverPerson>
        <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="1" schemeName="Documento de Identidad">${data.driverDocNumber}</cbc:ID>
        <cbc:FirstName>${data.driverName || "CONDUCTOR AUTORIZADO"}</cbc:FirstName>
        <cbc:JobTitle>Conductor</cbc:JobTitle>
        <cac:IdentityDocumentReference>
          <cbc:ID>${data.driverLicense || "Q-12345678"}</cbc:ID>
        </cac:IdentityDocumentReference>
      </cac:DriverPerson>
      ` : ""}

      ${data.transportMode === "01" && data.carrierRuc ? `
      <cac:CarrierParty>
        <cac:PartyIdentification>
          <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="6">${data.carrierRuc}</cbc:ID>
        </cac:PartyIdentification>
        <cac:PartyLegalEntity>
          <cbc:RegistrationName><![CDATA[${data.carrierName}]]></cbc:RegistrationName>
        </cac:PartyLegalEntity>
      </cac:CarrierParty>
      ` : ""}
    </cac:ShipmentStage>

    <!-- Punto de Partida -->
    <cac:OriginAddress>
      <cbc:ID schemeAgencyName="PE:INEI" schemeName="Ubigeos">${data.originUbigeo || "150101"}</cbc:ID>
      <cac:AddressLine>
        <cbc:Line><![CDATA[${data.originAddress}]]></cbc:Line>
      </cac:AddressLine>
    </cac:OriginAddress>

    <!-- Punto de Llegada -->
    <cac:DeliveryAddress>
      <cbc:ID schemeAgencyName="PE:INEI" schemeName="Ubigeos">${data.destUbigeo || "150101"}</cbc:ID>
      <cac:AddressLine>
        <cbc:Line><![CDATA[${data.destAddress}]]></cbc:Line>
      </cac:AddressLine>
    </cac:DeliveryAddress>

    ${data.vehiclePlate ? `
    <cac:TransportHandlingUnit>
      <cac:TransportEquipment>
        <cbc:ID>${data.vehiclePlate}</cbc:ID>
      </cac:TransportEquipment>
    </cac:TransportHandlingUnit>
    ` : ""}
  </cac:Shipment>

  <!-- Items a trasladar -->
  ${data.items.map((item, idx) => `
  <cac:DespatchLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:DeliveredQuantity unitCode="${item.unitCode || "NIU"}">${item.quantity.toFixed(2)}</cbc:DeliveredQuantity>
    <cac:OrderLineReference>
      <cbc:LineID>${idx + 1}</cbc:LineID>
    </cac:OrderLineReference>
    <cac:Item>
      <cbc:Name><![CDATA[${item.name}]]></cbc:Name>
      <cac:SellersItemIdentification>
        <cbc:ID>${item.sku}</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
  </cac:DespatchLine>
  `).join("")}
</DespatchAdvice>`;

  return { xml, digestValue, cdrHash };
}
