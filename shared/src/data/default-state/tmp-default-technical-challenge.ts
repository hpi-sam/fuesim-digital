import {
    type Guard,
    newTechnicalChallengeState,
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
    const transitions = Object.fromEntries(
        [
            // From initial state
            {
                id: 'd4b68229-51d7-4575-a500-ec8b689fed92',
                from: initialState.id,
                to: onlyExtinguished.id,
                guard: isFireExtinguished,
            },
            {
                id: '5cb6f69e-3ecd-4f01-86cd-a8db251e55fd',
                from: initialState.id,
                to: onlyDead.id,
                guard: isPatientDead,
            },
            {
                id: '9b48ba3c-d301-4687-99ac-098d764e172e',
                from: initialState.id,
                to: onlyTreated.id,
                guard: isPatientRescued,
            },
            {
                id: '7ad0f40e-21d4-4ff6-90ed-d7437b37b979',
                from: initialState.id,
                to: onlyBurnedOut.id,
                guard: isVehicleBurnedOut,
            },

            // From onlyExtinguished
            {
                id: '6f4d2832-9614-4be6-b114-ee9b751c1f82',
                from: onlyExtinguished.id,
                to: patientDeadButExtinguished.id,
                guard: isPatientDead,
            },
            {
                id: 'c31091e1-c452-44c5-b592-5db58b450ba0',
                from: onlyExtinguished.id,
                to: treatedAndExtinguished.id,
                guard: isPatientRescued,
            },

            // From onlyDead
            {
                id: '4131c822-c475-4ea1-9256-3e06e11b8f9f',
                from: onlyDead.id,
                to: patientDeadButExtinguished.id,
                guard: isFireExtinguished,
            },
            {
                id: '7d1ca6a1-335a-4805-81ff-45da1c48eda1',
                from: onlyDead.id,
                to: burnedOutAndPatientDead.id,
                guard: isVehicleBurnedOut,
            },

            // From onlyTreated
            {
                id: '131d9f2a-1831-4f64-9276-1acd6e5bc42b',
                from: onlyTreated.id,
                to: treatedAndExtinguished.id,
                guard: isFireExtinguished,
            },
            {
                id: '008c9dd1-b4b8-4730-846c-6ee6657f211d',
                from: onlyTreated.id,
                to: burnedOutAndPatientDead.id,
                guard: isVehicleBurnedOut,
            },

            // From onlyBurnedOut
            {
                id: '17841f63-54de-431f-9650-9e03e3c6e3f6',
                from: onlyBurnedOut.id,
                to: burnedOutAndPatientDead.id,
                guard: isPatientDead,
            },
            {
                id: '281d061d-b18c-49c4-9b8a-bc332de54302',
                from: onlyBurnedOut.id,
                to: burnedOutButRescued.id,
                guard: isPatientRescued,
            },
        ].map((t) => [t.id, t])
    );

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
        transitions,
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
    return Object.fromEntries(
        [
            StateMachineTesting.extinguishFireTask,
            StateMachineTesting.rescuePatientTask,
        ].map((t) => [t.id, t])
    );
}
