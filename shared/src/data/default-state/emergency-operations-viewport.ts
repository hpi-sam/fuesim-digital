import { MapCoordinates, Size, Viewport } from '../../models/index.js';
import type { UUID } from '../../utils/index.js';
import { cloneDeepMutable } from '../../utils/index.js';

export const emergencyOperationsViewportId: UUID =
    '00000000-0000-4000-9000-000000000000';

const emergencyOperationsViewport: Viewport = Viewport.create(
    MapCoordinates.create(0, 0),
    Size.create(0, 0),
    'Leitstelle',
    {
        viewportType: 'eoc',
        overrideId: emergencyOperationsViewportId,
    }
);

export function createEmergencyOperationsViewport() {
    return cloneDeepMutable(emergencyOperationsViewport);
}
