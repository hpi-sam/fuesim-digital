describe('A trainer on the exercise page', () => {
    beforeEach(() => {
        cy.createExercise().joinExerciseAsTrainer().initializeTrainerSocket();
    });

    it('can download patients as CSV', () => {
        cy.get('[data-cy="patientsAccordionButton"]').click();
        cy.log('load a patient to the map').dragToMap(
            '[data-cy=draggablePatientDiv]'
        );
        cy.closeAllToasts();
        cy.get('[data-cy="exportMenuButton"').click();
        cy.get('[data-cy="exportPatientsCsvButton"]').click();
        cy.get('@participantKey', { log: false }).then((participantKey) => {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            cy.readFile(`cypress/downloads/patienten-${participantKey}.csv`);
        });
    });
});
