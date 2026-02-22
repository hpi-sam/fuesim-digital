import { Component, inject, signal } from '@angular/core';
import {
    ChangeImpact,
    RemovedElementChangeImpact,
} from '../marketplace-tab/marketplace-tab.component';
import { ElementDto, Marketplace } from 'fuesim-digital-shared';
import { z } from 'zod';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { MapEditorCardComponent } from '../../../../../shared/components/map-editor-card/map-editor-card.component';
import { JsonPipe } from '@angular/common';

@Component({
    selector: 'app-change-impact-modal',
    templateUrl: './change-impact-modal.component.html',
    styleUrl: './change-impact-modal.component.scss',
    imports: [MapEditorCardComponent, JsonPipe],
})
export class ChangeImpactModalComponent {
    private readonly collectionService = inject(CollectionService);

    public readonly changes: ChangeImpact[] = [];
    public readonly newCollectionElements!: ElementDto[];

    public selectedChangeIndex = signal<number | null>(null);

    public selectChange(index: number) {
        console.log('Selected change index:', index);
        this.selectedChangeIndex.set(index);
    }

    public changesToApply = signal<Record<string, ChangeApply>>({});
    public elementsOfNewCollection = signal<ElementDto[] | null>(null);

    public setRemovalActionType(type: RemoveChangeApply['action']) {
        const index = this.selectedChangeIndex();
        if (index === null) return;

        const selectedChange = this.changes[index];
        if (!selectedChange) return;

        if (selectedChange.type !== 'removed') return;

        console.log(
            `Setting action type for change ${selectedChange.id} to ${type}`
        );

        this.changesToApply.update((current) => {
            let existingEntry = current[selectedChange.id];

            if (!existingEntry) {
                existingEntry = {
                    type: selectedChange.type,
                    change: selectedChange,
                    action: type,
                    replaceWith: undefined,
                } satisfies RemoveChangeApply;
            }
            existingEntry.action = type;

            console.log(existingEntry);

            return {
                ...current,
                [selectedChange.id]: existingEntry,
            };
        });
    }
}

type ChangeApply = RemoveChangeApply | EditableChangeApply | AddedChangeApply;

const removeChangeApplyActionSchema = z.literal([
    'remove',
    'replace',
    'placeholder',
]);

interface RemoveChangeApply {
    type: 'removed';
    change: RemovedElementChangeImpact;
    action: z.infer<typeof removeChangeApplyActionSchema>;
    replaceWith?: ElementDto;
}

interface EditableChangeApply {
    type: 'editable';
    action: 'keep' | 'update';
}

interface AddedChangeApply {
    type: 'added';
    action: 'keep';
}
