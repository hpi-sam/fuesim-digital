import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import {
    CollectionService,
    ExerciseElementSetSubscriptionData,
} from '../../../core/exercise-element.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
    AlarmGroup,
    CollectionEntityId,
    CollectionVersionId,
    isCollectionEntityId,
    VehicleTemplate,
    vehicleTemplateSchema,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import { Subject, takeUntil } from 'rxjs';
import {
    NgbDropdownModule,
    NgbModal,
    NgbNavModule,
} from '@ng-bootstrap/ng-bootstrap';
import {
    CreatingVersionedElementModalData,
    VersionedElementModalComponent,
} from '../editor-modals/versioned-element-modal/versioned-element-modal.component';
import { ElementCardComponent } from '../element-card/element-card.component';
import { LocaleDatePipe } from '../../../shared/pipes/localeDate.pipe';
import { AsyncPipe } from '@angular/common';
import { VersionedElementDisplayNamePipe } from '../../../shared/pipes/versioned-element-type-display-name.pipe';
import { UsedCollectionsTabComponent } from './used-collections-tab/used-collections-tab.component';
import { CollectionDetailsTabComponent } from './collection-details-tab/collection-details-tab.component';

@Component({
    selector: 'app-marketplace-set-detail',
    imports: [
        ElementCardComponent,
        LocaleDatePipe,
        NgbDropdownModule,
        VersionedElementDisplayNamePipe,
        NgbNavModule,
        AsyncPipe,
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

    public _setEntityId!: CollectionEntityId;

    private readonly destroy$ = new Subject<void>();

    public selectedSetData = signal<ExerciseElementSetSubscriptionData | null>(
        null
    );

    public availableElements = computed(() => {
        const selectedSetData = this.selectedSetData();
        if (!selectedSetData) return [];

        return [
            ...selectedSetData.objects.direct,
            ...selectedSetData.objects.transitive.flatMap((d) => d.elements),
        ];
    });

    // This array defined the order in which the element types are displayed in the UI.
    // Types not included in this array will NOT be displayed in the UI
    public visibleElementTypesOrder: VersionedElementContent['type'][] = [
        'vehicleTemplate',
        'alarmGroup',
    ];

    private subscription: (() => void) | null = null;

    constructor() {
        console.log("FUCUCUCU")
        this.activatedRoute.paramMap
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                this.subscription?.();
                const setEntityId = params.get('setEntityId') ?? '';

                if (!isCollectionEntityId(setEntityId)) {
                    this.router.navigate(['/marketplace']);
                    return;
                }

                this._setEntityId = setEntityId;

                this.subscription =
                    this.collectionService.subscribeToCollection(
                        setEntityId,
                        (data) => {
                            console.log(
                                'Received data for set',
                                setEntityId,
                                data
                            );
                            this.selectedSetData.set(data);
                        }
                    );
            });
    }

    public createNewAlarmgroup() {
        const selectedSetData = this.selectedSetData?.();
        if (!selectedSetData) {
            throw new Error('selectedSetData is null');
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
                console.log('Creating new alarm group with data', data);
                await this.collectionService.createElement(
                    this._setEntityId,
                    data
                );
            },
            collection: selectedSetData.collection,
            availableCollectionElements: this.availableElements(),
        } satisfies CreatingVersionedElementModalData<AlarmGroup>;
    }

    public createNewVehicle() {
        const selectedSetData = this.selectedSetData?.();
        if (!selectedSetData) {
            throw new Error('selectedSetData is null');
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
                console.log(
                    'Creating new vehicle template with data',
                    vehicleTemplate
                );
                this.collectionService.createElement(
                    this._setEntityId,
                    vehicleTemplateSchema.parse(vehicleTemplate)
                );
            },
            collection: selectedSetData.collection,
            availableCollectionElements: this.availableElements(),
        } satisfies CreatingVersionedElementModalData<VehicleTemplate>;
    }

    public async duplicateSet() {
        const selectedVersion = this.selectedSetData()?.collection.versionId;
        if (!selectedVersion) return;
        console.log('duplicateSet', this._setEntityId);

        await this.collectionService.duplicateCollection(
            this._setEntityId,
            selectedVersion
        );
    }


    public async saveDraftState() {
        await this.collectionService.saveDraftState(this._setEntityId);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
    }
}
