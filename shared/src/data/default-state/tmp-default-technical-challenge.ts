import { uuid } from '../../index.js';
import type {
    Guard,
    TechnicalChallengeTemplate,
    Transition,
    UserGeneratedContent,
    UserGeneratedContentId,
    UUID,
} from '../../index.js';
import { newImageProperties } from '../../index.js';
import {
    newTechnicalChallengeState,
    newUserGeneratedContent,
} from '../../models/index.js';
import type { Task } from '../../models/task.js';
import { log } from '../../store/action-reducers/utils/log.js';

// TODO@Felix: remove this file

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
const contents = Object.fromEntries(
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

function buildDefaultTechnicalChallengeTemplate(): TechnicalChallengeTemplate {
    // --- Tasks ---
    const extinguishFireTask: Task = {
        id: '7eac4a83-99cd-406a-a4a3-d61b4d5b72bd',
        type: 'task',
        taskName: 'Feuer löschen',
    };
    const rescuePatientTask: Task = {
        id: '86fcf9d4-33b3-469e-9b4c-5bf25d88387b',
        type: 'task',
        taskName: 'Patient retten',
    };

    const relevantTasks = Object.fromEntries(
        [extinguishFireTask, rescuePatientTask].map((task) => [task.id, task])
    );

    // --- States ---
    const initialState = newTechnicalChallengeState(
        'Ausgangslage',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id, rescuePatientTask.id],
        initialContent.id
    );
    const onlyExtinguished = newTechnicalChallengeState(
        'Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [rescuePatientTask.id],
        onlyExtiguishedContent.id
    );
    const onlyDead = newTechnicalChallengeState(
        'Patient verstorben',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id],
        onlyDeadContent.id
    );
    const onlyTreated = newTechnicalChallengeState(
        'Patient gerettet',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id],
        onlyTreatedContent.id
    );
    const onlyBurnedOut = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [rescuePatientTask.id],
        onlyBurnedOutContent.id
    );
    const patientDeadButExtinguished = newTechnicalChallengeState(
        'Patient verstorben, Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [],
        patientDeadButExtinguishedContent.id
    );
    const treatedAndExtinguished = newTechnicalChallengeState(
        'Patient gerettet und Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [],
        treatedAndExtinguishedContent.id
    );
    const burnedOutAndPatientDead = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt und Patient verstorben',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [],
        burnedOutAndPatientDeadContent.id
    );
    const burnedOutButRescued = newTechnicalChallengeState(
        'Fahrzeug ausgebrannt, Patient gerettet',
        newImageProperties('/assets/blue_car_burned_out.png', 100, 1),
        [],
        burnedOutButRescuedContent.id
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

    // --- Guards ---
    // A guard is fulfilled when the task's progress exceeds minProgress.
    const isFireExtinguished: Guard = {
        type: 'progressGuard',
        minProgress: 10000,
        taskId: extinguishFireTask.id,
    };
    const isPatientRescued: Guard = {
        type: 'progressGuard',
        minProgress: 10000,
        taskId: rescuePatientTask.id,
    };
    const isPatientDead: Guard = {
        type: 'timerGuard',
        minTimePassed: 30_000,
    };
    const isVehicleBurnedOut: Guard = {
        type: 'timerGuard',
        minTimePassed: 60_000,
    };

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
    console.log('initalContent id: ' + initialContent.id);
    console.log(contents);
    return contents;
}
