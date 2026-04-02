import { createSelector } from '@ngrx/store';
import type {
    MapImage,
    Material,
    Patient,
    Personnel,
    SimulatedRegion,
    TransferPoint,
    UUID,
    Vehicle,
    WithPosition,
    RestrictedZone,
    Viewport,
} from 'fuesim-digital-shared';
import {
    newMapCoordinatesAt,
    StrictObject,
    currentCoordinatesOf,
    isOnMap,
    isInViewport,
} from 'fuesim-digital-shared';

import { pickBy } from 'lodash-es';
import type { AppState } from '../../app.state';
import type { CateringLine } from '../../../shared/types/catering-line';
import type { ScoutableIndicator } from '../../../shared/types/scoutable-indicator';
import { selectOwnClientId } from './application.selectors';
import {
    selectClients,
    selectRestrictedZones,
    selectMapImages,
    selectMaterials,
    selectPatients,
    selectPersonnel,
    selectSimulatedRegions,
    selectTransferPoints,
    selectVehicles,
    selectViewports,
    selectScoutables,
    scoutableElementSelectors,
} from './exercise.selectors';

/**
 * All selectors in here use exercise- as well as application-selectors
 */

export const selectOwnClient = createSelector(
    selectOwnClientId,
    selectClients,
    (ownClientId, clients) => (ownClientId ? clients[ownClientId] : undefined)
);

/**
 * Do not use this to distinguish between the exerciseStateModes
 */
export const selectCurrentRole = createSelector(
    selectOwnClient,
    (ownClient) => ownClient?.role
);

export const selectCurrentMainRole = createSelector(
    selectCurrentRole,
    (currentRole) => currentRole?.mainRole
);

export const selectRestrictedViewport = createSelector(
    selectOwnClient,
    selectViewports,
    (ownClient, viewports) =>
        ownClient?.viewRestrictedToViewportId
            ? viewports[ownClient.viewRestrictedToViewportId]!
            : undefined
);

/**
 * @returns a selector that returns a UUIDMap of all elements that have a position and are in the viewport restriction
 */
function selectVisibleElementsFactory<
    Element extends WithPosition,
    Elements extends { readonly [key: UUID]: Element } = {
        readonly [key: UUID]: Element;
    },
>(
    selectElements: (state: AppState) => Elements,
    isInViewportHelper: (element: Element, viewport: Viewport) => boolean = (
        element,
        viewport
    ) => isInViewport(viewport, currentCoordinatesOf(element))
) {
    return createSelector(
        selectRestrictedViewport,
        selectElements,
        (restrictedViewport, elements) =>
            pickBy(
                elements,
                (element) =>
                    // Is placed on the map
                    isOnMap(element) &&
                    // No viewport restriction
                    (!restrictedViewport ||
                        isInViewportHelper(element, restrictedViewport))
            )
    );
}

// TODO: Take into account the width and height of the images of these elements
export const selectVisibleMaterials =
    selectVisibleElementsFactory<Material>(selectMaterials);
export const selectVisibleVehicles =
    selectVisibleElementsFactory<Vehicle>(selectVehicles);
export const selectVisiblePersonnel =
    selectVisibleElementsFactory<Personnel>(selectPersonnel);
export const selectVisiblePatients =
    selectVisibleElementsFactory<Patient>(selectPatients);
export const selectVisibleViewports = selectVisibleElementsFactory<Viewport>(
    selectViewports,
    // The viewport the client is restricted to should not be shown, as this causes a white border in fullscreen mode
    (element, viewport) => element.id !== viewport.id
);
export const selectVisibleMapImages = selectVisibleElementsFactory<MapImage>(
    selectMapImages,
    // TODO: MapImages could get very big. Therefore its size must be taken into account. The current implementation is a temporary solution.
    (element, viewport) => true
);
export const selectVisibleTransferPoints =
    selectVisibleElementsFactory<TransferPoint>(selectTransferPoints);
export const selectVisibleSimulatedRegions =
    selectVisibleElementsFactory<SimulatedRegion>(selectSimulatedRegions);
export const selectVisibleRestrictedZones =
    selectVisibleElementsFactory<RestrictedZone>(selectRestrictedZones);

export const selectVisibleCateringLines = createSelector(
    selectRestrictedViewport,
    selectMaterials,
    selectPersonnel,
    selectPatients,
    (viewport, materials, personnel, patients) =>
        // Mostly, there are fewer untreated patients than materials and personnel that are not treating
        Object.values(patients)
            .filter((patient) => isOnMap(patient))
            .flatMap((patient) =>
                [
                    ...Object.keys(patient.assignedPersonnelIds).map(
                        (personnelId) => personnel[personnelId]!
                    ),
                    ...Object.keys(patient.assignedMaterialIds).map(
                        (materialId) => materials[materialId]!
                    ),
                ].map((caterer) => ({
                    id: `${caterer.id}:${patient.id}` as const,
                    patientPosition: currentCoordinatesOf(patient),
                    // If the catering element is treating a patient, it must have a position
                    catererPosition: currentCoordinatesOf(caterer),
                }))
            )
            // To improve performance, all Lines where both ends are not in the viewport
            // are removed as they are not visible for the user
            .filter(
                ({ catererPosition, patientPosition }) =>
                    !viewport ||
                    isInViewport(viewport, catererPosition) ||
                    isInViewport(viewport, patientPosition)
            )
            .reduce<{ [id: `${UUID}:${UUID}`]: CateringLine }>(
                (cateringLinesObject, cateringLine) => {
                    cateringLinesObject[cateringLine.id] = cateringLine;
                    return cateringLinesObject;
                },
                {}
            )
);

export const selectVisibleScoutableIndicators = createSelector(
    selectCurrentMainRole,
    selectScoutables,
    selectRestrictedViewport,
    ...scoutableElementSelectors,
    (currentRole, scoutables, viewport, ...elementSelectors) =>
        elementSelectors
            .flatMap((selector) =>
                StrictObject.values(selector)
                    .filter(
                        (element) =>
                            isOnMap(element) && element.scoutableId !== null
                    )
                    .map((element): ScoutableIndicator => {
                        const scoutable = scoutables[element.scoutableId!]!;
                        const elementPos = currentCoordinatesOf(element);
                        /* 23 height units make one coordinate unit */
                        const coefficient = 1 / 23;
                        const offset = newMapCoordinatesAt(
                            element.image.height *
                                element.image.aspectRatio *
                                coefficient *
                                0.25,
                            element.image.height * coefficient * -0.5
                        );
                        const indicatorPos = newMapCoordinatesAt(
                            elementPos.x + offset.x,
                            elementPos.y + offset.y
                        );
                        return {
                            id: `${scoutable.id}:${element.id}`,
                            position: indicatorPos,
                            scoutableElementType: element.type,
                            scoutableElementId: element.id,
                            isVisibleForParticipants:
                                scoutable.isVisibleForParticipants,
                        };
                    })
            )
            /* for performance, we dont select indicators out of view. */
            .filter(
                (scoutableIndicator) =>
                    (!viewport ||
                        isInViewport(viewport, scoutableIndicator.position)) &&
                    (scoutableIndicator.isVisibleForParticipants ||
                        currentRole === 'trainer')
            )
            .reduce<{ [id: `${UUID}:${UUID}`]: ScoutableIndicator }>(
                (scoutableIndicatorsObject, scoutableIndicator) => {
                    scoutableIndicatorsObject[scoutableIndicator.id] =
                        scoutableIndicator;
                    return scoutableIndicatorsObject;
                },
                {}
            )
);
