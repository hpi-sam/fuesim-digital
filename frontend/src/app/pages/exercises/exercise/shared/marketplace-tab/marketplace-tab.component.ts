import { Component, inject, signal } from '@angular/core';
import {
    CollectionDto,
    gatherCollectionElements,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DragElementService } from '../core/drag-element.service';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { ExerciseService } from '../../../../../core/exercise.service';
import { AppState } from '../../../../../state/app.state';
import {
    selectSelectedCollections,
} from '../../../../../state/application/selectors/exercise.selectors';
import { openSelectCollectionModal } from '../../../../marketplace/shared/modals/marketplace-select-collection-modal/select-collection-modal';
import { MarketplaceColletionItemComponent } from './marketplace-collection-item/marketplace-collection-item.component';

@Component({
    selector: 'app-marketplace-tab',
    imports: [NgbDropdownModule, MarketplaceColletionItemComponent],
    templateUrl: './marketplace-tab.component.html',
    styleUrl: './marketplace-tab.component.scss',
})
export class MarketplaceTabComponent {
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

    public async openCollectionSelectDialog() {
        const result = await openSelectCollectionModal(this.ngbModalService, {
            showDependencyElements: true,
            disallowedCollections: this.selectedCollections().map(
                (e) => e.entityId
            ),
        });
        if (result === null) return;

        const elements =
            await this.collectionService.getElementsOfCollectionVersion(result);
        await this.exerciseService.proposeAction({
            type: '[Collection] Add Collection',
            elements: gatherCollectionElements(elements).allVisibleElements(),
            collectionVersion: {
                versionId: result.versionId,
                entityId: result.entityId,
            },
        });
    }
}
