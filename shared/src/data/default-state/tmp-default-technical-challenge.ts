import {
    type Guard,
    newTechnicalChallengeState,
    type Transition,
} from '../../models/technical-challenge/state-machine.js';
import type { Task } from '../../models/task.js';
import type { TechnicalChallengeTemplate } from '../../models/technical-challenge/technical-challenge-template.js';
import { newImageProperties } from '../../models/utils/image-properties.js';
import type { UUID } from '../../utils/uuid.js';
import type { UserGeneratedContent } from '../../models/user-generated-content.js';

// TODO@Felix: move into state-machine.spec.ts
export namespace StateMachineTesting {
    // --- Tasks ---
    export const extinguishFireTask: Task = {
        id: '7eac4a83-99cd-406a-a4a3-d61b4d5b72bd',
        type: 'task',
        taskName: 'Feuer löschen',
    };
    export const rescuePatientTask: Task = {
        id: '86fcf9d4-33b3-469e-9b4c-5bf25d88387b',
        type: 'task',
        taskName: 'Patient retten',
    };

    // --- Guards ---
    // A guard is fulfilled when the task's progress exceeds minProgress.
    export const isFireExtinguished = {
        type: 'progressGuard',
        minProgress: 10000,
        taskId: extinguishFireTask.id,
        name: 'ist das Feuer gelöscht?',
    } satisfies Guard;
    export const isPatientRescued = {
        type: 'progressGuard',
        minProgress: 10000,
        taskId: rescuePatientTask.id,
        name: 'ist der Patient gerettet?',
    } satisfies Guard;
    export const isPatientDead = {
        type: 'timerGuard',
        minTimePassed: 30_000,
        name: 'ist der Patient tot?',
    } satisfies Guard;
    export const isVehicleBurnedOut = {
        type: 'timerGuard',
        minTimePassed: 60_000,
        name: 'ist das Fahrzeug ausgebrannt?',
    } satisfies Guard;

    // --- Contents ---
    const initialContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Was eine Schweinerei, jetzt mach mal was draus.</p>',
    };
    const onlyExtiguishedContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Feuer is nun weg, aber pass auf! Da is noch wer drin.</p>',
    };
    const onlyDeadContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Der hat schon seinen Körper verlassen.</p>',
    };
    const onlyTreatedContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Da is noch Feuer. Zum glück steckt keiner mehr drin.</p>',
    };
    const onlyBurnedOutContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Ein Wunder.</p>',
    };
    const patientDeadButExtinguishedContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Feuer is weg, aber zu spät.</p>',
    };
    const treatedAndExtinguishedContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Sehr vorbildlich, besser gehts kaum.</p>',
    };
    const burnedOutAndPatientDeadContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content: '<p>Wo waren eingentlich das Personal?</p>',
    };
    const burnedOutButRescuedContent: UserGeneratedContent = {
        type: 'userGeneratedContent',
        content:
            '<p>Grad noch mal glück gehabt. Hätte schlimmer kommen können.</p>',
    };

    // --- States ---
    export const initialState = newTechnicalChallengeState(
        'Ausgangslage',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id, rescuePatientTask.id],
        initialContent
    );
    export const onlyExtinguished = newTechnicalChallengeState(
        'Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [rescuePatientTask.id],
        onlyExtiguishedContent
    );
    export const onlyDead = newTechnicalChallengeState(
        'Patient verstorben',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id],
        onlyDeadContent
    );
    export const onlyTreated = newTechnicalChallengeState(
        'Patient gerettet',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id],
        onlyTreatedContent
    );
    export const onlyBurnedOut = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [rescuePatientTask.id],
        onlyBurnedOutContent
    );
    export const patientDeadButExtinguished = newTechnicalChallengeState(
        'Patient verstorben, Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [],
        patientDeadButExtinguishedContent
    );
    export const treatedAndExtinguished = newTechnicalChallengeState(
        'Patient gerettet und Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [],
        treatedAndExtinguishedContent
    );
    export const burnedOutAndPatientDead = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt und Patient verstorben',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [],
        burnedOutAndPatientDeadContent
    );
    export const burnedOutButRescued = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt, Patient gerettet',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [],
        burnedOutButRescuedContent
    );
}

function buildDefaultTechnicalChallengeTemplate(): TechnicalChallengeTemplate {
    const extinguishFireTask = StateMachineTesting.extinguishFireTask;
    const rescuePatientTask = StateMachineTesting.rescuePatientTask;
    const isFireExtinguished = StateMachineTesting.isFireExtinguished;
    const isVehicleBurnedOut = StateMachineTesting.isVehicleBurnedOut;
    const isPatientDead = StateMachineTesting.isPatientDead;
    const isPatientRescued = StateMachineTesting.isPatientRescued;
    const onlyExtinguished = StateMachineTesting.onlyExtinguished;
    const patientDeadButExtinguished =
        StateMachineTesting.patientDeadButExtinguished;
    const onlyDead = StateMachineTesting.onlyDead;
    const treatedAndExtinguished = StateMachineTesting.treatedAndExtinguished;
    const onlyTreated = StateMachineTesting.onlyTreated;
    const burnedOutAndPatientDead = StateMachineTesting.burnedOutAndPatientDead;
    const onlyBurnedOut = StateMachineTesting.onlyBurnedOut;
    const burnedOutButRescued = StateMachineTesting.burnedOutButRescued;
    const initialState = StateMachineTesting.initialState;

    const relevantTasks = Object.fromEntries(
        [extinguishFireTask, rescuePatientTask].map((task) => [task.id, task])
    );

    const states = Object.fromEntries(
        [
            initialState,
            onlyExtinguished,
            onlyDead,
            onlyTreated,
            onlyBurnedOut,
            patientDeadButExtinguished,
            treatedAndExtinguished,
            burnedOutAndPatientDead,
            burnedOutButRescued,
        ].map((state) => [state.id, state])
    );

    // --- Transitions ---
    const transitions: Transition[] = [
        // From initial state
        {
            id: 'ffcf3b26-d18b-44c3-b3c4-ff9b6a8b9d19',
            from: initialState.id,
            to: onlyExtinguished.id,
            guard: isFireExtinguished,
        },
        {
            id: 'e572cef1-c0d9-4855-a395-7a435bef1f76',
            from: initialState.id,
            to: onlyDead.id,
            guard: isPatientDead,
        },
        {
            id: '359d2925-bf59-4618-8801-477e027074fd',
            from: initialState.id,
            to: onlyTreated.id,
            guard: isPatientRescued,
        },
        {
            id: 'b0ea2ca8-85a8-4169-9e05-ccf63cf68cc4',
            from: initialState.id,
            to: onlyBurnedOut.id,
            guard: isVehicleBurnedOut,
        },

        // From onlyExtinguished
        {
            id: '9328e285-9dee-4b2f-8b15-5c10db861c0b',
            from: onlyExtinguished.id,
            to: patientDeadButExtinguished.id,
            guard: isPatientDead,
        },
        {
            id: '2ad70e61-9455-4389-b3be-d684fb30aa48',
            from: onlyExtinguished.id,
            to: treatedAndExtinguished.id,
            guard: isPatientRescued,
        },

        // From onlyDead
        {
            id: '97adb6fc-2c77-4f44-bfdb-d4f8706d2253',
            from: onlyDead.id,
            to: patientDeadButExtinguished.id,
            guard: isFireExtinguished,
        },
        {
            id: 'd68c4c2d-1ced-4a47-ac6e-785a8adbaa8b',
            from: onlyDead.id,
            to: burnedOutAndPatientDead.id,
            guard: isVehicleBurnedOut,
        },

        // From onlyTreated
        {
            id: '86bfb83e-1eda-45a5-8ad1-ad2e662acccc',
            from: onlyTreated.id,
            to: treatedAndExtinguished.id,
            guard: isFireExtinguished,
        },
        {
            id: 'efa85b02-4dbc-4c50-9719-1e52a6e35a69',
            from: onlyTreated.id,
            to: burnedOutAndPatientDead.id,
            guard: isVehicleBurnedOut,
        },

        // From onlyBurnedOut
        {
            id: 'e29dd599-b8f5-411a-ba47-dc32aaf49fea',
            from: onlyBurnedOut.id,
            to: burnedOutAndPatientDead.id,
            guard: isPatientDead,
        },
        {
            id: '3a846832-2306-4a32-817d-466dadabc486',
            from: onlyBurnedOut.id,
            to: burnedOutButRescued.id,
            guard: isPatientRescued,
        },
    ];

    return {
        initialStateId: initialState.id,
        id: '9d629cfb-440e-4fe1-9155-ffdb6f97248f',
        image: newImageProperties(
            '/assets/blue_car_broken_burning.png',
            100,
            1
        ),
        name: 'Brennendes Fahrzeug mit eingeklemmter Person',
        states,
        relevantTasks,
        transitions: Object.fromEntries(
            transitions.map((transition) => [transition.id, transition])
        ),
        simulationStartTime: 0,
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

export function getDefaultTasks(): { [key: UUID]: Task } {
    return getDefaultTechnicalChallengeTemplate().relevantTasks;
}
