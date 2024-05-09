export interface IRequestParams<T = any> {
  origin?: string;
  eventName: string;
  method: MethodsType;
  payload?: T;
}

export interface RequestOption<T = any> {
  method: MethodsType | string;
  payload?: T;
}

export interface PageMetaData {
  hostname: string;
  avatar?: string;
}

export interface IResponseType<T = any> {
  eventName: string;
  info: IResponseInfo<T>;
  origin?: string;
  target?: string;
}

export interface IResponseInfo<T = any> {
  code: ResponseCode;
  data?: T;
  msg?: string;
}

export enum ResponseCode {
  SUCCESS = 0,

  USER_DENIED = 4001,
  ERROR_IN_PARAMS = 4002,
  UNKNOWN_METHOD = 4003,
  UNIMPLEMENTED = 4004,

  UNAUTHENTICATED = 4005,
  TIMEOUT = 4006,
  CONTRACT_ERROR = 4007,
  INTERNAL_ERROR = 5001,
}

export type ResponseCodeType = keyof typeof ResponseCode;

export const ResponseMessagePreset: { [key in ResponseCodeType]: string } = {
  SUCCESS: 'Success',
  ERROR_IN_PARAMS: 'Please check your params.',
  UNKNOWN_METHOD: 'You are using an unknown method name, please check again.',
  UNIMPLEMENTED: 'This method is not implemented yet.',
  UNAUTHENTICATED: `You are not authenticated, use "requestAccounts" first.`,
  INTERNAL_ERROR: 'Server internal error.',
  TIMEOUT: 'Request timeout.',
  USER_DENIED: 'User denied.',
  CONTRACT_ERROR: 'Request contract fail',
};

export const MethodsBase = {
  CHAIN_ID: 'chainId',
  ACCOUNTS: 'accounts',
  CHAIN_IDS: 'chainIds',
  CA_HASH: 'caHash',
  CHAINS_INFO: 'chainsInfo',
  NETWORK: 'network',
  SEND_TRANSACTION: 'sendTransaction',
  REQUEST_ACCOUNTS: 'requestAccounts',
  SEND_WALLET_CONFIG_OPTIONS: 'sendWalletConfigOptions',
} as const;

export type MethodsBaseType = (typeof MethodsBase)[keyof typeof MethodsBase];

export const MethodsWallet = {
  GET_WALLET_STATE: 'wallet_getWalletState',
  GET_WALLET_NAME: 'wallet_getWalletName',
  GET_WALLET_SIGNATURE: 'wallet_getSignature',
  GET_WALLET_TRANSACTION_SIGNATURE: 'wallet_getTransactionSignature',
  GET_WALLET_CURRENT_MANAGER_ADDRESS: 'wallet_getCurrentManagerAddress',
  GET_WALLET_MANAGER_SYNC_STATUS: 'wallet_getManagerSyncStatus',
} as const;

export type MethodsWalletType = (typeof MethodsWallet)[keyof typeof MethodsWallet];

export type MethodsType = MethodsBaseType | MethodsWalletType | string;
