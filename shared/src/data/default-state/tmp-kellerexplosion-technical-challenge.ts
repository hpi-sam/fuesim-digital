import {
    type StateMachine,
    type StateMachineState,
} from '../../models/technical-challenge/state-machine.js';
import type { TechnicalChallengeTemplate } from '../../models/technical-challenge/technical-challenge-template.js';
import { newImageProperties } from '../../models/utils/image-properties.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
import { StateMachineTesting } from './tmp-default-technical-challenge.js';

function buildKellerexplosionTemplate(): TechnicalChallengeTemplate {
    const sm1Tasks: StateMachine['tasks'] = {
        [StateMachineTesting.shoringTask.id]: {
            taskTypeId: StateMachineTesting.shoringTask.id,
            totalDuration: StateMachineTesting.shoringTaskDuration,
        },
        [StateMachineTesting.debrisClearingTask.id]: {
            taskTypeId: StateMachineTesting.debrisClearingTask.id,
            totalDuration: StateMachineTesting.debrisClearingTaskDuration,
        },
    };

    const sm1Timers: StateMachine['timers'] = {
        [StateMachineTesting.secondaryCollapseTimerId]: {
            id: StateMachineTesting.secondaryCollapseTimerId,
            name: 'Nachsturz',
            totalDuration: StateMachineTesting.secondaryCollapseTimerDuration,
        },
    };

    const sm1States = TypeAssertedObject.fromEntries(
        [
            StateMachineTesting.sm1StructureUnstable,
            StateMachineTesting.sm1AccessSecured,
            StateMachineTesting.sm1SecondaryCollapse,
        ].map<[StateMachineState['id'], StateMachineState]>((s) => [s.id, s])
    ) as { [key: StateMachineState['id']]: StateMachineState };

    const sm2Tasks: StateMachine['tasks'] = {
        [StateMachineTesting.searchTask.id]: {
            taskTypeId: StateMachineTesting.searchTask.id,
            totalDuration: StateMachineTesting.searchTaskDuration,
        },
        [StateMachineTesting.rescuePatientTask.id]: {
            taskTypeId: StateMachineTesting.rescuePatientTask.id,
            totalDuration: StateMachineTesting.technicalExtricationTaskDuration,
        },
        [StateMachineTesting.firstAidTask.id]: {
            taskTypeId: StateMachineTesting.firstAidTask.id,
            totalDuration: StateMachineTesting.firstAidTaskDuration,
        },
    };

    const sm2Timers: StateMachine['timers'] = {
        [StateMachineTesting.survivalTimerId]: {
            id: StateMachineTesting.survivalTimerId,
            name: 'Überlebenszeit',
            totalDuration: StateMachineTesting.survivalTimerDuration,
        },
        [StateMachineTesting.lossOfConsciousnessTimerId]: {
            id: StateMachineTesting.lossOfConsciousnessTimerId,
            name: 'Bewusstlosigkeit',
            totalDuration: StateMachineTesting.lossOfConsciousnessTimerDuration,
        },
    };

    const sm2States = TypeAssertedObject.fromEntries(
        [
            StateMachineTesting.sm2PersonMissing,
            StateMachineTesting.sm2PersonLocated,
            StateMachineTesting.sm2PersonExtricatedConscious,
            StateMachineTesting.sm2PersonExtricatedUnconscious,
            StateMachineTesting.sm2RescueSuccessful,
            StateMachineTesting.sm2PersonCritical,
            StateMachineTesting.sm2PersonDeceased,
        ].map<[StateMachineState['id'], StateMachineState]>((s) => [s.id, s])
    ) as { [key: StateMachineState['id']]: StateMachineState };

    const sm1Id = 'c9d0e1f2-a3b4-4678-8345-789012345678' as StateMachine['id'];
    const sm2Id = 'd0e1f2a3-b4c5-4789-9456-890123456789' as StateMachine['id'];

    return {
        id: 'e1f2a3b4-c5d6-4890-a567-901234567890',
        name: 'Kellerexplosion in Mehrfamilienhaus',
        // TODO: Replace with an image fitting a basement explosion scene
        image: newImageProperties('/assets/kellerexplosion/base.png', 300, 1),
        stateMachines: {
            [sm1Id]: {
                id: sm1Id,
                name: 'Struktursicherung',
                initialStateId: StateMachineTesting.sm1StructureUnstable.id,
                currentStateId: StateMachineTesting.sm1StructureUnstable.id,
                states: sm1States,
                tasks: sm1Tasks,
                timers: sm1Timers,
                simulationStartTime: 0,
                taskTimeSpent: {},
                assignedPersonnel: {},
            },
            [sm2Id]: {
                id: sm2Id,
                name: 'Personenrettung',
                initialStateId: StateMachineTesting.sm2PersonMissing.id,
                currentStateId: StateMachineTesting.sm2PersonMissing.id,
                states: sm2States,
                tasks: sm2Tasks,
                timers: sm2Timers,
                simulationStartTime: 0,
                taskTimeSpent: {},
                assignedPersonnel: {},
            },
        },
    };
}

let _cachedTemplate: TechnicalChallengeTemplate | undefined;

export function getKellerexplosionTechnicalChallengeTemplate(): TechnicalChallengeTemplate {
    _cachedTemplate ??= buildKellerexplosionTemplate();
    return _cachedTemplate;
}
