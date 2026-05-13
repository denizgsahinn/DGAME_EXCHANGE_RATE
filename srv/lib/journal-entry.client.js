const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

/** ---------------- SOAP RESPONSE PARSER ---------------- */
function extractAccountingDocument(xml) {
  if (!xml || typeof xml !== "string") return null;

  const match = xml.match(/<AccountingDocument>(\d+)<\/AccountingDocument>/);
  return match ? match[1] : null;
}

/** ---------------- POST ---------------- */
async function postJournalEntry(soapXML, jwt) {
  try {
    const response = await executeHttpRequest(
      {
        destinationName: "S4H_SOAP_PROD",
        jwt
      },
      {
        method: "POST",
        url: "/sap/bc/srt/scs_ext/sap/journalentrycreaterequestconfi",
        headers: {
          "Content-Type": "text/xml",
          "Accept": "text/xml"
        },
        data: soapXML,
        timeout: 30000
      }
    );

    const accountingDocument =
      extractAccountingDocument(response.data);

    return {
      ok: true,
      status: response.status,
      accountingDocument,
      raw: response.data
    };

  } catch (err) {
    return {
      ok: false,
      status: err.response?.status,
      message: err.message,
      raw: err.response?.data
    };
  }
}

module.exports = { postJournalEntry };
