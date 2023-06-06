import 'isomorphic-fetch';
import { describe, expect, test } from '@jest/globals';
import { Web3Provider, DappInteractionStream } from '../src';
import { EventEmitter } from 'stream';
import { IChain, MethodsBase } from '@portkey/provider-types';
const noop = () => undefined;

// mock post message
const mockEvent = new EventEmitter();
const data = {
  info: {
    data: {
      AELF: [
        {
          chainId: 'AELF',
          chainName: 'AELF',
          endPoint: 'https://aelf-test-node.aelf.io',
          explorerUrl: 'https://explorer-test.aelf.io',
          caContractAddress: 'iupiTuL2cshxB9UNauXNXe9iyCcqka7jCotodcEHGpNXeLzqG',
          defaultToken: {
            name: 'AELF',
            address: 'JRmBduh4nXWi1aXgdUsj5gJrzeZb2LxmrAbf7W99faZSvoAaE',
            imageUrl: 'https://portkey-did.s3.ap-northeast-1.amazonaws.com/img/aelf_token_logo.png',
            symbol: 'ELF',
            decimals: '8',
          },
          lastModifyTime: '2023-04-04T11:38:12.9517335Z',
          id: 'AELF',
        },
      ],
      tDVW: [
        {
          chainId: 'tDVW',
          chainName: 'tDVW',
          endPoint: 'https://tdvw-test-node.aelf.io',
          explorerUrl: 'https://explorer-test-side02.aelf.io',
          caContractAddress: '2WzfRW6KZhAfh3gCZ8Akw4wcti69GUNc1F2sXNa2fgjndv59bE',
          defaultToken: {
            name: 'tDVW',
            address: 'ASh2Wt7nSEmYqnGxPPzp4pnVDU4uhj1XW9Se5VeZcX2UDdyjx',
            imageUrl: 'https://portkey-did.s3.ap-northeast-1.amazonaws.com/img/aelf_token_logo.png',
            symbol: 'ELF',
            decimals: '8',
          },
          lastModifyTime: '2023-04-04T11:39:49.2364153Z',
          id: 'tDVW',
        },
      ],
    },
    code: 0,
  },
  eventName: '1685442020591_167258',
};

class MockServer {
  postMessage(message) {
    const { eventName, method } = JSON.parse(message);

    switch (method) {
      case MethodsBase.SEND_TRANSACTION: {
        setTimeout(() => {
          this.pushMessage(eventName, { code: 0, data: { transactionId: 'transactionId' }, msg: 'hello servers' });
        }, 1000);
        break;
      }
      case MethodsBase.REQUEST_ACCOUNTS: {
        setTimeout(() => {
          this.pushMessage(eventName, {
            code: 0,
            data: { AELF: ['address'], tDVV: ['address'] },
            msg: 'hello servers',
          });
        }, 1000);
        break;
      }
      case MethodsBase.CHAINS_INFO: {
        setTimeout(() => {
          this.pushMessage(eventName, {
            code: 0,
            data: data.info.data,
            msg: 'hello servers',
          });
        }, 1000);
        break;
      }
    }
  }

  pushMessage(eventName, info) {
    // react native postMessage
    mockEvent.emit(
      'message',
      JSON.stringify({
        eventName,
        info,
      }),
    );
  }
  readMessage(message) {
    this.postMessage(message);
  }
}
const server = new MockServer();

class MockStream extends DappInteractionStream {
  constructor() {
    super();
    mockEvent.addListener('message', this._onMessage.bind(this));
  }
  _read = noop;
  _onMessage(message) {
    this.push(message);
  }
  _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): void {
    try {
      // send
      server.readMessage(chunk.toString());
    } catch (err) {
      return callback(new Error('MockStream - disconnected'));
    }
    return callback();
  }
}

class MockProvider extends Web3Provider {}

const stream = new MockStream();

describe('chain describe', () => {
  const provider = new MockProvider({ connectionStream: stream });
  let chain: IChain | undefined;
  test('init chain', async () => {
    chain = await provider.getChain('AELF');
    expect(1).toBe(1);
  });
  test('test getChain', async () => {
    const height = await chain!.getBlockHeight();
    console.log(height, '=====height');
    expect(1).toBe(1);
  });
  test('test tokenContract callViewMethod', async () => {
    const tokenContract = chain!.getContract('JRmBduh4nXWi1aXgdUsj5gJrzeZb2LxmrAbf7W99faZSvoAaE');
    const info = await tokenContract.callViewMethod<{ balance: string; symbol: string; owner: string }>('GetBalance', {
      symbol: 'ELF',
      owner: 'LSWoBaeoXRp9QW75mCVJgNP4YurGi2oEJDYu3iAxtDH8R6UGy',
    });
    expect(info).toHaveProperty('symbol');
    expect(info).toHaveProperty('balance');
    expect(info).toHaveProperty('owner');
  }, 10000);

  test('test request accounts', async () => {
    const account = await provider.request({
      method: MethodsBase.REQUEST_ACCOUNTS,
    });
    console.log(account, '=======account');
    expect(account).toHaveProperty('AELF');
    expect(account).toHaveProperty('tDVV');
  }, 10000);

  test('test tokenContract callSendMethod', async () => {
    const tokenContract = chain!.getContract('JRmBduh4nXWi1aXgdUsj5gJrzeZb2LxmrAbf7W99faZSvoAaE');
    const req = await tokenContract.callSendMethod<{ transactionId: string }>('Transfer', '', {
      symbol: 'ELF',
      owner: 'LSWoBaeoXRp9QW75mCVJgNP4YurGi2oEJDYu3iAxtDH8R6UGy',
    });
    expect(req).toHaveProperty('transactionId');
  }, 10000);
});
