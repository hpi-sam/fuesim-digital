import type { PatientStatus, Vehicle } from 'digital-fuesim-manv-shared';

/**
 * The statistics for an area in the exercise (e.g. a viewport or the whole exercise).
 */
export interface AreaStatistics {
    /**
     * The number of patients per type
     */
    readonly patients: {
        readonly [visibleStatus in PatientStatus]?: number;
    };

    /**
     * The number of vehicles (inclusive in transfer) per type.
     */
    readonly vehicles: {
        readonly [vehicleType: Vehicle['vehicleType']]: number | undefined;
    };

    /**
     * The number of disembarked personnel that is not in transfer per personnelType.
     */
    readonly personnel: {
        readonly [personnelType in string]?: number;
    };

    readonly numberOfActiveParticipants: number;
}
