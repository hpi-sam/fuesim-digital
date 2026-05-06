import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
    ChangedElementDto,
    ChangeDependencies,
    ElementDto,
    VersionedCollectionPartial,
} from 'fuesim-digital-shared';
import { Subject } from 'rxjs';
import { Immutable } from 'immer';
import { VersionedElementFormComponent } from '../editor-modals/versioned-element-form/versioned-element-form.component';
import { VersionedElementModalData } from '../editor-modals/base-versioned-element-submodal';
import { VersionedElementDisplayNamePipe } from '../../../../../shared/pipes/versioned-element-type-display-name.pipe';

@Component({
    selector: 'app-marketplace-collection-update-impact-modal',
    styleUrl: './marketplace-collection-update-impact-modal.component.scss',
    templateUrl: './marketplace-collection-update-impact-modal.component.html',
    imports: [VersionedElementFormComponent, VersionedElementDisplayNamePipe],
})
export class CollectionUpgradeImpactModalComponent {
    private readonly activeModal = inject(NgbActiveModal);

    public collection!: VersionedCollectionPartial;
    public changes!: ChangedElementDto[];
    public collectionElements!: Immutable<ElementDto[]>;
    public changeDependencies!: ChangeDependencies | undefined;
    public confirmationButtonText = 'OK';
    public readonly confirmationResult$ = new Subject<boolean | null>();

    public readonly selectedChange = signal<{
        change: ChangedElementDto;
        oldView: VersionedElementModalData<any> | null;
        newView: VersionedElementModalData<any> | null;
    } | null>(null);
    public readonly selectedView = signal<'new' | 'old'>('old');

    public selectChange(change: ChangedElementDto) {
        const type = change.new?.content.type ?? change.old?.content.type;
        if (!type) {
            console.error(
                'Could not determine type of changed element',
                change
            );
            return;
        }

        const oldView: VersionedElementModalData<any> | null = change.old
            ? {
                  element: change.old,
                  availableCollectionElements: this.collectionElements,
                  mode: 'view',
                  collection: this.collection,
                  onSubmit: () => {
                      /* nop */
                  },
                  type,
              }
            : null;

        const newView: VersionedElementModalData<any> | null = change.new
            ? {
                  element: change.new,
                  availableCollectionElements: this.collectionElements,
                  mode: 'view',
                  collection: this.collection,
                  onSubmit: () => {
                      /* nop */
                  },
                  type,
              }
            : null;

        this.selectedChange.set({
            change,
            oldView,
            newView,
        });

        this.selectedView.set(newView ? 'new' : 'old');
    }

    public close(confirmed: boolean | null = null) {
        this.confirmationResult$.next(confirmed);
        this.confirmationResult$.complete();
        this.activeModal.close();
    }
}
