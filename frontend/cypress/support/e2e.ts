/* eslint-disable @typescript-eslint/method-signature-style */
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// When a command from ./commands is ready to use, import with `import './commands'` syntax

import type { JsonObject } from 'fuesim-digital-shared';
import {
    dragToMap,
    store,
    createExercise,
    joinExerciseAsTrainer,
    joinExerciseAsParticipant,
    getState,
    firstElement,
    lastElement,
    atPosition,
    itsKeys,
    itsValues,
    initializeParticipantSocket,
    initializeTrainerSocket,
    atKey,
    closeAllToasts,
} from './commands';
declare global {
    namespace Cypress {
        interface Chainable {
            dragToMap(
                elementSelector: string,
                offset?: { x: number; y: number }
            ): Chainable;
            store(): Chainable;
            getState(): Chainable;
            createExercise(): Chainable;
            joinExerciseAsTrainer(): Chainable;
            joinExerciseAsParticipant(): Chainable;
            closeAllToasts(): Chainable;
            firstElement(): Chainable;
            lastElement(): Chainable;
            atPosition(n: number): Chainable;
            itsKeys(): Chainable;
            itsValues(): Chainable;
            initializeParticipantSocket(): Chainable;
            initializeTrainerSocket(): Chainable;
            atKey(key: string): Chainable;
        }
    }
}

Cypress.Commands.addAll<keyof Cypress.Chainable, unknown[]>(
    { prevSubject: true },
    {
        firstElement,
        lastElement,
        atPosition,
    }
);

Cypress.Commands.addAll<keyof Cypress.Chainable, JsonObject>(
    { prevSubject: true },
    {
        itsKeys,
        itsValues,
        atKey,
    }
);

Cypress.Commands.addAll({
    dragToMap,
    store,
    getState,
    createExercise,
    joinExerciseAsParticipant,
    joinExerciseAsTrainer,
    closeAllToasts,
    initializeParticipantSocket,
    initializeTrainerSocket,
});
