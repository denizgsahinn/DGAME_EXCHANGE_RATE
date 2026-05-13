/**
 * srv/config/constants.js
 * 
 * Tüm destination isimleri ve sabit konfigürasyonlar tek noktadan yönetilir.
 * Handler'larda doğrudan string yazmak yerine buradan import edin.
 */

const DESTINATIONS = {
  /** OData V2/V4 arama yardımı (Supplier, Customer, CostCenter, ProfitCenter) */
  ODATA: "S4H_ODATA_PROD",

  /** SOAP - Journal Entry oluşturma */
  SOAP: "S4H_SOAP_PROD",

  /** OData V4 - Draft kayıt işlemleri (FX Header/Item) */
  DRAFT: "S4H_DRAFT_PROD"
};

const DRAFT_BASE_URL = "/sap/opu/odata4/sap/zui_fx_srv_bind/srvd/sap/zui_fx_srv/0001";

const SOAP_PATH = "/sap/bc/srt/scs_ext/sap/journalentrycreaterequestconfi";

module.exports = { DESTINATIONS, DRAFT_BASE_URL, SOAP_PATH };
