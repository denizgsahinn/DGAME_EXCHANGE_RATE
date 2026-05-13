const s4 = require("../services/s4Client");
const { getCompanyCode } = require("../utils/queryParser");

exports.read = async (req) => {
  try {
    const companyCode = getCompanyCode(req);
    if (!companyCode) {
      return req.reject(400, "Company Code zorunludur.");
    }

    // 1️⃣ Company bazlı müşteri listesi
    const companies = await s4.getV2(
      "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_CustomerCompany",
      {
        $select: "Customer,CompanyCode",
        $filter: `CompanyCode eq '${companyCode}'`
      }
    );

    if (!companies.length) return [];

    const customers = await s4.getV2(
      "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Customer",
      {
        $select: "Customer,CustomerFullName",
        $filter: `Customer eq ${companies.map(c => `'${c.Customer}'`).join(" or Customer eq ")}`
      }
    );

    const nameMap = {};
    customers.forEach(c => { nameMap[c.Customer] = c.CustomerFullName; });

    return companies.map(c => ({
      Customer: c.Customer,
      CompanyCode: c.CompanyCode,
      CustomerFullName: nameMap[c.Customer] || ""
    }));

  } catch (e) {
    console.error("Customers READ error:", e.response?.data || e.message);
    req.reject(500, e.response?.data || e.message);
  }
};
