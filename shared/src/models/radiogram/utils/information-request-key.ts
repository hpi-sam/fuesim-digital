import type { UUID } from '../../../utils/uuid.js';

const interfaceSignallerPrefix = 'interfaceSignaller';

export function getInformationRequestKeyDetails(key: string) {
    return key.split('_').slice(2).join('_');
}

export function makeInterfaceSignallerKey(clientId: UUID, keyDetails: string) {
    return `${interfaceSignallerPrefix}_${clientId}_${keyDetails}`;
}

export function isInterfaceSignallerKey(key: string | null) {
    return key?.startsWith(interfaceSignallerPrefix) ?? false;
}

export function isInterfaceSignallerKeyForClient(
    key: string | null,
    clientId: UUID
) {
    return key?.startsWith(`${interfaceSignallerPrefix}_${clientId}`) ?? false;
}
