export class SagaConst {
    static readonly BASE_URL = process.env.NEXT_PUBLIC_APP_ENV_SEND_BASE_URL ?? 'http://localhost:4999';
    static readonly STREAM: string = process.env.NEXT_PUBLIC_APP_ENV_SOCKET_PATH ?? '/stream';
    static readonly CONNECT: string = 'connect';
    static readonly AUTHENTICATED: string = 'authenticated';
  }