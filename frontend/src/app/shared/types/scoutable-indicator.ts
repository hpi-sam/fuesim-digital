import { MapCoordinates, UUID } from 'fuesim-digital-shared';

export interface ScoutableIndicator {
    readonly id: `${UUID}:${UUID}`;
    readonly elementPosition: MapCoordinates;
}
