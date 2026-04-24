import type { PatientStatus, UUID } from 'fuesim-digital-shared';

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
     * The number of vehicles (inclusive in transfer) per vehicle template.
     */
    readonly vehicles: {
        readonly [key in UUID]: number;
    };

    /**
     * The number of disembarked personnel that is not in transfer per personnel template.
     */
    readonly personnel: {
        readonly [key in UUID]: number;
    };

    readonly numberOfActiveParticipants: number;
}
