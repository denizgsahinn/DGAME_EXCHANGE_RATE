const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

const DESTINATION = "S4H_DRAFT_PROD";
const BASE_URL = "/sap/opu/odata4/sap/zui_fx_srv_bind/srvd/sap/zui_fx_srv/0001";

async function getCsrfToken() {
    const response = await executeHttpRequest(
        { destinationName: DESTINATION },
        {
            method: "GET",
            url: `${BASE_URL}/FXHeader`,
            headers: {
                "x-csrf-token": "Fetch",
                "Accept": "application/json"
            }
        }
    );
    return {
        csrfToken: response.headers["x-csrf-token"],
        cookies: response.headers["set-cookie"]
    };
}

exports.post = async (req) => {
    const input = req.data.input;
    if (!input) return req.error(400, "input zorunlu");

    const { header, items } = input;

    console.log("📥 Header:", header);
    console.log("📥 Items:", items);

    // CSRF Token al
    let csrfToken, cookies;
    try {
        ({ csrfToken, cookies } = await getCsrfToken());
        console.log("✅ CSRF Token alındı:", csrfToken);
    } catch (e) {
        console.error("❌ CSRF fetch hatası:", e.message);
        return req.error(500, "CSRF token alınamadı");
    }

    const payload = {
        document_type: header.belgeTuru,
        company_code: header.sirketKodu,
        customer: header.musteri || "",
        vendor: header.satici || "",
        invoice_date: header.faturaTarihi,
        bp_description: header.cariAciklama,
        posting_date: header.kayitTarihi,
        document_currency: header.faturalamaParaBirimi,
        // total_amount: header.tutar,
        header_text: header.belgeBaslikMetni || "",
        reference: header.referans || "",
        debit_credit_indicator: header.ba || "",
        _Items: (items || []).map(i => ({
            debit_credit_indicator: i.ba || "H",
            gl_account: i.anaHesap,
            amount: Number(i.tutar),
            document_currency: header.faturalamaParaBirimi,
            assignment: i.tayin || "",
            item_text: i.aciklama || "",
            tax_code: i.vergi || "",
            profit_center: i.karMerkezi || "",
            cost_center: i.masrafYeri || ""
        }))
    };

    try {
        const response = await executeHttpRequest(
            { destinationName: DESTINATION },
            {
                method: "POST",
                url: `${BASE_URL}/FXHeader`,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "x-csrf-token": csrfToken,
                    ...(cookies ? { Cookie: cookies.join(";") } : {})
                },
                data: payload
            }
        );

        console.log("✅ Draft oluşturuldu:", response.data);
        return { success: true, fx_id: response.data?.fx_id };

    } catch (e) {
        console.error("❌ Status:", e.response?.status);
        console.error("❌ Body:", JSON.stringify(e.response?.data, null, 2));
        return req.error(500, `Draft oluşturulamadı: ${e.response?.status}`);
    }
};