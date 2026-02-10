import type { UUID, MapCoordinates } from 'fuesim-digital-shared';

export interface CateringLine {
    readonly id: `${UUID}:${UUID}`;

    readonly catererPosition: MapCoordinates;
    readonly patientPosition: MapCoordinates;
}
