// const s4 = require("../services/s4Client");

// exports.read = async () => {
//   const data = await s4.getV4(
//     "/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/A_CostCenter_2",
//     {
//       $select: "CostCenter,CostCenterName"
//     }
//   );

//   return data.map(c => ({
//     CostCenter: c.CostCenter,
//     CostCenterName: c.CostCenterName
//   }));
// };

const s4 = require("../services/s4Client");

exports.read = async () => {
  // Ana liste
  const data = await s4.getV4(
    "/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/A_CostCenter_2",
    {
      $select: "CostCenter,ControllingArea,ValidityEndDate"
    }
  );

  if (!data.length) return [];

  // Text endpoint'ten isimler
  const texts = await s4.getV4(
    "/sap/opu/odata4/sap/api_cost_center/srvd_a2x/sap/costcenter/0001/A_CostCenterText_2",
    {
      $select: "CostCenter,CostCenterName",
      $filter: "Language eq 'EN'"
    }
  );

  const nameMap = {};
  texts.forEach(t => { nameMap[t.CostCenter] = t.CostCenterName; });

  return data.map(c => ({
    CostCenter: c.CostCenter,
    CostCenterName: nameMap[c.CostCenter] || ""
  }));
};
