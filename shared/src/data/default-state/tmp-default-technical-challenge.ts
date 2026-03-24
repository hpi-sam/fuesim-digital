import type {
    Guard,
    TechnicalChallengeTemplate,
    Transition,
} from '../../index.js';
import { createTechnicalChallengeState } from '../../models/technical-challenge/state-machine.js';
import type { Task } from '../../models/task.js';
import { uuid } from '../../utils/index.js';
import { defaultMapImagesTemplates } from './map-images-templates.js';

// TODO@Felix: remove this file

function buildDefaultTechnicalChallengeTemplate(): TechnicalChallengeTemplate {
    // --- States ---
    const initialState = createTechnicalChallengeState('Ausgangslage');
    const onlyExtinguished = createTechnicalChallengeState('Feuer geloescht');
    const onlyDead = createTechnicalChallengeState('Patient verstorben');
    const onlyTreated = createTechnicalChallengeState('Patient gerettet');
    const onlyBurnedOut = createTechnicalChallengeState('Fahrzeug ausgebrannt');
    const patientDeadButExtinguished = createTechnicalChallengeState(
        'Patient verstorben, Feuer geloescht'
    );
    const treatedAndExtinguished = createTechnicalChallengeState(
        'Patient gerettet und Feuer geloescht'
    );
    const burnedOutAndPatientDead = createTechnicalChallengeState(
        'Fahrzeug ausgebrannt und Patient verstorben'
    );
    const burnedOutButRescued = createTechnicalChallengeState(
        'Fahrzeug ausgebrannt, Patient gerettet'
    );

    const states: State[] = [
        initialState,
        onlyExtinguished,
        onlyDead,
        onlyTreated,
        onlyBurnedOut,
        patientDeadButExtinguished,
        treatedAndExtinguished,
        burnedOutAndPatientDead,
        burnedOutButRescued,
    ];

    // --- Tasks ---
    const extinguishFireTask: Task = {
        id: uuid(),
        type: 'task',
        taskName: 'Feuer loeschen',
    };
    const rescuePatientTask: Task = {
        id: uuid(),
        type: 'task',
        taskName: 'Patient retten',
    };
    const patientDeadTask: Task = {
        id: uuid(),
        type: 'task',
        taskName: 'Patient verstorben',
    };
    const vehicleBurnedOutTask: Task = {
        id: uuid(),
        type: 'task',
        taskName: 'Fahrzeug ausgebrannt',
    };

    const relevantTasks: Task[] = [
        extinguishFireTask,
        rescuePatientTask,
        patientDeadTask,
        vehicleBurnedOutTask,
    ];

    // --- Guards ---
    // A guard is fulfilled when the task's progress exceeds minProgress.
    const isFireExtinguished: Guard = {
        type: 'ProgressGuard',
        minProgress: 100,
        taskId: extinguishFireTask.id,
    };
    const isPatientRescued: Guard = {
        type: 'ProgressGuard',
        minProgress: 100,
        taskId: rescuePatientTask.id,
    };
    const isPatientDead: Guard = {
        type: 'ProgressGuard',
        minProgress: 100,
        taskId: patientDeadTask.id,
    };
    const isVehicleBurnedOut: Guard = {
        type: 'ProgressGuard',
        minProgress: 100,
        taskId: vehicleBurnedOutTask.id,
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
        image: defaultMapImagesTemplates.at(1)!.image,
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
