import { Address, ChainId } from './chain';

export type ChainItemType = {
  chainId: ChainId;
  chainName: string;
  endPoint: string;
  explorerUrl: string;
};

export type Accounts = {
  [key in ChainId]?: Address[];
};

export type ChainIds = ChainId[];

export type ChainsInfo = {
  [key in ChainId]?: ChainItemType[];
};

export type NetworkType = 'MAIN' | 'TESTNET';

export type ConnectInfo = {
  chainIds: ChainIds;
};

interface Error {
  message: string;
  stack?: string;
}
export interface ProviderErrorType extends Error {
  code: number;
  data?: unknown;
}

export type ProviderMessage = {
  type: string;
  data: unknown;
};
