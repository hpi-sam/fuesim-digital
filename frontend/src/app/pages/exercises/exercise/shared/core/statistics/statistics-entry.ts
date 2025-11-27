import type { UUID } from 'digital-fuesim-manv-shared';
import type { AreaStatistics } from './area-statistics';

export interface StatisticsEntry {
    readonly id: UUID;

    /**
     * The exercise time in ms when these statistics were created.
     */
    readonly exerciseTime: number;

    readonly viewports: {
        readonly [viewportId: string]: AreaStatistics;
    };

    readonly simulatedRegions: {
        readonly [simulatedRegionId: string]: AreaStatistics;
    };

    readonly exercise: AreaStatistics;
}
