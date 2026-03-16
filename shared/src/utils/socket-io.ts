import type { ServerOptions } from 'socket.io';

export const socketIoTransports = {
    transports: ['websocket'],
} satisfies Partial<ServerOptions>;
