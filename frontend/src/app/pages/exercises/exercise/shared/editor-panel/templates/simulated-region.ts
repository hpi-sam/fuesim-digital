import type {
    ExerciseSimulationBehaviorState,
    ExerciseState,
    ImageProperties,
} from 'fuesim-digital-shared';
import {
    TransferToHospitalBehaviorState,
    ManagePatientTransportToHospitalBehaviorState,
    TransferBehaviorState,
    cloneDeepMutable,
    SimulatedRegion,
    uuid,
    AnswerRequestsBehaviorState,
    AssignLeaderBehaviorState,
    AutomaticallyDistributeVehiclesBehaviorState,
    ProvidePersonnelBehaviorState,
    ReportBehaviorState,
    RequestBehaviorState,
    TreatPatientsBehaviorState,
    UnloadArrivingVehiclesBehaviorState,
    StrictObject,
    newNoPosition,
} from 'fuesim-digital-shared';
import type { WritableDraft } from 'immer';
import { toUtf8Base64 } from './utils/base64';

export interface SimulatedRegionDragTemplate {
    editorName: string;
    image: ImageProperties;
    stereotype: SimulatedRegion;
}

const height = SimulatedRegion.image.height / 23.5;
const width = height * SimulatedRegion.image.aspectRatio;
const size = {
    height,
    width,
};
const position = newNoPosition();

const stereotypes: SimulatedRegion[] = [
    {
        type: 'simulatedRegion',
        id: '',
        name: 'Patientenablage ???',
        borderColor: '#cc0000',
        activities: {},
        behaviors: [
            AssignLeaderBehaviorState.create(),
            ReportBehaviorState.create(),
            UnloadArrivingVehiclesBehaviorState.create(),
            TreatPatientsBehaviorState.create(),
            ProvidePersonnelBehaviorState.create(),
            RequestBehaviorState.create(),
            TransferBehaviorState.create(),
            TransferToHospitalBehaviorState.create(),
        ],
        inEvents: [],
        position,
        size,
    },
    {
        type: 'simulatedRegion',
        id: '',
        name: 'Bereitstellungsraum ???',
        borderColor: '#00cc00',
        activities: {},
        behaviors: [
            AssignLeaderBehaviorState.create(),
            ReportBehaviorState.create(),
            TransferBehaviorState.create(),
            AnswerRequestsBehaviorState.create(),
            AutomaticallyDistributeVehiclesBehaviorState.create(),
        ],
        inEvents: [],
        position,
        size,
    },
    {
        type: 'simulatedRegion',
        id: '',
        name: 'Transportorganisation ???',
        borderColor: '#0000cc',
        activities: {},
        behaviors: [
            AssignLeaderBehaviorState.create(),
            ReportBehaviorState.create(),
            ManagePatientTransportToHospitalBehaviorState.create(),
        ],
        inEvents: [],
        position,
        size,
    },
    {
        type: 'simulatedRegion',
        id: '',
        name: 'Generische Simulation ???',
        borderColor: '#cccc00',
        activities: {},
        behaviors: [
            AssignLeaderBehaviorState.create(),
            ReportBehaviorState.create(),
        ],
        inEvents: [],
        position,
        size,
    },
];

function coloredImageUrl(borderColor: string): ImageProperties {
    const content = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg
       width="161"
       height="91"
       viewBox="0 0 42.597916 24.077084"
       version="1.1"
       xmlns="http://www.w3.org/2000/svg">
      <rect
         style="fill:#808080;stroke-width:0.266;fill-opacity:0.80000001;stroke:${borderColor};stroke-opacity:1;"
         width="42.563648"
         height="23.987329"
         x="0.059559178"
         y="0.036193207" />
    </svg>
    `;
    const url = `data:image/svg+xml;base64,${toUtf8Base64(content)}`;
    return {
        ...SimulatedRegion.image,
        url,
    };
}

export const simulatedRegionDragTemplates: SimulatedRegionDragTemplate[] =
    stereotypes.map((stereotype) => ({
        stereotype,
        image: coloredImageUrl(stereotype.borderColor),
        editorName: stereotype.name.endsWith(' ???')
            ? stereotype.name.slice(0, -4)
            : stereotype.name,
    }));

function reconstituteBehavior(
    behavior: WritableDraft<ExerciseSimulationBehaviorState>,
    state: ExerciseState
) {
    behavior.id = uuid();
    switch (behavior.type) {
        case 'providePersonnelBehavior':
            behavior.vehicleTemplatePriorities = StrictObject.values(
                state.vehicleTemplates
            ).map((template) => template.id);
            break;
        default:
            break;
    }
}

export function reconstituteSimulatedRegionTemplate(
    template: SimulatedRegion,
    state: ExerciseState
) {
    const region = cloneDeepMutable(template);
    region.id = uuid();
    region.behaviors.forEach((behavior) => {
        reconstituteBehavior(behavior, state);
    });
    return region;
}
