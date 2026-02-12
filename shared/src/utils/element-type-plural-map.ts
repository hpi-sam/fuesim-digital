// eslint-disable-next-line @typescript-eslint/no-shadow
import type { Element } from '../models/element.js';
import type { ExerciseState } from '../state.js';

type ElementType = Element['type'];

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
    technicalChallenge: 'technicalChallenges',
    transferPoint: 'transferPoints',
    vehicle: 'vehicles',
    viewport: 'viewports',
    scoutable: 'scoutables',
    userGeneratedContent: 'userGeneratedContents',
} as const satisfies { [Key in ElementType]: keyof ExerciseState };

export type ElementTypePluralMap = typeof elementTypePluralMap;
