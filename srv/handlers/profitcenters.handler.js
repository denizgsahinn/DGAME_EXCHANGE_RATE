// const s4 = require("../services/s4Client");
// const { getCompanyCode } = require("../utils/queryParser");

// exports.read = async (req) => {
//   const companyCode = getCompanyCode(req);
//   if (!companyCode) {
//     return req.reject(400, "Company Code zorunludur.");
//   }

//   const rows = await s4.getV4(
//     "/sap/opu/odata4/sap/api_profitcenter/srvd_a2x/sap/profitcenter/0001/PrftCtrCoCodeAssignment",
//     {
//       $select: "ProfitCenter,CompanyCode",
//       $filter: `CompanyCode eq '${companyCode}'`
//     }
//   );

//   const unique = new Map();
//   rows.forEach(r => {
//     if (!unique.has(r.ProfitCenter)) {
//       unique.set(r.ProfitCenter, {
//         ProfitCenter: r.ProfitCenter,
//         CompanyCode: r.CompanyCode
//       });
//     }
//   });

//   return [...unique.values()];
// };

const s4 = require("../services/s4Client");
const { getCompanyCode } = require("../utils/queryParser");

exports.read = async (req) => {
  const companyCode = getCompanyCode(req);
  if (!companyCode) {
    return req.reject(400, "Company Code zorunludur.");
  }

  // 1️⃣ Company bazlı profit center listesi
  const rows = await s4.getV4(
    "/sap/opu/odata4/sap/api_profitcenter/srvd_a2x/sap/profitcenter/0001/PrftCtrCoCodeAssignment",
    {
      $select: "ProfitCenter,CompanyCode",
      $filter: `CompanyCode eq '${companyCode}'`
    }
  );

  const unique = new Map();
  rows.forEach(r => {
    if (!unique.has(r.ProfitCenter)) {
      unique.set(r.ProfitCenter, {
        ProfitCenter: r.ProfitCenter,
        CompanyCode: r.CompanyCode
      });
    }
  });

  const profitCenters = [...unique.values()];
  if (!profitCenters.length) return [];

  // 2️⃣ Text endpoint'ten isimler
  const texts = await s4.getV4(
    "/sap/opu/odata4/sap/api_profitcenter/srvd_a2x/sap/profitcenter/0001/ProfitCenterText",
    {
      $select: "ProfitCenter,ProfitCenterName",
      $filter: "Language eq 'EN'"
    }
  );

  const nameMap = {};
  texts.forEach(t => { nameMap[t.ProfitCenter] = t.ProfitCenterName; });

  return profitCenters.map(p => ({
    ProfitCenter: p.ProfitCenter,
    CompanyCode: p.CompanyCode,
    ProfitCenterName: nameMap[p.ProfitCenter] || ""
  }));
};
