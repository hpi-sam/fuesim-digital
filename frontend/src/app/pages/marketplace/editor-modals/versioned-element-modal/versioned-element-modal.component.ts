import { Component, computed, inject, input, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
    ElementDto,
    Marketplace,
    VersionedCollectionPartial,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import { CollectionService } from '../../../../core/exercise-element.service';
import { VehicleTemplateFormMarketplaceComponent } from '../vehicle-template-form/vehicle-template-form.component';
import { AlarmgroupElementModalComponent } from '../alarmgroup-element-modal/alarmgroup-element-modal.component';
import { LocaleDatePipe } from '../../../../shared/pipes/localeDate.pipe';
import { JsonPipe } from '@angular/common';

export interface SharedVersionedElementModalData<T> {
    onSubmit: (values: T) => void;
    type: VersionedElementContent['type'];
    collection: VersionedCollectionPartial;
    isEditMode: boolean;
    availableCollectionElements: ElementDto[];
}

export interface CreatingVersionedElementModalData<T>
    extends SharedVersionedElementModalData<T> {
    isEditMode: false;
}

export interface EditingVersionedElementModalData<T>
    extends SharedVersionedElementModalData<T> {
    isEditMode: true;
    element: ElementDto;
}

export type VersionedElementModalData<T> =
    | CreatingVersionedElementModalData<T>
    | EditingVersionedElementModalData<T>;

@Component({
    selector: 'app-versioned-element-modal',
    imports: [
        VehicleTemplateFormMarketplaceComponent,
        AlarmgroupElementModalComponent,
        LocaleDatePipe,
        JsonPipe,
    ],
    templateUrl: './versioned-element-modal.component.html',
    styleUrl: './versioned-element-modal.component.scss',
})
export class VersionedElementModalComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly activeModal = inject(NgbActiveModal);

    // This data must be provided when opening the modal via NgbModal.
    public data!: VersionedElementModalData<any>;

    public readonly selectedVersion = signal<number | null>(null);
    public readonly selectedVersionData = computed<
        VersionedElementModalData<any>
    >(() => {
        console.log(
            'Computing selectedVersionData with selectedVersion:',
            this.selectedVersion()
        );
        if (this.timeTravelMode()) {
            console.log(
                'Time travel mode is active. Finding version data for version:',
                this.selectedVersion()
            );
            return {
                ...this.data,
                element: this.findVersionData(this.selectedVersion()!),
            };
        }
        console.log('Time travel mode is not active. Returning current data.');
        return this.data;
    });

    public readonly timeTravelMode = computed<boolean>(() => {
        if (this.data.isEditMode === false) return false;
        if (this.selectedVersion() === null) return false;

        return this.selectedVersion() !== this.data.element.version;
    });

    public readonly versionHistory = signal<ElementDto[] | null>(null);

    public async selectVersion(version: number) {
        this.selectedVersion.set(version);
    }

    public findVersionData(version: number) {
        console.log('Finding version data for version:', version);
        const versionData = this.versionHistory()
            ? this.versionHistory()!.find((v) => v.version === version)
            : null;

        if (!versionData) {
            throw new Error('Version data not found for version ' + version);
        }
        console.log('Found version data:', versionData);

        return versionData;
    }

    public async ngOnInit() {
        if (this.data.isEditMode) {
            const versionData = await this.collectionService.getElementVersions(
                this.data.collection.entityId,
                this.data.element.entityId
            );
            this.versionHistory.set(versionData);

            if (
                this.selectedVersion() === null &&
                this.data.element.version !== null
            ) {
                this.selectedVersion.set(this.data.element.version);
            }
        }
    }

    public async submit(data: any) {
        this.data.onSubmit(data);
        this.close();
    }

    private close() {
        this.activeModal.close();
    }
}
