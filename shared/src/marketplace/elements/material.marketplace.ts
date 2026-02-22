import { ReducerError } from '../../store/reducer-error.js';
import type { ChangeApply } from '../exercise-collection-upgrade/exercise-collection-change-apply.js';
import type { ChangeImpact } from '../exercise-collection-upgrade/exercise-collection-change-impact.js';
import { newChangeMapTarget } from '../exercise-collection-upgrade/exercise-collection-change-target.js';
import type { Material } from '../../models/material.js';
import { newMaterialFromTemplate } from '../../models/material.js';
import type { MaterialTemplate } from '../../models/material-template.js';
import { materialTemplateSchema } from '../../models/material-template.js';
import { uuid } from '../../utils/uuid.js';
import {
    hasEntityProperties,
    type MarketplaceRegistryEntry,
} from './marketplace-elements.js';

export const marketplaceMaterial: MarketplaceRegistryEntry = {
    naming: {
        singular: 'Material',
        plural: 'Materialien',
    },

    changeImpact: (draftState, change) => {
        const changeImpacts: ChangeImpact[] = [];
        const changeApplies: ChangeApply[] = [];

        // If material gets added, we dont need to do anything, as they dont have any impact on the exercise
        if (change.type === 'create') return { impact: [], apply: [] };

        if (
            change.type === 'update' &&
            change.new.content.type === 'materialTemplate'
        ) {
            // check if changes material was used on map / in vehicles
            Object.values(draftState.materials).forEach((f) => {
                const isAffected =
                    Object.values(draftState.templates).find(
                        (t) => f.templateId === t.id
                    )?.entity?.versionId === change.old.versionId;

                if (isAffected) {
                    // if the matterial is only getting updated, we just need to apply the changes
                    // since the material is not editable, we dont need to check for anything
                    //
                    // we dont use changeImpact here, since we have nothing to present to the user
                    changeApplies.push({
                        type: 'editable',
                        action: 'replace',
                        target: newChangeMapTarget(f.type, f.id),
                        marketplaceElement: change.new,
                        newContent: {
                            ...(change.new.content as MaterialTemplate),
                            entity:
                                f.entity !== undefined
                                    ? {
                                          versionId: change.new.versionId,
                                          entityId: change.new.entityId,
                                          type: f.entity.type,
                                      }
                                    : undefined,
                        } satisfies MaterialTemplate,
                    });
                }
            });
        } else if (change.type === 'remove') {
            Object.values(draftState.materials).forEach((f) => {
                const isAffected =
                    Object.values(draftState.templates).find(
                        (t) => f.templateId === t.id
                    )?.entity?.versionId === change.old.versionId;

                if (isAffected) {
                    // if the material is getting deleted, we need to prompt the user what to do (e.g. remove, orphan, replace, ...)
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

        const replaceMaterial = (
            materialId: string,
            material: Material,
            newContent: MaterialTemplate
        ) => {
            const parsedNewContent =
                materialTemplateSchema.safeParse(newContent);
            if (!parsedNewContent.success) {
                throw new ReducerError(
                    'MaterialTemplate of ChangeApply does not match expected schema'
                );
            }

            console.log({ parsedNewContent });

            if (!hasEntityProperties(parsedNewContent.data)) {
                throw new ReducerError(
                    'MaterialTemplate of ChangeApply does not contain required entity attribute'
                );
            }

            const newMaterial = newMaterialFromTemplate(
                parsedNewContent.data,
                material.vehicleId,
                material.vehicleName,
                material.position,
                materialId
            );
            draftState.materials[materialId] = newMaterial;
        };

        if (change.type === 'editable' && change.action === 'replace') {
            // we just want to replace a changed material
            const materialId = change.target.elementId;
            const material = draftState.materials[materialId];
            if (!material) return;
            const newContent = change.newContent as MaterialTemplate;
            replaceMaterial(materialId, material, newContent);
        } else if (change.type === 'removed') {
            const materialId = change.target.elementId;
            switch (change.action) {
                case 'remove': {
                    delete draftState.materials[materialId];
                    draftState.vehicles = Object.fromEntries(
                        Object.entries(draftState.vehicles).map(([k, v]) => [
                            k,
                            {
                                ...v,
                                materialIds: Object.fromEntries(
                                    Object.entries(v.materialIds).filter(
                                        ([id, _]) => id !== materialId
                                    )
                                ),
                            },
                        ])
                    );

                    break;
                }
                case 'orphan': {
                    draftState.materials = Object.fromEntries(
                        Object.entries(draftState.materials).map(([k, v]) => {
                            if (v.id === materialId) {
                                return [k, { ...v, entity: null }];
                            }
                            return [k, v];
                        })
                    );
                    break;
                }
                case 'replace': {
                    const materials = draftState.materials[materialId];
                    if (!materials) return;
                    const newContent = change.replaceWith as MaterialTemplate;
                    replaceMaterial(materialId, materials, newContent);
                    break;
                }
            }
        } else {
            console.error(
                'Unsupported changeApply type found for Material',
                change
            );
        }
    },
};
