import type {
    MapCoordinates,
    UUID,
    TechnicalChallenge,
    ScoutableElement,
} from 'fuesim-digital-shared';

export interface ScoutableIndicator {
    readonly id: `${UUID}:${UUID}`;
    readonly position: MapCoordinates;
    readonly scoutableElementType:
        | ScoutableElement['type']
        | TechnicalChallenge['type'];
    readonly scoutableElementId: UUID;
    readonly imageUrl: string;
    readonly height: number;
}
