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
//     const { fx_id } = req.data;
//     if (!fx_id) return req.error(400, "fx_id zorunlu");

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

//         // 2. Sonra sil
//         await executeHttpRequest(
//             { destinationName: DESTINATION },
//             {
//                 method: "DELETE",
//                 url: `${BASE_URL}/FXHeader(fx_id=${fx_id},IsActiveEntity=false)`,
//                 headers: {
//                     "Accept": "application/json",
//                     "If-Match": etag,
//                     "x-csrf-token": csrfToken,
//                     ...(cookies ? { Cookie: cookies.join(";") } : {})
//                 }
//             }
//         );

//         console.log("✅ Draft silindi:", fx_id);
//         return { success: true };

//     } catch (e) {
//         console.error("❌ Delete error:", e.response?.data || e.message);
//         return req.error(500, `Draft silinemedi: ${e.message}`);
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

exports.post = async (req) => {
    const { fx_id } = req.data;
    if (!fx_id) return req.error(400, "fx_id zorunlu");

    try {
        const { csrfToken, cookies } = await getCsrfToken();
        const cookieHeader = cookies ? { Cookie: cookies.join(";") } : {};

        // 1. Etag al
        const getResponse = await executeHttpRequest(
            { destinationName: DESTINATION },
            {
                method: "GET",
                url: `${BASE_URL}/FXHeader(fx_id=${fx_id},IsActiveEntity=false)`,
                headers: {
                    "Accept": "application/json",
                    ...cookieHeader
                }
            }
        );

        const etag = getResponse.headers["etag"] || "*";
        console.log("✅ ETag alındı:", etag);

        // 2. Discard action
        await executeHttpRequest(
            { destinationName: DESTINATION },
            {
                method: "POST",
                url: `${BASE_URL}/FXHeader(fx_id=${fx_id},IsActiveEntity=false)/com.sap.gateway.srvd.zui_fx_srv.v0001.Discard`,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "If-Match": etag,
                    "x-csrf-token": csrfToken,
                    ...cookieHeader
                },
                data: {}
            }
        );

        console.log("✅ Draft silindi:", fx_id);
        return { success: true };

    } catch (e) {
        console.error("❌ Delete error:", e.response?.data || e.message);
        return req.error(500, `Draft silinemedi: ${e.message}`);
    }
};