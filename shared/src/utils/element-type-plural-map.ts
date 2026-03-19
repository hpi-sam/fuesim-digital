// eslint-disable-next-line @typescript-eslint/no-shadow
import type { Element } from '../models/element.js';
import type { ExerciseState } from '../state.js';

export const elementTypePluralMap = {
    alarmGroup: 'alarmGroups',
    client: 'clients',
    hospital: 'hospitals',
    restrictedZone: 'restrictedZones',
    mapImage: 'mapImages',
    material: 'materials',
    patient: 'patients',
    personnel: 'personnel',
    simulatedRegion: 'simulatedRegions',
    transferPoint: 'transferPoints',
    vehicle: 'vehicles',
    viewport: 'viewports',
    scoutable: 'scoutables',
    userGeneratedContent: 'userGeneratedContents',
} as const satisfies { [Key in Element['type']]: keyof ExerciseState };

export type ElementTypePluralMap = typeof elementTypePluralMap;
