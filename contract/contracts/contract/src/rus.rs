#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, symbol_short, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum InvoiceStatus {
    Unpaid,
    Paid,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Invoice {
    pub id: u64,
    pub creator: Address,
    pub client: Address,
    pub amount: i128,
    pub description: String,
    pub status: InvoiceStatus,
}

const INVOICE_COUNT: Symbol = symbol_short!("INV_CNT");

#[contract]
pub struct CryptoInvoiceContract;

#[contractimpl]
impl CryptoInvoiceContract {

    // 1. Create a new invoice
    pub fn create_invoice(env: Env, creator: Address, client: Address, amount: i128, description: String) -> u64 {
        creator.require_auth();

        let mut count: u64 = env.storage().instance().get(&INVOICE_COUNT).unwrap_or(0);
        count += 1;

        let invoice = Invoice {
            id: count,
            creator: creator.clone(),
            client,
            amount,
            description,
            status: InvoiceStatus::Unpaid,
        };

        env.storage().instance().set(&count, &invoice);
        env.storage().instance().set(&INVOICE_COUNT, &count);
        
        count
    }

    // 2. Pay an existing invoice
    pub fn pay_invoice(env: Env, client: Address, invoice_id: u64, token_address: Address) {
        client.require_auth();

        let mut invoice: Invoice = env.storage().instance().get(&invoice_id).expect("Invoice not found");
        
        if invoice.status != InvoiceStatus::Unpaid {
            panic!("Invoice is not payable");
        }
        if client != invoice.client {
            panic!("Only the designated client can pay this invoice");
        }

        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&client, &invoice.creator, &invoice.amount);

        invoice.status = InvoiceStatus::Paid;
        env.storage().instance().set(&invoice_id, &invoice);
    }

    // 3. View invoice details
    pub fn get_invoice(env: Env, invoice_id: u64) -> Invoice {
        env.storage().instance().get(&invoice_id).expect("Invoice not found")
    }

    // 4. Cancel an invoice (Creator only)
    pub fn cancel_invoice(env: Env, creator: Address, invoice_id: u64) {
        creator.require_auth();
        let mut invoice: Invoice = env.storage().instance().get(&invoice_id).expect("Invoice not found");
        
        if invoice.creator != creator {
            panic!("Unauthorized");
        }
        
        invoice.status = InvoiceStatus::Cancelled;
        env.storage().instance().set(&invoice_id, &invoice);
    }
}