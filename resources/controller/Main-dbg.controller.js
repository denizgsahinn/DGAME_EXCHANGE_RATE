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
        },

        _getEmptyData: function () {
            return {
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

            /* ==========================
               HEADER TEMİZLE
            ========================== */
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

            MessageToast.show("Form temizlendi");
        },

        /* ======================================================= */
        /* X SERVICE POST                                          */
        /* ======================================================= */
        // En eski onPostExchangeRate: function () {
        //     const oModel = this.getView().getModel(); // OData V4
        //     const oViewModel = this.getView().getModel("view");
        //     const oData = oViewModel.getData();

        //     if (!oData.belgeTuru || !oData.sirketKodu) {
        //         MessageBox.error("Belge Türü ve Şirket Kodu zorunludur.");
        //         return;
        //     }

        //     // ✅ Action'a gönderilecek "input" parametresi
        //     const inputParam = {
        //         header: {
        //             belgeTuru: oData.belgeTuru,
        //             sirketKodu: oData.sirketKodu,
        //             satici: oData.satici || "",
        //             musteri: oData.musteri || "",
        //             faturaTarihi: oData.faturaTarihi,
        //             cariAciklama: oData.cariAciklama || "",
        //             kayitTarihi: oData.kayitTarihi,
        //             faturalamaParaBirimi: oData.faturalamaParaBirimi || "TRY",
        //             tutar: parseFloat(oData.tutar) || 0,
        //             belgeBaslikMetni: oData.belgeBaslikMetni || "",
        //             referans: oData.referans || "",
        //             ba: oData.ba || "S"
        //         },
        //         items: (oData.items || []).map(i => ({
        //             ba: i.ba || "S",
        //             anaHesap: i.anaHesap || "",
        //             tutar: parseFloat(i.tutar) || 0,
        //             tayin: i.tayin || "",
        //             aciklama: i.aciklama || "",
        //             vergi: i.vergi || "",
        //             karMerkezi: i.karMerkezi || "",
        //             masrafYeri: i.masrafYeri || ""
        //         }))
        //     };

        //     console.log("📤 Gönderilen payload:", JSON.stringify(inputParam, null, 2));

        //     // ✅ OData V4 action call
        //     const oBinding = oModel.bindContext("/sendToService(...)");

        //     // ✅ CRITICAL: "input" adında tek parametre gönderiyoruz (service.cds'deki tanıma uygun)
        //     oBinding.setParameter("input", inputParam);

        //     oBinding.execute().then(() => {
        //         const oContext = oBinding.getBoundContext();
        //         const oResult = oContext.getObject();

        //         console.log("✅ Backend response:", oResult);

        //         if (oResult && oResult.success) {
        //             MessageBox.success(oResult.message || "Başarıyla gönderildi!");
        //         } else {
        //             MessageBox.error(oResult?.message || "Bir hata oluştu");
        //         }
        //     }).catch((oError) => {
        //         console.error("❌ Action error:", oError);
        //         MessageBox.error("Post sırasında hata: " + (oError.message || "Bilinmeyen hata"));
        //     });
        // },

        // onPostExchangeRate: function () {
        //     const oModel = this.getView().getModel();
        //     const oViewModel = this.getView().getModel("view");
        //     const oData = oViewModel.getData();

        //     // ✅ Detaylı validasyon
        //     if (!oData.belgeTuru || !oData.sirketKodu) {
        //         MessageBox.error("Belge Türü ve Şirket Kodu zorunludur.");
        //         return;
        //     }

        //     if (!oData.faturaTarihi) {
        //         MessageBox.error("Fatura Tarihi zorunludur.");
        //         return;
        //     }

        //     if (!oData.kayitTarihi) {
        //         MessageBox.error("Kayıt Tarihi zorunludur.");
        //         return;
        //     }

        //     if (!oData.items || oData.items.length === 0) {
        //         MessageBox.error("En az 1 kalem girmelisiniz.");
        //         return;
        //     }

        //     // ✅ Tutarları kontrol et
        //     const totalItemAmount = oData.items.reduce((sum, item) => {
        //         return sum + (parseFloat(item.tutar) || 0);
        //     }, 0);

        //     if (totalItemAmount === 0) {
        //         MessageBox.error("Kalem tutarları sıfır olamaz!");
        //         return;
        //     }

        //     // ✅ Header tutarı hesapla (müşteri/satıcı varsa)
        //     const headerAmount = (oData.musteri || oData.satici) ? totalItemAmount : 0;


        //     // ✅ Action payload
        //     const inputParam = {
        //         header: {
        //             belgeTuru: oData.belgeTuru,
        //             sirketKodu: oData.sirketKodu,
        //             satici: oData.satici || null,
        //             musteri: oData.musteri || null,
        //             faturaTarihi: oData.faturaTarihi, // Date object
        //             cariAciklama: oData.cariAciklama || "",
        //             kayitTarihi: oData.kayitTarihi, // Date object
        //             faturalamaParaBirimi: oData.faturalamaParaBirimi || "TRY",
        //             tutar: headerAmount,
        //             belgeBaslikMetni: oData.belgeBaslikMetni || "",
        //             referans: oData.referans || "",
        //             ba: oData.ba || "S"
        //         },
        //         items: oData.items.map(i => {
        //             const tutar = parseFloat(i.tutar) || 0;
        //             if (tutar === 0) {
        //                 throw new Error("Kalem tutarı 0 olamaz!");
        //             }
        //             return {
        //                 ba: i.ba || "S",
        //                 anaHesap: i.anaHesap || "",
        //                 tutar: tutar,
        //                 tayin: i.tayin || "",
        //                 aciklama: i.aciklama || "",
        //                 vergi: i.vergi || "",
        //                 karMerkezi: i.karMerkezi || "",
        //                 masrafYeri: i.masrafYeri || ""
        //             };
        //         })
        //     };

        //     console.log("📤 Gönderilen payload:", JSON.stringify(inputParam, null, 2));

        //     // ✅ Kullanıcıya onay sor
        //     MessageBox.confirm(
        //         `${inputParam.items.length} kalem, toplam ${totalItemAmount.toFixed(2)} TRY tutarında belge gönderilecek. Onaylıyor musunuz?`,
        //         {
        //             title: "Belge Gönderimi",
        //             onClose: (sAction) => {
        //                 if (sAction !== MessageBox.Action.OK) {
        //                     return;
        //                 }

        //                 // ✅ OData V4 action call
        //                 const oBinding = oModel.bindContext("/sendToService(...)");
        //                 oBinding.setParameter("input", inputParam);

        //                 // ✅ Busy indicator
        //                 sap.ui.core.BusyIndicator.show(0);

        //                 oBinding.execute().then(() => {
        //                     sap.ui.core.BusyIndicator.hide();

        //                     const oContext = oBinding.getBoundContext();
        //                     const oResult = oContext.getObject();

        //                     console.log("✅ Backend response:", oResult);

        //                     if (oResult && oResult.success) {
        //                         MessageBox.success(oResult.message || "Başarıyla gönderildi!");
        //                         // TODO: Formu temizle veya yeni sayfaya yönlendir
        //                     } else {
        //                         MessageBox.error(oResult?.message || "Bir hata oluştu");
        //                     }
        //                 }).catch((oError) => {
        //                     sap.ui.core.BusyIndicator.hide();
        //                     console.error("❌ Action error:", oError);

        //                     let errorMsg = "Post sırasında hata oluştu";
        //                     if (oError.message) {
        //                         errorMsg += ": " + oError.message;
        //                     }

        //                     MessageBox.error(errorMsg);
        //                 });
        //             }
        //         }
        //     );
        // },

        onPostExchangeRate: function () {
            const oModel = this.getView().getModel();
            const oViewModel = this.getView().getModel("view");
            const oData = oViewModel.getData();

            // ---------------- VALIDATION (header) ----------------
            if (!oData.belgeTuru || !oData.sirketKodu) {
                sap.m.MessageBox.error("Belge Türü ve Şirket Kodu zorunludur.");
                return;
            }
            if (!oData.faturaTarihi || !oData.kayitTarihi) {
                sap.m.MessageBox.error("Fatura ve Kayıt Tarihi zorunludur.");
                return;
            }

            // Kur farkı için: Transaction Currency TRY olamaz
            if (!oData.faturalamaParaBirimi) {
                sap.m.MessageBox.error("İşlem para birimi zorunludur (USD/EUR/GBP).");
                return;
            }
            if (oData.faturalamaParaBirimi === "TRY") {
                sap.m.MessageBox.error("Kur farkı kaydı için işlem para birimi TRY olamaz. USD/EUR/GBP seçin.");
                return;
            }

            if (!oData.items || oData.items.length === 0) {
                sap.m.MessageBox.error("En az 1 kalem girmelisiniz.");
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
                // Customer veya Supplier varsa tek GL item olacak
                if (oData.items.length !== 1) {
                    sap.m.MessageBox.error("Müşteri/Satıcı seçiliyse sadece 1 GL kalemi girilmelidir.");
                    return;
                }
            } else {
                // Partner yoksa 2 GL olmalı
                if (oData.items.length !== 2) {
                    sap.m.MessageBox.error("Müşteri ve Satıcı boşsa 2 GL kalemi girilmelidir (biri S biri H).");
                    return;
                }
                const ba1 = (oData.items[0].ba || "").toUpperCase();
                const ba2 = (oData.items[1].ba || "").toUpperCase();
                const ok = (ba1 === "S" && ba2 === "H") || (ba1 === "H" && ba2 === "S");
                if (!ok) {
                    sap.m.MessageBox.error("2 GL kalem senaryosunda bir kalem S, diğeri H olmalıdır.");
                    return;
                }
            }

            // Amount validation: 0 olamaz (kur farkı tutarı dahil)
            for (const it of oData.items) {
                const amt = parseTurkishAmount(it.tutar);
                if (!amt || amt === 0) {
                    sap.m.MessageBox.error("Kalem tutarı 0 olamaz.");
                    return;
                }
            }

            // ---------------- PAYLOAD ----------------
            const inputParam = {
                header: {
                    belgeTuru: oData.belgeTuru,
                    sirketKodu: oData.sirketKodu,
                    musteri: oData.musteri || null,
                    satici: oData.satici || null,
                    faturaTarihi: oData.faturaTarihi,
                    kayitTarihi: oData.kayitTarihi,
                    cariAciklama: oData.cariAciklama || "",
                    faturalamaParaBirimi: oData.faturalamaParaBirimi, // ✅ USD/EUR/GBP
                    referans: oData.referans || ""
                },
                items: oData.items.map(i => ({
                    ba: (i.ba || "H").toUpperCase(), // "S" / "H"
                    anaHesap: i.anaHesap,
                    tutar: parseTurkishAmount(i.tutar),
                    aciklama: i.aciklama || "",
                    vergi: i.vergi || "",            // taxcode
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
                // .then(() => {
                //     sap.ui.core.BusyIndicator.hide();
                //     sap.m.MessageBox.success("Belge başarıyla gönderildi");
                // })
                .then(() => {

                    sap.ui.core.BusyIndicator.hide(); // 👈 KAPAT
                    const oContext = oBinding.getBoundContext();
                    const oResult = oContext.getObject();

                    const sDocNo = oResult?.accountingDocument;

                    const isValidDocument =
                        sDocNo &&
                        sDocNo !== "0000000000";

                    if (oResult?.success && isValidDocument) {

                        // ✅ GERÇEK BAŞARI
                        sap.m.MessageBox.success(
                            `📄 Muhasebe Belgesi Oluşturuldu\n\nBelge No: ${sDocNo}`,
                            {
                                title: "Başarılı",
                                actions: [sap.m.MessageBox.Action.OK]
                            }
                        );

                    } else {

                        // ❌ BAŞARISIZ (dummy belge no veya success=false)
                        sap.m.MessageBox.error(
                            "Muhasebe belgesi oluşturulamadı.\n\n" +
                            "Kur farkı belgesi FI tarafında oluşmadı.\n" +
                            "Lütfen işlem detaylarını kontrol ediniz.",
                            {
                                title: "Başarısız"
                            }
                        );
                    }

                    // if (oResult?.success) {
                    //     sap.m.MessageBox.success(
                    //         `📄 Muhasebe Belgesi Oluşturuldu\n\nBelge No: ${oResult.accountingDocument}`,
                    //         {
                    //             title: "Başarılı",
                    //             actions: [sap.m.MessageBox.Action.OK]
                    //         }
                    //     );
                    // } else {
                    //     sap.m.MessageBox.error(oResult?.message || "Bilinmeyen hata");
                    // }
                })

            // .catch(err => {
            //     sap.ui.core.BusyIndicator.hide();
            //     console.error(err);
            //     sap.m.MessageBox.error("Gönderim sırasında hata oluştu");
            // });
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
            // this._vhConfig = { sKeyField, sTargetPath };

            this._vhConfig = {
                sKeyField,
                sTargetPath,
                isItem: !!this._vhContextPath // 👈 kalem mi header mı
            };

            if (!this._oVHDialog) {
                this._oVHDialog = await Fragment.load({
                    name: "com.exchangerate.exchangerateui.fragment.ValueHelp",
                    controller: this
                });
                this.getView().addDependent(this._oVHDialog);
            }

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

            let aResults;

            // 🔀 ENTITY BAZLI TEXT KARARI
            if (sEntity === "CostCenters") {
                aResults = aContexts.map(c => ({
                    key: c.getProperty("CostCenter"),
                    text: `${c.getProperty("CostCenter")} - ${c.getProperty("CostCenterName")}`
                }));
            }

            else if (sEntity === "Customers") {
                aResults = aContexts.map(c => ({
                    key: c.getProperty("Customer"),
                    text: `${c.getProperty("Customer")} - ${c.getProperty("CustomerFullName") || ""}`
                }));
            } else {
                aResults = aContexts.map(c => ({
                    key: c.getProperty(sKeyField),
                    text: c.getProperty(sKeyField)
                }));
            }
            // const aResults = aContexts.map(c => ({
            //     key: c.getProperty(sKeyField),
            //     text: c.getProperty(sKeyField)
            // }));



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

        // onValueHelpConfirm: function (oEvent) {
        //     const oItem = oEvent.getParameter("selectedItem");
        //     if (!oItem) return;

        //     const sKey = oItem.getBindingContext("vh").getProperty("key");
        //     this.getView()
        //         .getModel("view")
        //         .setProperty(this._vhConfig.sTargetPath, sKey);

        //     this._oVHDialog().close();
        // },

        onValueHelpConfirm: function (oEvent) {
            const oItem = oEvent.getParameter("selectedItem");
            if (!oItem) return;

            const sKey = oItem.getBindingContext("vh").getProperty("key");
            const oViewModel = this.getView().getModel("view");

            let sFinalPath;

            // 🧠 HEADER vs ITEM AYRIMI
            if (this._vhContextPath) {
                // Örn: /items/0 + /anaHesap
                sFinalPath = this._vhContextPath + this._vhConfig.sTargetPath;
            } else {
                // Örn: /satici
                sFinalPath = this._vhConfig.sTargetPath;
            }

            console.log("VH write path:", sFinalPath);

            const sOldCompanyCode = oViewModel.getProperty("/sirketKodu");

            oViewModel.setProperty(sFinalPath, sKey);

            if (
                sFinalPath === "/sirketKodu" &&
                sOldCompanyCode &&
                sOldCompanyCode !== sKey
            ) {
                oViewModel.setProperty("/satici", "");
                oViewModel.setProperty("/musteri", "");
                this._clearAllItemProfitCenters();
            }

            // cleanup
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
                MessageBox.warning("Önce Şirket Kodu seçmelisiniz.");
                return;
            }
            console.log("sCompanyCode: ", sCompanyCode);

            this._openValueHelp(
                "Suppliers",
                "Supplier",
                // "SupplierName",
                "/satici",
                {
                    companyCode: sCompanyCode
                }
            );

        },

        onCustomerVH: function () {

            const sCompanyCode = this.getView()
                .getModel("view")
                .getProperty("/sirketKodu");

            if (!sCompanyCode) {
                MessageBox.warning("Önce Şirket Kodu seçmelisiniz.");
                return;
            }

            this._openValueHelp(
                "Customers",
                "Customer",
                "/musteri",
                { companyCode: sCompanyCode }
            );
        },

        onDocumentTypesVH: function () {
            this._openValueHelp("DocumentTypes", "code", "/belgeTuru");
        },

        onCurrencyVH: function () {
            this._openValueHelp("Currencies", "code", "/faturalamaParaBirimi");
        },

        onCompanyCodeVH: function () {
            this._openValueHelp("CompanyCodes", "code", "/sirketKodu");
        },

        onBAValuesVH: function () {
            this._openValueHelp("BAValues", "code", "/ba");
        },

        onGLAccountsVH: function (oEvent) {
            const oSource = oEvent.getSource();
            const oCtx = oSource.getBindingContext("view"); // 👈 hangi satır

            this._vhContextPath = oCtx.getPath(); // "/items/0"

            this._openValueHelp(
                "GLAccounts",
                "code",
                "/anaHesap"   // 👈 SADECE field adı
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

            // hangi kalem satırı
            this._vhContextPath = oCtx.getPath(); // "/items/0"

            this._openValueHelp(
                "CostCenters",
                "CostCenter",
                "/masrafYeri"
            );
        },

        onProfitCenterVH: function (oEvent) {

            const sCompanyCode = this.getView()
                .getModel("view")
                .getProperty("/sirketKodu");

            if (!sCompanyCode) {
                MessageBox.warning("Önce Şirket Kodu seçmelisiniz.");
                return;
            }

            const oCtx = oEvent.getSource().getBindingContext("view");
            this._vhContextPath = oCtx.getPath(); // /items/0

            this._openValueHelp(
                "ProfitCenters",
                "ProfitCenter",
                "/karMerkezi",
                { companyCode: sCompanyCode }
            );
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

        // -----------------------------   DRAFT  --------------------------------

        // onSaveDraft: function () {
        //     const oViewModel = this.getView().getModel("view");
        //     const oRAPModel = this.getView().getModel("fxRAP");

        //     const d = oViewModel.getData();

        //     const oPayload = {
        //         document_type: d.belgeTuru,
        //         company_code: d.sirketKodu,
        //         vendor: d.satici || "",
        //         customer: d.musteri || "",
        //         invoice_date: d.faturaTarihi,
        //         posting_date: d.kayitTarihi,
        //         bp_description: d.cariAciklama || "",
        //         document_currency: d.faturalamaParaBirimi,
        //         total_amount: parseFloat(d.tutar) || 0,
        //         header_text: d.belgeBaslikMetni || "",
        //         reference: d.referans || "",
        //         debit_credit_indicator: d.ba || "S",

        //         _Items: d.items.map(i => ({
        //             debit_credit_indicator: i.ba || "H",
        //             gl_account: i.anaHesap,
        //             document_currency: d.faturalamaParaBirimi,
        //             amount: parseFloat(i.tutar) || 0,
        //             assignment: i.tayin || "",
        //             item_text: i.aciklama || "",
        //             tax_code: i.vergi || "",
        //             profit_center: i.karMerkezi || "",
        //             cost_center: i.masrafYeri || ""
        //         }))
        //     };

        //     console.log("📤 RAP Draft Payload:", oPayload);

        //     // ✅ OData V4: ListBinding
        //     const oListBinding = oRAPModel.bindList("/ZI_FX_HEADER");

        //     sap.ui.core.BusyIndicator.show(0);

        //     const oContext = oListBinding.create(oPayload);

        //     oContext.created()
        //         .then(() => {
        //             sap.ui.core.BusyIndicator.hide();
        //             sap.m.MessageBox.success("Taslak başarıyla kaydedildi");
        //             console.log("✅ Draft context:", oContext.getObject());
        //         })
        //         .catch(err => {
        //             sap.ui.core.BusyIndicator.hide();
        //             console.error(err);
        //             sap.m.MessageBox.error("Taslak kaydedilemedi");
        //         });
        // },

        onSaveDraft: function () {

            const oModel = this.getView().getModel();
            const oData = this.getView().getModel("view").getData();

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
                .then(() => sap.m.MessageToast.show("Draft kaydedildi"))
                .catch(() => sap.m.MessageBox.error("Draft kaydedilemedi"));
        },

        _getMockDrafts: function () {
            return [
                {
                    fx_id: "DRAFT-001",
                    belgeTuru: "DZ",
                    sirketKodu: "1000",
                    musteri: "1000205",
                    satici: "",
                    faturaTarihi: "2024-12-09",
                    kayitTarihi: "2024-12-09",
                    faturalamaParaBirimi: "USD",
                    tutar: "0.00",
                    belgeBaslikMetni: "Kur Farkı Deneme",
                    referans: "DenemeRef-1",
                    ba: "",
                    items: [
                        {
                            ba: "H",
                            anaHesap: "6560000001",
                            tutar: 1000,
                            tayin: "",
                            aciklama: "Kur farkı Deneme",
                            vergi: "A1",
                            karMerkezi: "RK",
                            masrafYeri: ""
                        }
                    ]
                },
                {
                    fx_id: "DRAFT-002",
                    belgeTuru: "KF",
                    sirketKodu: "2000",
                    musteri: "",
                    satici: "",
                    faturaTarihi: "2024-12-10",
                    kayitTarihi: "2024-12-10",
                    faturalamaParaBirimi: "EUR",
                    tutar: 2200,
                    belgeBaslikMetni: "Kur Farkı 2",
                    referans: "REF-002",
                    ba: "A",
                    items: [
                        {
                            ba: "S",
                            anaHesap: "6560000001",
                            tutar: 1100,
                            tayin: "",
                            aciklama: "Kur farkı S",
                            vergi: "V0",
                            karMerkezi: "",
                            masrafYeri: ""
                        },
                        {
                            ba: "H",
                            anaHesap: "6460000001",
                            tutar: 1100,
                            tayin: "",
                            aciklama: "Kur farkı H",
                            vergi: "V0",
                            karMerkezi: "",
                            masrafYeri: ""
                        }
                    ]
                }
            ];
        },

        // onShowDrafts: async function () {

        //     if (!this._oDraftDialog) {
        //         this._oDraftDialog = await Fragment.load({
        //             id: this.getView().getId(),   // 🔴 KRİTİK SATIR
        //             name: "com.exchangerate.exchangerateui.fragment.DraftList",
        //             controller: this
        //         });
        //         this.getView().addDependent(this._oDraftDialog);
        //     }

        //     const aDrafts = this._getMockDrafts();

        //     this.getView().setModel(
        //         new sap.ui.model.json.JSONModel({ list: aDrafts }),
        //         "drafts"
        //     );

        //     this._oDraftDialog.open();
        // },

        onShowDrafts: async function () {

            if (!this._oDraftDialog) {
                this._oDraftDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.exchangerate.exchangerateui.fragment.DraftList",
                    controller: this
                });
                this.getView().addDependent(this._oDraftDialog);
            }

            const oModel = this.getView().getModel();
            const oCtx = oModel.bindContext("/getDrafts(...)");

            await oCtx.execute();

            const aDrafts = oCtx.getObject();

            this.getView().setModel(
                new sap.ui.model.json.JSONModel({ list: aDrafts }),
                "drafts"
            );

            this._oDraftDialog.open();
        },


        onCloseDraftDialog: function () {
            const oDialog = this.byId("draftDialog");
            if (oDialog) {
                oDialog.close();
            }
        },


        onDraftSelect: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            if (!oItem) return;

            const oDraft = oItem.getBindingContext("drafts").getObject();
            const oViewModel = this.getView().getModel("view");

            // Header
            oViewModel.setData({
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

            this.byId("draftDialog").close();
        }


    });
});
