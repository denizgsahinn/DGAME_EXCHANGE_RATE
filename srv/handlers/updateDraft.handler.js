// const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

// const DESTINATION = "S4H_DRAFT_PROD";
// const BASE_URL = "/sap/opu/odata4/sap/zui_fx_srv_bind/srvd/sap/zui_fx_srv/0001";

// async function getCsrfToken() {
//     const response = await executeHttpRequest(
//         { destinationName: DESTINATION },
//         {
//             method: "GET",
//             url: `${BASE_URL}/FXHeader`,
//             headers: { "x-csrf-token": "Fetch", "Accept": "application/json" }
//         }
//     );
//     return {
//         csrfToken: response.headers["x-csrf-token"],
//         cookies: response.headers["set-cookie"]
//     };
// }

// exports.post = async (req) => {
//     const input = req.data.input;
//     if (!input) return req.error(400, "input zorunlu");

//     const { fx_id, header, items } = input;
//     if (!fx_id) return req.error(400, "fx_id zorunlu");

//     console.log("📥 Update fx_id:", fx_id);

//     try {
//         const { csrfToken, cookies } = await getCsrfToken();

//         // 1. Önce etag al
//         const getResponse = await executeHttpRequest(
//             { destinationName: DESTINATION },
//             {
//                 method: "GET",
//                 url: `${BASE_URL}/FXHeader(fx_id=${fx_id},IsActiveEntity=false)`,
//                 headers: {
//                     "Accept": "application/json",
//                     ...(cookies ? { Cookie: cookies.join(";") } : {})
//                 }
//             }
//         );

//         const etag = getResponse.headers["etag"] || "*";
//         console.log("✅ ETag alındı:", etag);

//         // 2. Sonra güncelle
//         const payload = {
//             document_type:          header.belgeTuru,
//             company_code:           header.sirketKodu,
//             customer:               header.musteri || "",
//             vendor:                 header.satici || "",
//             invoice_date:           header.faturaTarihi,
//             bp_description:         header.cariAciklama || "",
//             posting_date:           header.kayitTarihi,
//             document_currency:      header.faturalamaParaBirimi,
//             header_text:            header.belgeBaslikMetni || "",
//             reference:              header.referans || "",
//             debit_credit_indicator: header.ba || ""
//             // _Items: (items || []).map(i => ({
//             //     debit_credit_indicator: i.ba || "H",
//             //     gl_account:             i.anaHesap,
//             //     amount:                 Number(i.tutar),
//             //     document_currency:      header.faturalamaParaBirimi,
//             //     assignment:             i.tayin || "",
//             //     item_text:              i.aciklama || "",
//             //     tax_code:               i.vergi || "",
//             //     profit_center:          i.karMerkezi || "",
//             //     cost_center:            i.masrafYeri || ""
//             // }))
//         };

//         await executeHttpRequest(
//             { destinationName: DESTINATION },
//             {
//                 method: "PATCH",
//                 url: `${BASE_URL}/FXHeader(fx_id=${fx_id},IsActiveEntity=false)`,
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Accept":       "application/json",
//                     "If-Match":     etag,
//                     "x-csrf-token": csrfToken,
//                     ...(cookies ? { Cookie: cookies.join(";") } : {})
//                 },
//                 data: payload
//             }
//         );

//         console.log("✅ Draft güncellendi:", fx_id);
//         return { success: true, fx_id };

//     } catch (e) {
//         console.error("❌ Update error:", e.response?.data || e.message);
//         return req.error(500, `Draft güncellenemedi: ${e.message}`);
//     }
// };


const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

const DESTINATION = "S4H_DRAFT_PROD";
const BASE_URL = "/sap/opu/odata4/sap/zui_fx_srv_bind/srvd/sap/zui_fx_srv/0001";

async function getCsrfToken() {
    const response = await executeHttpRequest(
        { destinationName: DESTINATION },
        {
            method: "GET",
            url: `${BASE_URL}/FXHeader`,
            headers: { "x-csrf-token": "Fetch", "Accept": "application/json" }
        }
    );
    return {
        csrfToken: response.headers["x-csrf-token"],
        cookies: response.headers["set-cookie"]
    };
}

async function getEtag(url, cookies, destination) {
    const response = await executeHttpRequest(
        { destinationName: destination },
        {
            method: "GET",
            url,
            headers: {
                "Accept": "application/json",
                ...(cookies ? { Cookie: cookies.join(";") } : {})
            }
        }
    );
    return response.headers["etag"] || "*";
}

exports.post = async (req) => {
    const input = req.data.input;
    if (!input) return req.error(400, "input zorunlu");

    const { fx_id, header, items } = input;
    if (!fx_id) return req.error(400, "fx_id zorunlu");

    console.log("📥 Update fx_id:", fx_id);

    try {
        const { csrfToken, cookies } = await getCsrfToken();
        const cookieHeader = cookies ? { Cookie: cookies.join(";") } : {};

        // 1. Header etag al ve güncelle
        const headerEtag = await getEtag(
            `${BASE_URL}/FXHeader(fx_id=${fx_id},IsActiveEntity=false)`,
            cookies,
            DESTINATION
        );

        const headerPayload = {
            document_type:          header.belgeTuru,
            company_code:           header.sirketKodu,
            customer:               header.musteri || "",
            vendor:                 header.satici || "",
            invoice_date:           header.faturaTarihi,
            bp_description:         header.cariAciklama || "",
            posting_date:           header.kayitTarihi,
            document_currency:      header.faturalamaParaBirimi,
            header_text:            header.belgeBaslikMetni || "",
            reference:              header.referans || "",
            debit_credit_indicator: header.ba || ""
        };

        await executeHttpRequest(
            { destinationName: DESTINATION },
            {
                method: "PATCH",
                url: `${BASE_URL}/FXHeader(fx_id=${fx_id},IsActiveEntity=false)`,
                headers: {
                    "Content-Type": "application/json",
                    "Accept":       "application/json",
                    "If-Match":     headerEtag,
                    "x-csrf-token": csrfToken,
                    ...cookieHeader
                },
                data: headerPayload
            }
        );
        console.log("✅ Header güncellendi");

        // 2. Her item için ayrı PATCH
        for (const item of (items || [])) {
            if (!item.item_id) {
                console.warn("⚠️ item_id yok, atlanıyor:", item);
                continue;
            }

            const itemEtag = await getEtag(
                `${BASE_URL}/FXItem(item_id=${item.item_id},IsActiveEntity=false)`,
                cookies,
                DESTINATION
            );

            const itemPayload = {
                debit_credit_indicator: (item.ba || "H").toUpperCase(),
                gl_account:             item.anaHesap,
                amount:                 Number(item.tutar),
                document_currency:      header.faturalamaParaBirimi,
                assignment:             item.tayin || "",
                item_text:              item.aciklama || "",
                tax_code:               item.vergi || "",
                profit_center:          item.karMerkezi || "",
                cost_center:            item.masrafYeri || ""
            };

            await executeHttpRequest(
                { destinationName: DESTINATION },
                {
                    method: "PATCH",
                    url: `${BASE_URL}/FXItem(item_id=${item.item_id},IsActiveEntity=false)`,
                    headers: {
                        "Content-Type": "application/json",
                        "Accept":       "application/json",
                        "If-Match":     itemEtag,
                        "x-csrf-token": csrfToken,
                        ...cookieHeader
                    },
                    data: itemPayload
                }
            );
            console.log("✅ Item güncellendi:", item.item_id);
        }

        return { success: true, fx_id };

    } catch (e) {
        console.error("❌ Update error:", e.response?.data || e.message);
        return req.error(500, `Draft güncellenemedi: ${e.message}`);
    }
};