const axios = require("axios");
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

function buildQuery(params = {}) {
  const parts = [];

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      parts.push(`${key}=${encodeURIComponent(value)}`);
    }
  }

  return parts.join("&");
}


/**
 * OData V2 GET
 */
exports.getV2 = async (path, params = {}) => {

  const query = buildQuery(params);
  const url = query ? `${path}?${query}` : path;

  const res = await executeHttpRequest(
    { destinationName: "S4H_ODATA_PROD" },
    {
      method: "GET",
      url,
      headers: {
        Accept: "application/json"
      }
    }
  );

  return res.data?.d?.results || [];
};

/**
 * OData V4 GET
 */
exports.getV4 = async (path, params = {}) => {

  const query = buildQuery({
    ...params,
    $format: "json"
  });

  const url = query ? `${path}?${query}` : path;

  const res = await executeHttpRequest(
    { destinationName: "S4H_ODATA_PROD" },
    {
      method: "GET",
      url,
      headers: {
        Accept: "application/json"
      }
    }
  );

  return res.data?.value || [];
};
