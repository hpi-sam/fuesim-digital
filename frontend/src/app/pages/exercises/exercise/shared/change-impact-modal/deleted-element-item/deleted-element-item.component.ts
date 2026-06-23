import { Component, effect, input, output, signal } from '@angular/core';
import {
    CollectionUpgradeChangeElement,
    ElementVersionId,
    RemoveReplaceChangeApply,
    uuid,
    type ChangeApply,
    type TemplateVersion,
    type RemoveChangeApply,
    type RemovedElementChangeImpact,
} from 'fuesim-digital-shared';
import { Immutable } from 'immer';
import { MapEditorCardComponent } from '../../../../../../shared/components/map-editor-card/map-editor-card.component';
import { ElementCardComponent } from '../../../../../marketplace/shared/cards/element-card/element-card.component';

@Component({
    selector: 'app-change-impact-deleted-element-item',
    templateUrl: './deleted-element-item.component.html',
    styleUrl: './deleted-element-item.component.scss',
    imports: [MapEditorCardComponent, ElementCardComponent],
})
export class DeletedElementChangeApplyItemComponent {
    public readonly change = input.required<RemovedElementChangeImpact>();
    public readonly applyingChange = input<ChangeApply>();
    public readonly elementsOfNewCollection =
        input.required<Immutable<TemplateVersion[]>>();

    public readonly applyChange = output<RemoveChangeApply | null>();
    public readonly applyForAll = output();

    public readonly elementTypes: {
        [T in CollectionUpgradeChangeElement['type']]?: {
            replaceFilter: (
                elements: Immutable<TemplateVersion[]>
            ) => TemplateVersion[];
            orphanable: boolean;
        };
    } = {
        vehicle: {
            orphanable: true,
            replaceFilter: (elements) =>
                elements.filter((e) => e.content.type === 'vehicleTemplate'),
        },
        alarmGroupVehicle: {
            orphanable: false,
            replaceFilter: (elements) =>
                elements.filter((e) => e.content.type === 'vehicleTemplate'),
        },
        personnel: {
            orphanable: true,
            replaceFilter: (elements) =>
                elements.filter((e) => e.content.type === 'personnelTemplate'),
        },
    };

    public readonly selectedActionType = signal<
        RemoveChangeApply['action'] | null
    >(null);

    public isReplacementSelected(
        elementVersionId: ElementVersionId | undefined
    ) {
        const applyChange = this.applyingChange() as
            | RemoveChangeApply
            | undefined;

        if (elementVersionId === undefined)
            return applyChange?.action === 'replace';
        return (
            applyChange?.action === 'replace' &&
            applyChange.replaceWith.entity?.versionId === elementVersionId
        );
    }

    public castChangeApply(
        applyChange: ChangeApply | undefined
    ): RemoveChangeApply | undefined {
        if (applyChange?.type === 'removed') {
            return applyChange as RemoveChangeApply;
        }
        return undefined;
    }

    public castReplaceChangeApply(
        applyChange: ChangeApply | undefined
    ): RemoveReplaceChangeApply | undefined {
        if (
            applyChange?.type === 'removed' &&
            applyChange.action === 'replace'
        ) {
            return applyChange as RemoveReplaceChangeApply;
        }
        return undefined;
    }

    public constructor() {
        effect(() => {
            this.selectedActionType.set(
                (this.applyingChange()?.action as
                    | RemoveChangeApply['action']
                    | undefined) ?? null
            );
            console.log('effect called');
        });
    }

    public setActionType(action: RemoveChangeApply['action']) {
        this.selectedActionType.set(action);
        switch (action) {
            case 'orphan':
            case 'remove':
                this.applyChange.emit({
                    type: 'removed',
                    marketplaceElement: this.change().entity,
                    action,
                    target: this.change().target,
                });
                break;
            case 'replace':
                // We only want to emit the change when the user
                // has selected an element to replace with,
                // so we wait until setReplacement is called.

                this.applyChange.emit(null);

                // We need this timeout here for the encapsuled code to be called after effect()
                //
                // Context: applyChange.emit causes the parent component to update the
                // data which is being reacted on by this component.
                // This then causes the data of this component to be recalulcated, with effect being called.
                // Since we emit `null`, we delete the changeApply entry from the parent, which causes effect()
                // to set the selectedActionType to null (we dont want that, we want to keep `replace`)
                //
                // setTimeout properly defers this for after effect() has been called
                setTimeout(() => {
                    this.selectedActionType.set(action);
                });
                break;
        }
    }

    public setReplacement(entity: TemplateVersion) {
        if (this.selectedActionType() !== 'replace') return;

        const replacingElementContent = this.change().element;

        const replacingElementContentEntity =
            'entity' in replacingElementContent
                ? replacingElementContent
                : undefined;

        this.applyChange.emit({
            type: 'removed',
            action: 'replace',
            replaceWith: {
                ...entity.content,
                // we need to set the uuid here bc we cant in the reducer
                id: uuid(),
                entity: {
                    entityId: entity.entityId,
                    versionId: entity.versionId,
                    type:
                        replacingElementContentEntity?.entity?.type ?? 'direct',
                },
            },
            marketplaceElement: this.change().entity,
            target: this.change().target,
        });
    }
}
