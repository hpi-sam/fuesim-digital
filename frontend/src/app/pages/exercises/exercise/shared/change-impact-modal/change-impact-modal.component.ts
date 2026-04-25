import { Component, inject, signal } from '@angular/core';
import { ElementDto } from 'fuesim-digital-shared';
import { JsonPipe } from '@angular/common';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { MapEditorCardComponent } from '../../../../../shared/components/map-editor-card/map-editor-card.component';
import { VersionedElementDisplayNamePipe } from '../../../../../shared/pipes/versioned-element-type-display-name.pipe';
import { ChangeApply, ChangeImpact } from './change-impact-types';
import { DeletedElementChangeApplyItemComponent } from './deleted-element-item/deleted-element-item.component';
import { EditedElementChangeApplyItemComponent } from './edited-element-item/edited-element-item.component';

@Component({
    selector: 'app-change-impact-modal',
    templateUrl: './change-impact-modal.component.html',
    styleUrl: './change-impact-modal.component.scss',
    imports: [
        MapEditorCardComponent,
        JsonPipe,
        VersionedElementDisplayNamePipe,
        EditedElementChangeApplyItemComponent,
        DeletedElementChangeApplyItemComponent,
        NgbTooltip,
    ],
})
export class ChangeImpactModalComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly activeModal = inject(NgbActiveModal);

    // This data must be provided when opening the modal via NgbModal.
    public readonly changes: ChangeImpact[] = [];
    public readonly newCollectionElements!: ElementDto[];

    public readonly selectedChangeIndex = signal<number | null>(null);

    public selectChange(index: number) {
        this.selectedChangeIndex.set(index);
    }

    public readonly changesToApply = signal<{ [key: string]: ChangeApply }>({});

    public applyChange(change: ChangeImpact, apply: ChangeApply) {
        this.changesToApply.update((current) => ({
            ...current,
            [change.id]: apply,
        }));
    }

    public applyChangeForAll(change: ChangeImpact) {
        console.log('Applying change for all changes of the same versionId');
        const versionId = change.entity.versionId;
        console.log('VersionId:', versionId);
        const actionToApply = this.changesToApply()[change.id];
        console.log('Action to apply:', actionToApply);
        if (!actionToApply) return;

        for (const otherChange of this.changes) {
            if (otherChange.entity.versionId === versionId) {
                this.applyChange(otherChange, actionToApply);
            }
        }
    }

    public actionedChangesCount(): number {
        return this.changes.filter((change) => this.changesToApply()[change.id])
            .length;
    }

    public actionExistsForChange(change: ChangeImpact): boolean {
        const apply = this.changesToApply()[change.id];
        if (!apply) return false;

        if (apply.type === 'removed' && apply.action === 'replace') {
            return !!apply.replaceWith;
        }

        return true;
    }

    public close(data: boolean | null) {
        this.activeModal.close();
    }
}
