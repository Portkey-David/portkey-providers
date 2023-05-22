import { IContract } from './contract';
import { IProvider } from './provider';
export type ChainId = 'AELF' | 'tDVV' | 'tDVW';
export type ChainType = 'aelf' | 'ethereum';
export interface IChain {
  getContract(contractAddress: string): IContract;
}

export type IChainProvider = any;

export type BaseChainOptions = {
  rpcUrl: string;
  chainType?: ChainType;
  chainId: ChainId;
  request: IProvider['request'];
};
