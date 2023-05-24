import { AnyOriginMark, ResponseCode, SyncOriginData } from '@portkey/provider-types';
import {
  CryptoRequest,
  CryptoResponse,
  EventMessage,
  IDappInteractionStream,
  IDappRequestResponse,
  IDappRequestWrapper,
  IDappResponseWrapper,
  IOperator,
  MessageType,
  SpecialEvent,
} from '@portkey/provider-types';
import { CryptoManager } from '@portkey/provider-utils';

import { isSpecialOrigin } from '@portkey/provider-utils';

export default abstract class Operator implements IOperator {
  /**
   * we use _stream to communicate with the dapp
   * Operator does not need to know how to communicate with the dapp
   */
  private _stream: IDappInteractionStream;

  constructor(stream: IDappInteractionStream) {
    this._stream = stream;
  }
  public readonly origins: Array<{ origin: AnyOriginMark; publicKey: JsonWebKey }> = [];

  /**
   * use this method to handle the message from the dapp
   * @param message the message from the dapp
   */
  public handleRequestMessage = async (message: string) => {
    if (!(message?.length > 0)) {
      this._stream.createMessageEvent('invalid message');
      return;
    }
    try {
      const requestObj = JSON.parse(message) as CryptoRequest;
      const { origin, command, raw } = requestObj || {};
      if (!raw || !(raw?.length > 0)) {
        this._stream.createMessageEvent(`invalid raw:${raw}`);
        return;
      }
      if (command === SpecialEvent.SYNC) {
        this.originSync(origin, raw);
        return;
      }
      const publicKey = this.origins.find(item => item.origin === origin)?.publicKey;
      if (!this.isVavidOrigin(origin) || !publicKey) {
        this._stream.createMessageEvent(`invalid origin:${origin}`);
        return;
      }
      const params = JSON.parse(await CryptoManager.decrypt(publicKey, raw)) as IDappRequestWrapper;
      const { eventId } = params || {};
      const result = await this.handleRequest(params);
      this._stream.push({
        type: MessageType.REQUEST,
        origin,
        raw: await CryptoManager.encrypt(
          publicKey,
          JSON.stringify(Object.assign({}, { params: result }, { eventId }) as IDappResponseWrapper),
        ),
      } as CryptoResponse);
    } catch (e) {
      console.error('error when parsing message:' + message, 'error:', e);
      this._stream.createMessageEvent('operation failed:' + e?.message);
    }
  };

  public originSync = async (origin: string, raw: string): Promise<void> => {
    if (isSpecialOrigin(origin)) {
      this._stream.createMessageEvent(
        `error when try to sync origin:${origin}, it is a special origin and you can not use it`,
      );
      return;
    } else if (this.origins.some(item => item.origin === origin)) {
      this._stream.createMessageEvent(`error when try to sync origin:${origin}, it is already in the origins list`);
      return;
    } else {
      const { publicKey } = JSON.parse(raw) as SyncOriginData;
      this.origins.push({ origin, publicKey });
      this._stream.createMessageEvent(`success sync origin:${origin}`);
      this._stream.push({
        origin,
        type: MessageType.REQUEST,
        command: SpecialEvent.SYNC,
        raw: await CryptoManager.encrypt(
          publicKey,
          JSON.stringify(
            Object.assign(
              {},
              { params: { code: ResponseCode.SUCCESS } as IDappRequestResponse },
              { eventId: origin },
            ) as IDappResponseWrapper,
          ),
        ),
      } as CryptoResponse);
    }
  };

  public isVavidOrigin = (origin: string): boolean => {
    return this.origins.some(item => item.origin === origin);
  };

  /**
   * implement this method to handle the request from the dapp
   * @param request the request from the dapp
   */
  public abstract handleRequest(request: IDappRequestWrapper): Promise<IDappRequestResponse>;

  /**
   * expose it to your server code, it creates an event to the dapp
   * @param event the event data you want to publish to the dapp
   */
  public publishEvent = (event: EventMessage): void => {
    this._stream.push(JSON.stringify(event));
  };
}