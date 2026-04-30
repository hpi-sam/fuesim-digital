import { uuid } from '../utils/uuid.js';
import type {
    ChangeImpact,
    EditableElementChangeImpact,
    RemovedElementChangeImpact,
} from '../marketplace/exercise-collection-upgrade/exercise-collection-change-impact.js';
import { newChangeAlarmgroupVehicleTarget } from '../marketplace/exercise-collection-upgrade/exercise-collection-change-target.js';
import { hasEntityProperties } from '../marketplace/models/versioned-element-content.js';
import { registerMarketplaceElement } from './utils/marketplace-registry.js';

registerMarketplaceElement('alarmGroup', {
    changeApply: (draftState, change) => {
        if (change.type === 'added') return;
        if (change.target.kind === 'alarm-group-vehicle') {
            switch (change.action) {
                case 'keep': {
                    throw new Error(
                        'action keep not supported for alarm group vehicles'
                    );
                }
                case 'update': {
                    throw new Error(
                        'action keep not supported for alarm group vehicles'
                    );
                }
                case 'replace': {
                    const alarmGroup =
                        draftState.alarmGroups[change.target.alarmGroupId];
                    const alarmGroupVehicle =
                        alarmGroup?.alarmGroupVehicles[
                            change.target.alarmGrupVehicleId
                        ];
                    if (!alarmGroupVehicle) {
                        throw new Error(
                            `No alarm group vehicle found with id ${change.target.alarmGrupVehicleId} in alarm group ${change.target.alarmGroupId}`
                        );
                    }

                    const replacement = change.replaceWith;
                    if (!hasEntityProperties(replacement)) {
                        throw new Error(
                            `Replacement for alarm group vehicle must be of type vehicle template, but got ${replacement.type}`
                        );
                    }

                    alarmGroupVehicle.vehicleTemplateId =
                        replacement.entity.versionId;
                    break;
                }
                case 'remove': {
                    const alarmGroup =
                        draftState.alarmGroups[change.target.alarmGroupId];
                    if (!alarmGroup) {
                        throw new Error(
                            `No alarm group found with id ${change.target.alarmGroupId}`
                        );
                    }
                    delete alarmGroup.alarmGroupVehicles[
                        change.target.alarmGrupVehicleId
                    ];
                    break;
                }
            }
        }
    },
    changeImpact: (currentState, change) => {
        const impacts: ChangeImpact[] = [];

        if (change.type === 'create') return impacts;
        const alarmGroups = Object.values(currentState.alarmGroups);
        for (const alarmGroup of alarmGroups) {
            const alarmGroupVehicles = Object.values(
                alarmGroup.alarmGroupVehicles
            );
            for (const alarmGroupVehicle of alarmGroupVehicles) {
                if (
                    alarmGroupVehicle.vehicleTemplateId === change.old.versionId
                ) {
                    impacts.push({
                        id: uuid(),
                        type: change.type === 'update' ? 'updated' : 'removed',
                        target: newChangeAlarmgroupVehicleTarget(
                            alarmGroup.id,
                            alarmGroup.name,
                            alarmGroupVehicle.id
                        ),
                        entity: change.old,
                        element: alarmGroupVehicle,
                    } satisfies
                        | EditableElementChangeImpact
                        | RemovedElementChangeImpact);
                }
            }
        }

        return impacts;
    },
});
