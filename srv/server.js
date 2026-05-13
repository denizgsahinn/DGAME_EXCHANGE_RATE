const cds = require("@sap/cds");

cds.on("served", () => console.log("CAP server started"));

module.exports = cds.server;
