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
    Scoutable,
    UserGeneratedContent,
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
    | Scoutable
    | SimulatedRegion
    | TechnicalChallenge
    | TransferPoint
    | UserGeneratedContent
    | Vehicle
    | Viewport;
