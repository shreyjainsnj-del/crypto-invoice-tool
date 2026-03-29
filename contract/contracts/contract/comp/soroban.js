import { 
    SorobanRpc, 
    TransactionBuilder, 
    Address, 
    xdr, 
    scValToNative, 
    nativeToScVal, 
    TimeoutInfinite 
} from '@stellar/stellar-sdk';
import { signWithFreighter } from './freighter';

// CONFIGURATION
const RPC_URL = "https://soroban-testnet.stellar.org:443";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const CONTRACT_ID = "C...YOUR_CONTRACT_ID_HERE"; 

const server = new SorobanRpc.Server(RPC_URL);

/**
 * Helper to handle the Soroban Transaction Lifecycle:
 * Prepare -> Simulate -> Sign -> Send -> Await Result
 */
async function sendTransaction(sourceAddress, functionName, args) {
    try {
        // 1. Fetch latest ledger info for sequence numbers
        const account = await server.getAccount(sourceAddress);

        // 2. Build the initial transaction
        let tx = new TransactionBuilder(account, { fee: "1000", networkPassphrase: NETWORK_PASSPHRASE })
            .addOperation(
                xdr.Operation.invokeHostFunction({
                    hostFunction: xdr.HostFunction.hostFunctionTypeInvokeContract(
                        new xdr.InvokeContractArgs({
                            contractAddress: Address.fromString(CONTRACT_ID).toScAddress(),
                            functionName: functionName,
                            args: args,
                        })
                    ),
                    auth: [],
                })
            )
            .setTimeout(TimeoutInfinite)
            .build();

        // 3. Simulate the transaction to calculate resource fees (Gas)
        const simulation = await server.simulateTransaction(tx);
        if (SorobanRpc.Api.isSimulationError(simulation)) {
            throw new Error(`Simulation Failed: ${simulation.error}`);
        }

        // 4. Update the transaction with simulated fees and sign with Freighter
        tx = SorobanRpc.assembleTransaction(tx, simulation).build();
        const xdrBase64 = tx.toXDR();
        const signedXdr = await signWithFreighter(xdrBase64);

        if (!signedXdr) throw new Error("User cancelled signing.");

        // 5. Submit to the network
        let response = await server.sendTransaction(signedXdr);
        if (response.status !== "PENDING") {
            throw new Error(`Submission Error: ${JSON.stringify(response)}`);
        }

        // 6. Poll for the final result
        console.log("Transaction pending... awaiting ledger confirmation.");
        let statusResponse = await server.getTransaction(response.hash);
        
        while (statusResponse.status === "NOT_FOUND" || statusResponse.status === "SUCCESS") {
             // Basic polling logic (In production, use a more robust loop)
             if (statusResponse.status === "SUCCESS") break;
             await new Promise(resolve => setTimeout(resolve, 2000));
             statusResponse = await server.getTransaction(response.hash);
        }

        return scValToNative(statusResponse.returnValue);

    } catch (error) {
        console.error(`Contract Call [${functionName}] Failed:`, error);
        throw error;
    }
}

/**
 * EXPORTED FUNCTIONS FOR YOUR UI
 */

// Function to Create a New Invoice
export const createInvoice = async (creatorAddr, clientAddr, amount, description) => {
    const args = [
        Address.fromString(creatorAddr).toScVal(),
        Address.fromString(clientAddr).toScVal(),
        nativeToScVal(amount, { type: 'i128' }),
        nativeToScVal(description, { type: 'string' })
    ];
    return await sendTransaction(creatorAddr, "create_invoice", args);
};

// Function to Pay an Invoice
export const payInvoice = async (clientAddr, invoiceId, tokenAddr) => {
    const args = [
        Address.fromString(clientAddr).toScVal(),
        nativeToScVal(invoiceId, { type: 'u64' }),
        Address.fromString(tokenAddr).toScVal()
    ];
    return await sendTransaction(clientAddr, "pay_invoice", args);
};