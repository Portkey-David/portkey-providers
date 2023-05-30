import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { IChain, IContract, IWeb3Provider, NotificationEvents, RPCMethodsBase } from '@portkey/provider-types';
import detectProvider from '@portkey/detect-provider';
import './index.css';
function App() {
  const [provider, setProvider] = useState<IWeb3Provider>();
  const [chain, setChain] = useState<IChain>();
  const [tokenContract, setTokenContract] = useState<IContract>();
  return (
    <div>
      <button
        onClick={async () => {
          try {
            console.log(window.portkey, '=window.portkey');
            setProvider(await detectProvider());
          } catch (error) {
            console.log(error, '=====error');
          }
        }}>
        init provider
      </button>
      <button
        onClick={async () => {
          const _chain = provider.getChain('AELF');
          setChain(_chain);
          setTokenContract(_chain.getContract('JRmBduh4nXWi1aXgdUsj5gJrzeZb2LxmrAbf7W99faZSvoAaE'));
        }}>
        getChain
      </button>
      <button
        onClick={async () => {
          try {
            const height = await chain.getBlockHeight();
            console.log(height, '====height');
            alert(height);
          } catch (error) {
            console.log(error, '====error');
          }
        }}>
        getBlockHeight
      </button>
      <button
        onClick={async () => {
          try {
            const balance = await tokenContract.callViewMethod('GetBalance', {
              symbol: 'ELF',
              owner: 'LSWoBaeoXRp9QW75mCVJgNP4YurGi2oEJDYu3iAxtDH8R6UGy',
            });
            console.log(balance, '=====balance');
          } catch (error) {
            console.log(error, '====error');
          }
        }}>
        GetBalance
      </button>

      <button
        onClick={async () => {
          try {
            console.log(tokenContract, '=====tokenContract');

            const balance = await tokenContract.callSendMethod(
              'Transfer',
              '',
              {
                symbol: 'ELF',
                owner: 'LSWoBaeoXRp9QW75mCVJgNP4YurGi2oEJDYu3iAxtDH8R6UGy',
              },
              // { onMethod: 'receipt' },
            );
            console.log(balance, '=====balance');
          } catch (error) {
            console.log(error, '====callSendMethod-error');
          }
        }}>
        callSendMethod
      </button>
      <button
        onClick={async () => {
          // const result = provider.request({ method: 'requestAccounts' });
          const result = await window.portkey.request({
            method: RPCMethodsBase.REQUEST_ACCOUNTS,
            payload: {
              a: 1,
            },
          });
          console.log(result, 'result=====onConnect');
        }}>
        onConnect
      </button>
      <button
        onClick={async () => {
          const result = await provider.request({
            method: RPCMethodsBase.ACCOUNTS,
          });
          console.log(result, 'result=====onConnect');
        }}>
        ACCOUNTS
      </button>
      <button
        onClick={async () => {
          const result = await provider.request({
            method: RPCMethodsBase.CHAIN_ID,
          });
          console.log(result, 'result=====onConnect');
        }}>
        CHAIN_ID
      </button>
    </div>
  );
}
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
