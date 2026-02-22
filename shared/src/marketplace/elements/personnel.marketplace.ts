import { newChangeMapTarget } from '../exercise-collection-upgrade/exercise-collection-change-target.js';
import type { ChangeApply } from '../exercise-collection-upgrade/exercise-collection-change-apply.js';
import { uuid } from '../../utils/uuid.js';
import type { ChangeImpact } from '../exercise-collection-upgrade/exercise-collection-change-impact.js';
import type { Personnel } from '../../models/personnel.js';
import { newPersonnelFromTemplate } from '../../models/personnel.js';
import type { PersonnelTemplate } from '../../models/personnel-template.js';
import { personnelTemplateSchema } from '../../models/personnel-template.js';
import { ReducerError } from '../../store/reducer-error.js';
import {
    hasEntityProperties,
    type MarketplaceRegistryEntry,
} from './marketplace-elements.js';

export const marketplacePersonnel: MarketplaceRegistryEntry = {
    naming: {
        singular: 'Personal',
        plural: 'Personal',
    },

    changeImpact: (draftState, change) => {
        const changeImpacts: ChangeImpact[] = [];
        const changeApplies: ChangeApply[] = [];

        // If personnel gets added, we dont need to do anything, as they dont have any impact on the exercise
        if (change.type === 'create') return { impact: [], apply: [] };

        if (
            change.type === 'update' &&
            change.new.content.type === 'personnelTemplate'
        ) {
            // check if changes personnel was used on map / in vehicles
            Object.values(draftState.personnel).forEach((f) => {
                const isAffected =
                    Object.values(draftState.templates).find(
                        (t) => f.templateId === t.id
                    )?.entity?.versionId === change.old.versionId;

                if (isAffected) {
                    // if the personnel is only getting updated, we just need to apply the changes
                    // since the personnel is not editable, we dont need to check for anything
                    //
                    // we dont use changeImpact here, since we have nothing to present to the user
                    changeApplies.push({
                        type: 'editable',
                        action: 'replace',
                        target: newChangeMapTarget(f.type, f.id),
                        marketplaceElement: change.new,
                        newContent: {
                            ...(change.new.content as PersonnelTemplate),
                            entity:
                                f.entity !== undefined
                                    ? {
                                          versionId: change.new.versionId,
                                          entityId: change.new.entityId,
                                          type: f.entity.type,
                                      }
                                    : undefined,
                        } satisfies PersonnelTemplate,
                    });
                }
            });
        } else if (change.type === 'remove') {
            Object.values(draftState.personnel).forEach((f) => {
                const isAffected =
                    Object.values(draftState.templates).find(
                        (t) => f.templateId === t.id
                    )?.entity?.versionId === change.old.versionId;

                if (isAffected) {
                    // if the personnel is getting deleted, we need to prompt the user what to do (e.g. remove, orphan, replace, ...)
                    changeImpacts.push({
                        id: uuid(),
                        type: 'removed',
                        element: f,
                        entity: change.old,
                        target: newChangeMapTarget(f.type, f.id),
                    });
                }
            });
        }

        return { impact: changeImpacts, apply: changeApplies };
    },

    changeApply: (draftState, change) => {
        if (change.target.kind !== 'map') return;

        const replacePersonnel = (
            personnelId: string,
            personnel: Personnel,
            newContent: PersonnelTemplate
        ) => {
            const parsedNewContent =
                personnelTemplateSchema.safeParse(newContent);
            if (!parsedNewContent.success) {
                throw new ReducerError(
                    'PersonnelTemplate of ChangeApply does not match expected schema'
                );
            }

            console.log({ parsedNewContent });

            if (!hasEntityProperties(parsedNewContent.data)) {
                throw new ReducerError(
                    'PersonnelTemplate of ChangeApply does not contain required entity attribute'
                );
            }

            const newPersonnel = newPersonnelFromTemplate(
                parsedNewContent.data,
                personnel.vehicleId,
                personnel.vehicleName,
                personnel.position,
                personnelId
            );
            draftState.personnel[personnelId] = newPersonnel;
        };

        if (change.type === 'editable' && change.action === 'replace') {
            // we just want to replace a changed personnel
            const personnelId = change.target.elementId;
            const personnel = draftState.personnel[personnelId];
            if (!personnel) return;
            const newContent = change.newContent as PersonnelTemplate;
            replacePersonnel(personnelId, personnel, newContent);
        } else if (change.type === 'removed') {
            const personnelId = change.target.elementId;
            switch (change.action) {
                case 'remove': {
                    delete draftState.personnel[personnelId];
                    draftState.vehicles = Object.fromEntries(
                        Object.entries(draftState.vehicles).map(([k, v]) => [
                            k,
                            {
                                ...v,
                                personnelIds: Object.fromEntries(
                                    Object.entries(v.personnelIds).filter(
                                        ([id, _]) => id !== personnelId
                                    )
                                ),
                            },
                        ])
                    );

                    break;
                }
                case 'orphan': {
                    draftState.personnel = Object.fromEntries(
                        Object.entries(draftState.personnel).map(([k, v]) => {
                            if (v.id === personnelId) {
                                return [k, { ...v, entity: null }];
                            }
                            return [k, v];
                        })
                    );
                    break;
                }
                case 'replace': {
                    const personnel = draftState.personnel[personnelId];
                    if (!personnel) return;
                    const newContent = change.replaceWith as PersonnelTemplate;
                    replacePersonnel(personnelId, personnel, newContent);
                    break;
                }
            }
        } else {
            console.error(
                'Unsupported changeApply type found for Personnel',
                change
            );
        }
    },
};
