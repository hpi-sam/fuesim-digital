import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
    AlarmGroup,
    checkCollectionRole,
    CollectionEntityId,
    isCollectionEntityId,
    VehicleTemplate,
    vehicleTemplateSchema,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import {
    NgbDropdownModule,
    NgbModal,
    NgbNavModule,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { VersionedElementModalComponent } from '../editor-modals/versioned-element-modal/versioned-element-modal.component';
import { ElementCardComponent } from '../element-card/element-card.component';
import {
    CollectionService,
    ExerciseElementSetSubscriptionData,
} from '../../../core/exercise-element.service';
import { VersionedElementDisplayNamePipe } from '../../../shared/pipes/versioned-element-type-display-name.pipe';
import { UsedCollectionsTabComponent } from './used-collections-tab/used-collections-tab.component';
import { CollectionDetailsTabComponent } from './collection-details-tab/collection-details-tab.component';
import { CreatingVersionedElementModalData } from '../editor-modals/base-versioned-element-submodal';

@Component({
    selector: 'app-marketplace-set-detail',
    imports: [
        ElementCardComponent,
        DatePipe,
        NgbDropdownModule,
        NgbTooltip,
        VersionedElementDisplayNamePipe,
        NgbNavModule,
        RouterLink,
        UsedCollectionsTabComponent,
        CollectionDetailsTabComponent,
    ],
    templateUrl: './marketplace-set-detail.component.html',
    styleUrl: './marketplace-set-detail.component.scss',
})
export class MarketplaceSetDetailComponent implements OnDestroy {
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly collectionService = inject(CollectionService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly router = inject(Router);

    public _collectionEntityId!: CollectionEntityId;

    private readonly destroy$ = new Subject<void>();

    public readonly selectedCollectionData =
        signal<ExerciseElementSetSubscriptionData | null>(null);

    public readonly availableElements = computed(() => {
        const selectedCollectionData = this.selectedCollectionData();
        if (!selectedCollectionData) return [];

        return [
            ...selectedCollectionData.objects.direct,
            ...selectedCollectionData.objects.transitive.flatMap(
                (d) => d.elements
            ),
        ];
    });

    public routerBackLink: { title: string; link: string } = {
        title: 'meinen Sammlungen',
        link: '/collections',
    };

    public readonly checkRole = checkCollectionRole.bind(this);

    // This array defined the order in which the element types are displayed in the UI.
    // Types not included in this array will NOT be displayed in the UI
    public visibleElementTypesOrder: VersionedElementContent['type'][] = [
        'vehicleTemplate',
        'alarmGroup',
    ];

    private unsubscribeEventSource: (() => void) | null = null;

    constructor() {
        this.activatedRoute.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                this.unsubscribeEventSource?.();
                const collectionEntityId =
                    params.get('collectionEntityId') ?? '';

                if (!isCollectionEntityId(collectionEntityId)) {
                    this.router.navigate(['/collections']);
                    return;
                }

                this._collectionEntityId = collectionEntityId;

                this.unsubscribeEventSource =
                    this.collectionService.subscribeToCollection(
                        collectionEntityId,
                        (data) => {
                            this.selectedCollectionData.set(data);
                        }
                    );
            });

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

    public createNewAlarmgroup() {
        const selectedCollectionData = this.selectedCollectionData();
        if (!selectedCollectionData) {
            throw new Error('selectedCollectionData is null');
        }

        const modal = this.ngbModalService.open(
            VersionedElementModalComponent,
            {
                size: 'xl',
            }
        );
        modal.componentInstance.data = {
            type: 'alarmGroup',
            isEditMode: false,
            onSubmit: async (data: any) => {
                await this.collectionService.createElement(
                    this._collectionEntityId,
                    data
                );
            },
            collection: selectedCollectionData.collection,
            availableCollectionElements: this.availableElements(),
        } satisfies CreatingVersionedElementModalData<AlarmGroup>;
    }

    public createNewVehicle() {
        const selectedCollectionData = this.selectedCollectionData();
        if (!selectedCollectionData) {
            throw new Error('selectedCollectionData is null');
        }

        const modal = this.ngbModalService.open(
            VersionedElementModalComponent,
            {
                size: 'xl',
            }
        );
        modal.componentInstance.data = {
            type: 'vehicleTemplate',
            isEditMode: false,
            onSubmit: async (vehicleTemplate) => {
                this.collectionService.createElement(
                    this._collectionEntityId,
                    vehicleTemplateSchema.parse(vehicleTemplate)
                );
            },
            collection: selectedCollectionData.collection,
            availableCollectionElements: this.availableElements(),
        } satisfies CreatingVersionedElementModalData<VehicleTemplate>;
    }

    public async duplicateCollection() {
        const selectedVersion =
            this.selectedCollectionData()?.collection.versionId;
        if (!selectedVersion) return;

        await this.collectionService.duplicateCollection(
            this._collectionEntityId,
            selectedVersion
        );
    }

    public async leaveCollection() {
        await this.collectionService.leaveCollection(this._collectionEntityId);
        this.router.navigate(['/collections']);
    }

    public async saveDraftState() {
        await this.collectionService.saveDraftState(this._collectionEntityId);
    }

    public async unarchiveCollection() {
        await this.collectionService.unarchiveCollection(
            this._collectionEntityId
        );
    }

    ngOnDestroy(): void {
        this.unsubscribeEventSource?.();
        this.destroy$.next();
    }
}
