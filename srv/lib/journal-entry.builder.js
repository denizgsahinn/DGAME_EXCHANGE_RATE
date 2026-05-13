function buildJournalEntryXML(header, items) {
  const formatDate = (d) => new Date(d).toISOString().split("T")[0];
  const now = new Date().toISOString();
  const docDate = formatDate(header.faturaTarihi);
  const postDate = formatDate(header.kayitTarihi);
  const TX_CUR = header.faturalamaParaBirimi;

  if (!TX_CUR || TX_CUR === "TRY") {
    throw new Error("Kur farkı belgesi için işlem para birimi TRY olamaz.");
  }

  const hasPartner = !!(header.musteri || header.satici);
  const isCreditor = !!(header.satici && !header.musteri);

  // ============================================================
  // CASE 1 & 2: GL-ONLY (Satıcı/Müşteri YOK, 2 kalem)
  // ============================================================
  if (!hasPartner) {
    if (items.length < 2) {
      throw new Error("GL-only senaryosunda en az 2 kalem olmalı.");
    }

    const baValues = items.map(i => (i.ba || "").toUpperCase());
    if (!baValues.includes("S") || !baValues.includes("H")) {
      throw new Error("GL-only senaryosunda en az bir S ve bir H kalemi olmalı.");
    }

    const taxItem = items.find(i => i.vergi);
    const hasTax = !!taxItem;

    if (!hasTax) {
      const total = items.reduce((sum, i) => {
        const amt = Math.abs(Number(i.tutar));
        return sum + ((i.ba || "").toUpperCase() === "S" ? amt : -amt);
      }, 0);
      if (Number(total.toFixed(2)) !== 0) {
        throw new Error(`Belge dengeli değil. Toplam=${total.toFixed(2)}`);
      }
    }

    const glItems = items.map((gl, idx) => {
      const amt = Number(gl.tutar);
      const signedAmt = (gl.ba || "").toUpperCase() === "S"
        ? Math.abs(amt) : -Math.abs(amt);
      return `
        <Item>
          <ReferenceDocumentItem>${idx + 1}</ReferenceDocumentItem>
          <GLAccount>${gl.anaHesap}</GLAccount>
          <AmountInCompanyCodeCurrency currencyCode="TRY">${signedAmt}</AmountInCompanyCodeCurrency>
          <AmountInTransactionCurrency currencyCode="${TX_CUR}">0</AmountInTransactionCurrency>
          <DebitCreditCode>${(gl.ba || "").toUpperCase()}</DebitCreditCode>
          <DocumentItemText>${gl.aciklama || ""}</DocumentItemText>
          <TaxCode>${gl.vergi || ""}</TaxCode>
          <AccountAssignment>
            <ProfitCenter>${gl.karMerkezi || ""}</ProfitCenter>
            <CostCenter>${gl.masrafYeri || ""}</CostCenter>
          </AccountAssignment>
        </Item>`;
    }).join("");

    let productTaxXML = "";
    if (hasTax) {
      const gl = taxItem;
      const glAmount = Math.abs(Number(gl.tutar));
      const refIdx = items.indexOf(gl) + 1;
      const taxBA = (gl.ba || "").toUpperCase();

      const sTotal = items
        .filter(i => (i.ba || "").toUpperCase() === "S")
        .reduce((s, i) => s + Math.abs(Number(i.tutar)), 0);
      const hTotal = items
        .filter(i => (i.ba || "").toUpperCase() === "H")
        .reduce((s, i) => s + Math.abs(Number(i.tutar)), 0);
      const taxAmount = Number(Math.abs(hTotal - sTotal).toFixed(2));

      productTaxXML = `
        <ProductTaxItem>
          <ReferenceDocumentItem>${refIdx}</ReferenceDocumentItem>
          <TaxCode>${gl.vergi}</TaxCode>
          <TaxitemClassification>VST</TaxitemClassification>
          <ConditionType>MWVS</ConditionType>
          <AmountInCompanyCodeCurrency currencyCode="TRY">${taxAmount}</AmountInCompanyCodeCurrency>
          <AmountInTransactionCurrency currencyCode="${TX_CUR}">0</AmountInTransactionCurrency>
          <DebitCreditCode>${taxBA}</DebitCreditCode>
          <TaxBaseAmountInCoCodeCrcy currencyCode="TRY">${glAmount}</TaxBaseAmountInCoCodeCrcy>
          <TaxBaseAmountInTransCrcy currencyCode="${TX_CUR}">${glAmount}</TaxBaseAmountInTransCrcy>
        </ProductTaxItem>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:sfin="http://sap.com/xi/SAPSCORE/SFIN">
  <soapenv:Header/>
  <soapenv:Body>
    <sfin:JournalEntryBulkCreateRequest>
      <MessageHeader>
        <CreationDateTime>${now}</CreationDateTime>
      </MessageHeader>
      <JournalEntryCreateRequest>
        <MessageHeader>
          <CreationDateTime>${now}</CreationDateTime>
        </MessageHeader>
        <JournalEntry>
          <OriginalReferenceDocumentType>BKPFF</OriginalReferenceDocumentType>
          <BusinessTransactionType>RFBU</BusinessTransactionType>
          <AccountingDocumentType>${header.belgeTuru}</AccountingDocumentType>
          <CreatedByUser>CB9980000052</CreatedByUser>
          <CompanyCode>${header.sirketKodu}</CompanyCode>
          <DocumentDate>${docDate}</DocumentDate>
          <PostingDate>${postDate}</PostingDate>
          <DocumentReferenceID>${header.referans || ""}</DocumentReferenceID>
          <TaxDeterminationDate>${docDate}</TaxDeterminationDate>
          ${glItems}
          ${productTaxXML}
        </JournalEntry>
      </JournalEntryCreateRequest>
    </sfin:JournalEntryBulkCreateRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  // ============================================================
  // CASE 3 & 4: PARTNER (Müşteri veya Satıcı VAR, 1 GL kalemi)
  // ============================================================
  if (items.length !== 1) {
    throw new Error("Partner varsa sadece 1 GL kalemi olmalı.");
  }

  const gl = items[0];
  const glAmountTRY = Math.abs(Number(gl.tutar));

  if (!glAmountTRY || glAmountTRY === 0) {
    throw new Error("GL tutarı 0 olamaz.");
  }

  if (!gl.vergi) {
    throw new Error("Partner senaryosunda vergi kodu zorunludur.");
  }

  const TAX_RATES = {
    "V0": 0, "V1": 0.01, "V2": 0.10, "V3": 0.20,
    "A0": 0, "A1": 0.01, "A2": 0.10, "A3": 0.20
  };
  const taxRate = TAX_RATES[gl.vergi] || 0;
  const taxAmountTRY = Number((glAmountTRY * taxRate).toFixed(2));
  const partnerAmountTRY = Number((glAmountTRY + taxAmountTRY).toFixed(2));

  // Satıcı: GL=S pozitif, Creditor=H negatif, Tax=S pozitif, TaxBase pozitif
  // Müşteri: GL=H negatif, Debtor=S pozitif, Tax=H negatif, TaxBase negatif
  const glBA = isCreditor ? "S" : "H";
  const partnerBA = isCreditor ? "H" : "S";
  const taxBA = isCreditor ? "S" : "H";

  const glTRY = isCreditor ? Math.abs(glAmountTRY) : -Math.abs(glAmountTRY);
  const partnerTRY = isCreditor ? -partnerAmountTRY : partnerAmountTRY;
  const taxAmountSigned = isCreditor ? taxAmountTRY : -taxAmountTRY;
  const taxBaseSigned = glTRY; // GL tutarıyla aynı işaret

  const taxClassification = isCreditor ? "VST" : "MWS";
  const conditionType = isCreditor ? "MWVS" : "MWAS";

  const partnerItem = isCreditor
    ? `<CreditorItem>
        <ReferenceDocumentItem>1</ReferenceDocumentItem>
        <Creditor>${header.satici}</Creditor>
        <AmountInCompanyCodeCurrency currencyCode="TRY">${partnerTRY.toFixed(2)}</AmountInCompanyCodeCurrency>
        <AmountInTransactionCurrency currencyCode="${TX_CUR}">0</AmountInTransactionCurrency>
        <DebitCreditCode>${partnerBA}</DebitCreditCode>
        <DocumentItemText>${header.cariAciklama || ""}</DocumentItemText>
        <PaymentDetails>
          <PaymentMethod>T</PaymentMethod>
        </PaymentDetails>
      </CreditorItem>`
    : `<DebtorItem>
        <ReferenceDocumentItem>1</ReferenceDocumentItem>
        <Debtor>${header.musteri}</Debtor>
        <AmountInCompanyCodeCurrency currencyCode="TRY">${partnerTRY.toFixed(2)}</AmountInCompanyCodeCurrency>
        <AmountInTransactionCurrency currencyCode="${TX_CUR}">0</AmountInTransactionCurrency>
        <DebitCreditCode>${partnerBA}</DebitCreditCode>
        <DocumentItemText>${header.cariAciklama || ""}</DocumentItemText>
      </DebtorItem>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:sfin="http://sap.com/xi/SAPSCORE/SFIN">
  <soapenv:Header/>
  <soapenv:Body>
    <sfin:JournalEntryBulkCreateRequest>
      <MessageHeader>
        <CreationDateTime>${now}</CreationDateTime>
      </MessageHeader>
      <JournalEntryCreateRequest>
        <MessageHeader>
          <CreationDateTime>${now}</CreationDateTime>
        </MessageHeader>
        <JournalEntry>
          <OriginalReferenceDocumentType>BKPFF</OriginalReferenceDocumentType>
          <BusinessTransactionType>RFBU</BusinessTransactionType>
          <AccountingDocumentType>${header.belgeTuru}</AccountingDocumentType>
          <CreatedByUser>CB9980000052</CreatedByUser>
          <CompanyCode>${header.sirketKodu}</CompanyCode>
          <DocumentDate>${docDate}</DocumentDate>
          <PostingDate>${postDate}</PostingDate>
          <DocumentReferenceID>${header.referans || ""}</DocumentReferenceID>
          <TaxDeterminationDate>${docDate}</TaxDeterminationDate>

          ${partnerItem}

          <Item>
            <ReferenceDocumentItem>2</ReferenceDocumentItem>
            <GLAccount>${gl.anaHesap}</GLAccount>
            <AmountInCompanyCodeCurrency currencyCode="TRY">${glTRY.toFixed(2)}</AmountInCompanyCodeCurrency>
            <AmountInTransactionCurrency currencyCode="${TX_CUR}">0</AmountInTransactionCurrency>
            <DebitCreditCode>${glBA}</DebitCreditCode>
            <DocumentItemText>${gl.aciklama || ""}</DocumentItemText>
            <TaxCode>${gl.vergi}</TaxCode>
            <AccountAssignment>
              <ProfitCenter>${gl.karMerkezi || ""}</ProfitCenter>
              <CostCenter>${gl.masrafYeri || ""}</CostCenter>
            </AccountAssignment>
          </Item>

          <ProductTaxItem>
            <ReferenceDocumentItem>2</ReferenceDocumentItem>
            <TaxCode>${gl.vergi}</TaxCode>
            <TaxitemClassification>${taxClassification}</TaxitemClassification>
            <ConditionType>${conditionType}</ConditionType>
            <AmountInCompanyCodeCurrency currencyCode="TRY">${taxAmountSigned}</AmountInCompanyCodeCurrency>
            <AmountInTransactionCurrency currencyCode="${TX_CUR}">0</AmountInTransactionCurrency>
            <DebitCreditCode>${taxBA}</DebitCreditCode>
            <TaxBaseAmountInCoCodeCrcy currencyCode="TRY">${taxBaseSigned.toFixed(2)}</TaxBaseAmountInCoCodeCrcy>
            <TaxBaseAmountInTransCrcy currencyCode="${TX_CUR}">${taxBaseSigned.toFixed(2)}</TaxBaseAmountInTransCrcy>
          </ProductTaxItem>

        </JournalEntry>
      </JournalEntryCreateRequest>
    </sfin:JournalEntryBulkCreateRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
}

module.exports = { buildJournalEntryXML };