public with sharing class AccountHelper {
    
 @AuraEnabled(cacheable=true)
  public static List<Account> getAccounts() {
    return [SELECT Id, Name, Owner.Name, Website, Phone, AnnualRevenue 
                FROM Account WHERE Industry='Financial Services' ORDER BY Name asc LIMIT 20];
  }
}