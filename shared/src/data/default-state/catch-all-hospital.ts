import type { UUID } from '../../utils/uuid.js';
import type { Hospital } from '../../models/hospital.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';

export const catchAllHospitalId: UUID = '00000000-0000-4000-8000-000000000000';

const catchAllHospital: Hospital = {
    type: 'hospital',
    id: catchAllHospitalId,
    name: 'Beliebiges Krankenhaus',
    transportDuration: 60 * 60 * 1000,
    patientIds: {},
};

export function createCatchAllHospital() {
    return cloneDeepMutable(catchAllHospital);
}
