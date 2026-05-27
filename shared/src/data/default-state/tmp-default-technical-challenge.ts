import {
    newTechnicalChallengeState,
    type StateMachine,
    type StateMachineState,
    type TimerGuard,
} from '../../models/technical-challenge/state-machine.js';
import type { TaskType } from '../../models/task-type.js';
import type { TechnicalChallengeTemplate } from '../../models/technical-challenge/technical-challenge-template.js';
import { newImageProperties } from '../../models/utils/image-properties.js';
import type { UUID } from '../../utils/uuid.js';
import type { UserGeneratedContent } from '../../models/user-generated-content.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';

// TODO@Felix: move into state-machine.spec.ts
export namespace StateMachineTesting {
    // --- Tasks ---
    export const extinguishFireTask: TaskType = {
        id: '7eac4a83-99cd-406a-a4a3-d61b4d5b72bd' as TaskType['id'],
        type: 'taskType',
        taskName: 'Feuer löschen',
    };
    export const extinguishFireTaskDuration = 10_000;
    export const rescuePatientTask: TaskType = {
        id: '86fcf9d4-33b3-469e-9b4c-5bf25d88387b' as TaskType['id'],
        type: 'taskType',
        taskName: 'Patient retten',
    };
    export const rescuePatientTaskDuration = 10_000;

    // --- Timers ---
    export const patientDeadTimerId =
        '2a5d1c1e-9f2d-4e4f-a86c-3f6a06a57f1b' as TimerGuard['timerId'];
    export const patientDeadTimerDuration = 30_000;
    export const vehicleBurnedOutTimerId =
        'c4b7e7f5-4f23-4d84-b8db-51c1c5cdb6ac' as TimerGuard['timerId'];
    export const vehicleBurnedOutTimerDuration = 60_000;

    // --- Guards ---
    // A guard is fulfilled when the task's progress exceeds minProgress.
    export const isFireExtinguished = {
        type: 'taskGuard',
        minProgress: 1,
        taskId: extinguishFireTask.id,
    } as const;
    export const isPatientRescued = {
        type: 'taskGuard',
        minProgress: 1,
        taskId: rescuePatientTask.id,
    } as const;
    export const isPatientDead = {
        type: 'timerGuard',
        minProgress: 1,
        timerId: patientDeadTimerId,
    } as const;
    export const isVehicleBurnedOut = {
        type: 'timerGuard',
        minProgress: 1,
        timerId: vehicleBurnedOutTimerId,
    } as const;

    // --- Contents ---
    const initialContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Ein brennender PKW. Der Lenker ist eingeklemmt.</p>',
    };
    const onlyExtinguishedContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Ein gelöschter PKW. Der Lenker ist eingeklemmt.</p>',
    };
    const onlyDeadContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content:
            '<p>Ein brennender PKW. Der Lenker schaut schwer verletzt aus und reagiert nicht.</p>',
    };
    const onlyTreatedContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Ein brennender PKW. Der Lenker wurde bereits befreit.</p>',
    };
    const patientDeadButExtinguishedContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content:
            '<p>Der PKW ist gelöscht. Der Patient gibt keine Lebenszeichen von sich.</p>',
    };
    const treatedAndExtinguishedContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content:
            '<p>Der PKW ist gelöscht. Der Lenker wurde erfolgreich befreit.</p>',
    };
    const burnedOutAndPatientDeadContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content:
            '<p>Ein ausgebrannter PKW mit einem leblosen Patienten am Steuer.</p>',
    };
    const burnedOutButRescuedContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content:
            '<p>Ein ausgebrannter PKW. Der Lenker wurde bereits befreit.</p>',
    };

    // --- States ---
    export const patientDeadButExtinguished = newTechnicalChallengeState(
        'Patient verstorben, Feuer gelöscht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [],
        [],
        patientDeadButExtinguishedContent
    );
    export const treatedAndExtinguished = newTechnicalChallengeState(
        'Patient gerettet und Feuer gelöscht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [],
        [],
        treatedAndExtinguishedContent
    );
    export const burnedOutAndPatientDead = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt und Patient verstorben',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [],
        [],
        burnedOutAndPatientDeadContent
    );
    export const burnedOutButRescued = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt, Patient gerettet',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [],
        [],
        burnedOutButRescuedContent
    );
    export const onlyExtinguished = newTechnicalChallengeState(
        'Feuer gelöscht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [
            {
                targetState: patientDeadButExtinguished.id,
                guard: isPatientDead,
            },
            {
                targetState: treatedAndExtinguished.id,
                guard: isPatientRescued,
            },
        ],
        [rescuePatientTask.id],
        onlyExtinguishedContent
    );
    export const onlyDead = newTechnicalChallengeState(
        'Patient verstorben',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [
            {
                targetState: patientDeadButExtinguished.id,
                guard: {
                    type: 'taskGuard',
                    taskId: extinguishFireTask.id,
                    minProgress: 1,
                },
            },
            {
                targetState: burnedOutAndPatientDead.id,
                guard: {
                    type: 'timerGuard',
                    minProgress: 1,
                    timerId: vehicleBurnedOutTimerId,
                },
            },
        ],
        [extinguishFireTask.id],
        onlyDeadContent
    );
    export const onlyTreated = newTechnicalChallengeState(
        'Patient gerettet',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [
            {
                targetState: treatedAndExtinguished.id,
                guard: isFireExtinguished,
            },
            {
                targetState: burnedOutAndPatientDead.id,
                guard: isVehicleBurnedOut,
            },
        ],
        [extinguishFireTask.id],
        onlyTreatedContent
    );
    export const initialState = newTechnicalChallengeState(
        'Ausgangslage',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [
            {
                targetState: onlyExtinguished.id,
                guard: isFireExtinguished,
            },
            {
                targetState: onlyDead.id,
                guard: isPatientDead,
            },
            {
                targetState: onlyTreated.id,
                guard: isPatientRescued,
            },
        ],
        [extinguishFireTask.id, rescuePatientTask.id],
        initialContent
    );
}

function buildDefaultTechnicalChallengeTemplate(): TechnicalChallengeTemplate {
    const extinguishFireTask = StateMachineTesting.extinguishFireTask;
    const rescuePatientTask = StateMachineTesting.rescuePatientTask;
    const extinguishFireTaskDuration =
        StateMachineTesting.extinguishFireTaskDuration;
    const rescuePatientTaskDuration =
        StateMachineTesting.rescuePatientTaskDuration;
    const patientDeadTimerId = StateMachineTesting.patientDeadTimerId;
    const patientDeadTimerDuration =
        StateMachineTesting.patientDeadTimerDuration;
    const vehicleBurnedOutTimerId = StateMachineTesting.vehicleBurnedOutTimerId;
    const vehicleBurnedOutTimerDuration =
        StateMachineTesting.vehicleBurnedOutTimerDuration;
    const onlyExtinguished = StateMachineTesting.onlyExtinguished;
    const patientDeadButExtinguished =
        StateMachineTesting.patientDeadButExtinguished;
    const onlyDead = StateMachineTesting.onlyDead;
    const treatedAndExtinguished = StateMachineTesting.treatedAndExtinguished;
    const onlyTreated = StateMachineTesting.onlyTreated;
    const burnedOutAndPatientDead = StateMachineTesting.burnedOutAndPatientDead;
    const burnedOutButRescued = StateMachineTesting.burnedOutButRescued;
    const initialState = StateMachineTesting.initialState;

    const tasks: StateMachine['tasks'] = {
        [extinguishFireTask.id]: {
            taskTypeId: extinguishFireTask.id,
            totalDuration: extinguishFireTaskDuration,
        },
        [rescuePatientTask.id]: {
            taskTypeId: rescuePatientTask.id,
            totalDuration: rescuePatientTaskDuration,
        },
    };

    const timers: StateMachine['timers'] = {
        [patientDeadTimerId]: {
            id: patientDeadTimerId,
            totalDuration: patientDeadTimerDuration,
            name: 'Patient verstirbt',
        },
        [vehicleBurnedOutTimerId]: {
            id: vehicleBurnedOutTimerId,
            totalDuration: vehicleBurnedOutTimerDuration,
            name: 'Fahrzeug brennt aus',
        },
    };

    const states = TypeAssertedObject.fromEntries(
        [
            initialState,
            onlyExtinguished,
            onlyDead,
            onlyTreated,
            patientDeadButExtinguished,
            treatedAndExtinguished,
            burnedOutAndPatientDead,
            burnedOutButRescued,
        ].map<[StateMachineState['id'], StateMachineState]>(
            (state: StateMachineState) => [state.id, state]
        )
    ) as { [key: StateMachineState['id']]: StateMachineState };

    const stateMachineId =
        'd4c67365-0195-48ac-8514-c343353ffeb7' as StateMachine['id'];
    return {
        stateMachines: {
            [stateMachineId]: {
                id: stateMachineId,
                name: 'Beispiel Automat',
                initialStateId: initialState.id,
                currentStateId: initialState.id,
                states,
                tasks,
                timers,
                simulationStartTime: 0,
                taskTimeSpent: {},
                assignedPersonnel: {},
            },
        },
        id: '9d629cfb-440e-4fe1-9155-ffdb6f97248f',
        image: newImageProperties(
            '/assets/blue_car_broken_burning.png',
            100,
            1
        ),
        name: 'Brennendes Fahrzeug mit eingeklemmter Person',
    };
}

let _cachedTemplate: TechnicalChallengeTemplate | undefined;

/**
 * Lazily built to avoid circular dependency issues at module load time.
 * The template is cached after first access.
 */
export function getDefaultTechnicalChallengeTemplate(): TechnicalChallengeTemplate {
    _cachedTemplate ??= buildDefaultTechnicalChallengeTemplate();
    return _cachedTemplate;
}

export function getDefaultTasks(): { [key: UUID]: TaskType } {
    return {
        [StateMachineTesting.extinguishFireTask.id]:
            StateMachineTesting.extinguishFireTask,
        [StateMachineTesting.rescuePatientTask.id]:
            StateMachineTesting.rescuePatientTask,
    };
}
