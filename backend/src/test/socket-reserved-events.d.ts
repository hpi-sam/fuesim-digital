/**
 * Copied from `node_modules\socket.io-client\build\esm\socket.d.ts` (it isn't exported...)
 */
export interface SocketReservedEvents {
    connect: () => void;
    connect_error: (err: Error) => void;
    disconnect: (reason: Socket.DisconnectReason) => void;
}
