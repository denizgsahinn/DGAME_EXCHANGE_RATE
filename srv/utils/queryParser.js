// exports.getCompanyCode = (req) => {
//   const where = req.query?.SELECT?.where;
//   if (!where) return null;

//   const idx = where.findIndex(e => e?.ref?.[0] === "CompanyCode");
//   if (idx !== -1 && where[idx + 2]?.val) {
//     return where[idx + 2].val;
//   }
//   return null;
// };

exports.getCompanyCode = (req) => {
  try {
    const where = req?.query?.SELECT?.where;
    if (!Array.isArray(where)) return null;

    for (let i = 0; i < where.length; i++) {
      const t = where[i];
      if (t?.ref?.[0] === "CompanyCode") {
        if (where[i + 1] === "=" && where[i + 2]?.val !== undefined) {
          return String(where[i + 2].val);
        }
      }
    }
    return null;
  } catch {
    return null;
  }

};
