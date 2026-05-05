import { Component, effect, input, output, signal } from '@angular/core';
import {
    CollectionUpgradeChangeElement,
    ElementVersionId,
    RemoveReplaceChangeApply,
    uuid,
    type ChangeApply,
    type ElementDto,
    type RemoveChangeApply,
    type RemovedElementChangeImpact,
} from 'fuesim-digital-shared';
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
    public readonly elementsOfNewCollection = input.required<ElementDto[]>();

    public readonly applyChange = output<RemoveChangeApply>();
    public readonly applyForAll = output();

    public readonly replaceableElementTypes: {
        [T in CollectionUpgradeChangeElement['type']]?: {
            filter: (elements: ElementDto[]) => ElementDto[];
        };
    } = {
        vehicle: {
            filter: (elements) =>
                elements.filter((e) => e.content.type === 'vehicleTemplate'),
        },
        alarmGroupVehicle: {
            filter: (elements) =>
                elements.filter((e) => e.content.type === 'vehicleTemplate'),
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
        });
    }

    public setActionType(action: RemoveChangeApply['action']) {
        this.selectedActionType.set(action);
        switch (action) {
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
                break;
        }
    }

    public setReplacement(entity: ElementDto) {
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
