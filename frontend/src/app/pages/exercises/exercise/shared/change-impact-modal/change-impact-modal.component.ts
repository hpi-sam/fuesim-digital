import { Component, inject, signal } from '@angular/core';
import {  ElementDto } from 'fuesim-digital-shared';
import { JsonPipe } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { MapEditorCardComponent } from '../../../../../shared/components/map-editor-card/map-editor-card.component';
import { VersionedElementDisplayNamePipe } from '../../../../../shared/pipes/versioned-element-type-display-name.pipe';
import {
    ChangeApply,
    ChangeImpact,
} from './change-impact-types';
import { DeletedElementChangeApplyItemComponent } from './deleted-element-item/deleted-element-item.component';

@Component({
    selector: 'app-change-impact-modal',
    templateUrl: './change-impact-modal.component.html',
    styleUrl: './change-impact-modal.component.scss',
    imports: [
        MapEditorCardComponent,
        JsonPipe,
        VersionedElementDisplayNamePipe,
        DeletedElementChangeApplyItemComponent
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

    public async applyChange(change: ChangeImpact, apply: ChangeApply) {
        this.changesToApply.update((current) => ({
                ...current,
                [change.id]: apply,
            }))
    }

    public close(data: boolean | null) {
        this.activeModal.close();
    }
}

