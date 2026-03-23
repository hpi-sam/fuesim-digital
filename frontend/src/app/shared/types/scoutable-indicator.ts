import type {
    MapCoordinates,
    ScoutableElementType,
    UUID,
} from 'fuesim-digital-shared';

export interface ScoutableIndicator {
    readonly id: `${UUID}:${UUID}`;
    readonly position: MapCoordinates;
    readonly scoutableElementType: ScoutableElementType;
    readonly scoutableElementId: UUID;
    readonly isPaticipantVisible: boolean;
}
