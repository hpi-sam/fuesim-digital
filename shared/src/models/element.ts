import type {
    AlarmGroup,
    Client,
    Hospital,
    RestrictedZone,
    MapImage,
    Material,
    Patient,
    Personnel,
    SimulatedRegion,
    TransferPoint,
    Vehicle,
    Viewport,
} from './index.js';

export type Element =
    | AlarmGroup
    | Client
    | Hospital
    | MapImage
    | Material
    | Patient
    | Personnel
    | RestrictedZone
    | SimulatedRegion
    | TransferPoint
    | Vehicle
    | Viewport;
