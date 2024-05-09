import BaseProvider from './baseProvider';
import { BaseProviderOptions, IPortkeyProvider } from '@portkey/provider-types';
import { Web3Provider } from './web3Provider';

export class PortkeyProvider extends Web3Provider implements IPortkeyProvider {
  public readonly isPortkey: true = true;
  public readonly providerVersion: string = '2.2.0';
  constructor(props: BaseProviderOptions) {
    super(props);
  }
  /**
   * **MUST** be called after instantiation to complete initialization.
   *
   * Calls `getProviderState` and passes the result to
   * {@link BaseProvider._initializeState}. Logs an error if getting initial state
   * fails. Throws if called after initialization has completed.
   */
  getInitialize = async () => {
    await this.initializeState();
  };

  isConnected() {
    return this.state.isConnected;
  }
}
