function createCollection(name: string) {
    cy.visit('/collections');
    cy.get('[data-cy="create-new-collection-btn"]').click();

    cy.get('[data-cy="collectionCreationModalTitleInput"]').type(name);
    cy.get('[data-cy="collectionCreationModalSubmitBtn"]').click();
}

describe('A trainer in the marketplace', () => {
    let collectionName: string;
    let collectionId: string;
    const findOurCollection = () =>
        cy.get(`[data-cy="collectionCard"][title="${collectionName}"]`);
    const goToOurCollection = () => cy.visit(`/collections/${collectionId}`);

    beforeEach(() => {
        cy.visit('http://localhost:3201/api/auth/indev-generate-token');
        cy.getCookie('fuesim_session').should('exist');
        collectionName = Math.random().toString(36).slice(2, 15);
        createCollection(collectionName);
        findOurCollection()
            .invoke('attr', 'data-entity')
            .then((id) => {
                expect(id).to.be.a('string');
                collectionId = id!;
            });
    });

    it('can create a new Collection', () => {
        findOurCollection()
            .find('[data-cy="collectionCardTitle"]')
            .should('have.text', collectionName);
    });

    it('can manage templates inside a collection and use them inside an exericse', () => {
        goToOurCollection();

        const getTemplates = (type: string) =>
            cy.get(`[data-cy="${type}_elements_list"]`).children();

        cy.get('[data-cy="collectionDetailsTitle"]').should(
            'have.text',
            collectionName
        );

        // Create Vehicle Templates
        cy.get('[data-cy="create_vehicleTemplate_button"]').click();

        const vehicleName = 'RTW ???';

        cy.get('[data-cy="vehicleTypeInput"]').type('RTW');
        cy.get('[data-cy="vehicleNameInput"]').type(vehicleName);
        cy.get('[data-cy="imageUrlInput"]').type('https://placehold.co/300');

        cy.get('[data-cy="submitTemplateFormButton"]').click();

        getTemplates('vehicleTemplate')
            .first()
            .should('include.text', vehicleName);

        // Create Alarmgroups
        cy.get('[data-cy="create_alarmGroup_button"]').click();

        const alarmGroupName = 'MANV';

        cy.get('[data-cy="alarmGroupNameInput"]').type(alarmGroupName);

        cy.get('[data-cy="addVehicleButton"]').click();
        cy.get('[data-cy="addVehicleDropdown"]').children().first().click();
        cy.get('[data-cy="addVehicleButton"]').click();

        cy.get('[data-cy="submitTemplateFormButton"]').click();

        getTemplates('alarmGroup')
            .first()
            .should('include.text', alarmGroupName);
        getTemplates('alarmGroup')
            .first()
            .find('[data-cy="elementCardSubtitle"]')
            .first()
            .invoke('text')
            .then((text) => {
                expect(text.trim()).to.eq('1 Fahrzeuge');
            });

        // Duplicate Template
        getTemplates('vehicleTemplate')
            .eq(0)
            .find('[data-cy="duplicateElementButton"]')
            .click();
        getTemplates('vehicleTemplate')
            .eq(0)
            .find('[data-cy="duplicateInSameCollectionButton"]')
            .click();

        getTemplates('vehicleTemplate').should('have.length', 2);
        getTemplates('vehicleTemplate')
            .eq(1)
            .should('include.text', 'Kopie von');

        // Delete Template
        getTemplates('vehicleTemplate').should('have.length', 2);
        getTemplates('vehicleTemplate')
            .eq(1)
            .should('include.text', 'Kopie von');

        getTemplates('vehicleTemplate')
            .eq(0)
            .find('[data-cy="deleteElementButton"]')
            .click();

        cy.get('[data-cy="confirmationModal"]').should('be.visible');
        cy.get('[data-cy="confirmationModalTitle"]').should(
            'have.text',
            'Element löschen'
        );
        cy.get('[data-cy="confirmationModalOkButton"]').click();

        cy.get('[data-cy="confirmationModal"]').should('be.visible');
        cy.get('[data-cy="confirmationModalTitle"]').should(
            'have.text',
            'Element in weiteren Elementen verwendet'
        );
        cy.get('[data-cy="confirmationModalOkButton"]').click();

        cy.wait(500);

        getTemplates('alarmGroup')
            .first()
            .find('[data-cy="elementCardSubtitle"]')
            .first()
            .invoke('text')
            .then((text) => {
                expect(text.trim()).to.eq('0 Fahrzeuge');
            });

        // Collection Dependencies
        cy.get('[data-cy="collectionUsedCollectionsTabButton"]').click();
        cy.get('[data-cy="addDependencyCollectionButton"]').click();

        cy.get(
            '[data-cy="availableCollectionItem"][data-visibility="embedded"]'
        )
            .find('[data-cy="selectCollectionButton"]')
            .should('exist')
            .click();

        cy.get('[data-cy="confirmCollectionSelectionButton"]')
            .should('exist')
            .click();

        cy.get('[data-cy="usedCollectionsList"]')
            .children()
            .should('have.length', 1);

        cy.get('[data-cy="collectionElementsTabButton"]').click();

        getTemplates('alarmGroup')
            .first()
            .find('[data-cy="editElementButton"]')
            .click();
        cy.get('[data-cy="versionedElementModal"]').should('be.visible');

        cy.get('[data-cy="addVehicleButton"]').click();
        cy.get('[data-cy="addVehicleDropdown"]')
            .find('[data-vehicle-type="RTW"]')
            .click();
        cy.get('[data-cy="addVehicleButton"]').click();

        cy.get('[data-cy="submitTemplateFormButton"]').click();

        cy.get('[data-cy="saveDraftStateButton"]').click();

        // Use inside an exericse
        cy.createExercise().joinExerciseAsTrainer().initializeTrainerSocket();
        cy.get('[data-cy="availableCollectionsList"]')
            .should('exist')
            .find(
                `[data-cy="availableCollectionItem"][data-entity="${collectionId}"]`
            )
            .should('exist')
            .scrollIntoView()
            .click();

        cy.get('[data-cy="confirmCollectionSelectionButton"]')
            .should('not.be.disabled')
            .click();
    });
});

// confirmationModalOkButton
