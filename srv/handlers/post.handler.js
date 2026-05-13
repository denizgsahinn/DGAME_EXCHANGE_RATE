const { buildJournalEntryXML } = require("../lib/journal-entry.builder");
const { postJournalEntry } = require("../lib/journal-entry.client");
const { retrieveJwt } = require("@sap-cloud-sdk/connectivity");
// const { extractAccountingDocument } = require("../lib/soap-response.parser");

exports.post = async (req) => {
  // ✅ jwt burada alınıp client'a geçiliyor
  const jwt = retrieveJwt(req.http.req);
  console.log("🔑 JWT alındı mı:", !!jwt);

  try {
    const input = req.data.input;
    if (!input) return req.error(400, "input zorunlu");

    const { header, items } = input;

    console.log("📥 Header:", header);
    console.log("📥 Items:", items);

    const xml = buildJournalEntryXML(header, items);

    console.log("📄 SOAP XML:");
    console.log(xml);

    const response = await postJournalEntry(xml, jwt);

    console.log("✅ SOAP Response Status:", response.status);
    console.log("Response: ", response);

    const accountingDocument = response.accountingDocument;
    if (!accountingDocument) {
      return req.error(500, "Belge oluşturuldu ancak belge numarası alınamadı");
    }

    return {
      success: true,
      accountingDocument,
      message: `Belge başarıyla oluşturuldu: ${accountingDocument}`
    }

  }
  catch (e) {
    console.error("❌ HATA:", e.message);
    console.error("HTTP Status:", e.response?.status);
    console.error("Response Body:", e.response?.data);

    const status = e.response?.status;

    if (status === 504 || e.code === "ETIMEDOUT" || e.code === "ECONNABORTED") {
      return req.error(504, "Hedef sistem zaman aşımına uğradı (504).");
    }
    if (status === 401 || status === 403) {
      return req.error(status, "Yetkilendirme hatası. Destination kimlik bilgilerini kontrol edin.");
    }
    if (status === 404) {
      return req.error(404, "Servis endpoint bulunamadı.");
    }
    if (e.code === "ECONNREFUSED") {
      return req.error(503, "Hedef sisteme bağlanılamıyor.");
    }

    const errorMsg = e.response?.data
      ? (typeof e.response.data === "string"
        ? e.response.data.substring(0, 300)
        : JSON.stringify(e.response.data).substring(0, 300))
      : e.message;

    return req.error(500, `SOAP Hatası: ${errorMsg}`);
  }
};
