import { DappEvents, EventId, NotificationEvents } from './event';
import { IResponseInfo, MethodsBase, MethodsWallet, RequestOption } from './request';
import type { IDappInteractionStream } from './stream';
import { ChainId, IAElfChain, IChain } from './chain';
import {
  Accounts,
  ChainIds,
  ChainsInfo,
  ConnectInfo,
  NetworkType,
  ProviderErrorType,
  Signature,
  Transaction,
  WalletName,
  WalletState,
} from './response';

export interface IProvider {
  /**
   * When the provider is connected to an operator, this event will be triggered.
   * ```
   * provider.on('connect', (connectInfo: ConnectInfo) => {
   *  console.log('current chainIds: ', connectInfo.chainIds);
   * });
   * ```
   */
  on(event: typeof NotificationEvents.CONNECTED, listener: (connectInfo: ConnectInfo) => void): this;
  /**
   * When network changes, this event will be triggered.
   * ```
   * provider.on('networkChanged', (networkType: NetworkType) => {
   * console.log('current networkType is : ', networkType);
   * });
   * ```
   */
  on(event: typeof NotificationEvents.NETWORK_CHANGED, listener: (networkType: NetworkType) => void): this;
  /**
   * When current APP's supported chain changes, this event will be triggered.
   * ```
   * provider.on('chainChanged', (chainIds: ChainIds) => {
   * console.log('current chainIds: ', chainIds);
   * });
   * ```
   */
  on(event: typeof NotificationEvents.CHAIN_CHANGED, listener: (chainIds: ChainIds) => void): this;
  /**
   * If the CA address changes, this event will be triggered.
   * ```
   * provider.on('accountsChanged', (accounts: Accounts) => {
   * alert('current account has changed, please refresh the page.');
   * console.log('current accounts: ', accounts);
   * });
   * ```
   */
  on(event: typeof NotificationEvents.ACCOUNTS_CHANGED, listener: (accounts: Accounts) => void): this;
  /**
   * When error occurs, the provider will be disconnected and this event will be triggered.
   * ```
   * provider.on('disconnect', (error: ProviderErrorType) => {
   * alert('sorry, the provider has been disconnected, please refresh the page.');
   * console.log('facing error: ', error);
   * ```
   */
  on(event: typeof NotificationEvents.DISCONNECTED, listener: (error: ProviderErrorType) => void): this;
  /**
   * Creates a listener on the provider.
   * @param event - event name that the listener will listen to
   * @param listener - callback function
   */
  on(event: DappEvents, listener: (...args: any[]) => void): this;

  /**
   * @override
   * Creates a listener on the provider, the listener will be removed after the first time it is triggered.
   *
   * Also see {@link IProvider.on} for more details.
   *
   * @param event - event name that the listener will listen to
   * @param listener - callback function
   */
  once(event: typeof NotificationEvents.CONNECTED, listener: (connectInfo: ConnectInfo) => void): this;
  once(event: typeof NotificationEvents.NETWORK_CHANGED, listener: (networkType: NetworkType) => void): this;
  once(event: typeof NotificationEvents.CHAIN_CHANGED, listener: (chainIds: ChainIds) => void): this;
  once(event: typeof NotificationEvents.ACCOUNTS_CHANGED, listener: (accounts: Accounts) => void): this;
  once(event: typeof NotificationEvents.DISCONNECTED, listener: (error: ProviderErrorType) => void): this;
  once(event: DappEvents, listener: (...args: any[]) => void): this;

  /**
   * Remove a listener from the provider.
   *
   * Also see {@link IProvider.on} for more details.
   *
   * @param event - event name that the listener used to listen to
   * @param listener - callback function
   */
  removeListener(event: typeof NotificationEvents.CONNECTED, listener: (connectInfo: ConnectInfo) => void): this;
  removeListener(event: typeof NotificationEvents.NETWORK_CHANGED, listener: (networkType: NetworkType) => void): this;
  removeListener(event: typeof NotificationEvents.CHAIN_CHANGED, listener: (chainIds: ChainIds) => void): this;
  removeListener(event: typeof NotificationEvents.ACCOUNTS_CHANGED, listener: (accounts: Accounts) => void): this;
  removeListener(event: typeof NotificationEvents.DISCONNECTED, listener: (error: ProviderErrorType) => void): this;
  removeListener(event: DappEvents, listener: (...args: any[]) => void): this;

  // request
  request<T = Accounts>(params: { method: typeof MethodsBase.ACCOUNTS }): Promise<T>;
  request<T = ChainIds>(params: { method: typeof MethodsBase.CHAIN_ID }): Promise<T>;
  request<T = ChainIds>(params: { method: typeof MethodsBase.CHAIN_IDS }): Promise<T>;
  request<T = ChainsInfo>(params: { method: typeof MethodsBase.CHAINS_INFO }): Promise<T>;
  request<T = Accounts>(params: { method: typeof MethodsBase.REQUEST_ACCOUNTS }): Promise<T>;
  request<T = WalletState>(params: { method: typeof MethodsWallet.GET_WALLET_STATE }): Promise<T>;
  request<T = WalletName>(params: { method: typeof MethodsWallet.GET_WALLET_NAME }): Promise<T>;
  request<T = NetworkType>(params: { method: typeof MethodsBase.NETWORK }): Promise<T>;
  request<T = Transaction>(params: {
    method: typeof MethodsBase.SEND_TRANSACTION;
    payload: SendTransactionParams;
  }): Promise<T>;
  request<T = Signature>(params: {
    method: typeof MethodsWallet.GET_WALLET_SIGNATURE;
    payload: GetSignatureParams;
  }): Promise<Signature>;
  /**
   * Request(params) is used to call DAPP service, returns a promise that will be fulfilled later.
   *
   * See its generic types for more details.
   */
  request<T extends MethodResponse = any>(params: RequestOption): Promise<T>;
  request<T = string>(params: { method: typeof MethodsWallet.GET_WALLET_CURRENT_MANAGER_ADDRESS }): Promise<T>;
  request<T = boolean>(params: {
    method: typeof MethodsWallet.GET_WALLET_MANAGER_SYNC_STATUS;
    payload: GetManagerSyncStatusParams;
  }): Promise<T>;
}

export interface IWeb3Provider extends IProvider {
  getChain<T extends IChain = IAElfChain>(chainId: ChainId): Promise<T>;
}

export interface IPortkeyProvider extends IWeb3Provider {
  /**
   * Determines whether the current environment is Portkey, if everything works well, it is `true`.
   */
  isPortkey: boolean;
  /**
   * The version of the current provider
   */
  providerVersion: string;
  /**
   * Use it to detect if current Portkey APP's wallet is connected.
   * @returns `true` if connected, otherwise `false`.
   */
  isConnected(): boolean;
}

export interface IInternalProvider extends IProvider {
  emit(event: DappEvents | EventId, response: IResponseInfo): boolean;
  addListener(event: DappEvents, listener: (...args: any[]) => void): this;
}

export type TWalletConfigOptionsType = 'showBatchApproveToken';

export type TSetWalletConfigOptionsParams = {
  [key in TWalletConfigOptionsType]?: boolean;
};

export interface SendTransactionParams {
  rpcUrl: string;
  chainId: ChainId;
  contractAddress: string;
  method: string;
  params?: readonly unknown[] | object;
}

export interface GetSignatureParams {
  data: string;
}

export interface GetManagerSyncStatusParams {
  chainId: ChainId;
}

export type MethodResponse =
  | Accounts
  | ChainIds
  | ChainsInfo
  | WalletState
  | NetworkType
  | Transaction
  | Signature
  | null
  | undefined;

export type ConsoleLike = Pick<Console, 'log' | 'warn' | 'error' | 'debug' | 'info' | 'trace'>;

export type BaseProviderOptions = {
  connectionStream: IDappInteractionStream;
  /**
   * The logging API to use.
   *
   * If not provided, it will be `console`.
   */
  logger?: ConsoleLike;

  /**
   * The maximum number of event listeners.
   */
  maxEventListeners?: number;
};

export const portkeyInitEventV1 = 'portkeyInitEvent';
export const portkeyInitEvent = 'portkeyInitEventV2';
