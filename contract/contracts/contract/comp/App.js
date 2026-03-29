import React, { useState } from 'react';
import Header from './Header';
import { connectWallet } from './freighter';
import { createInvoice } from './soroban';
import { getInvoice } from './fetchInvoice';

function App() {
    const [address, setAddress] = useState(null);
    const [invoice, setInvoice] = useState(null);
    const [searchId, setSearchId] = useState("");

    const handleConnect = async () => {
        const addr = await connectWallet();
        setAddress(addr);
    };

    const handleSearch = async () => {
        const data = await getInvoice(searchId);
        setInvoice(data);
    };

    return (
        <div>
            <Header address={address} onConnect={handleConnect} />
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                {!address ? (
                    <h2>Connect your wallet to start invoicing.</h2>
                ) : (
                    <div>
                        <section style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem' }}>
                            <h3>Lookup Invoice</h3>
                            <input type="number" onChange={(e) => setSearchId(e.target.value)} placeholder="ID" />
                            <button onClick={handleSearch}>Fetch</button>
                            {invoice && (
                                <div style={{ marginTop: '1rem' }}>
                                    <p>Description: {invoice.description}</p>
                                    <p>Status: {invoice.status}</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;