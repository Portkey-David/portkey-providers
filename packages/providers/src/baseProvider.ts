import { EventEmitter } from 'events';
import {
  EventId,
  IInternalProvider,
  DappEvents,
  MethodsType,
  ConsoleLike,
  ResponseCode,
  BaseProviderOptions,
  IDappInteractionStream,
  IResponseInfo,
  ProviderError,
  NotificationEvents,
  MethodsWallet,
  RequestOption,
  Accounts,
  SendTransactionParams,
  MethodsBase,
  WalletState,
  Transaction,
  ChainIds,
  ChainsInfo,
  ConnectInfo,
  ProviderErrorType,
  WalletName,
  IResponseType,
  Signature,
  GetSignatureParams,
  NetworkType,
  GetManagerSyncStatusParams,
  TSendWalletConfigOptionsParams,
} from '@portkey/provider-types';
import { isNotificationEvents, isMethodsBase, isMethodsUnimplemented } from './utils';
import isEqual from 'lodash/isEqual';
import { DappInteractionStream } from './dappStream';

export interface BaseProviderState {
  isConnected: boolean;
  isUnlocked: boolean;
  initialized: boolean;
  chainIds?: ChainIds | null;
  networkType?: string | null;
  accounts?: null | Accounts;
}

const defaultState: BaseProviderState = {
  accounts: null,
  isConnected: false,
  isUnlocked: false,
  initialized: false,
  chainIds: null,
  networkType: null,
};

export default abstract class BaseProvider extends EventEmitter implements IInternalProvider {
  /**
   * default console object.
   */
  protected readonly _log: ConsoleLike;
  /**
   * _companionStream is used to create a connection - between the provider and the operator, which exists on the other side of service.
   * Read {@link DappInteractionStream} for more information.
   */
  private _companionStream: IDappInteractionStream;

  /**
   * state property is used to store the current state of the provider.
   */
  protected state: BaseProviderState;

  constructor({ connectionStream, logger = console, maxEventListeners = 100 }: BaseProviderOptions) {
    super();
    this._companionStream = connectionStream;
    this.setMaxListeners(maxEventListeners);
    this._log = logger;
    this._companionStream.on('data', this._onData);
    this.state = defaultState;
    this.request = this.request.bind(this);
  }

  /**
   * This method will be registered to the window object, providing basic service based on the event name.
   * If the event name is not regarded as an event name, it will be regarded as a request eventId since they share the same way to communicate.
   * @param buffer - Raw Buffer data from the stream
   */
  protected _onData = (buffer: Buffer): void => {
    try {
      const { eventName, info } = JSON.parse(buffer?.toString()) as IResponseType;
      if (isNotificationEvents(eventName) && info) {
        switch (eventName) {
          case NotificationEvents.CONNECTED:
            this.handleConnect(info.data);
            return;
          case NotificationEvents.DISCONNECTED:
            this.handleDisconnect(info.data);
            return;
          case NotificationEvents.MESSAGE:
            this.handleMessage(info.msg);
            return;
          case NotificationEvents.ACCOUNTS_CHANGED:
            this.handleAccountsChanged(info.data);
            return;
          case NotificationEvents.NETWORK_CHANGED:
            this.handleNetworkChanged(info.data);
            return;
          case NotificationEvents.CHAIN_CHANGED:
            this.handleChainChanged(info.data);
            return;
          default:
            if (eventName) this.emit(eventName, info.data);
            break;
        }
      } else {
        if (eventName && info) this.emit(eventName, info as IResponseInfo);
      }
    } catch (error) {
      this._log.log(error, '====error');
    }
  };

  /**
   * Creates a listener on the provider
   * @param event - event name that the listener will listen to
   * @param listener - callback function
   */
  public on(event: string, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }

  /**
   * Creates a listener on the provider, the listener will be removed after the first time it is triggered
   * @param event - event name that the listener will listen to
   * @param listener - callback function
   */
  public once(event: string, listener: (...args: any[]) => void): this {
    super.once(event, listener);
    return this;
  }

  /**
   * Alias for BaseProvider.on()
   * @param event - event name that the listener will listen to
   * @param listener - callback function
   */
  public addListener(event: string, listener: (...args: any[]) => void): this {
    return this.on(event, listener);
  }

  /**
   * Remove a listener from the provider
   * @param event - event name that the listener used to listen to
   * @param listener - callback function
   */
  public removeListener(event: string, listener: (...args: any[]) => void): this {
    super.removeListener(event, listener);
    return this;
  }

  /**
   * Emit method to create a event on the provider
   * @param event - DappEvents | EventId event name or eventId
   * @param response - IResponseInfo response data
   */
  public emit(event: DappEvents | EventId, response: IResponseInfo | any): boolean {
    return super.emit(event, response);
  }

  /**
   * Request(params) is used to call DAPP service, returns a promise that will be fulfilled later.
   * @example basic usage:
   * ```
   * provider.request({ method: "requestAccounts" }).then((result: any) => {
   *   // Do something with the result
   * }).catch(error => console.error('error occurred :', error));
   * ```
   * @param params - RequestOption
   */
  public async request(params: { method: typeof MethodsBase.ACCOUNTS }): Promise<Accounts>;
  public async request(params: { method: typeof MethodsBase.CHAIN_ID }): Promise<ChainIds>;
  public async request(params: {
    method: typeof MethodsBase.SEND_WALLET_CONFIG_OPTIONS;
    payload: TSendWalletConfigOptionsParams;
  }): Promise<boolean>;

  public async request(params: { method: typeof MethodsBase.CHAIN_IDS }): Promise<ChainIds>;
  public async request(params: { method: typeof MethodsBase.CHAINS_INFO }): Promise<ChainsInfo>;
  public async request(params: { method: typeof MethodsBase.REQUEST_ACCOUNTS }): Promise<Accounts>;
  public async request(params: { method: typeof MethodsWallet.GET_WALLET_STATE }): Promise<WalletState>;
  public async request(params: { method: typeof MethodsWallet.GET_WALLET_NAME }): Promise<WalletName>;
  public async request(params: {
    method: typeof MethodsBase.SEND_TRANSACTION;
    payload: SendTransactionParams;
  }): Promise<Transaction>;
  public async request(params: {
    method: typeof MethodsWallet.GET_WALLET_SIGNATURE;
    payload: GetSignatureParams;
  }): Promise<Signature>;
  public async request(params: { method: typeof MethodsWallet.GET_WALLET_CURRENT_MANAGER_ADDRESS }): Promise<string>;
  public async request<T = boolean>(params: {
    method: typeof MethodsWallet.GET_WALLET_MANAGER_SYNC_STATUS;
    payload: GetManagerSyncStatusParams;
  }): Promise<boolean>;
  public async request(params: { method: typeof MethodsBase.NETWORK }): Promise<NetworkType>;
  public async request<T = any>(params: RequestOption): Promise<T> {
    if (!params || typeof params !== 'object' || Array.isArray(params))
      throw new ProviderError('Expected a single, non-array, object argument.', ResponseCode.ERROR_IN_PARAMS);

    const eventName = this.getEventName();
    const { method, payload } = params;

    if (payload !== undefined && typeof payload !== 'object' && payload !== null)
      throw new ProviderError(`'params.payload' must be an object if provided.`, ResponseCode.UNKNOWN_METHOD);

    this._companionStream.write(
      JSON.stringify({
        method,
        payload,
        eventName,
      }),
    );
    return new Promise((resolve, reject) => {
      this.once(eventName, (response: IResponseInfo) => {
        const { code, data } = response;
        if (code == ResponseCode.SUCCESS) {
          resolve(data);
        } else {
          reject(new ProviderError(`${response.msg}`, code));
        }
      });
    });
  }

  protected methodCheck = (method: string): method is MethodsType => {
    return isMethodsBase(method) || isMethodsUnimplemented(method);
  };

  /**
   * Create an unduplicated eventId for a request
   * @param seed - used to generate random number, default is 999999
   * @returns eventId used for request() operation
   */
  protected getEventName = (seed: number = 999999): string => {
    return new Date().getTime() + '_' + Math.floor(Math.random() * seed);
  };

  protected initializeState = async () => {
    const initialResponse = await this.request({
      method: MethodsWallet.GET_WALLET_STATE,
    });
    if (!initialResponse) return;
    this.state = { ...this.state, ...initialResponse, initialized: true };
    initialResponse.accounts && this.handleAccountsChanged(initialResponse.accounts);
    initialResponse.chainIds && this.handleChainChanged(initialResponse.chainIds);
    initialResponse.networkType && this.handleNetworkChanged(initialResponse.networkType);
  };
  /**
   * When the provider becomes connected, updates internal state and emits required events.
   * @param response - contains chainId
   */
  protected handleConnect(response: ConnectInfo) {
    if (!this.state.isConnected) {
      this.state.isConnected = true;
      this.emit(NotificationEvents.CONNECTED, response);
    }
  }
  /**
   * When the provider becomes disconnected, updates internal state and emits required events.
   * @param response - reason why the provider is disconnected
   */
  protected handleDisconnect(response: ProviderErrorType) {
    if (this.state.isConnected) {
      this.state.isConnected = false;
      this.state.accounts = null;
      this.state.isUnlocked = false;
      this.state.chainIds = null;
      this.state.networkType = null;
      this.emit(NotificationEvents.DISCONNECTED, response);
    }
  }

  /**
   * Will be triggered when the account is updated or the network is switched.
   * @param response - contains accounts address
   */
  protected handleAccountsChanged(response: Accounts) {
    if (isEqual(this.state.accounts, response)) return;
    this.state.accounts = response;

    this.emit(NotificationEvents.ACCOUNTS_CHANGED, response);
  }
  /**
   * When the network switches, updates internal state and emits required events.
   * @param response - contains network type like 'MAINNET'
   */
  protected handleNetworkChanged(response: string) {
    if (isEqual(this.state.networkType, response)) return;
    this.state.networkType = response;

    this.initializeState();
    this.emit(NotificationEvents.NETWORK_CHANGED, response);
  }

  /**
   * When something unexpected happens, the dapp will receive a notification.
   * @param response - contains error message
   */
  protected handleMessage(response: any) {
    this.emit(NotificationEvents.MESSAGE, response);
  }

  /**
   * When the current chainId changes, updates internal state and emits required events.
   * @param response - contains chainId
   */
  protected handleChainChanged(response: ChainIds) {
    if (isEqual(this.state.chainIds, response)) return;
    this.state.chainIds = response;
    this.emit(NotificationEvents.CHAIN_CHANGED, response);
  }
}
