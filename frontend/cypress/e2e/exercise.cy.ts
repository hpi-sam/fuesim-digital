/**
 * Tests on github have been super flaky,
 * because the runners are not fast enough
 * to handle web socket events during tests.
 */
const commonErrorTimeout = 500;
const tickDuration = 1000;

describe('A trainer on the exercise page', () => {
    beforeEach(() => {
        cy.createExercise().joinExerciseAsTrainer().initializeTrainerSocket();
    });

    it('can load and unload vehicles', () => {
        cy.dragToMap('[data-cy=draggableVehicleDiv]');

        cy.log('load a patient to a vehicle').dragToMap(
            '[data-cy=draggablePatientDiv]'
        );

        cy.wait(commonErrorTimeout);

        cy.get('@trainerSocketPerformedActions')
            .atPosition(-2)
            .should('have.property', 'type', '[Patient] Add patient');

        cy.getState()
            .its('exerciseState')
            .its('patients')
            .should('not.be.empty');

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Vehicle] Load vehicle');

        cy.getState()
            .its('exerciseState')
            .its('vehicles')
            .itsValues()
            .firstElement()
            .its('patientIds')
            .should('not.be.empty');

        cy.get('[data-cy=openLayersContainer]').click();
        cy.get('[data-cy=vehiclePopupUnloadButton]').click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Vehicle] Unload vehicle');

        cy.getState()
            .its('exerciseState')
            .its('personnel')
            .itsValues()
            .firstElement()
            .its('position')
            .should('have.property', 'type', 'coordinates');

        cy.getState()
            .its('exerciseState')
            .its('patients')
            .itsValues()
            .firstElement()
            .its('position')
            .should('have.property', 'type', 'coordinates');
    });

    it('can interact with the map', () => {
        cy.log('drag a viewport to the map').dragToMap(
            '[data-cy=draggableViewportDiv]'
        );

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Viewport] Add viewport');

        cy.getState()
            .its('exerciseState')
            .its('viewports')
            .should('not.be.empty');

        cy.log('drag a transfer point to the map').dragToMap(
            '[data-cy=draggableTransferPointDiv]'
        );

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[TransferPoint] Add TransferPoint'
            );

        cy.getState()
            .its('exerciseState')
            .its('transferPoints')
            .should('not.be.empty');

        cy.log('drag a map image to the map').dragToMap(
            '[data-cy=draggableMapImageDiv]'
        );

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[MapImage] Add MapImage');

        cy.getState()
            .its('exerciseState')
            .its('mapImages')
            .should('not.be.empty');

        cy.log('load a patient to the map').dragToMap(
            '[data-cy=draggablePatientDiv]'
        );

        cy.wait(commonErrorTimeout);

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Patient] Add patient');

        cy.getState()
            .its('exerciseState')
            .its('patients')
            .should('not.be.empty');

        cy.get('[data-cy=openLayersContainer]').click();

        cy.get('[data-cy=patientPopupTriageNav]').click();
        cy.get('[data-cy=patientPopupPretriageButton]').click();
        cy.get('[data-cy=patientPopupPretriageButtonDropdown]').last().click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Patient] Set Visible Status');

        cy.getState()
            .its('exerciseState')
            .its('patients')
            .itsValues()
            .firstElement()
            .should('have.property', 'pretriageStatus', 'green');

        cy.log('drag a vehicle to the map').dragToMap(
            '[data-cy=draggableVehicleDiv]'
        );

        cy.wait(commonErrorTimeout);

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Vehicle] Add vehicle');

        cy.getState()
            .its('exerciseState')
            .its('vehicles')
            .should('not.be.empty');

        cy.log('drag a simulated region to the map').dragToMap(
            '[data-cy=draggableSimulatedRegionDiv]'
        );

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[SimulatedRegion] Add simulated region'
            );

        cy.getState()
            .its('exerciseState')
            .its('simulatedRegions')
            .should('not.be.empty');
    });

    it('can manage alarm groups', () => {
        cy.get('[data-cy=trainerToolbarCreationButton]').click();
        cy.get('[data-cy=trainerToolbarAlarmGroupsButton]').click();

        cy.log('add an alarm group')
            .get('[data-cy="alarmGroupAddButton"]')
            .click();
        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[AlarmGroup] Add AlarmGroup');

        cy.getState()
            .its('exerciseState')
            .its('alarmGroups')
            .should('not.be.empty');

        cy.log('add an alarm group vehicle')
            .get('[data-cy="alarmGroupAddVehicleButton"]')
            .first()
            .click();
        cy.get('[data-cy="alarmGroupAddVehicleSelect"] > :nth-child(1)')
            .first()
            .click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[AlarmGroup] Add AlarmGroupVehicle'
            );

        cy.getState()
            .its('exerciseState')
            .its('alarmGroups')
            .itsValues()
            .firstElement()
            .its('alarmGroupVehicles')
            .should('not.be.empty');

        cy.log('change the input delay of a vehicle')
            .get('[data-cy="alarmGroupVehicleDelayInput"]')
            .first()
            .clear()
            .type('10');

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[AlarmGroup] Edit AlarmGroupVehicle'
            );

        cy.getState()
            .its('exerciseState')
            .its('alarmGroups')
            .itsValues()
            .firstElement()
            .its('alarmGroupVehicles')
            .itsValues()
            .firstElement()
            .should('have.property', 'time', 600000);

        cy.get('[data-cy=alarmGroupAddVehicleButton]').first().click();
        cy.get('[data-cy=alarmGroupAddVehicleSelect] > :nth-child(2)')
            .first()
            .click();
        cy.get('[data-cy=alarmGroupClosePopupButton]').click({ force: true });
        cy.dragToMap('[data-cy=draggableTransferPointDiv]');
        cy.get('[data-cy=trainerToolbarExecutionButton]').click();
        cy.get('[data-cy=trainerToolbarControlCenterButton]').click();
        cy.get('[data-cy=sendAlarmGroupChooseAlarmGroupButton]')
            .first()
            .click();
        cy.get('[data-cy=searchableDropdownOptionButton] > :nth-child(1)')
            .first()
            .click();
        cy.get('[data-cy=sendAlarmGroupChooseTargetButton]').first().click();
        cy.get('[data-cy=searchableDropdownOptionButton] > :nth-child(1)')
            .first()
            .click();
        cy.get('[data-cy=sendAlarmGroupSendButton]').click();

        cy.wait(commonErrorTimeout);

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[Emergency Operation Center] Send Alarm Group'
            );

        cy.get('[data-cy=closeEmergencyOperationsCenterPopupButton]').click({
            force: true,
        });
        cy.get('[data-cy=trainerToolbarExecutionButton]').click();
        cy.get('[data-cy=trainerToolbarTransferButton]').click();
        cy.get('[data-cy=transferOverviewLetArriveInstantlyButton]')
            .first()
            .click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Transfer] Finish transfer');

        cy.getState()
            .its('exerciseState')
            .its('vehicles')
            .itsValues()
            .firstElement()
            .its('position')
            .should('have.property', 'type', 'coordinates');

        cy.getState()
            .its('exerciseState')
            .its('vehicles')
            .itsValues()
            .atPosition(1)
            .its('position')
            .should('have.property', 'type', 'transfer');

        cy.get('[data-cy=transferOverviewCloseButton]').click({ force: true });
        cy.get('[data-cy=trainerToolbarCreationButton]').click();
        cy.get('[data-cy=trainerToolbarAlarmGroupsButton]').click();

        cy.log('remove an alarm group vehicle')
            .get('[data-cy="alarmGroupRemoveVehicleButton"]')
            .first()
            .click();
        cy.log('remove an alarm group vehicle')
            .get('[data-cy="alarmGroupRemoveVehicleButton"]')
            .first()
            .click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[AlarmGroup] Remove AlarmGroupVehicle'
            );

        cy.getState()
            .its('exerciseState')
            .its('alarmGroups')
            .itsValues()
            .firstElement()
            .its('alarmGroupVehicles')
            .should('be.empty');

        cy.log('remove an alarm group')
            .get('[data-cy="alarmGroupsRemoveButton"]')
            .first()
            .click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[AlarmGroup] Remove AlarmGroup');

        cy.getState()
            .its('exerciseState')
            .its('alarmGroups')
            .should('be.empty');
    });

    it('can manage hospitals and transfer vehicles to them', () => {
        cy.get('[data-cy=trainerToolbarCreationButton]').click();
        cy.get('[data-cy=trainerToolbarHospitalsButton]').click();

        cy.log('add a hospital').get('[data-cy="hospitalAddButton"]').click();
        cy.get('@trainerSocketPerformedActions')
            .firstElement()
            .should('have.property', 'type', '[Hospital] Add hospital');
        cy.get('@trainerSocketPerformedActions')
            .firstElement()
            .its('hospital')
            .as('createdHospital');

        cy.getState()
            .its('exerciseState')
            .its('hospitals')
            .should('not.be.empty');

        cy.log('update a hospitals transport time')
            .get('[data-cy="hospitalUpdateTransportTimeInput"]')
            .last()
            .clear()
            .type('30');

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[Hospital] Edit transportDuration to hospital'
            );

        cy.getState()
            .its('exerciseState')
            .its('hospitals')
            .itsValues()
            .lastElement()
            .should('have.property', 'transportDuration', 1800000);

        cy.get('[data-cy=hospitalClosePopupButton]').click({ force: true });

        cy.dragToMap('[data-cy=draggableTransferPointDiv]');
        cy.get('[data-cy=openLayersContainer]').click();
        cy.get('[data-cy=transferPointPopupHospitalNav]').click();
        cy.get('[data-cy=transferPointPopupAddHospitalButton]').click();
        cy.get('[data-cy=transferPointPopupAddHospitalDropdownButton]')
            .last()
            .click({ force: true });

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[TransferPoint] Connect hospital'
            );

        cy.getState()
            .its('exerciseState')
            .its('transferPoints')
            .itsValues()
            .lastElement()
            .its('reachableHospitals')
            .should('not.be.empty');

        cy.get('[data-cy=transferPointPopupCloseButton]').click();
        cy.dragToMap('[data-cy=draggableVehicleDiv]');
        cy.dragToMap('[data-cy=draggablePatientDiv]');

        cy.get('[data-cy=chooseTransferTargetPopupHospitalDropdown]')
            .first()
            .click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[Hospital] Transport patient to hospital'
            );

        cy.getState()
            .its('exerciseState')
            .its('hospitals')
            .itsValues()
            .lastElement()
            .its('patientIds')
            .should('not.be.empty');

        cy.wait(commonErrorTimeout);

        cy.get('[data-cy=openLayersContainer]').click();
        cy.get('[data-cy=transferPointPopupHospitalNav]').click();
        cy.get('[data-cy=transferPointPopupRemoveHospitalButton]').click();
        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[TransferPoint] Disconnect hospital'
            );

        cy.getState()
            .its('exerciseState')
            .its('transferPoints')
            .itsValues()
            .lastElement()
            .its('reachableHospitals')
            .should('be.empty');

        cy.get('[data-cy=trainerToolbarCreationButton]').click();
        cy.get('[data-cy=trainerToolbarHospitalsButton]').click();

        cy.log('delete a hospital');
        cy.get('[data-cy="hospitalDeleteButton"]').click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Hospital] Remove hospital');

        cy.get('@createdHospital').then((hospital: any) => {
            cy.getState()
                .its('exerciseState')
                .its('hospitals')
                .should('not.have.keys', hospital.id);
        });
    });

    it('can manage transfer points (within simulated regions) and transfer vehicles', () => {
        cy.dragToMap('[data-cy=draggableSimulatedRegionDiv]');
        cy.dragToMap('[data-cy=draggableTransferPointDiv]');

        cy.wait(commonErrorTimeout);

        cy.get('[data-cy=openLayersContainer]').click();
        cy.get('[data-cy=transferPointPopupOtherTransferPointsNav]').click();
        cy.get(
            '[data-cy=transferPointPopupAddOtherTransferPointButton]'
        ).click();
        cy.get('[data-cy=searchableDropdownOptionButton]')
            .first()
            .click({ force: true });

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[TransferPoint] Connect TransferPoints'
            );

        cy.getState()
            .its('exerciseState')
            .its('transferPoints')
            .itsValues()
            .firstElement()
            .its('reachableTransferPoints')
            .should('not.be.empty');

        cy.get(
            '[data-cy=transferPointPopupRemoveOtherTransferPointButton]'
        ).click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[TransferPoint] Disconnect TransferPoints'
            );

        cy.getState()
            .its('exerciseState')
            .its('transferPoints')
            .itsValues()
            .firstElement()
            .its('reachableTransferPoints')
            .should('be.empty');

        cy.get(
            '[data-cy=transferPointPopupAddOtherTransferPointButton]'
        ).click();
        cy.get('[data-cy=searchableDropdownOptionButton]')
            .first()
            .click({ force: true });
        cy.get('[data-cy=transferPointPopupDurationInput]')
            .first()
            .clear()
            .type('0.5');

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[TransferPoint] Connect TransferPoints'
            );

        cy.getState()
            .its('exerciseState')
            .its('transferPoints')
            .itsValues()
            .firstElement()
            .its('reachableTransferPoints')
            .itsValues()
            .firstElement()
            .should('have.property', 'duration', 30000);

        cy.dragToMap('[data-cy=draggableVehicleDiv]');
        cy.get('[data-cy=chooseTransferTargetPopupOtherTransferPointDropdown]')
            .first()
            .click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Transfer] Add to transfer');

        cy.getState()
            .its('exerciseState')
            .its('vehicles')
            .itsValues()
            .firstElement()
            .its('position')
            .should('have.property', 'type', 'transfer');

        cy.get('[data-cy=trainerToolbarExecutionButton]').click();
        cy.get('[data-cy=trainerToolbarTransferButton]').click();
        cy.get('[data-cy=transferTimeTogglePauseButton]').click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[Transfer] Toggle pause transfer'
            );

        cy.getState()
            .its('exerciseState')
            .its('vehicles')
            .itsValues()
            .firstElement()
            .its('position')
            .its('transfer')
            .should('have.property', 'isPaused', true);

        cy.getState()
            .its('exerciseState')
            .its('vehicles')
            .itsValues()
            .firstElement()
            .its('position')
            .its('transfer')
            .its('endTimeStamp')
            .then((previousEndTimeStamp: any) => {
                cy.get('[data-cy=transferTimeReduceByOneMinuteButton]').click();

                cy.get('@trainerSocketPerformedActions')
                    .lastElement()
                    .should(
                        'have.property',
                        'type',
                        '[Transfer] Edit transfer'
                    );

                cy.getState()
                    .its('exerciseState')
                    .its('vehicles')
                    .itsValues()
                    .firstElement()
                    .its('position')
                    .its('transfer')
                    .its('endTimeStamp')
                    .should('be.lessThan', previousEndTimeStamp);
            });

        cy.get('[data-cy=transferTimeTogglePauseButton]').click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[Transfer] Toggle pause transfer'
            );

        cy.getState()
            .its('exerciseState')
            .its('vehicles')
            .itsValues()
            .firstElement()
            .its('position')
            .its('transfer')
            .should('have.property', 'isPaused', false);

        cy.get('[data-cy=transferOverviewCloseButton]').click();
        cy.get('[data-cy=trainerToolbarStartButton]').click();
        cy.get('[data-cy=confirmationModalOkButton]').click();

        cy.wait(tickDuration);
        cy.getState()
            .its('exerciseState')
            .its('vehicles')
            .itsValues()
            .firstElement()
            .its('position')
            .should('have.property', 'type', 'simulatedRegion');
    });

    it('can start and stop an exercise', () => {
        cy.log('start an exercise')
            .get('[data-cy=trainerToolbarStartButton]')
            .click();
        cy.get('[data-cy=confirmationModalOkButton]').click();

        cy.wait(commonErrorTimeout);

        cy.get('@trainerSocketPerformedActions')
            .atPosition(-2)
            .should('have.property', 'type', '[Exercise] Start');

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[Emergency Operation Center] Add Log Entry'
            );

        cy.getState()
            .its('exerciseState')
            .should('have.property', 'currentStatus', 'running');

        cy.wait(tickDuration);
        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Exercise] Tick');

        cy.getState()
            .its('exerciseState')
            .its('currentTime')
            .should('be.greaterThan', 0);

        cy.log('pause an exercise')
            .get('[data-cy=trainerToolbarPauseButton]')
            .click();

        cy.wait(commonErrorTimeout);

        cy.get('@trainerSocketPerformedActions')
            .atPosition(-2)
            .should('have.property', 'type', '[Exercise] Pause');

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[Emergency Operation Center] Add Log Entry'
            );

        cy.getState()
            .its('exerciseState')
            .should('have.property', 'currentStatus', 'paused');
    });

    it('can manage participants', () => {
        cy.initializeParticipantSocket();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Client] Add client');

        cy.getState()
            .its('exerciseState')
            .its('clients')
            .itsValues()
            .should('have.length', 3);

        cy.dragToMap('[data-cy=draggableViewportDiv]');

        cy.get('[data-cy=trainerToolbarExecutionButton]').click();
        cy.get('[data-cy=trainerToolbarParticipantsButton]').click();

        cy.get('[data-cy=clientPopupSetWaitingRoomCheckbox]').last().check();

        cy.get('@participantSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Client] Set waitingroom');

        cy.get('@participantSocketUUID', { log: false }).then(
            (participantSocketUUID: any) => {
                cy.getState()
                    .its('exerciseState')
                    .its('clients')
                    .atKey(participantSocketUUID)
                    .should('have.property', 'isInWaitingRoom', false);
            }
        );

        cy.get('[data-cy=clientPopupSetViewportButton]').last().click();
        cy.get('[data-cy=clientPopupSetViewportDropdownButton]:visible')
            .first()
            .click();

        cy.get('@participantSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Client] Restrict to viewport');

        cy.get('@participantSocketUUID', { log: false }).then(
            (participantSocketUUID: any) => {
                cy.getState()
                    .its('exerciseState')
                    .its('clients')
                    .atKey(participantSocketUUID)
                    .should('have.property', 'viewRestrictedToViewportId');
            }
        );

        cy.get('@participantSocket', { log: false }).invoke('disconnect');

        cy.wait(commonErrorTimeout);
        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should('have.property', 'type', '[Client] Remove client');

        cy.getState()
            .its('exerciseState')
            .its('clients')
            .itsValues()
            .should('have.length', 2);
    });

    it('can manage an exercise settings', () => {
        cy.get('[data-cy=trainerToolbarSettingsButton]').click();
        cy.get('[data-cy=settingsMaxZoomInput]').clear().type('30');
        cy.get('[data-cy=settingsSaveTileMapPropertiesButton]').click();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[Configuration] Set tileMapProperties'
            );

        cy.getState()
            .its('exerciseState')
            .its('configuration')
            .its('tileMapProperties')
            .should('have.property', 'maxZoom', 30);

        cy.get('[data-cy=settingsPretriageCheckbox]').uncheck();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[Configuration] Set pretriageEnabled'
            );

        cy.getState()
            .its('exerciseState')
            .its('configuration')
            .should('have.property', 'pretriageEnabled', false);

        cy.get('[data-cy=settingsBluePatientsCheckbox]').check();

        cy.get('@trainerSocketPerformedActions')
            .lastElement()
            .should(
                'have.property',
                'type',
                '[Configuration] Set bluePatientsEnabled'
            );

        cy.getState()
            .its('exerciseState')
            .its('configuration')
            .should('have.property', 'bluePatientsEnabled', true);
    });
});
