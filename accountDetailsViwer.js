import { LightningElement, wire, track } from 'lwc';
import getAccounts from '@salesforce/apex/AccountHelper.getAccounts';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const columns = [
    { label: 'Account Name', 
        fieldName: 'accountIdForURL', type: 'url',
        typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' },
        sortable: "true"
    },{
        label: 'Account Owner',
        fieldName: 'AccountOwner',
        type: 'text',
        editable: true,
        sortable: "true"
    },{
        label: 'Phone',
        fieldName: 'Phone',
        type: 'phone',
        editable: true,
        sortable: "true"
    },{
        label: 'Website',
        fieldName: 'Website',
        type: 'text',
        editable: true,
        sortable: "true"
    },{
        label: 'Annual Revenue',
        fieldName: 'AnnualRevenue',
        type: 'text',
        editable: true,
        sortable: "true"
    }
];

export default class AccountDetailsViwer extends LightningElement {

    @track columns = columns;
    @track accounts;
    initialRecords;
    @track sortBy;
    @track sortDirection;
    saveDraftValues = [];
 
    @wire(getAccounts)
    AccountData(result) {
        this.accounts = result;
        console.log('account data ', result);
        if(result.data){
            this.accounts.data = result.data.map(acc => {
                const accWithOwner = Object.assign({}, acc); // clone the original record
                accWithOwner.AccountOwner = acc.Owner.Name; // 
                accWithOwner.Name = acc.Name;
                accWithOwner.accountIdForURL = '/' + acc.Id;  //This field will be used for navigation to the account
                return accWithOwner;
            });
            this.initialRecords = this.accounts.data;
        }
        if (result.error) {
            this.accounts = undefined;
        }
    };
 
    handleSave(event) {
        this.saveDraftValues = event.detail.draftValues;
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });
 
        
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.ShowToast('Success', 'Records Updated Successfully!!', 'success', 'dismissable');
            this.saveDraftValues = [];
            return this.refresh();
        }).catch(error => {
            this.ShowToast('Error', 'An Error Occured!!', 'error', 'dismissable');
        }).finally(() => {
            this.saveDraftValues = [];
        });
    }
 
    ShowToast(title, message, variant, mode){
        const evt = new ShowToastEvent({
                title: title,
                message:message,
                variant: variant,
                //mode: mode
            });
            this.dispatchEvent(evt);
    }
 
    
    async refresh() {
        await refreshApex(this.accounts);
    }

    doSorting(event) {
        let fieldName = event.detail.fieldName;
        fieldName = fieldName === 'accountIdForURL' ? 'Name' : fieldName;
        console.log('fieldName',fieldName);

        this.sortBy = fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
        this.sortBy = event.detail.fieldName;
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.accounts.data));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1: -1;
        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.accounts.data = parseData;
    }

    handleSearch( event ) {
        const searchKey = event.target.value.toLowerCase();
        if ( searchKey ) {
            if ( this.accounts.data ) {
                let recs = [];
                for ( let rec of this.accounts.data ) {
                    let valuesArray = Object.values( rec );
                    for ( let val of valuesArray ) {
                        let strVal = String( val );
                        if ( strVal ) {
                            if ( strVal.toLowerCase().includes( searchKey ) ) {
                                recs.push( rec );
                                break;
                            }
                        }
                    } 
                }
                this.accounts.data = recs;
             }
        }  else {
            this.accounts.data = this.initialRecords;
        }        
    }

}