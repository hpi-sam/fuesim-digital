import type {
    Guard,
    TechnicalChallengeTemplate,
    Transition,
    UUID,
} from '../../index.js';
import { newImageProperties } from '../../index.js';
import { createTechnicalChallengeState } from '../../models/index.js';
import type { Task } from '../../models/task.js';

// TODO@Felix: remove this file

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
    const initialState = createTechnicalChallengeState(
        'Ausgangslage',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id, rescuePatientTask.id]
    );
    const onlyExtinguished = createTechnicalChallengeState(
        'Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1),
        [rescuePatientTask.id]
    );
    const onlyDead = createTechnicalChallengeState(
        'Patient verstorben',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id]
    );
    const onlyTreated = createTechnicalChallengeState(
        'Patient gerettet',
        newImageProperties('/assets/blue_car_broken_burning.png', 100, 1),
        [extinguishFireTask.id]
    );
    const onlyBurnedOut = createTechnicalChallengeState(
        'Fahrzeug ausgebrannt',
        newImageProperties('/assets/blue_car_burnedOut.png', 100, 1),
        [rescuePatientTask.id]
    );
    const patientDeadButExtinguished = createTechnicalChallengeState(
        'Patient verstorben, Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1)
    );
    const treatedAndExtinguished = createTechnicalChallengeState(
        'Patient gerettet und Feuer geloescht',
        newImageProperties('/assets/blue_car_broken.png', 100, 1)
    );
    const burnedOutAndPatientDead = createTechnicalChallengeState(
        'Fahrzeug ausgebrannt und Patient verstorben',
        newImageProperties('/assets/blue_car_burnedOut.png', 100, 1)
    );
    const burnedOutButRescued = createTechnicalChallengeState(
        'Fahrzeug ausgebrannt, Patient gerettet',
        newImageProperties('/assets/blue_car_burnedOut.png', 100, 1)
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
        type: 'ProgressGuard',
        minProgress: 10000,
        taskId: extinguishFireTask.id,
    };
    const isPatientRescued: Guard = {
        type: 'ProgressGuard',
        minProgress: 10000,
        taskId: rescuePatientTask.id,
    };
    const isPatientDead: Guard = {
        type: 'TimerGuard',
        minTimePassed: 30_000,
    };
    const isVehicleBurnedOut: Guard = {
        type: 'TimerGuard',
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
