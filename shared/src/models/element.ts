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
    TechnicalChallenge,
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
    | TechnicalChallenge
    | TransferPoint
    | Vehicle
    | Viewport;
