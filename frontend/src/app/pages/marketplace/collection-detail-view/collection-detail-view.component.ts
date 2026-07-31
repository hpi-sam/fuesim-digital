import {
    Component,
    inject,
    OnDestroy,
    OnInit,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
    checkCollectionMembershipRole,
    exerciseKeySchema,
    gatherAllVisibleCollectionElements,
    getCollectionElementDiff,
} from 'fuesim-digital-shared';
import { Subject, takeUntil } from 'rxjs';
import {
    NgbDropdownModule,
    NgbModal,
    NgbNavModule,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import {
    CollectionService,
    CollectionSubscriptionData,
} from '../../../core/exercise-element.service';
import { CollectionUpgradeImpactModalComponent } from '../shared/modals/marketplace-collection-update-impact-modal/marketplace-collection-update-impact-modal.component';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';
import { CollectionDataResolverResult } from '../collection-data.resolver';
import { openSelectCollectionModal } from '../shared/modals/marketplace-select-collection-modal/select-collection-modal';
import { openCreateCollectionModal } from '../shared/modals/create-collection-modal/open-create-collection-modal';
import { MessageService } from '../../../core/messages/message.service';
import { UsedCollectionsTabComponent } from './used-collections-tab/used-collections-tab.component';
import { CollectionDetailsTabComponent } from './collection-properties-tab/collection-properties-tab.component';
import { CollectionElementsTabComponent } from './collection-elements-tab/collection-elements-tab.component';

@Component({
    selector: 'app-marketplace-set-detail',
    imports: [
        DatePipe,
        NgbDropdownModule,
        NgbTooltip,
        CollectionElementsTabComponent,
        NgbNavModule,
        RouterLink,
        UsedCollectionsTabComponent,
        CollectionDetailsTabComponent,
    ],
    templateUrl: './collection-detail-view.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './collection-detail-view.component.scss',
})
export class MarketplaceSetDetailComponent implements OnDestroy, OnInit {
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly collectionService = inject(CollectionService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly router = inject(Router);
    private readonly confirmationService = inject(ConfirmationModalService);
    private readonly messageService = inject(MessageService);

    public readonly resolved = toSignal(this.activatedRoute.data);

    private readonly destroy$ = new Subject<void>();

    public readonly selectedCollectionData =
        signal<CollectionSubscriptionData | null>(null);

    public routerBackLink: {
        title: string;
        link: string;
        important: boolean;
        icon: string | null;
        queryParams: object | null;
    } = {
        title: 'meinen Sammlungen',
        link: '/collections',
        important: false,
        icon: null,
        queryParams: null,
    };

    public readonly checkRole = checkCollectionMembershipRole.bind(this);

    private readonly collection = this.activatedRoute.snapshot.data[
        'collectionSubscription'
    ] as CollectionDataResolverResult;

    ngOnInit() {
        this.collection.subject
            .pipe(takeUntil(this.destroy$))
            .subscribe((data) => {
                this.selectedCollectionData.set(data);
            });
    }

    constructor() {
        // TODO: @Quixelation remove this before prod

        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.activatedRoute.queryParamMap
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                const fromLocation = params.get('from');
                if (fromLocation === 'archive') {
                    this.routerBackLink = {
                        title: 'meinem Archiv',
                        link: '/collections/archive',
                        important: false,
                        icon: null,
                        queryParams: null,
                    };
                } else if (fromLocation?.startsWith('org-')) {
                    this.routerBackLink = {
                        title: 'der Organisation',
                        link: `/organisations/${fromLocation.slice(4)}`,
                        important: false,
                        icon: null,
                        queryParams: null,
                    };
                } else if (exerciseKeySchema.safeParse(fromLocation).success) {
                    this.routerBackLink = {
                        title: 'der Übung',
                        link: `/exercises/${fromLocation}`,
                        important: true,
                        icon: 'bi bi-map mx-1',
                        queryParams: {
                            openmanagecollectionmodal: 'true',
                        },
                    };
                }
            });
    }

    public async useCollection() {
        openSelectCollectionModal(this.ngbModalService, {
            allowCreate: true,
            restrictToEditable: true,
            selectionInfoText:
                'Wollen Sie die Sammlung in der ausgewählten Sammlung verwenden?',
        });
    }

    public async duplicateCollection() {
        const selectedCollection = this.selectedCollectionData()?.collection;
        if (!selectedCollection) return;

        openCreateCollectionModal(this.ngbModalService, {
            basedOnCollection: selectedCollection,
            prefilledName: `Kopie von ${selectedCollection.title}`,
        }).subscribe((created) => {
            if (created) {
                this.router.navigate(['/collections/', created.entityId]);
                this.messageService.postMessage({
                    color: 'info',
                    title: 'Zu neuer Sammlung gewechselt',
                    body: 'Sie befinden sich nun in der neuen Sammlung, die auf der vorherigen Sammlung basiert.',
                });
            } else {
                this.messageService.postError({
                    title: 'Fehler beim Duplizieren der Sammlung',
                    body: 'Die Sammlung konnte nicht dupliziert werden.',
                });
            }
        });
    }

    public async viewDraftStateChanges() {
        const collectionData = this.selectedCollectionData();
        if (!collectionData) return;

        const changes = getCollectionElementDiff(
            collectionData.publishedElements.direct,
            collectionData.objects.direct
        );

        const modal = this.ngbModalService.open(
            CollectionUpgradeImpactModalComponent,
            {
                size: 'xl',
            }
        );

        const modalInstance =
            modal.componentInstance as CollectionUpgradeImpactModalComponent;
        modalInstance.changes = changes;
        modalInstance.collectionElements = gatherAllVisibleCollectionElements(
            collectionData.objects
        );
    }

    public async saveDraftState() {
        await this.collectionService.saveDraftState(
            this.collection.collectionEntityId
        );
    }

    public async revertDraftState() {
        const result = await this.confirmationService.confirm({
            title: 'Änderungen verwerfen',
            description:
                'Möchten Sie wirklich alle ungespeicherten Änderungen verwerfen und zum zuletzt veröffentlichten Zustand zurückkehren?',
            confirmationButtonText: 'Änderungen verwerfen',
        });
        if (!result) return;

        await this.collectionService.revertDraftState(
            this.collection.collectionEntityId
        );
    }

    public async unarchiveCollection() {
        await this.collectionService.unarchiveCollection(
            this.collection.collectionEntityId
        );
    }

    ngOnDestroy(): void {
        this.collection.subject.complete();
        this.destroy$.next();
    }
}
