import {
    Component,
    computed,
    inject,
    OnDestroy,
    OnInit,
    signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
    checkCollectionRole,
    CollectionEntityId,
    isCollectionEntityId,
} from 'fuesim-digital-shared';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import {
    NgbDropdownModule,
    NgbModal,
    NgbNavModule,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { DatePipe, JsonPipe } from '@angular/common';
import { ElementCardComponent } from '../element-card/element-card.component';
import {
    CollectionService,
    CollectionSubscriptionData,
} from '../../../core/exercise-element.service';
import { VersionedElementDisplayNamePipe } from '../../../shared/pipes/versioned-element-type-display-name.pipe';
import { UsedCollectionsTabComponent } from './used-collections-tab/used-collections-tab.component';
import { CollectionDetailsTabComponent } from './collection-details-tab/collection-details-tab.component';
import { CollectionElementsTabComponent } from './collection-elements-tab/collection-elements-tab.component';
import { collectionDataResolver, CollectionDataResolverResult } from '../collection-data.resolver';

@Component({
    selector: 'app-marketplace-set-detail',
    imports: [
        ElementCardComponent,
        DatePipe,
        NgbDropdownModule,
        NgbTooltip,
        VersionedElementDisplayNamePipe,
        CollectionElementsTabComponent,
        NgbNavModule,
        RouterLink,
        UsedCollectionsTabComponent,
        CollectionDetailsTabComponent,
        JsonPipe,
    ],
    templateUrl: './marketplace-set-detail.component.html',
    styleUrl: './marketplace-set-detail.component.scss',
})
export class MarketplaceSetDetailComponent implements OnDestroy, OnInit {
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly collectionService = inject(CollectionService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly router = inject(Router);

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
        await this.collectionService.leaveCollection(this.collection.collectionEntityId);
        this.router.navigate(['/collections']);
    }

    public async saveDraftState() {
        await this.collectionService.saveDraftState(this.collection.collectionEntityId);
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
