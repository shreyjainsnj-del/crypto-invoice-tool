import React from 'react';
import { shortenAddress } from './freighter';

const Header = ({ address, onConnect }) => (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#111', color: '#fff' }}>
        <h1>Crypto Invoice</h1>
        <button onClick={onConnect} style={{ padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
            {address ? shortenAddress(address) : "Connect Wallet"}
        </button>
    </nav>
);

export default Header;