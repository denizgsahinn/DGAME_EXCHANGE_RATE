service API_BUSINESS_PARTNER {

  entity A_SupplierCompany {
    key Supplier     : String(10);
        CompanyCode  : String(4);
        // SupplierName : String(80);
  }

  entity A_CustomerCompany {
    key Customer     : String(10);
        CompanyCode  : String(4);
        CustomerFullName : String(80);
  }

}
