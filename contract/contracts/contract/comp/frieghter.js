import { isConnected, getUserInfo, signTransaction, requestAccess, isAllowed } from "@stellar/freighter-api";

export const connectWallet = async () => {
    if (!(await isConnected())) {
        alert("Please install Freighter extension");
        return null;
    }
    if (!(await isAllowed())) {
        await requestAccess();
    }
    const info = await getUserInfo();
    return info.publicKey;
};

export const signWithFreighter = async (xdr, network = "TESTNET") => {
    return await signTransaction(xdr, { network });
};

export const shortenAddress = (addr) => `${addr.slice(0, 5)}...${addr.slice(-4)}`;