// const { odata } = require("@sap/cds");

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/NumberFormat"
], function (
    Controller,
    JSONModel,
    MessageToast,
    MessageBox,
    Fragment,
    Filter,
    FilterOperator,
    NumberFormat
) {
    "use strict";

    return Controller.extend("com.exchangerate.exchangerateui.controller.Main", {

        /* ======================================================= */
        /* INIT                                                    */
        /* ======================================================= */
        onInit: function () {
            const oViewModel = new JSONModel(this._getEmptyData());
            this.getView().setModel(oViewModel, "view");

            // 🔹 STATIC VALUE HELPS
            this.getView().setModel(new JSONModel({
                CompanyCodes: [
                    { code: "1000", text: "DGT" },
                    { code: "2000", text: "DGPL" },
                    { code: "3000", text: "DGDT" },
                    { code: "9000", text: "DGHL" }
                ],
                DocumentTypes: [
                    { code: "KF", text: "Exchange Rate Posting" },
                    { code: "DZ", text: "Customer Payment" },
                    { code: "DA", text: "Customer Document" },
                    { code: "KA", text: "Vendor Document" },
                    { code: "KR", text: "Vendor Invoice" },
                    { code: "SA", text: "G/L Account Document" }
                ],
                // BAValues: [
                //     { code: "Debit", text: "Debit" },
                //     { code: "Credit", text: "Credit" }
                // ],

                BAValues: [
                    { code: "D", text: "Debit (D)" },
                    { code: "C", text: "Credit (C)" }
                ],
                Currencies: [
                    { code: "USD", text: "USD" },
                    { code: "EUR", text: "EUR" },
                    { code: "GBP", text: "GBP" }
                ],
                GLAccounts: [
                    { code: "6460000001", text: "6460000001" },
                    { code: "6560000001", text: "6560000001" }
                ],
                TaxCodes: [
                    { code: "A0", text: "TR: %0 Output VAT - Sales" },
                    { code: "A1", text: "TR: %1 Output VAT - Sales" },
                    { code: "A2", text: "TR: %10 Output VAT - Sales" },
                    { code: "A3", text: "TR: %20 Output VAT - Sales" },
                    { code: "V0", text: "TR: %0 Input VAT - Purchases" },
                    { code: "V1", text: "TR: %1 Input VAT - Purchases" },
                    { code: "V2", text: "TR: %10 Input VAT - Purchases" },
                    { code: "V3", text: "TR: %20 Input VAT - Purchases" }
                ]
            }), "staticVH");
        },

        _getEmptyData: function () {
            return {
                editingFxId: null,
                belgeTuru: "",
                sirketKodu: "",
                satici: "",
                musteri: "",
                faturaTarihi: null,
                cariAciklama: "",
                kayitTarihi: null,
                faturalamaParaBirimi: "",
                tutar: "0.00",
                belgeBaslikMetni: "",
                referans: "",
                ba: "",
                items: [{
                    ba: "",
                    anaHesap: "",
                    tutar: "0.00",
                    tayin: "",
                    aciklama: "",
                    vergi: "",
                    karMerkezi: "",
                    masrafYeri: ""
                }]
            };
        },

        _i18n: function (key) {
            return this.getView().getModel("i18n").getResourceBundle().getText(key);
        },

        /* ======================================================= */
        /* ITEM EKLE / SIL                                         */
        /* ======================================================= */
        onAddItem: function () {
            const oModel = this.getView().getModel("view");
            const aItems = oModel.getProperty("/items");

            aItems.push({
                ba: "",
                anaHesap: "",
                tutar: "0.00",
                tayin: "",
                aciklama: "",
                vergi: "",
                karMerkezi: "",
                masrafYeri: ""
            });

            oModel.refresh(true);
        },

        onDeleteItem: function (oEvent) {
            const oModel = this.getView().getModel("view");
            const sPath = oEvent.getSource().getBindingContext("view").getPath();
            const iIndex = parseInt(sPath.split("/")[2], 10);

            const aItems = oModel.getProperty("/items");
            aItems.splice(iIndex, 1);
            oModel.refresh(true);
        },

        onClear: function () {
            const oModel = this.getView().getModel("view");
            const oData = oModel.getData();

            oData.editingFxId = null;

            // HEADER TEMİZLE
            oData.belgeTuru = "";
            oData.sirketKodu = "";
            oData.satici = "";
            oData.musteri = "";
            oData.faturaTarihi = null;
            oData.cariAciklama = "";
            oData.kayitTarihi = null;
            oData.faturalamaParaBirimi = "";
            oData.tutar = "0.00";
            oData.belgeBaslikMetni = "";
            oData.referans = "";
            oData.ba = "";

            /* ==========================
               ITEMS TEMİZLE (SATIRLAR KORUNUR)
            ========================== */
            oData.items.forEach(item => {
                item.ba = "";
                item.anaHesap = "";
                item.tutar = "0.00";
                item.tayin = "";
                item.aciklama = "";
                item.vergi = "";
                item.karMerkezi = "";
                item.masrafYeri = "";
            });

            oModel.refresh(true);

            MessageToast.show(this._i18n("msgFormCleared"));
        },

        onPostExchangeRate: function () {
            const oModel = this.getView().getModel();
            const oViewModel = this.getView().getModel("view");
            const oData = oViewModel.getData();

            // ---------------- VALIDATION (header) ----------------
            if (!oData.belgeTuru || !oData.sirketKodu) {
                sap.m.MessageBox.error(this._i18n("valDocTypeRequired"));
                return;
            }
            if (!oData.faturaTarihi || !oData.kayitTarihi) {
                sap.m.MessageBox.error(this._i18n("valDateRequired"));
                return;
            }
            if (!oData.faturalamaParaBirimi) {
                sap.m.MessageBox.error(this._i18n("valCurrencyRequired"));
                return;
            }
            if (oData.belgeTuru === "KR" && !oData.referans) {
                sap.m.MessageBox.error(this._i18n("valReferenceRequired"));
                return;
            }
            if (!oData.items || oData.items.length === 0) {
                sap.m.MessageBox.error(this._i18n("valItemRequired"));
                return;
            }

            // ---------------- HELPERS ----------------
            const parseTurkishAmount = (value) => {
                if (value === null || value === undefined || value === "") return 0;
                if (typeof value === "string") value = value.replace(/\./g, "").replace(",", ".");
                const n = parseFloat(value);
                return isNaN(n) ? 0 : n;
            };

            const hasPartner = !!(oData.musteri || oData.satici);

            // ---------------- VALIDATION (scenario rules) ----------------
            if (hasPartner) {
                if (oData.items.length !== 1) {
                    sap.m.MessageBox.error(this._i18n("valPartnerOneItem"));
                    return;
                }
            } else {
                if (oData.items.length !== 2) {
                    sap.m.MessageBox.error(this._i18n("valTwoItems"));
                    return;
                }
                const ba1 = (oData.items[0].ba || "").toUpperCase();
                const ba2 = (oData.items[1].ba || "").toUpperCase();
                const ok = (ba1 === "D" && ba2 === "C") || (ba1 === "C" && ba2 === "D");
                if (!ok) {
                    sap.m.MessageBox.error(this._i18n("valItemBalance"));
                    return;
                }
            }
            // } else {
            //     if (oData.items.length !== 2) {
            //         sap.m.MessageBox.error(this._i18n("valTwoItems"));
            //         return;
            //     }
            //     const ba1 = (oData.items[0].ba || "").toUpperCase();
            //     const ba2 = (oData.items[1].ba || "").toUpperCase();
            //     const ok = (ba1 === "S" && ba2 === "H") || (ba1 === "H" && ba2 === "S");
            //     if (!ok) {
            //         sap.m.MessageBox.error(this._i18n("valItemBalance"));
            //         return;
            //     }
            // }

            for (const it of oData.items) {
                const amt = parseTurkishAmount(it.tutar);
                if (!amt || amt === 0) {
                    sap.m.MessageBox.error(this._i18n("valAmountZero"));
                    return;
                }
            }

            const mapBA = (ba) => {
                const v = (ba || "").toUpperCase();
                if (v === "D") return "S";
                if (v === "C") return "H";
                return v;
            };

            // ---------------- PAYLOAD ----------------
            const inputParam = {
                header: {
                    belgeTuru: oData.belgeTuru,
                    sirketKodu: oData.sirketKodu,
                    musteri: oData.musteri || "",
                    satici: oData.satici || "",
                    faturaTarihi: oData.faturaTarihi,
                    kayitTarihi: oData.kayitTarihi,
                    cariAciklama: oData.cariAciklama || "",
                    faturalamaParaBirimi: oData.faturalamaParaBirimi,
                    referans: oData.referans || "",
                    tutar: parseTurkishAmount(oData.tutar)  // ← ekle
                },
                items: oData.items.map(i => ({
                    // ba: (i.ba || "H").toUpperCase(),
                    ba: mapBA(i.ba),   // ← D→S, C→H dönüşümü burada
                    anaHesap: i.anaHesap,
                    tutar: parseTurkishAmount(i.tutar),
                    aciklama: i.aciklama || "",
                    vergi: i.vergi || "",
                    karMerkezi: i.karMerkezi || "",
                    masrafYeri: i.masrafYeri || ""
                }))
            };

            console.log("📤 Payload:", JSON.stringify(inputParam, null, 2));

            // ---------------- ACTION CALL ----------------
            const oBinding = oModel.bindContext("/sendToService(...)");
            oBinding.setParameter("input", inputParam);

            sap.ui.core.BusyIndicator.show(0);

            oBinding.execute()
                .then(() => {
                    sap.ui.core.BusyIndicator.hide();

                    const oContext = oBinding.getBoundContext();
                    const oResult = oContext.getObject();
                    const sDocNo = oResult?.accountingDocument;
                    const isValidDocument = sDocNo && sDocNo !== "0000000000";

                    if (oResult?.success && isValidDocument) {
                        sap.m.MessageBox.success(
                            `📄 ${this._i18n("successDocCreated")}\n\n${this._i18n("successDocNo")}: ${sDocNo}`,
                            {
                                title: "Success",
                                actions: [sap.m.MessageBox.Action.OK]
                            }
                        );
                    } else {
                        sap.m.MessageBox.error(
                            this._i18n("errDocNotCreated"),
                            { title: "Failed" }
                        );
                    }
                })
                .catch(err => {
                    // ✅ ARTIK AKTİF - BusyIndicator kapanır, kullanıcıya anlamlı hata gösterilir
                    sap.ui.core.BusyIndicator.hide();
                    console.error("❌ Servis hatası:", err);

                    // HTTP durum kodunu parse et
                    const sMessage = err?.message || "";
                    let sUserMessage = this._i18n("errServiceConn");

                    if (sMessage.includes("504")) {
                        sUserMessage = this._i18n("errTimeout");
                    } else if (sMessage.includes("401") || sMessage.includes("403")) {
                        sUserMessage = this._i18n("errAuth");
                    } else if (sMessage.includes("404")) {
                        sUserMessage = this._i18n("errNotFound");
                    } else if (sMessage.includes("Communication error")) {
                        sUserMessage = this._i18n("errConnError");
                    }

                    sap.m.MessageBox.error(sUserMessage, {
                        title: "Connection Error",
                        details: sMessage  // Teknik detay "Details" linkiyle gösterilir
                    });
                });
        },


        /* ======================================================= */
        /* GENERIC VALUE HELP                                      */
        /* ======================================================= */
        _openValueHelp: async function (
            sEntity,
            sKeyField,
            sTargetPath,
            mOptions = {}
        ) {

            this._vhConfig = {
                sKeyField,
                sTargetPath,
                isItem: !!this._vhContextPath,
                writeText: mOptions.writeText || false
            };

            if (!this._oVHDialog) {
                this._oVHDialog = await Fragment.load({
                    name: "com.exchangerate.exchangerateui.fragment.ValueHelp",
                    controller: this
                });
                this.getView().addDependent(this._oVHDialog);
            }

            let aResults = [];

            // 🔹 1) STATIC VALUE HELP
            const oStaticModel = this.getView().getModel("staticVH");
            if (oStaticModel && oStaticModel.getProperty("/" + sEntity)) {

                aResults = oStaticModel.getProperty("/" + sEntity).map(e => ({
                    key: e[sKeyField],
                    text: e.text || e[sKeyField]
                }));

            } else {

                // 🔹 2) ODATA VALUE HELP
                const aFilters = [];
                if (mOptions.companyCode) {
                    aFilters.push(
                        new Filter("CompanyCode", FilterOperator.EQ, mOptions.companyCode)
                    );
                }

                const oListBinding = this.getView()
                    .getModel()
                    .bindList("/" + sEntity, null, null, aFilters);

                const aContexts = await oListBinding.requestContexts(0, 500);

                aResults = aContexts.map(c => ({
                    key: c.getProperty(sKeyField),
                    text: c.getProperty(sKeyField)
                }));
            }

            this.getView().setModel(
                new JSONModel({ results: aResults }),
                "vh"
            );

            this._oVHDialog.open();
        },


        onValueHelpSearch: function (oEvent) {
            const sValue = oEvent.getParameter("value");
            const oBinding = oEvent.getSource().getBinding("items");

            if (!sValue) {
                oBinding.filter([]);
                return;
            }

            oBinding.filter([
                new Filter("text", FilterOperator.Contains, sValue)
            ]);
        },

        onValueHelpConfirm: function (oEvent) {
            const oItem = oEvent.getParameter("selectedItem");
            if (!oItem) return;

            const sKey = oItem.getBindingContext("vh").getProperty("key");
            const sText = oItem.getBindingContext("vh").getProperty("text");
            const oViewModel = this.getView().getModel("view");

            let sFinalPath;

            if (this._vhContextPath) {
                sFinalPath = this._vhContextPath + this._vhConfig.sTargetPath;
            } else {
                sFinalPath = this._vhConfig.sTargetPath;
            }

            console.log("VH write path:", sFinalPath);

            const sOldCompanyCode = oViewModel.getProperty("/sirketKodu");

            // writeText true ise text yaz, değilse key yaz
            const sValueToWrite = this._vhConfig.writeText ? sText : sKey;
            oViewModel.setProperty(sFinalPath, sValueToWrite);

            if (
                sFinalPath === "/sirketKodu" &&
                sOldCompanyCode &&
                sOldCompanyCode !== sKey
            ) {
                oViewModel.setProperty("/satici", "");
                oViewModel.setProperty("/musteri", "");
                this._clearAllItemProfitCenters();
            }

            this._vhContextPath = null;

            if (this._oVHDialog && typeof this._oVHDialog.close === "function") {
                this._oVHDialog.close();
            }
        },

        onValueHelpCancel: function () {
            if (this._oVHDialog && typeof this._oVHDialog.close === "function") {
                this._oVHDialog.close();
            }
        },

        onSupplierVH: function () {
            const sCompanyCode = this.getView()
                .getModel("view")
                .getProperty("/sirketKodu");

            if (!sCompanyCode) {
                MessageBox.warning(this._i18n("valCompanyCodeFirst"));
                return;
            }
            console.log("sCompanyCode: ", sCompanyCode);

            this._vhConfig = {
                sKeyField: "Supplier",
                sTargetPath: "/satici",
                isItem: false
                // writeText: true
            };

            const oListBinding = this.getView()
                .getModel()
                .bindList("/Suppliers", null, null, [
                    new Filter("CompanyCode", FilterOperator.EQ, sCompanyCode)
                ]);

            oListBinding.requestContexts(0, 500).then(aContexts => {
                const aResults = aContexts.map(c => ({
                    key: c.getProperty("Supplier"),
                    text: c.getProperty("SupplierFullName")
                        ? `${c.getProperty("SupplierFullName")}`
                        : c.getProperty("Supplier")
                }));

                this.getView().setModel(new JSONModel({ results: aResults }), "vh");

                if (!this._oVHDialog) {
                    Fragment.load({
                        name: "com.exchangerate.exchangerateui.fragment.ValueHelp",
                        controller: this
                    }).then(oDialog => {
                        this._oVHDialog = oDialog;
                        this.getView().addDependent(this._oVHDialog);
                        this._oVHDialog.open();
                    });
                } else {
                    this._oVHDialog.open();
                }
            });
        },

        onCustomerVH: function () {
            const sCompanyCode = this.getView()
                .getModel("view")
                .getProperty("/sirketKodu");

            if (!sCompanyCode) {
                MessageBox.warning(this._i18n("valCompanyCodeFirst"));
                return;
            }

            this._vhConfig = {
                sKeyField: "Customer",
                sTargetPath: "/musteri",
                isItem: false
                // writeText: true
            };

            // Özel fetch — CustomerFullName dahil
            const oListBinding = this.getView()
                .getModel()
                .bindList("/Customers", null, null, [
                    new Filter("CompanyCode", FilterOperator.EQ, sCompanyCode)
                ]);

            oListBinding.requestContexts(0, 500).then(aContexts => {
                const aResults = aContexts.map(c => ({
                    key: c.getProperty("Customer"),
                    text: c.getProperty("CustomerFullName")
                        ? `${c.getProperty("CustomerFullName")}`
                        : c.getProperty("Customer")
                }));

                console.log("👥 Customer results:", JSON.stringify(aResults));  // ← ekle

                this.getView().setModel(new JSONModel({ results: aResults }), "vh");

                if (!this._oVHDialog) {
                    Fragment.load({
                        name: "com.exchangerate.exchangerateui.fragment.ValueHelp",
                        controller: this
                    }).then(oDialog => {
                        this._oVHDialog = oDialog;
                        this.getView().addDependent(this._oVHDialog);
                        this._oVHDialog.open();
                    });
                } else {
                    this._oVHDialog.open();
                }
            });
        },

        onDocumentTypesVH: function () {
            this._openValueHelp("DocumentTypes", "code", "/belgeTuru");
            // this._openValueHelp("DocumentTypes", "code", "/belgeTuru", { writeText: true });
        },

        onCurrencyVH: function () {
            this._openValueHelp("Currencies", "code", "/faturalamaParaBirimi");
        },

        onCompanyCodeVH: function () {
            this._openValueHelp("CompanyCodes", "code", "/sirketKodu",);
        },

        onBAValuesVH: function () {
            this._openValueHelp("BAValues", "code", "/ba");
        },

        onItemBAValuesVH: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext("view");
            this._vhContextPath = oCtx.getPath(); // "/items/0"
            this._openValueHelp("BAValues", "code", "/ba");
        },

        onGLAccountsVH: function (oEvent) {

            const sCompanyCode = this.getView()
                .getModel("view")
                .getProperty("/sirketKodu");

            if (!sCompanyCode) {
                MessageBox.warning(this._i18n("valCompanyCodeFirst"));
                return;
            }

            const oSource = oEvent.getSource();
            const oCtx = oSource.getBindingContext("view"); // 👈 hangi satır

            this._vhContextPath = oCtx.getPath(); // "/items/0"

            this._openValueHelp(
                "GLAccounts",
                "code",
                "/anaHesap"
            );
        },

        onTaxCodesVH: function (oEvent) {
            const oSource = oEvent.getSource();
            const oCtx = oSource.getBindingContext("view"); // 👈 hangi satır

            this._vhContextPath = oCtx.getPath(); // "/items/0"
            this._openValueHelp("TaxCodes", "code", "/vergi");
        },

        onCostCenterVH: function (oEvent) {
            const oSource = oEvent.getSource();
            const oCtx = oSource.getBindingContext("view");
            this._vhContextPath = oCtx.getPath();

            this._vhConfig = {
                sKeyField: "CostCenter",
                sTargetPath: "/masrafYeri",
                isItem: true
                // writeText: true
            };

            const oListBinding = this.getView()
                .getModel()
                .bindList("/CostCenters");

            oListBinding.requestContexts(0, 500).then(aContexts => {
                const aResults = aContexts.map(c => ({
                    key: c.getProperty("CostCenter"),
                    text: c.getProperty("CostCenterName")
                        ? `${c.getProperty("CostCenterName")}`
                        : c.getProperty("CostCenter")
                }));

                this.getView().setModel(new JSONModel({ results: aResults }), "vh");

                if (!this._oVHDialog) {
                    Fragment.load({
                        name: "com.exchangerate.exchangerateui.fragment.ValueHelp",
                        controller: this
                    }).then(oDialog => {
                        this._oVHDialog = oDialog;
                        this.getView().addDependent(this._oVHDialog);
                        this._oVHDialog.open();
                    });
                } else {
                    this._oVHDialog.open();
                }
            });
        },

        onProfitCenterVH: function (oEvent) {
            const sCompanyCode = this.getView()
                .getModel("view")
                .getProperty("/sirketKodu");

            if (!sCompanyCode) {
                MessageBox.warning(this._i18n("valCompanyCodeFirst"));
                return;
            }

            const oCtx = oEvent.getSource().getBindingContext("view");
            this._vhContextPath = oCtx.getPath();

            this._vhConfig = {
                sKeyField: "ProfitCenter",
                sTargetPath: "/karMerkezi",
                isItem: true
                // writeText: true
            };

            const oListBinding = this.getView()
                .getModel()
                .bindList("/ProfitCenters", null, null, [
                    new Filter("CompanyCode", FilterOperator.EQ, sCompanyCode)
                ]);

            oListBinding.requestContexts(0, 500).then(aContexts => {
                const aResults = aContexts.map(c => ({
                    key: c.getProperty("ProfitCenter"),
                    text: c.getProperty("ProfitCenterName")
                        ? `${c.getProperty("ProfitCenterName")}`
                        : c.getProperty("ProfitCenter")
                }));

                this.getView().setModel(new JSONModel({ results: aResults }), "vh");

                if (!this._oVHDialog) {
                    Fragment.load({
                        name: "com.exchangerate.exchangerateui.fragment.ValueHelp",
                        controller: this
                    }).then(oDialog => {
                        this._oVHDialog = oDialog;
                        this.getView().addDependent(this._oVHDialog);
                        this._oVHDialog.open();
                    });
                } else {
                    this._oVHDialog.open();
                }
            });
        },


        /* ======================================================= */
        /* NUMERIC FORMAT                                          */
        /* ======================================================= */
        onNumericLiveChange: function (oEvent) {
            let sValue = oEvent.getParameter("value") || "";
            sValue = sValue.replace(/[^\d.,]/g, "").replace(",", ".");

            const fValue = parseFloat(sValue);
            const oInput = oEvent.getSource();
            const oModel = oInput.getModel("view");

            const oBinding = oInput.getBinding("value");
            let sPath = oBinding.getPath();

            if (!sPath.startsWith("/")) {
                sPath = oInput.getBindingContext("view").getPath() + "/" + sPath;
            }

            oModel.setProperty(sPath, isNaN(fValue) ? null : fValue);
        },

        onNumericChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const oBinding = oInput.getBinding("value");
            if (!oBinding) return;

            let sPath = oBinding.getPath();
            if (!sPath.startsWith("/")) {
                sPath = oInput.getBindingContext("view").getPath() + "/" + sPath;
            }

            const fValue = oInput.getModel("view").getProperty(sPath);
            if (fValue === null) {
                oInput.setValue("");
                return;
            }

            oInput.setValue(this._formatNumberTR(fValue));
        },

        _formatNumberTR: function (value) {
            return NumberFormat.getFloatInstance({
                minFractionDigits: 2,
                maxFractionDigits: 2,
                groupingEnabled: true,
                groupingSeparator: ".",
                decimalSeparator: ","
            }).format(value);
        },

        _clearAllItemProfitCenters: function () {
            const oViewModel = this.getView().getModel("view");
            const aItems = oViewModel.getProperty("/items") || [];

            aItems.forEach(item => {
                item.karMerkezi = "";
            });

            oViewModel.refresh(true);
        },

        onSaveDraft: async function () {

            const oModel = this.getView().getModel();
            const oData = this.getView().getModel("view").getData();

            // Validation
            if (!oData.belgeTuru || !oData.sirketKodu) {
                sap.m.MessageBox.error(this._i18n("valDocTypeRequired"));
                return;
            }
            if (!oData.faturaTarihi || !oData.kayitTarihi) {
                sap.m.MessageBox.error(this._i18n("valDateRequired"));
                return;
            }
            if (!oData.faturalamaParaBirimi) {
                sap.m.MessageBox.error(this._i18n("valCurrencyRequired"));
                return;
            }

            // ── Duplicate kontrolü ──
            try {
                const csrfResponse = await fetch("/srv/exchangerate/$metadata", {
                    method: "GET",
                    headers: { "X-CSRF-Token": "fetch" }
                });
                const csrfToken = csrfResponse.headers.get("x-csrf-token");

                const oResponse = await fetch("/srv/exchangerate/getDrafts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken
                    },
                    body: JSON.stringify({})
                });

                if (oResponse.ok) {
                    const oResult = await oResponse.json();
                    const aDrafts = oResult?.value || oResult || [];

                    // const isDuplicate = aDrafts.some(d =>
                    //     d.belgeTuru === oData.belgeTuru &&
                    //     d.sirketKodu === oData.sirketKodu &&
                    //     d.referans === oData.referans &&
                    //     d.faturaTarihi === oData.faturaTarihi &&
                    //     d.faturalamaParaBirimi === oData.faturalamaParaBirimi
                    // );

                    const isDuplicate = aDrafts.some(d => {
                        // Header karşılaştır
                        const headerMatch =
                            d.belgeTuru === oData.belgeTuru &&
                            d.sirketKodu === oData.sirketKodu &&
                            d.referans === oData.referans &&
                            d.faturaTarihi === oData.faturaTarihi &&
                            d.faturalamaParaBirimi === oData.faturalamaParaBirimi &&
                            (d.musteri || "") === (oData.musteri || "") &&
                            (d.satici || "") === (oData.satici || "");

                        if (!headerMatch) return false;

                        // Kalem sayısı farklıysa duplicate değil
                        if ((d.items || []).length !== (oData.items || []).length) return false;

                        // Her kalemi karşılaştır
                        const itemsMatch = (oData.items || []).every((item, idx) => {
                            const dItem = d.items?.[idx];
                            if (!dItem) return false;
                            return (
                                (item.ba || "") === (dItem.ba || "") &&
                                (item.anaHesap || "") === (dItem.anaHesap || "") &&
                                String(item.tutar || "") === String(dItem.tutar || "") &&
                                (item.vergi || "") === (dItem.vergi || "") &&
                                (item.karMerkezi || "") === (dItem.karMerkezi || "") &&
                                (item.masrafYeri || "") === (dItem.masrafYeri || "")
                            );
                        });

                        return itemsMatch;
                    });

                    if (isDuplicate) {
                        sap.m.MessageBox.warning(
                            "A draft already exists.",
                            { title: "Duplicate Draft" }
                        );
                        return;
                    }
                }
            } catch (e) {
                console.warn("Duplicate check failed:", e.message);
                // Hata olursa kontrol atla, kaydetmeye devam et
            }

            // ── Kaydet ──
            const inputParam = {
                header: {
                    belgeTuru: oData.belgeTuru,
                    sirketKodu: oData.sirketKodu,
                    musteri: oData.musteri || "",
                    satici: oData.satici || "",
                    faturaTarihi: oData.faturaTarihi,
                    kayitTarihi: oData.kayitTarihi,
                    cariAciklama: oData.cariAciklama || "",
                    faturalamaParaBirimi: oData.faturalamaParaBirimi,
                    tutar: oData.tutar,
                    belgeBaslikMetni: oData.belgeBaslikMetni,
                    referans: oData.referans,
                    ba: oData.ba
                },
                items: oData.items
            };

            oModel.bindContext("/createDraft(...)")
                .setParameter("input", inputParam)
                .execute()
                .then(() => sap.m.MessageToast.show(this._i18n("msgDraftSaved")))
                .catch(() => sap.m.MessageBox.error("Draft could not be saved"));
        },

        _formatAmount: function (value) {
            if (value === null || value === undefined || value === "") return "";
            return NumberFormat.getFloatInstance({
                minFractionDigits: 2,
                maxFractionDigits: 2,
                groupingEnabled: true,
                groupingSeparator: ".",
                decimalSeparator: ","
            }).format(Number(Number(value).toFixed(2)));
        },

        onShowDrafts: async function () {

            // Fragment'ı her seferinde yeniden yükle (cache temizle)
            if (this._oDraftDialog) {
                this._oDraftDialog.destroy();
                this._oDraftDialog = null;
            }

            if (!this._oDraftDialog) {
                this._oDraftDialog = await Fragment.load({
                    name: "com.exchangerate.exchangerateui.fragment.DraftList",
                    controller: this
                });
                this.getView().addDependent(this._oDraftDialog);
            }

            try {
                const csrfResponse = await fetch("/srv/exchangerate/$metadata", {
                    method: "GET",
                    headers: { "X-CSRF-Token": "fetch" }
                });

                if (csrfResponse.status === 401) {
                    sap.m.MessageBox.warning(
                        this._i18n("msgSessionExpired"),
                        { onClose: () => window.location.reload() }
                    );
                    return;
                }

                const csrfToken = csrfResponse.headers.get("x-csrf-token");

                const oResponse = await fetch("/srv/exchangerate/getDrafts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken
                    },
                    body: JSON.stringify({})
                });

                if (oResponse.status === 401) {
                    sap.m.MessageBox.warning(
                        this._i18n("msgSessionExpired"),
                        { onClose: () => window.location.reload() }
                    );
                    return;
                }

                if (!oResponse.ok) {
                    const text = await oResponse.text();
                    console.error("Service error:", text);
                    sap.m.MessageToast.show(this._i18n("msgDraftsNotLoaded"));
                    return;
                }

                const oData = await oResponse.json();
                const aDrafts = oData?.value || oData || [];

                const TAX_RATES = {
                    "V0": 0, "V1": 0.01, "V2": 0.08, "V3": 0.20,
                    "A0": 0, "A1": 0.01, "A2": 0.08, "A3": 0.20
                };

                const aDraftsWithDisplay = aDrafts.map(draft => {
                    const displayItems = [];

                    // 1. Partner kalemi (Satıcı veya Müşteri)
                    if (draft.satici || draft.musteri) {
                        const glTutar = draft.items?.[0]?.tutar || 0;
                        const vergi = draft.items?.[0]?.vergi || "";
                        const taxRate = TAX_RATES[vergi] || 0;
                        const taxAmount = Number((Math.abs(Number(glTutar)) * taxRate).toFixed(2));
                        const partnerTutar = Number((Math.abs(Number(glTutar)) + taxAmount).toFixed(2));
                        const isCreditor = !!draft.satici;

                        displayItems.push({
                            ba: isCreditor ? "H" : "S",
                            anaHesap: draft.satici || draft.musteri,
                            tutar: this._formatAmount(isCreditor ? -partnerTutar : partnerTutar),
                            tayin: "",
                            aciklama: draft.cariAciklama || (isCreditor ? this._i18n("vendorLabel") : this._i18n("customerLabel")),
                            vergi: "",
                            karMerkezi: "",
                            masrafYeri: ""
                        });

                    }

                    // 2. GL kalemleri
                    (draft.items || []).forEach(item => {
                        const isDebtor = !!draft.musteri;
                        const isCreditor = !!draft.satici;
                        let signedTutar;

                        if (isCreditor) {
                            signedTutar = Math.abs(Number(item.tutar));
                        } else if (isDebtor) {
                            signedTutar = -Math.abs(Number(item.tutar));
                        } else {
                            const glBA = (item.ba || "").toUpperCase();
                            signedTutar = glBA === "S"
                                ? Math.abs(Number(item.tutar))
                                : -Math.abs(Number(item.tutar));
                        }

                        displayItems.push({
                            ba: item.ba || "",
                            anaHesap: item.anaHesap,
                            tutar: this._formatAmount(signedTutar),
                            tayin: item.tayin || "",
                            aciklama: item.aciklama || "",
                            vergi: item.vergi || "",
                            karMerkezi: item.karMerkezi || "",
                            masrafYeri: item.masrafYeri || ""
                        });

                    });

                    // 3. Vergi kalemi (partner varsa ve vergi kodu doluysa)
                    if ((draft.satici || draft.musteri) && draft.items?.[0]?.vergi) {
                        const gl = draft.items[0];
                        const taxRate = TAX_RATES[gl.vergi] || 0;
                        const taxAmount = Math.abs(Number(gl.tutar)) * taxRate;
                        const isCreditor = !!draft.satici;

                        displayItems.push({
                            ba: isCreditor ? "S" : "H",
                            anaHesap: gl.vergi.startsWith("A") ? "1910000001" : "3910000001",
                            tutar: this._formatAmount(isCreditor ? taxAmount : -taxAmount),
                            tayin: "",
                            aciklama: isCreditor ? this._i18n("inputVAT") : this._i18n("outputVAT"),
                            vergi: gl.vergi,
                            karMerkezi: "",
                            masrafYeri: ""
                        });
                    }

                    return { ...draft, displayItems };
                });

                this.getView().setModel(
                    new sap.ui.model.json.JSONModel({ list: aDraftsWithDisplay }),
                    "drafts"
                );

                this._oDraftDialog.open();

            } catch (e) {
                sap.m.MessageToast.show("Error: " + e.message);
            }
        },

        onCloseDraftDialog: function () {
            // const oDialog = this.byId("draftDialog");
            const oDialog = this._oDraftDialog;
            if (oDialog) {
                oDialog.close();
            }
        },


        // onDraftSelect: function (oEvent) {
        //     const oItem = oEvent.getParameter("listItem");
        //     if (!oItem) return;

        //     const oDraft = oItem.getBindingContext("drafts").getObject();
        //     const oViewModel = this.getView().getModel("view");

        //     // Header
        //     oViewModel.setData({
        //         belgeTuru: oDraft.belgeTuru,
        //         sirketKodu: oDraft.sirketKodu,
        //         satici: oDraft.satici,
        //         musteri: oDraft.musteri,
        //         faturaTarihi: oDraft.faturaTarihi,
        //         kayitTarihi: oDraft.kayitTarihi,
        //         faturalamaParaBirimi: oDraft.faturalamaParaBirimi,
        //         tutar: oDraft.tutar,
        //         belgeBaslikMetni: oDraft.belgeBaslikMetni,
        //         referans: oDraft.referans,
        //         ba: oDraft.ba,
        //         items: JSON.parse(JSON.stringify(oDraft.items))
        //     });

        //     // this.byId("draftDialog").close();
        //     this._oDraftDialog.close();
        // },

        onDraftSelect: function (oEvent) {
            const oDraft = oEvent.getSource()
                .getBindingContext("drafts").getObject();

            if (!oDraft) return;

            const oViewModel = this.getView().getModel("view");

            oViewModel.setData({
                editingFxId: null,
                belgeTuru: oDraft.belgeTuru,
                sirketKodu: oDraft.sirketKodu,
                satici: oDraft.satici,
                musteri: oDraft.musteri,
                faturaTarihi: oDraft.faturaTarihi,
                kayitTarihi: oDraft.kayitTarihi,
                faturalamaParaBirimi: oDraft.faturalamaParaBirimi,
                tutar: oDraft.tutar,
                belgeBaslikMetni: oDraft.belgeBaslikMetni,
                referans: oDraft.referans,
                ba: oDraft.ba,
                items: JSON.parse(JSON.stringify(oDraft.items))
            });

            this._oDraftDialog.close();
            MessageToast.show(this._i18n("msgDraftLoaded"));
        },

        onDraftEdit: function (oEvent) {
            const oDraft = oEvent.getSource()
                .getBindingContext("drafts").getObject();
            const oViewModel = this.getView().getModel("view");

            // Formu doldur
            oViewModel.setData({
                editingFxId: oDraft.fx_id,
                belgeTuru: oDraft.belgeTuru,
                sirketKodu: oDraft.sirketKodu,
                satici: oDraft.satici,
                musteri: oDraft.musteri,
                faturaTarihi: oDraft.faturaTarihi,
                kayitTarihi: oDraft.kayitTarihi,
                faturalamaParaBirimi: oDraft.faturalamaParaBirimi,
                tutar: oDraft.tutar,
                belgeBaslikMetni: oDraft.belgeBaslikMetni,
                referans: oDraft.referans,
                ba: oDraft.ba,
                items: JSON.parse(JSON.stringify(oDraft.items))
            });

            // oViewModel.setProperty("/editingFxId", null);
            // this._editingFxId = oDraft.fx_id;  // fx_id'yi sakla — güncelleme için

            this._oDraftDialog.close();
            MessageToast.show(this._i18n("msgEditMode"));
        },

        onDraftDelete: async function (oEvent) {
            const oDraft = oEvent.getSource()
                .getBindingContext("drafts").getObject();

            sap.m.MessageBox.confirm(
                // `"${oDraft.referans}" ${this._i18n("confirmDeleteDraft")}`,
                this.getView().getModel("i18n").getResourceBundle().getText(
                    "confirmDeleteDraft", [oDraft.referans]
                ),
                {
                    title: this._i18n("confirmDeleteTitle"),
                    onClose: async (sAction) => {
                        if (sAction !== sap.m.MessageBox.Action.OK) return;

                        try {
                            const oModel = this.getView().getModel();
                            await oModel.bindContext("/deleteDraft(...)")
                                .setParameter("fx_id", oDraft.fx_id)
                                .execute();

                            MessageToast.show(this._i18n("msgDraftDeleted"));
                            this._oDraftDialog.close();

                        } catch (e) {
                            sap.m.MessageBox.error("Draft could not be deleted: " + e.message);
                        }
                    }
                }
            );
        },

        onUpdateDraft: async function () {
            const editingFxId = this.getView().getModel("view").getProperty("/editingFxId");
            if (!editingFxId) {
                sap.m.MessageBox.warning("No draft selected for editing.");
                return;
            }

            const oData = this.getView().getModel("view").getData();
            const parseTurkishAmount = (value) => {
                if (!value) return 0;
                if (typeof value === "string") value = value.replace(/\./g, "").replace(",", ".");
                return parseFloat(value) || 0;
            };

            const inputParam = {
                fx_id: editingFxId,
                header: {
                    belgeTuru: oData.belgeTuru,
                    sirketKodu: oData.sirketKodu,
                    musteri: oData.musteri || "",
                    satici: oData.satici || "",
                    faturaTarihi: oData.faturaTarihi,
                    kayitTarihi: oData.kayitTarihi,
                    cariAciklama: oData.cariAciklama || "",
                    faturalamaParaBirimi: oData.faturalamaParaBirimi,
                    tutar: parseTurkishAmount(oData.tutar),
                    belgeBaslikMetni: oData.belgeBaslikMetni || "",
                    referans: oData.referans || "",
                    ba: oData.ba || ""
                },
                items: oData.items.map(i => ({
                    item_id: i.item_id || "",
                    ba: (i.ba).toUpperCase(),
                    anaHesap: i.anaHesap,
                    tutar: parseTurkishAmount(i.tutar),
                    aciklama: i.aciklama || "",
                    vergi: i.vergi || "",
                    karMerkezi: i.karMerkezi || "",
                    masrafYeri: i.masrafYeri || ""
                }))
            };

            try {
                sap.ui.core.BusyIndicator.show(0);
                await this.getView().getModel()
                    .bindContext("/updateDraft(...)")
                    .setParameter("input", inputParam)
                    .execute();

                sap.ui.core.BusyIndicator.hide();
                // this._editingFxId = null;
                this.getView().getModel("view").setProperty("/editingFxId", null);
                MessageToast.show(this._i18n("msgDraftUpdated"));

            } catch (e) {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.error("Update error: " + e.message);
            }
        },

        onCancelEdit: function () {
            this.getView().getModel("view").setData(this._getEmptyData());
            MessageToast.show(this._i18n("msgCancelEdit"));
        },

    });
});