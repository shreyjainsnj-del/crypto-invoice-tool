import { SorobanRpc, Address, xdr, scValToNative } from '@stellar/stellar-sdk';

/**
 * CONFIGURATION
 * Replace CONTRACT_ID with your actual contract ID from the Stellar Laboratory or CLI.
 */
const RPC_URL = "https://soroban-testnet.stellar.org:443";
const CONTRACT_ID = "C...YOUR_CONTRACT_ID_HERE"; 
const server = new SorobanRpc.Server(RPC_URL);

/**
 * Single function to fetch and decode invoice data from the ledger.
 * @param {number} invoiceId - The unique ID of the invoice.
 */
export async function getInvoiceFeedback(invoiceId) {
    try {
        console.log(`Connecting to Soroban RPC to fetch Invoice #${invoiceId}...`);

        // 1. Convert the JavaScript number into a Soroban-compatible U64 XDR value
        const ledgerKey = xdr.ScVal.scvU64(xdr.Uint64.fromString(invoiceId.toString()));

        // 2. Query the "Instance" storage of the contract
        const ledgerResponse = await server.getContractData({
            contractId: CONTRACT_ID,
            key: ledgerKey,
            durability: 'instance',
        });

        if (!ledgerResponse || !ledgerResponse.val) {
            console.warn("No data found for this ID.");
            return { error: "Invoice not found." };
        }

        // 3. Use scValToNative to convert the complex XDR result into a clean JS Object
        // This will automatically handle your 'Invoice' struct fields: 
        // id, creator, client, amount, description, and status.
        const result = scValToNative(ledgerResponse.val);

        console.log("Invoice Data Received:", result);
        
        return {
            id: result.id.toString(),
            creator: result.creator,
            client: result.client,
            amount: result.amount.toString(),
            description: result.description.toString(),
            status: result.status // This will return the Enum name (Unpaid, Paid, etc.)
        };

    } catch (error) {
        console.error("Failed to fetch from blockchain:", error);
        return { error: "Check console for RPC connection issues." };
    }
}