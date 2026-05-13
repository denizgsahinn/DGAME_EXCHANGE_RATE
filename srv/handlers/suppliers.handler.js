const s4 = require("../services/s4Client");
const { getCompanyCode } = require("../utils/queryParser");

exports.read = async (req) => {
  try {
    const companyCode = getCompanyCode(req);
    if (!companyCode) {
      return req.reject(400, "Company Code zorunludur.");
    }

    // 1️⃣ Company bazlı supplier listesi
    const companies = await s4.getV2(
      "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_SupplierCompany",
      {
        $select: "Supplier,CompanyCode",
        $filter: `CompanyCode eq '${companyCode}'`
      }
    );

    if (!companies.length) return [];

    // 2️⃣ Tek sorguda tüm supplierlerin adını al
    const suppliers = await s4.getV2(
      "/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Supplier",
      {
        $select: "Supplier,SupplierFullName",
        $filter: companies.map(c => `Supplier eq '${c.Supplier}'`).join(" or ")
      }
    );

    const nameMap = {};
    suppliers.forEach(s => { nameMap[s.Supplier] = s.SupplierFullName; });

    return companies.map(c => ({
      Supplier: c.Supplier,
      CompanyCode: c.CompanyCode,
      SupplierFullName: nameMap[c.Supplier] || ""
    }));

  } catch (e) {
    console.error("Suppliers READ error:", e.response?.data || e.message);
    req.reject(500, e.response?.data || e.message);
  }
};