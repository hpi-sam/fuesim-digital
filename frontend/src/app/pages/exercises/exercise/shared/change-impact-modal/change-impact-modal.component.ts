import { Component, inject, signal } from '@angular/core';
import { ElementDto } from 'fuesim-digital-shared';
import { z } from 'zod';
import { JsonPipe } from '@angular/common';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { MapEditorCardComponent } from '../../../../../shared/components/map-editor-card/map-editor-card.component';
import {
    ChangeImpact,
    RemovedElementChangeImpact,
} from './change-impact-types';

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

    public readonly selectedChangeIndex = signal<number | null>(null);

    public selectChange(index: number) {
        this.selectedChangeIndex.set(index);
    }

    public readonly changesToApply = signal<{ [key: string]: ChangeApply }>({});
    public readonly elementsOfNewCollection = signal<ElementDto[] | null>(null);

    public setRemovalActionType(type: RemoveChangeApply['action']) {
        const index = this.selectedChangeIndex();
        if (index === null) return;

        const selectedChange = this.changes[index];

        if (!selectedChange) return;
        if (selectedChange.type !== 'removed') return;

        this.changesToApply.update((current) => {
            let existingEntry = current[selectedChange.id];

            existingEntry ??= {
                type: selectedChange.type,
                change: selectedChange,
                action: type,
                replaceWith: undefined,
            } satisfies RemoveChangeApply;

            existingEntry.action = type;

            return {
                ...current,
                [selectedChange.id]: existingEntry,
            };
        });
    }
}

type ChangeApply = AddedChangeApply | EditableChangeApply | RemoveChangeApply;

export const removeChangeApplyActionSchema = z.literal([
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
