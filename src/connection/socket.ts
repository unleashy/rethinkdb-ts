import { EventEmitter } from 'events';
import { connect as netConnect, Socket, TcpNetConnectOpts } from 'net';
import { connect as tlsConnect } from 'tls';
import { RethinkDBErrorType, RServerConnectionOptions } from '../types';
import { RethinkDBError } from '../error/error';
import { QueryJson, ResponseJson } from '../internal-types';
import { QueryType, ResponseType } from '../proto/enums';
import { DataQueue } from './data-queue';
import {
  buildAuthBuffer,
  compareDigest,
  computeSaltedPassword,
  NULL_BUFFER,
  validateVersion,
} from './handshake-utils';
import { isNativeError } from '../util';

export type RNConnOpts = RServerConnectionOptions & {
  host: string;
  port: number;
};

export function setConnectionDefaults(
  connectionOptions: RServerConnectionOptions,
): RNConnOpts {
  return {
    ...connectionOptions,
    host: connectionOptions.host || 'localhost',
    port: connectionOptions.port || 28015,
  };
}

export class RethinkDBSocket extends EventEmitter {
  public connectionOptions: RNConnOpts;

  public readonly user: string;

  public readonly password: Buffer;

  public lastError?: Error;

  public get status() {
    if (this.lastError) {
      return 'errored';
    }
    if (!this.isOpen) {
      return 'closed';
    }
    if (this.mode === 'handshake') {
      return 'handshake';
    }
    return 'open';
  }

  public socket?: Socket;

  public runningQueries = new Map<
    number,
    {
      query: QueryJson;
      data: DataQueue<ResponseJson | Error>;
    }
  >();

  private isOpen = false;

  private nextToken = 0;

  private buffer = Buffer.alloc(0);

  private mode: 'handshake' | 'response' = 'handshake';

  constructor({
    connectionOptions,
    user = 'admin',
    password = '',
  }: {
    connectionOptions: RNConnOpts;
    user?: string;
    password?: string;
  }) {
    super();
    this.connectionOptions = setConnectionDefaults(connectionOptions);
    this.user = user;
    this.password = password ? Buffer.from(password) : NULL_BUFFER;
  }

  public async connect() {
    if (this.socket) {
      throw new RethinkDBError('Socket already connected', {
        type: RethinkDBErrorType.CONNECTION,
      });
    }
    const options = this.connectionOptions;
    try {
      const socket = await new Promise<Socket>((resolve, reject) => {
        if (options.tls) {
          let socket = tlsConnect(options);
          socket.once('secureConnect', () => {
            if (socket.authorized || options.rejectUnauthorized === false) {
              resolve(socket);
            } else {
              reject(socket.authorizationError);
              socket.destroy();
            }
          });
          socket.once('error', reject);
        } else {
          let socket = netConnect(options);
          socket.once('connect', () => resolve(socket));
          socket.once("error", reject);
        }
      });

      socket.removeAllListeners();
      socket
        .on('close', () => this.close())
        .on('end', () => this.close())
        .on('error', (error) => this.handleError(error))
        .on('data', (data) => {
          try {
            this.buffer = Buffer.concat([this.buffer, data]);
            switch (this.mode) {
              case 'handshake':
                this.handleHandshakeData();
                break;
              case 'response':
                this.handleData();
                break;
              default:
                break;
            }
          } catch (error: any) {
            this.handleError(error);
          }
        });

      socket.setKeepAlive(true);
      this.socket = socket;

      this.isOpen = true;
      this.lastError = undefined;
      await this.performHandshake();
      this.emit('connect');
    } catch (error: any) {
      this.handleError(error);
    }
  }

  public sendQuery(newQuery: QueryJson, token?: number) {
    if (!this.socket || this.status !== 'open') {
      throw new RethinkDBError(
        '`run` was called with a closed connection after:',
        { term: newQuery[1], type: RethinkDBErrorType.CONNECTION },
      );
    }

    if (token === undefined) {
      token = this.nextToken++;
    }

    const encoded = JSON.stringify(newQuery);
    const querySize = Buffer.byteLength(encoded);
    const buffer = Buffer.alloc(8 + 4 + querySize);
    // eslint-disable-next-line no-bitwise
    buffer.writeUInt32LE(token & 0xffffffff, 0);
    buffer.writeUInt32LE(Math.floor(token / 0xffffffff), 4);
    buffer.writeUInt32LE(querySize, 8);
    buffer.write(encoded, 12);
    const { noreply = false } = newQuery[2] || {};
    if (noreply) {
      this.socket.write(buffer);
      this.emit('query', token);
      return token;
    }
    const [type] = newQuery;
    const { query = newQuery, data = null } =
      this.runningQueries.get(token) || {};
    if (type === QueryType.STOP) {
      // console.log('STOP ' + token);
      this.socket.write(buffer);
      if (data) {
        // Resolving and not rejecting so there won't be "unhandled rejection" if nobody listens
        data.destroy(
          new RethinkDBError('Query cancelled', {
            term: query[1],
            type: RethinkDBErrorType.CANCEL,
          }),
        );
        this.runningQueries.delete(token);
        this.emit('release', this.runningQueries.size);
      }
      return token;
    }
    if (!data) {
      this.runningQueries.set(token, {
        data: new DataQueue(),
        query,
      });
    }
    this.socket.write(buffer);
    this.emit('query', token);
    return token;
  }

  public stopQuery(token: number) {
    if (this.runningQueries.has(token)) {
      this.sendQuery([QueryType.STOP], token);
    }
  }

  public continueQuery(token: number) {
    if (this.runningQueries.has(token)) {
      this.sendQuery([QueryType.CONTINUE], token);
    }
  }

  public async readNext<T = ResponseJson>(token: number): Promise<T> {
    if (!this.isOpen) {
      throw (
        this.lastError ||
        new RethinkDBError(
          'The connection was closed before the query could be completed',
          {
            type: RethinkDBErrorType.CONNECTION,
          },
        )
      );
    }
    if (!this.runningQueries.has(token)) {
      throw new RethinkDBError('No more rows in the cursor.', {
        type: RethinkDBErrorType.CURSOR_END,
      });
    }
    const { data = null } = this.runningQueries.get(token) || {};
    if (!data) {
      throw new RethinkDBError('Query is not running.', {
        type: RethinkDBErrorType.CURSOR,
      });
    }
    const res = await data.dequeue();
    if (isNativeError(res)) {
      data.destroy(res);
      this.runningQueries.delete(token);
      throw res;
    } else if (this.status === 'handshake') {
      this.runningQueries.delete(token);
    } else if (res.t !== ResponseType.SUCCESS_PARTIAL) {
      this.runningQueries.delete(token);
      this.emit('release', this.runningQueries.size);
    }
    return res as any;
  }

  public close(error?: Error) {
    for (const { data, query } of this.runningQueries.values()) {
      data.destroy(
        new RethinkDBError(
          'The connection was closed before the query could be completed',
          {
            term: query[1],
            type: RethinkDBErrorType.CONNECTION,
          },
        ),
      );
    }
    this.runningQueries.clear();
    if (!this.socket) {
      return;
    }
    this.socket.removeAllListeners();
    this.socket.destroy();
    this.socket = undefined;
    this.isOpen = false;
    this.mode = 'handshake';
    this.emit('close', error);
    this.removeAllListeners();
    this.nextToken = 0;
  }

  private async performHandshake() {
    if (!this.socket || this.status !== 'handshake') {
      throw new RethinkDBError('Connection is not open', {
        type: RethinkDBErrorType.CONNECTION,
      });
    }

    let token = 0;
    const generateRunningQuery = () => {
      this.runningQueries.set(token, {
        data: new DataQueue(),
        query: [QueryType.START],
      });
      token += 1;
    };
    const { randomString, authBuffer } = buildAuthBuffer(this.user);
    generateRunningQuery();
    generateRunningQuery();
    this.socket.write(authBuffer);
    validateVersion(await this.readNext<any>(0));
    const { authentication } = await this.readNext<any>(1);
    const { serverSignature, proof } = await computeSaltedPassword(
      authentication,
      randomString,
      this.user,
      this.password,
    );
    generateRunningQuery();
    this.socket.write(proof);
    const { authentication: returnedSignature } = await this.readNext<any>(2);
    compareDigest(returnedSignature, serverSignature);
    this.mode = 'response';
  }

  private handleHandshakeData() {
    let index = -1;
    while ((index = this.buffer.indexOf(0)) >= 0) {
      const strMsg = this.buffer.subarray(0, index).toString('utf8');
      const { data = null } = this.runningQueries.get(this.nextToken++) || {};
      let error: RethinkDBError | undefined;
      try {
        const jsonMsg = JSON.parse(strMsg);
        if (jsonMsg.success) {
          if (data) {
            data.enqueue(jsonMsg as any);
          }
        } else {
          error = new RethinkDBError(jsonMsg.error, {
            errorCode: jsonMsg.error_code,
          });
        }
      } catch (cause: any) {
        error = new RethinkDBError(strMsg, {
          cause,
          type: RethinkDBErrorType.AUTH,
        });
      }
      if (error) {
        if (data) {
          data.destroy(error);
        }
        this.handleError(error);
      }
      this.buffer = this.buffer.subarray(index + 1);
      index = this.buffer.indexOf(0);
    }
  }

  private handleData() {
    while (this.buffer.length >= 12) {
      const token =
        this.buffer.readUInt32LE(0) + 0x100000000 * this.buffer.readUInt32LE(4);
      const responseLength = this.buffer.readUInt32LE(8);

      if (this.buffer.length < 12 + responseLength) {
        break;
      }

      const responseBuffer = this.buffer.subarray(12, 12 + responseLength);
      const response: ResponseJson = JSON.parse(
        responseBuffer.toString('utf8'),
      );
      this.buffer = this.buffer.subarray(12 + responseLength);
      const { data = null } = this.runningQueries.get(token) || {};
      if (data) {
        data.enqueue(response);
      }
    }
  }

  private handleError(err: Error) {
    this.close(err);
    this.lastError = err;
    if (this.listenerCount('error') > 0) {
      this.emit('error', err);
    }
  }
}
