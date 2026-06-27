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
        {},
        [],
        patientDeadButExtinguishedContent
    );
    export const treatedAndExtinguished = newTechnicalChallengeState(
        'Patient gerettet und Feuer gelöscht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        {},
        [],
        treatedAndExtinguishedContent
    );
    export const burnedOutAndPatientDead = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt und Patient verstorben',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        {},
        [],
        burnedOutAndPatientDeadContent
    );
    export const burnedOutButRescued = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt, Patient gerettet',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        {},
        [],
        burnedOutButRescuedContent
    );
    export const onlyExtinguished = newTechnicalChallengeState(
        'Feuer gelöscht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        {
            '0e9f2d6c-203b-4e43-8a11-d68601d0fa6b': {
                id: '0e9f2d6c-203b-4e43-8a11-d68601d0fa6b',
                targetState: patientDeadButExtinguished.id,
                guard: isPatientDead,
            },
            'd57ffc18-8207-42d9-aeb1-365507f0213b': {
                id: 'd57ffc18-8207-42d9-aeb1-365507f0213b',
                targetState: treatedAndExtinguished.id,
                guard: isPatientRescued,
            },
        },
        [rescuePatientTask.id],
        onlyExtinguishedContent
    );
    export const onlyDead = newTechnicalChallengeState(
        'Patient verstorben',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        {
            '233fc7e3-d31a-4d87-8c5f-b2a5aa8448c3': {
                id: '233fc7e3-d31a-4d87-8c5f-b2a5aa8448c3',
                targetState: patientDeadButExtinguished.id,
                guard: {
                    type: 'taskGuard',
                    taskId: extinguishFireTask.id,
                    minProgress: 1,
                },
            },
            'b205f9c2-0f91-495a-8371-62e5c60ab766': {
                id: 'b205f9c2-0f91-495a-8371-62e5c60ab766',
                targetState: burnedOutAndPatientDead.id,
                guard: {
                    type: 'timerGuard',
                    minProgress: 1,
                    timerId: vehicleBurnedOutTimerId,
                },
            },
        },
        [extinguishFireTask.id],
        onlyDeadContent
    );
    export const onlyTreated = newTechnicalChallengeState(
        'Patient gerettet',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        {
            '8bd99da3-1ea4-46f4-a206-6e6552d758e8': {
                id: '8bd99da3-1ea4-46f4-a206-6e6552d758e8',
                targetState: treatedAndExtinguished.id,
                guard: isFireExtinguished,
            },
            '4b56a9eb-2eb4-4033-bb4c-656953da0f83': {
                id: '4b56a9eb-2eb4-4033-bb4c-656953da0f83',
                targetState: burnedOutAndPatientDead.id,
                guard: isVehicleBurnedOut,
            },
        },
        [extinguishFireTask.id],
        onlyTreatedContent
    );
    export const initialState = newTechnicalChallengeState(
        'Ausgangslage',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        {
            'c10a2eaa-3c9a-444c-bd1d-12bdcb6ad512': {
                id: 'c10a2eaa-3c9a-444c-bd1d-12bdcb6ad512',
                targetState: onlyExtinguished.id,
                guard: isFireExtinguished,
            },
            '96ddef08-e7e5-426a-bde5-ccf8f35a308a': {
                id: '96ddef08-e7e5-426a-bde5-ccf8f35a308a',
                targetState: onlyDead.id,
                guard: isPatientDead,
            },
            '4becf84d-8a47-4d11-9705-014f2241c3cf': {
                id: '4becf84d-8a47-4d11-9705-014f2241c3cf',
                targetState: onlyTreated.id,
                guard: isPatientRescued,
            },
        },
        [extinguishFireTask.id, rescuePatientTask.id],
        initialContent
    );

    // ====================================================================
    // Kellerexplosion in Mehrfamilienhaus
    // ====================================================================

    // --- Task Types ---

    export const searchTask: TaskType = {
        id: 'a1b2c3d4-e5f6-4890-8bcd-ef1234567890' as TaskType['id'],
        type: 'taskType',
        taskName: 'Suche',
    };
    export const firstAidTask: TaskType = {
        id: 'c3d4e5f6-a7b8-4012-adef-123456789012' as TaskType['id'],
        type: 'taskType',
        taskName: 'Erstversorgung',
    };
    export const shoringTask: TaskType = {
        id: 'd4e5f6a7-b8c9-4123-bef0-234567890123' as TaskType['id'],
        type: 'taskType',
        taskName: 'Abstützung',
    };
    export const debrisClearingTask: TaskType = {
        id: 'e5f6a7b8-c9d0-4234-8f01-345678901234' as TaskType['id'],
        type: 'taskType',
        taskName: 'Trümmerräumung',
    };

    // --- Task Durations ---

    export const searchTaskDuration = 45_000;
    export const firstAidTaskDuration = 30_000;
    export const shoringTaskDuration = 120_000;
    export const debrisClearingTaskDuration = 90_000;
    export const technicalExtricationTaskDuration = 80_000;

    // --- Timer IDs & Durations ---

    export const secondaryCollapseTimerId =
        'f6a7b8c9-d0e1-4345-9012-456789012345' as TimerGuard['timerId'];
    export const secondaryCollapseTimerDuration = 150_000;
    export const survivalTimerId =
        'a7b8c9d0-e1f2-4456-a123-567890123456' as TimerGuard['timerId'];
    export const survivalTimerDuration = 200_000;
    export const lossOfConsciousnessTimerId =
        'b8c9d0e1-f2a3-4567-b234-678901234567' as TimerGuard['timerId'];
    export const lossOfConsciousnessTimerDuration = 100_000;

    // --- Guards ---

    export const isShoringComplete = {
        type: 'taskGuard',
        minProgress: 1,
        taskId: shoringTask.id,
    } as const;
    export const isDebrisCleared = {
        type: 'taskGuard',
        minProgress: 1,
        taskId: debrisClearingTask.id,
    } as const;
    export const isSecondaryCollapse = {
        type: 'timerGuard',
        minProgress: 1,
        timerId: secondaryCollapseTimerId,
    } as const;
    export const isSearchComplete = {
        type: 'taskGuard',
        minProgress: 1,
        taskId: searchTask.id,
    } as const;
    export const isPersonExtricated = {
        type: 'taskGuard',
        minProgress: 1,
        taskId: rescuePatientTask.id,
    } as const;
    export const isSurvivalTimerExpired = {
        type: 'timerGuard',
        minProgress: 1,
        timerId: survivalTimerId,
    } as const;
    export const isPersonUnconscious = {
        type: 'timerGuard',
        minProgress: 1,
        timerId: lossOfConsciousnessTimerId,
    } as const;
    export const isFirstAidComplete = {
        type: 'taskGuard',
        minProgress: 1,
        taskId: firstAidTask.id,
    } as const;

    // --- SM1 States (Struktursicherung) ---

    export const sm1AccessSecured = newTechnicalChallengeState(
        'Zugang gesichert',
        newImageProperties(
            '/assets/kellerexplosion/shored_and_cleared.png',
            300,
            1
        ),
        {},
        [],
        {
            type: 'userGeneratedContent',
            content:
                '<p>Die Einsturzstelle ist gesichert. Der Zugang ist freigegeben.</p>',
        }
    );
    export const sm1SecondaryCollapse = newTechnicalChallengeState(
        'Nachsturz eingetreten',
        newImageProperties(
            '/assets/kellerexplosion/secondary_collapse.png',
            300,
            1
        ),
        {},
        [],
        {
            type: 'userGeneratedContent',
            content:
                '<p>Ein Nachsturz hat die Einsturzstelle erneut verschüttet. Der Zugang ist nicht mehr passierbar.</p>',
        }
    );
    export const sm1StructureUnstable = newTechnicalChallengeState(
        'Einsturzstelle instabil',
        newImageProperties('/assets/kellerexplosion/base.png', 300, 1),
        {
            '6b7eb0ec-b264-4a44-88d6-ec2189cb4ee1': {
                id: '6b7eb0ec-b264-4a44-88d6-ec2189cb4ee1',
                targetState: sm1AccessSecured.id,
                guard: {
                    type: 'andGuard',
                    guards: [isShoringComplete, isDebrisCleared],
                },
            },
            '46dcf246-3fe7-46ac-918a-7624608a2b19': {
                id: '46dcf246-3fe7-46ac-918a-7624608a2b19',
                targetState: sm1SecondaryCollapse.id,
                guard: isSecondaryCollapse,
            },
        },
        [shoringTask.id, debrisClearingTask.id],
        {
            type: 'userGeneratedContent',
            content:
                '<p>Die Einsturzstelle ist instabil. Struktur muss abgestützt und der Zugang freigeräumt werden – beide Maßnahmen müssen abgeschlossen sein, bevor ein sicheres Vorgehen möglich ist.</p>',
        }
    );

    // --- SM2 States (Personenrettung) ---

    export const sm2RescueSuccessful = newTechnicalChallengeState(
        'Rettung erfolgreich',
        // TODO: Replace with an image fitting a successful basement rescue
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        {},
        [],
        {
            type: 'userGeneratedContent',
            content:
                '<p>Die Person wurde erfolgreich gerettet und befindet sich in einem stabilen Zustand.</p>',
        }
    );
    export const sm2PersonCritical = newTechnicalChallengeState(
        'Person notversorgt',
        // TODO: Replace with an image fitting a critically injured person from a basement explosion
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        {},
        [],
        {
            type: 'userGeneratedContent',
            content:
                '<p>Die Person wurde gerettet, befindet sich jedoch in einem kritischen Zustand.</p>',
        }
    );
    export const sm2PersonDeceased = newTechnicalChallengeState(
        'Person verstorben',
        // TODO: Replace with an image fitting a fatal basement explosion outcome
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        {},
        [],
        {
            type: 'userGeneratedContent',
            content:
                '<p>Die Person ist ihren Verletzungen erlegen. Die Rettung kam zu spät.</p>',
        }
    );
    export const sm2PersonExtricatedConscious = newTechnicalChallengeState(
        'Person befreit (bei Bewusstsein)',
        // TODO: Replace with an image fitting a conscious person being treated after basement rescue
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        {
            'ce9c7493-1520-4077-a0dc-e008149346e4': {
                id: 'ce9c7493-1520-4077-a0dc-e008149346e4',
                targetState: sm2RescueSuccessful.id,
                guard: isFirstAidComplete,
            },
        },
        [firstAidTask.id],
        {
            type: 'userGeneratedContent',
            content:
                '<p>Die Person wurde befreit und ist noch ansprechbar. Erstversorgung einleiten.</p>',
        }
    );
    export const sm2PersonExtricatedUnconscious = newTechnicalChallengeState(
        'Person befreit (bewusstlos)',
        // TODO: Replace with an image fitting an unconscious person being treated after basement rescue
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        {
            '5d2633d4-108e-42a0-8569-2dee6fa50d7d': {
                id: '5d2633d4-108e-42a0-8569-2dee6fa50d7d',
                targetState: sm2PersonCritical.id,
                guard: isFirstAidComplete,
            },
        },
        [firstAidTask.id],
        {
            type: 'userGeneratedContent',
            content:
                '<p>Die Person wurde befreit, ist jedoch nicht mehr ansprechbar. Sofortige Erstversorgung erforderlich.</p>',
        }
    );
    export const sm2PersonLocated = newTechnicalChallengeState(
        'Person gefunden',
        // TODO: Replace with an image fitting a person found trapped under rubble in a basement
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        {
            'e5919d18-0115-4a67-8d50-96769a33a838': {
                id: 'e5919d18-0115-4a67-8d50-96769a33a838',
                targetState: sm2PersonExtricatedConscious.id,
                guard: {
                    type: 'andGuard',
                    guards: [
                        isPersonExtricated,
                        { type: 'notGuard', guard: isPersonUnconscious },
                    ],
                },
            },
            'a19e470c-d6c8-48ac-9e74-e349294ab11d': {
                id: 'a19e470c-d6c8-48ac-9e74-e349294ab11d',
                targetState: sm2PersonExtricatedUnconscious.id,
                guard: {
                    type: 'andGuard',
                    guards: [isPersonExtricated, isPersonUnconscious],
                },
            },
            '0dd0b2bb-a4fc-493e-9d22-0a0519f9c692': {
                id: '0dd0b2bb-a4fc-493e-9d22-0a0519f9c692',
                targetState: sm2PersonDeceased.id,
                guard: isSurvivalTimerExpired,
            },
        },
        [rescuePatientTask.id],
        {
            type: 'userGeneratedContent',
            content:
                '<p>Die vermisste Person wurde lokalisiert. Sie ist unter Trümmern eingeklemmt und benötigt technische Befreiung.</p>',
        }
    );
    export const sm2PersonMissing = newTechnicalChallengeState(
        'Person vermisst',
        // TODO: Replace with an image fitting a basement explosion scene with a missing person
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        {
            'ba50f4bb-4611-40ff-8b86-e90fb84be623': {
                id: 'ba50f4bb-4611-40ff-8b86-e90fb84be623',
                targetState: sm2PersonLocated.id,
                guard: isSearchComplete,
            },
            'cf48c05f-39e6-44be-862b-e5335a1fc5dc': {
                id: 'cf48c05f-39e6-44be-862b-e5335a1fc5dc',
                targetState: sm2PersonDeceased.id,
                guard: isSurvivalTimerExpired,
            },
        },
        [searchTask.id],
        {
            type: 'userGeneratedContent',
            content:
                '<p>Im Keller des Gebäudes wird eine Person vermisst. Letzte bekannte Position: Heizungsraum.</p>',
        }
    );

    export const defaultStateMachineId =
        'd4c67365-0195-48ac-8514-c343353ffeb7' as StateMachine['id'];
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
    const stateMachineId = StateMachineTesting.defaultStateMachineId;

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
        [StateMachineTesting.searchTask.id]: StateMachineTesting.searchTask,
        [StateMachineTesting.firstAidTask.id]: StateMachineTesting.firstAidTask,
        [StateMachineTesting.shoringTask.id]: StateMachineTesting.shoringTask,
        [StateMachineTesting.debrisClearingTask.id]:
            StateMachineTesting.debrisClearingTask,
    };
}
