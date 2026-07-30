import {
    Component,
    computed,
    effect,
    inject,
    resource,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    CollectionVersion,
    CollectionEntityId,
    VersionedCollectionPartial,
    gatherAllVisibleCollectionElements,
    checkCollectionOrganisationRole,
} from 'fuesim-digital-shared';
import {
    NgbAccordionModule,
    NgbActiveModal,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { RouterLink, RouterLinkWithHref } from '@angular/router';
// we cannot get around it
// eslint-disable-next-line import/no-cycle
import { CollectionElementsListComponent } from '../../collection-elements-list/collection-elements-list.component';
import { CollectionService } from '../../../../../core/exercise-element.service';

@Component({
    selector: 'app-select-collection-modal',
    templateUrl: './marketplace-select-collection-modal.component.html',
    styleUrl: './marketplace-select-collection-modal.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        CollectionElementsListComponent,
        RouterLink,
        RouterLinkWithHref,
        NgbTooltip,
        NgbAccordionModule,
    ],
})
export class MarketplaceSelectCollectionModalComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly activeModal = inject(NgbActiveModal);

    public title = '';
    public disallowedCollections: CollectionEntityId[] = [];
    public collectionSelectionResult$ = new Subject<CollectionVersion | null>();
    public showDependencyElements = false;
    public allowLeave = true;
    public allowCreate = false;
    public showInfoBanner = false;
    public restrictToEditable = false;
    public selectionInfoText = 'Möchten Sie diese Sammlung auswählen?';
    public skipOnNoChoice = false;

    private constructor() {
        effect(() => {
            if (
                this.userAvailableCollections.isLoading() ||
                this.userAvailableCollections.error() ||
                !this.userAvailableCollections.hasValue()
            ) {
                return;
            }

            const userAvailableCollections =
                this.userAvailableCollections.value();
            if (this.skipOnNoChoice && userAvailableCollections.length === 1) {
                const firstCollection = userAvailableCollections[0];
                if (firstCollection === undefined) {
                    console.warn('only collection is undefined');
                    return;
                }
                this.close(firstCollection);
            }
        });
    }

    public readonly userAvailableCollections = resource({
        loader: async () =>
            this.collectionService.getUsableCollections().then((collections) =>
                collections.filter((collection) => {
                    if (
                        this.restrictToEditable &&
                        !checkCollectionOrganisationRole(
                            collection.relationship
                        ).isAtLeast('owner')
                    ) {
                        return false;
                    }

                    return true;
                })
            ),
    });

    public readonly isDisallowedCollection = (
        collection: VersionedCollectionPartial
    ) => this.disallowedCollections.includes(collection.entityId);

    public readonly selectedCollectionData = resource({
        params: () => ({
            collection: this.selectedCollection(),
        }),
        loader: async ({ params: { collection } }) =>
            collection
                ? Promise.all([
                      this.collectionService.getCollectionVersion(collection),
                      this.collectionService.getElementsOfCollectionVersion(
                          collection
                      ),
                  ])
                : Promise.resolve(null),
    });

    public readonly selectedCollectionDataElements = computed(() => {
        const data = this.selectedCollectionData.value();
        if (!data) return [];

        if (this.showDependencyElements) {
            return gatherAllVisibleCollectionElements(data[1]);
        }
        return data[1].direct;
    });

    public readonly selectedCollection =
        signal<VersionedCollectionPartial | null>(null);

    public selectCollection(id: VersionedCollectionPartial | null) {
        this.selectedCollection.set(id);
    }

    public close(collection: CollectionVersion | null) {
        this.collectionSelectionResult$.next(collection);
        this.collectionSelectionResult$.complete();
        this.activeModal.close();
    }
}
