import { Component, inject, resource, signal } from '@angular/core';
import {
    NgbAccordionModule,
    NgbActiveModal,
    NgbModal,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
    CollectionDto,
    CollectionElementsDto,
    VersionedCollectionPartial,
} from 'fuesim-digital-shared';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { ExerciseService } from '../../../../../core/exercise.service';
import { AppState } from '../../../../../state/app.state';
import { selectSelectedCollections } from '../../../../../state/application/selectors/exercise.selectors';
import { openSelectCollectionModal } from '../../../../marketplace/shared/modals/marketplace-select-collection-modal/select-collection-modal';
import { DragElementService } from '../core/drag-element.service';
import { CollectionElementsListComponent } from '../../../../marketplace/shared/collection-elements-list/collection-elements-list.component';
import { ExerciseColletionItemComponent } from './exercise-collection-item/exercise-collection-item.component';

@Component({
    selector: 'app-manage-exercise-collections-modal',
    templateUrl: './manage-exercise-collections-modal.component.html',
    styleUrl: './manage-exercise-collections-modal.component.scss',
    imports: [
        ExerciseColletionItemComponent,
        NgbAccordionModule,
        CollectionElementsListComponent,
    ],
})
export class ManageExerciseCollectionsModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    public readonly dragElementService = inject(DragElementService);
    private readonly collectionService = inject(CollectionService);
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly ngbModalService = inject(NgbModal);
    public readonly availableCollections = signal<CollectionDto[]>([]);
    public readonly updateAvailable = signal<Awaited<
        ReturnType<typeof this.collectionService.checkNewerVersionAvailable>
    > | null>(null);

    public selectedCollections = this.store.selectSignal(
        selectSelectedCollections
    );

    public readonly collectionElements = resource({
        params: () => ({
            collections: this.selectedCollections(),
        }),
        loader: async ({ params: { collections } }) =>
            Promise.all(
                collections.map(async (collection) => ({
                    collection,
                    elements:
                        await this.collectionService.getElementsOfCollectionVersion(
                            collection
                        ),
                }))
            ),
    });

    public getElementsByCollection(
        collection: VersionedCollectionPartial
    ): CollectionElementsDto {
        return (
            this.collectionElements
                .value()
                ?.find((e) => e.collection.versionId === collection.versionId)
                ?.elements ?? { direct: [], imported: [], references: [] }
        );
    }

    public async openCollectionSelectDialog() {
        const result = await openSelectCollectionModal(this.ngbModalService, {
            showDependencyElements: true,
            disallowedCollections: this.selectedCollections().map(
                (e) => e.entityId
            ),
        });
        if (result === null) return;
        await this.exerciseService.addCollection(result);
    }

    public close() {
        this.activeModal.close();
    }
}
