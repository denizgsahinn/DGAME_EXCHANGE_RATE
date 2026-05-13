const cds = require("@sap/cds");

const suppliers = require("./handlers/suppliers.handler");
const customers = require("./handlers/customers.handler");
const costCenters = require("./handlers/costcenters.handler");
const profitCenters = require("./handlers/profitcenters.handler");
const postHandler = require("./handlers/post.handler");
const createDraftHandler = require("./handlers/createDraft.handler");
const getDraftsHandler = require("./handlers/getDrafts.handler");
const deleteDraftHandler = require("./handlers/deleteDraft.handler");
const updateDraftHandler = require("./handlers/updateDraft.handler");


module.exports = cds.service.impl(function () {

  // 🔹 S/4 SEARCH HELP
  this.on("READ", "Suppliers", suppliers.read);
  this.on("READ", "Customers", customers.read);
  this.on("READ", "CostCenters", costCenters.read);
  this.on("READ", "ProfitCenters", profitCenters.read);

  // 🔹 ACTION
  this.on("sendToService", postHandler.post);
  this.on("createDraft", createDraftHandler.post);
  this.on("getDrafts", getDraftsHandler.post);

  this.on("deleteDraft", deleteDraftHandler.post);
  this.on("updateDraft", updateDraftHandler.post);
});
