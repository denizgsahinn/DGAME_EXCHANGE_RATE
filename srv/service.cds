// using com.exchangerate as db from '../db/schema';
using {API_BUSINESS_PARTNER} from './external/API_BUSINESS_PARTNER';

service ExchangeRateService @(path: '/exchangerate')@(requires: 'authenticated-user') {

  entity Suppliers as
    projection on API_BUSINESS_PARTNER.A_SupplierCompany {
      key Supplier    : String(10),
      key CompanyCode : String(4)
    };

  entity Customers as
    projection on API_BUSINESS_PARTNER.A_CustomerCompany {
      key Customer         : String(10),
      key CompanyCode      : String(4),
          CustomerFullName : String(80)
    };


  entity CostCenters {
    key CostCenter     : String(10);
        CostCenterName : String(80);
  }

  entity ProfitCenters {
    key ProfitCenter : String(10);
        CompanyCode  : String(4);
  }

  action sendToService(input: PostRequest) returns PostResponse;

  type PostRequest {
    header : HeaderInput;
    items  : many ItemInput;
  };

  type PostResponse {
    success            : Boolean;
    message            : String(255);
    accountingDocument : String(10);
  };

  type HeaderInput {
    belgeTuru            : String(4);
    sirketKodu           : String(4);
    satici               : String(10);
    musteri              : String(10);
    faturaTarihi         : Date;
    cariAciklama         : String(255);
    kayitTarihi          : Date;
    faturalamaParaBirimi : String(5);
    tutar                : Decimal(15, 2);
    belgeBaslikMetni     : String(100);
    referans             : String(30);
    ba                   : String(2);
  };

  type ItemInput {
    item_id    : String;
    ba         : String(2);
    anaHesap   : String(10);
    tutar      : Decimal(15, 2);
    tayin      : String(50);
    aciklama   : String(255);
    vergi      : String(10);
    karMerkezi : String(10);
    masrafYeri : String(10);
  };

  // 🔹 Public Cloud'a DRAFT POST
  action createDraft(input: DraftInput)    returns ActionResult;

  // 🔹 Public Cloud'tan DRAFT GET
  action getDrafts()                       returns many DraftHeader;

  /* ===== TYPES ===== */

  type DraftInput {
    header : DraftHeader;
    items  : many DraftItem;
  }

  type DraftHeader {
    fx_id                : String(20);
    belgeTuru            : String(4);
    sirketKodu           : String(4);
    musteri              : String(10);
    satici               : String(10);
    faturaTarihi         : Date;
    kayitTarihi          : Date;
    cariAciklama         : String(255);
    faturalamaParaBirimi : String(5);
    tutar                : Decimal(15, 2);
    belgeBaslikMetni     : String(100);
    referans             : String(30);
    ba                   : String(2);
    items                : many DraftItem; //  getDrafts için items dahil
  }

  type DraftItem {
    item_id    : String;
    ba         : String(2);
    anaHesap   : String(10);
    tutar      : Decimal(15, 2);
    tayin      : String(50);
    aciklama   : String(255);
    vergi      : String(10);
    karMerkezi : String(10);
    masrafYeri : String(10);
  }

  type ActionResult {
    success : Boolean;
    message : String(255);
  }

  type DeleteInput {
    fx_id : String;
  }

  type UpdateInput {
    fx_id  : String;
    header : HeaderInput;
    items  : array of DraftItem;
  }

  action deleteDraft(fx_id: String)        returns {
    success : Boolean
  };

  action updateDraft(input: UpdateInput)   returns {
    success : Boolean;
    fx_id   : String
  };


}
