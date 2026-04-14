import {
    type Guard,
    newTechnicalChallengeState,
    type Transition,
} from '../../models/technical-challenge/state-machine.js';
import type { Task } from '../../models/task.js';
import type { TechnicalChallengeTemplate } from '../../models/technical-challenge/technical-challenge-template.js';
import { newImageProperties } from '../../models/utils/image-properties.js';
import type { UUID } from '../../utils/uuid.js';
import type {
    UserGeneratedContent,
    UserGeneratedContentId,
} from '../../models/user-generated-content.js';

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
    export const isFireExtinguished: Guard = {
        type: 'progressGuard',
        minProgress: 10000,
        taskId: extinguishFireTask.id,
        name: 'ist das Feuer gelöscht?',
    };
    export const isPatientRescued: Guard = {
        type: 'progressGuard',
        minProgress: 10000,
        taskId: rescuePatientTask.id,
        name: 'ist der Patient gerettet?',
    };
    export const isPatientDead: Guard = {
        type: 'timerGuard',
        minTimePassed: 30_000,
        name: 'ist der Patient tot?',
    };
    export const isVehicleBurnedOut: Guard = {
        type: 'timerGuard',
        minTimePassed: 60_000,
        name: 'ist das Fahrzeug ausgebrannt?',
    };

    // --- Contents ---
    const initialContent: UserGeneratedContent = {
        id: '7eac4a83-99cd-406a-a4a3-d61b4d5b72bd' as UserGeneratedContentId,
        type: 'userGeneratedContent',
        content: 'Was eine Schweinerei, jetzt mach mal was draus.',
    };
    const onlyExtiguishedContent: UserGeneratedContent = {
        id: 'bbc61783-aed7-441f-9637-165b39e72b56' as UserGeneratedContentId,
        type: 'userGeneratedContent',
        content: 'Feuer is nun weg, aber pass auf! Da is noch wer drin.',
    };
    const onlyDeadContent: UserGeneratedContent = {
        id: 'a7a821a4-a4bc-44c6-a000-85ffba6b2b86' as UserGeneratedContentId,
        type: 'userGeneratedContent',
        content: 'Der hat schon seinen Körper verlassen.',
    };
    const onlyTreatedContent: UserGeneratedContent = {
        id: '295a0f00-9097-49f8-b236-7dc8070772ff' as UserGeneratedContentId,
        type: 'userGeneratedContent',
        content: 'Da is noch Feuer. Zum glück steckt keiner mehr drin.',
    };
    const onlyBurnedOutContent: UserGeneratedContent = {
        id: '64a92a4b-6860-4296-a06e-18e723ebd96e' as UserGeneratedContentId,
        type: 'userGeneratedContent',
        content: 'Ein Wunder.',
    };
    const patientDeadButExtinguishedContent: UserGeneratedContent = {
        id: 'e6c7e148-0172-4fdc-b4e2-b80f2c28d4df' as UserGeneratedContentId,
        type: 'userGeneratedContent',
        content: 'Feuer is weg, aber zu spät.',
    };
    const treatedAndExtinguishedContent: UserGeneratedContent = {
        id: '489288c0-e32e-4028-8dc5-3c6c76ca2e88' as UserGeneratedContentId,
        type: 'userGeneratedContent',
        content: 'Sehr vorbildlich, besser gehts kaum.',
    };
    const burnedOutAndPatientDeadContent: UserGeneratedContent = {
        id: '0aafeb9d-d934-4951-a3ba-6a2c58be0183' as UserGeneratedContentId,
        type: 'userGeneratedContent',
        content: 'Wo waren eingentlich das Personal?',
    };
    const burnedOutButRescuedContent: UserGeneratedContent = {
        id: 'cc94d311-c8e4-41c0-a23a-b39f97fcb551' as UserGeneratedContentId,
        type: 'userGeneratedContent',
        content: 'Grad noch mal glück gehabt. Hätte schlimmer kommen können.',
    };
    export const contents = Object.fromEntries(
        [
            initialContent,
            onlyExtiguishedContent,
            onlyDeadContent,
            onlyTreatedContent,
            onlyBurnedOutContent,
            patientDeadButExtinguishedContent,
            treatedAndExtinguishedContent,
            burnedOutAndPatientDeadContent,
            burnedOutButRescuedContent,
        ].map((content) => [content.id, content])
    );

    // --- States ---
    export const initialState = newTechnicalChallengeState(
        'Ausgangslage',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id, rescuePatientTask.id],
        initialContent.id
    );
    export const onlyExtinguished = newTechnicalChallengeState(
        'Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [rescuePatientTask.id],
        onlyExtiguishedContent.id
    );
    export const onlyDead = newTechnicalChallengeState(
        'Patient verstorben',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id],
        onlyDeadContent.id
    );
    export const onlyTreated = newTechnicalChallengeState(
        'Patient gerettet',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id],
        onlyTreatedContent.id
    );
    export const onlyBurnedOut = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [rescuePatientTask.id],
        onlyBurnedOutContent.id
    );
    export const patientDeadButExtinguished = newTechnicalChallengeState(
        'Patient verstorben, Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [],
        patientDeadButExtinguishedContent.id
    );
    export const treatedAndExtinguished = newTechnicalChallengeState(
        'Patient gerettet und Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [],
        treatedAndExtinguishedContent.id
    );
    export const burnedOutAndPatientDead = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt und Patient verstorben',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [],
        burnedOutAndPatientDeadContent.id
    );
    export const burnedOutButRescued = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt, Patient gerettet',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [],
        burnedOutButRescuedContent.id
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
            from: initialState.id,
            to: onlyExtinguished.id,
            guard: isFireExtinguished,
        },
        { from: initialState.id, to: onlyDead.id, guard: isPatientDead },
        {
            from: initialState.id,
            to: onlyTreated.id,
            guard: isPatientRescued,
        },
        {
            from: initialState.id,
            to: onlyBurnedOut.id,
            guard: isVehicleBurnedOut,
        },

        // From onlyExtinguished
        {
            from: onlyExtinguished.id,
            to: patientDeadButExtinguished.id,
            guard: isPatientDead,
        },
        {
            from: onlyExtinguished.id,
            to: treatedAndExtinguished.id,
            guard: isPatientRescued,
        },

        // From onlyDead
        {
            from: onlyDead.id,
            to: patientDeadButExtinguished.id,
            guard: isFireExtinguished,
        },
        {
            from: onlyDead.id,
            to: burnedOutAndPatientDead.id,
            guard: isVehicleBurnedOut,
        },

        // From onlyTreated
        {
            from: onlyTreated.id,
            to: treatedAndExtinguished.id,
            guard: isFireExtinguished,
        },
        {
            from: onlyTreated.id,
            to: burnedOutAndPatientDead.id,
            guard: isVehicleBurnedOut,
        },

        // From onlyBurnedOut
        {
            from: onlyBurnedOut.id,
            to: burnedOutAndPatientDead.id,
            guard: isPatientDead,
        },
        {
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
    return getDefaultTechnicalChallengeTemplate().relevantTasks;
}

export function getDefaultUserGeneratedContents(): {
    [key: UUID]: UserGeneratedContent;
} {
    return StateMachineTesting.contents;
}
