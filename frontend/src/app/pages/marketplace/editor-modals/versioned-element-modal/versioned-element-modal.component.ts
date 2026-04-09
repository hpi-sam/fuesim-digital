import {
    Component,
    computed,
    inject,
    resource,
    signal,
    OnInit,
} from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ElementDto } from 'fuesim-digital-shared';
import { DatePipe } from '@angular/common';
import { CollectionService } from '../../../../core/exercise-element.service';
import { VehicleTemplateFormMarketplaceComponent } from '../vehicle-template-form/vehicle-template-form.component';
import { AlarmgroupElementModalComponent } from '../alarmgroup-element-modal/alarmgroup-element-modal.component';
import { EditConflictResolutionComponent } from '../edit-conflict-resolution/edit-conflict-resolution.component';
import { MessageService } from '../../../../core/messages/message.service';
import { VersionedElementModalData } from '../base-versioned-element-submodal';
import { VersionedElementFormComponent } from '../versioned-element-form/versioned-element-form.component';

@Component({
    selector: 'app-versioned-element-modal',
    imports: [
        VehicleTemplateFormMarketplaceComponent,
        AlarmgroupElementModalComponent,
        DatePipe,
        VersionedElementFormComponent,
    ],
    templateUrl: './versioned-element-modal.component.html',
    styleUrl: './versioned-element-modal.component.scss',
})
export class VersionedElementModalComponent implements OnInit {
    private readonly collectionService = inject(CollectionService);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly messageService = inject(MessageService);
    private readonly ngbModalService = inject(NgbModal);

    // This data must be provided when opening the modal via NgbModal.
    public data!: VersionedElementModalData<any>;

    public readonly selectedVersion = signal<number | null>(null);
    public readonly selectedVersionData = computed<
        VersionedElementModalData<any>
    >(() => {
        if (this.timeTravelMode()) {
            return {
                ...this.data,
                element: this.findVersionData(this.selectedVersion()!),
            };
        }
        return this.data;
    });

    public readonly timeTravelMode = computed<boolean>(() => {
        if (this.data.mode === 'create') return false;
        if (this.selectedVersion() === null) return false;

        return this.selectedVersion() !== this.data.element.version;
    });

    public readonly versionHistory = signal<ElementDto[] | null>(null);

    public readonly dependentElements = resource({
        params: () => ({ data: this.data }),
        loader: async ({ params: { data } }) => {
            if (data.mode === 'create') return [] as ElementDto[];

            const dependentElements =
                await this.collectionService.getDependentElements(
                    data.element,
                    data.collection
                );

            return dependentElements;
        },
    });

    public async selectVersion(version: number) {
        this.selectedVersion.set(version);
    }

    public findVersionData(version: number) {
        const versionData = this.versionHistory()
            ? this.versionHistory()!.find((v) => v.version === version)
            : null;

        if (!versionData) {
            throw new Error(`Version data not found for version ${version}`);
        }

        return versionData;
    }

    public async ngOnInit() {
        if (
            this.data.mode !== 'create' &&
            this.data.hideVersionHistory !== true
        ) {
            const versionData = await this.collectionService.getElementVersions(
                this.data.collection.entityId,
                this.data.element.entityId
            );
            this.versionHistory.set(versionData);

            if (this.selectedVersion() === null) {
                this.selectedVersion.set(this.data.element.version);
            }
        }
    }

    public async submit(data: any) {
        if (
            !this.dependentElements.hasValue() ||
            this.dependentElements.error()
        ) {
            this.messageService.postMessage({
                color: 'danger',
                title: 'Abhängigkeiten konnten nicht geladen werden',
                body: 'Die Abhängigkeiten des Elements konnten nicht geladen werden. Bitte versuchen Sie es erneut.',
            });
        }
        if ((this.dependentElements.value()?.length ?? 0) > 0) {
            this.openConflictResolution(
                data,
                this.dependentElements.value() ?? []
            );
            return;
        }
        this.data.onSubmit(data);
        this.close();
    }

    public openConflictResolution(
        content: any,
        affectedElementVersions: ElementDto[]
    ) {
        const modal = this.ngbModalService.open(
            EditConflictResolutionComponent,
            {
                size: 'xl',
            }
        );

        modal.componentInstance.data = this.data;
        modal.componentInstance.affectedElementVersions =
            affectedElementVersions;
        modal.componentInstance.contentToBeSubmitted = content;
        modal.componentInstance.onDone = () => {
            this.close();
        };
    }

    private close() {
        this.activeModal.close();
    }
}
