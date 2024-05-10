import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Accounts,
  ChainIds,
  IAElfChain,
  IPortkeyProvider,
  MethodsBase,
  MethodsWallet,
  NetworkType,
  NotificationEvents,
  ProviderErrorType,
} from '@portkey/provider-types';
import detectProvider from '@portkey/detect-provider';
import { IContract } from '@portkey/types';
import { Actions, State, useExampleState } from './hooks';
import './index.css';
import { scheme, sigObjToStr, aelf } from '@portkey/utils';
import { createManagerForwardCall, getTxResult } from '@portkey/contracts';
import AElf from 'aelf-sdk';
import elliptic from 'elliptic';
const ec = new elliptic.ec('secp256k1');

const TokenContractAddressMap = {
  AELF: 'JRmBduh4nXWi1aXgdUsj5gJrzeZb2LxmrAbf7W99faZSvoAaE',
  tDVV: '7RzVGiuVWkvL4VfVHdZfQF2Tri3sgLe9U991bohHFfSRZXuGX',
  tDVW: 'ASh2Wt7nSEmYqnGxPPzp4pnVDU4uhj1XW9Se5VeZcX2UDdyjx',
};

function App() {
  const [provider, setProvider] = useState<IPortkeyProvider>();
  const [state, dispatch] = useExampleState();

  const setState = useCallback((payload: State, actions: Actions = Actions.setState) => {
    dispatch({ type: actions, payload });
  }, []);

  const [chain, setChain] = useState<IAElfChain>();
  const [tokenContract, setTokenContract] = useState<IContract>();

  const connectEagerly = useCallback(async () => {
    const accounts = await provider.request({ method: MethodsBase.ACCOUNTS });
    setState({ accounts });
  }, [provider]);

  const initProvider = useCallback(async () => {
    try {
      setProvider(await detectProvider());
    } catch (error) {
      console.log(error, '=====error');
    }
  }, []);
  const accountsChanged = (accounts: Accounts) => {
    setState({ accounts });
  };
  const chainChanged = (chainIds: ChainIds) => {
    setState({ chainIds });
  };
  const networkChanged = async (networkType: NetworkType) => {
    setState({ network: networkType });
    const _chain = await provider.getChain('AELF');
    setChain(_chain);
  };
  const connected = async (connectInfo: NetworkType) => {
    const result = await provider.request({
      method: MethodsBase.ACCOUNTS,
    });
    setState({ accounts: result });
  };
  const disconnected = (error: ProviderErrorType) => {
    console.log(error, '=====disconnected');
    connectEagerly();
  };
  const initListener = () => {
    provider.on(NotificationEvents.ACCOUNTS_CHANGED, accountsChanged);
    provider.on(NotificationEvents.CHAIN_CHANGED, chainChanged);
    provider.on(NotificationEvents.NETWORK_CHANGED, networkChanged);
    provider.on(NotificationEvents.CONNECTED, connected);
    provider.on(NotificationEvents.DISCONNECTED, disconnected);
  };
  const removeListener = () => {
    provider.removeListener(NotificationEvents.ACCOUNTS_CHANGED, accountsChanged);
    provider.removeListener(NotificationEvents.CHAIN_CHANGED, chainChanged);
    provider.removeListener(NotificationEvents.NETWORK_CHANGED, networkChanged);
    provider.removeListener(NotificationEvents.CONNECTED, connected);
    provider.removeListener(NotificationEvents.DISCONNECTED, disconnected);
  };
  useEffect(() => {
    if (!provider) return;
    initListener();
    connectEagerly();
    return () => {
      removeListener();
    };
  }, [provider]);
  return (
    <div>
      {Object.entries(state).map(([key, value]) => {
        return (
          <p key={key}>
            <a>{key}</a>
            <br />
            {JSON.stringify(value)}
          </p>
        );
      })}
      <button onClick={initProvider}>init provider</button>
      <button
        onClick={async () => {
          alert(provider.isConnected());
        }}>
        isConnected
      </button>
      <button
        onClick={async () => {
          try {
            const _chainId = 'AELF';
            const _chain = await provider.getChain(_chainId);
            setChain(_chain);
            setTokenContract(_chain.getContract(TokenContractAddressMap[_chainId]));
          } catch (error) {
            console.log(error, '=====getChain');
          }
        }}>
        getChain
      </button>
      <button
        onClick={async () => {
          try {
            const _chain = await provider.getChain('tDVV');
            setChain(_chain);
          } catch (error) {
            alert(error.message);
          }
        }}>
        getChain Error
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
            const balance = await tokenContract.callSendMethod('Transfer', '', {
              symbol: 'ELF',
              to: 'LSWoBaeoXRp9QW75mCVJgNP4YurGi2oEJDYu3iAxtDH8R6UGy',
              amount: 1,
            });
            console.log(balance, '=====balance');
          } catch (error) {
            alert(error.message);
          }
        }}>
        Transfer
      </button>
      <button
        onClick={async () => {
          try {
            const sin = await provider.request({
              method: MethodsWallet.GET_WALLET_SIGNATURE,
              payload: { data: Date.now().toString() },
            });
            console.log(sin, '=======sin');
          } catch (error) {
            alert(error.message);
          }
        }}>
        GET_WALLET_SIGNATURE
      </button>
      <button
        onClick={async () => {
          const data = `Welcome to provider example!
Please make sure you understand the effect of this signature.

timestamp:
${Date.now()}`;

          const hexData = Buffer.from(data).toString('hex');
          try {
            const sin = await provider.request({
              method: MethodsWallet.GET_WALLET_TRANSACTION_SIGNATURE,
              payload: { hexData },
            });
            const publicKey = ec.recoverPubKey(
              Buffer.from(AElf.utils.sha256(Buffer.from(hexData, 'hex')), 'hex'),
              sin,
              sin.recoveryParam,
            );
            const pubKey = ec.keyFromPublic(publicKey).getPublic('hex');
            const recoverManagerAddress = AElf.wallet.getAddressFromPubKey(publicKey);

            const managerAddress = await provider.request({
              method: MethodsWallet.GET_WALLET_CURRENT_MANAGER_ADDRESS,
            });
            console.log(
              pubKey,
              recoverManagerAddress,
              managerAddress,
              managerAddress === recoverManagerAddress,
              '======pubKey',
            );
          } catch (error) {
            alert(error.message);
          }
        }}>
        GET_WALLET_TRANSACTION_SIGNATURE
      </button>
      <button
        onClick={async () => {
          try {
            const ManagerForwardCall = 'ManagerForwardCall';
            const CAContractAddress = '238X6iw1j8YKcHvkDYVtYVbuYk2gJnK8UoNpVCtssynSpVC8hb';
            const rpcUrl = 'https://aelf-test-node.aelf.io';
            const instance = aelf.getAelfInstance(rpcUrl);
            const [managerForwardCall, managerAddress] = await Promise.all([
              createManagerForwardCall({
                instance,
                paramsOption: {
                  contractAddress: 'JRmBduh4nXWi1aXgdUsj5gJrzeZb2LxmrAbf7W99faZSvoAaE',
                  methodName: 'Transfer',
                  args: {
                    to: 'ELF_6Lr5NR3s1AtXTNzh7CVmBJbWLKCVHnWeHeKRYbfQBCYXeWqSf_AELF',
                    symbol: 'ELF',
                    amount: '1',
                  },
                  caHash: '09018c2fbd3ea94c99054cda666d23f1b1f6c90802a8b41c34a275a452f75c44',
                },
                caContractAddress: CAContractAddress,
              }),
              provider.request({
                method: MethodsWallet.GET_WALLET_CURRENT_MANAGER_ADDRESS,
              }),
            ]);

            const { BestChainHeight, BestChainHash } = await instance.chain.getChainStatus();

            // Create transaction
            const rawTx = aelf.getRawTx({
              blockHeightInput: BestChainHeight,
              blockHashInput: BestChainHash,
              packedInput: managerForwardCall,
              address: managerAddress,
              contractAddress: CAContractAddress,
              functionName: ManagerForwardCall,
            });
            rawTx.params = Buffer.from(rawTx.params, 'hex');

            const sin = await provider.request({
              method: MethodsWallet.GET_WALLET_TRANSACTION_SIGNATURE,
              payload: { data: aelf.encodeTransaction(rawTx) },
            });

            const transaction = aelf.encodeTransaction({
              ...rawTx,
              signature: Buffer.from(sigObjToStr(sin), 'hex'),
            });

            const send = await instance.chain.sendTransaction(transaction);
            const txResult = await getTxResult(instance, send.TransactionId, -20);
            console.log(txResult, '=====txResult');
          } catch (error) {
            alert(error.message);
            console.log(error, '=====error');
          }
        }}>
        GET_WALLET_TRANSACTION_SIGNATURE Transfer
      </button>
      <button
        onClick={async () => {
          try {
            const network = await provider.request({
              method: MethodsBase.NETWORK,
            });
            setState({ network });
          } catch (error) {
            alert(error.message);
          }
        }}>
        NETWORK
      </button>
      <button
        onClick={async () => {
          try {
            const balance = await tokenContract.callSendMethod(
              'Transfer',
              '',
              {
                symbol: 'ELF',
                to: 'LSWoBaeoXRp9QW75mCVJgNP4YurGi2oEJDYu3iAxtDH8R6UGy',
                amount: 10000 * 10 ** 8,
              },
              { onMethod: 'receipt' },
            );
            console.log(balance, '=====balance');
          } catch (error) {
            alert(error.message);
          }
        }}>
        Transfer receipt
      </button>
      <button
        onClick={async () => {
          try {
            const approveReq = await tokenContract.callSendMethod(
              'Approve',
              '',
              {
                symbol: 'ELF',
                spender: 'LSWoBaeoXRp9QW75mCVJgNP4YurGi2oEJDYu3iAxtDH8R6UGy',
                amount: 10000 * 10 ** 8,
              },
              { onMethod: 'receipt' },
            );
            console.log(approveReq, '=======approveReq');

            alert(JSON.stringify(approveReq));
          } catch (error) {
            console.log(error, '=====error');
            alert(error.message);
          }
        }}>
        Approve receipt
      </button>
      <button
        onClick={async () => {
          try {
            const result = await provider.request({
              method: MethodsBase.REQUEST_ACCOUNTS,
            });
            setState({ accounts: result });
          } catch (error) {
            alert(error.message);
          }
        }}>
        onConnect
      </button>
      <button
        onClick={async () => {
          const result = await provider.request({
            method: MethodsBase.ACCOUNTS,
          });
          setState({ accounts: result });
        }}>
        ACCOUNTS
      </button>
      <button
        onClick={async () => {
          const result = await provider.request({
            method: MethodsBase.CHAIN_ID,
          });
          setState({ chainIds: result });
        }}>
        CHAIN_ID
      </button>
      <button
        onClick={async () => {
          const result = await provider.request({
            method: MethodsBase.CHAINS_INFO,
          });
          setState({ chainsInfo: result });
        }}>
        CHAINS_INFO
      </button>
      <button
        onClick={async () => {
          try {
            const walletName = await provider.request({
              method: MethodsWallet.GET_WALLET_NAME,
            });
            setState({ walletName });
          } catch (error) {
            alert(error.message);
          }
        }}>
        GET_WALLET_NAME
      </button>
      <button
        onClick={async () => {
          try {
            const managerAddress = await provider.request({
              method: MethodsWallet.GET_WALLET_CURRENT_MANAGER_ADDRESS,
            });
            setState({ managerAddress });
          } catch (error) {
            alert(error.message);
          }
        }}>
        GET_WALLET_CURRENT_MANAGER_ADDRESS
      </button>

      <form
        onSubmit={async e => {
          // console.log(e.target[0].value, 'onSubmit==');
          e.preventDefault();
          var formData = new FormData(e.target as any);
          try {
            const syncStatus = await provider.request({
              method: MethodsWallet.GET_WALLET_MANAGER_SYNC_STATUS,
              payload: { chainId: formData.get('chainId') || 'AELF' },
            });
            alert(syncStatus);
          } catch (error) {
            alert(error.message);
          }
        }}>
        <label>
          ChainId:
          <input type="text" name="chainId" />
        </label>
        <button type="submit">GET_WALLET_MANAGER_SYNC_STATUS</button>
      </form>

      <button onClick={removeListener}>removeListener</button>
      <button
        onClick={async () => {
          window.location.href = scheme.formatScheme({
            domain: window.location.host,
            action: 'linkDapp',
            custom: { url: window.location.href },
          });
        }}>
        linkDapp
      </button>
      <button
        onClick={async () => {
          try {
            const result = await provider.request({
              method: MethodsBase.SET_WALLET_CONFIG_OPTIONS,
              payload: { showBatchApproveToken: true },
            });
            console.log('showBatchApproveToken', result);
          } catch (error) {
            alert(error.message);
          }
        }}>
        setAllowBatchApprove
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
