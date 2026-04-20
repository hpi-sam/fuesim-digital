import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
    checkCollectionRole,
    gatherCollectionElements,
    getCollectionElementDiff,
} from 'fuesim-digital-shared';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
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
import { UsedCollectionsTabComponent } from './used-collections-tab/used-collections-tab.component';
import { CollectionDetailsTabComponent } from './collection-details-tab/collection-details-tab.component';
import { CollectionElementsTabComponent } from './collection-elements-tab/collection-elements-tab.component';
import { CollectionDataResolverResult } from '../collection-data.resolver';
import { CollectionUpgradeImpactModalComponent } from '../marketplace-collection-update-impact-modal/marketplace-collection-update-impact-modal.component';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';

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
    templateUrl: './marketplace-set-detail.component.html',
    styleUrl: './marketplace-set-detail.component.scss',
})
export class MarketplaceSetDetailComponent implements OnDestroy, OnInit {
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly collectionService = inject(CollectionService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly router = inject(Router);
    private readonly confirmationService = inject(ConfirmationModalService);

    public readonly resolved = toSignal(this.activatedRoute.data);

    private readonly destroy$ = new Subject<void>();

    public readonly selectedCollectionData =
        signal<CollectionSubscriptionData | null>(null);

    public routerBackLink: { title: string; link: string } = {
        title: 'meinen Sammlungen',
        link: '/collections',
    };

    public readonly checkRole = checkCollectionRole.bind(this);

    private collection = this.activatedRoute.snapshot.data[
        'collectionSubscription'
    ] as CollectionDataResolverResult;

    ngOnInit() {
        this.collection.subject.subscribe((data) =>
            this.selectedCollectionData.set(data)
        );
    }

    constructor() {
        //TODO: @Quixelation remove this before prod
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.activatedRoute.queryParamMap
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                const fromLocation = params.get('from');
                switch (fromLocation) {
                    case 'archive':
                        this.routerBackLink = {
                            title: 'meinem Archiv',
                            link: '/collections/archive',
                        };
                        break;
                }
            });
    }

    public async duplicateCollection() {
        const selectedVersion =
            this.selectedCollectionData()?.collection.versionId;
        if (!selectedVersion) return;

        await this.collectionService.duplicateCollection(
            this.collection.collectionEntityId,
            selectedVersion
        );
    }

    public async leaveCollection() {
        await this.collectionService.leaveCollection(
            this.collection.collectionEntityId
        );
        this.router.navigate(['/collections']);
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
        modalInstance.collectionElements = gatherCollectionElements(
            collectionData.objects
        ).allVisibleElements();
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
