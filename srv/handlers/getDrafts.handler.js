// const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

// async function getCsrfToken(destination) {

//     const response = await executeHttpRequest(
//         { destinationName: destination },
//         {
//             method: "GET",
//             url: "/sap/opu/odata4/sap/zui_fx_srv_bind/srvd/sap/zui_fx_srv/0001/FXHeader",
//             headers: { "x-csrf-token": "Fetch" }
//         }
//     );

//     return {
//         csrfToken: response.headers["x-csrf-token"],
//         cookies: response.headers["set-cookie"]
//     };
// }

// exports.post = async (req) => {
//     try {
//         const { csrfToken, cookies } = await getCsrfToken("S4H_DRAFT_PROD");


//         const response = await executeHttpRequest(
//             { destinationName: "S4H_DRAFT_PROD" },
//             {
//                 method: "GET",
//                 url: "/sap/opu/odata4/sap/zui_fx_srv_bind/srvd/sap/zui_fx_srv/0001/FXHeader?%24expand=_Items",
//                 headers: {
//                     "Accept": "application/json",
//                     "x-csrf-token": csrfToken,
//                     ...(cookies ? { Cookie: cookies.join(";") } : {})
//                 }
//             }
//         );

//         return response.data?.value?.map(d => ({
//             fx_id: d.fx_id,
//             belgeTuru: d.document_type,
//             sirketKodu: d.company_code,
//             faturalamaParaBirimi: d.document_currency,
//             tutar: d.total_amount,
//             referans: d.reference,

//             satici: d.vendor,
//             musteri: d.customer,
//             faturaTarihi: d.invoice_date,
//             kayitTarihi: d.posting_date,
//             cariAciklama: d.bp_description,
//             belgeBaslikMetni: d.header_text,
//             ba: d.debit_credit_indicator,

//             items: (d._Items || []).map(i => ({
//                 item_id: i.item_id,
//                 ba: i.debit_credit_indicator,
//                 anaHesap: i.gl_account,
//                 tutar: i.amount,
//                 tayin: i.assignment,
//                 aciklama: i.item_text,
//                 vergi: i.tax_code,
//                 karMerkezi: i.profit_center,
//                 masrafYeri: i.cost_center
//             }))
//         })) || [];

//     } catch (e) {
//         console.error("FULL ERROR:", e.response?.data || e.message);
//         console.error("FULL ERROR 2:", e);
//         return req.error(500, e.message);
//     }
// };

const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

async function getCsrfToken(destination) {

    const response = await executeHttpRequest(
        { destinationName: destination },
        {
            method: "GET",
            url: "/sap/opu/odata4/sap/zui_fx_srv_bind/srvd/sap/zui_fx_srv/0001/FXHeader",
            headers: { "x-csrf-token": "Fetch" }
        }
    );

    return {
        csrfToken: response.headers["x-csrf-token"],
        cookies: response.headers["set-cookie"]
    };
}

exports.post = async (req) => {
    try {
        const { csrfToken, cookies } = await getCsrfToken("S4H_DRAFT_PROD");


        const response = await executeHttpRequest(
            { destinationName: "S4H_DRAFT_PROD" },
            {
                method: "GET",
                url: "/sap/opu/odata4/sap/zui_fx_srv_bind/srvd/sap/zui_fx_srv/0001/FXHeader?%24expand=_Items",
                headers: {
                    "Accept": "application/json",
                    "x-csrf-token": csrfToken,
                    ...(cookies ? { Cookie: cookies.join(";") } : {})
                }
            }
        );

        return response.data?.value?.map(d => ({
            fx_id: d.fx_id,
            belgeTuru: d.document_type,
            sirketKodu: d.company_code,
            faturalamaParaBirimi: d.document_currency,
            tutar: d.total_amount,
            referans: d.reference,

            satici: d.vendor,
            musteri: d.customer,
            faturaTarihi: d.invoice_date,
            kayitTarihi: d.posting_date,
            cariAciklama: d.bp_description,
            belgeBaslikMetni: d.header_text,
            ba: d.debit_credit_indicator,

            items: (d._Items || []).map(i => ({
                item_id: i.item_id,
                ba: i.debit_credit_indicator,
                anaHesap: i.gl_account,
                tutar: i.amount,
                tayin: i.assignment,
                aciklama: i.item_text,
                vergi: i.tax_code,
                karMerkezi: i.profit_center,
                masrafYeri: i.cost_center
            }))
        })) || [];

    } catch (e) {
        console.error("FULL ERROR:", e.response?.data || e.message);
        console.error("FULL ERROR 2:", e);
        return req.error(500, e.message);
    }
};



