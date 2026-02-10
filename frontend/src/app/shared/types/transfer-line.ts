import type { MapCoordinates, UUID } from 'fuesim-digital-shared';

export interface TransferLine {
    readonly id: `${UUID}:${UUID}`;

    readonly startPosition: MapCoordinates;
    readonly endPosition: MapCoordinates;
    readonly duration: number;
}
