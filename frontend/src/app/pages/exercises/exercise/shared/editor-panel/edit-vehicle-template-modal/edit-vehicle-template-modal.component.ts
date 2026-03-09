import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type {
    UUID,
    VehicleTemplate,
    MaterialTemplate,
    PersonnelTemplate,
} from 'fuesim-digital-shared';
import { cloneDeepMutable } from 'fuesim-digital-shared';
import { WritableDraft } from 'immer';
import type { ChangedVehicleTemplateValues } from '../vehicle-template-form/vehicle-template-form.component';
import { ConfirmationModalService } from '../../../../../../core/confirmation-modal/confirmation-modal.service';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import {
    createSelectVehicleTemplate,
    selectMaterialTemplates,
    selectPersonnelTemplates,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';

@Component({
    selector: 'app-edit-vehicle-template-modal',
    templateUrl: './edit-vehicle-template-modal.component.html',
    styleUrls: ['./edit-vehicle-template-modal.component.scss'],
    standalone: false,
})
export class EditVehicleTemplateModalComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    // This is set after the modal creation and therefore accessible in ngOnInit
    public vehicleTemplateId!: UUID;

    public vehicleTemplate?: WritableDraft<VehicleTemplate>;
    public materialTemplates?: WritableDraft<MaterialTemplate[]> = [];
    public personnelTemplates?: WritableDraft<PersonnelTemplate[]> = [];

    ngOnInit(): void {
        this.vehicleTemplate = cloneDeepMutable(
            selectStateSnapshot(
                createSelectVehicleTemplate(this.vehicleTemplateId),
                this.store
            )
        );

        const materialTemplates = selectStateSnapshot(
            selectMaterialTemplates,
            this.store
        );
        this.materialTemplates = cloneDeepMutable(
            this.vehicleTemplate.materialTemplateIds.map(
                (templateId) => materialTemplates[templateId]
            )
        ).filter((template) => template !== undefined);

        const personnelTemplates = selectStateSnapshot(
            selectPersonnelTemplates,
            this.store
        );
        this.personnelTemplates = cloneDeepMutable(
            this.vehicleTemplate.personnelTemplateIds.map(
                (templateId) => personnelTemplates[templateId]
            )
        ).filter((template) => template !== undefined);
    }

    public async deleteVehicleTemplate(): Promise<void> {
        const confirmDelete = await this.confirmationModalService.confirm({
            title: 'Fahrzeug-Vorlage löschen',
            description: `Möchten Sie die Fahrzeug-Vorlage "${this.vehicleTemplate?.vehicleType}" wirklich löschen? Diese Vorlage wird auch aus allen Alarmgruppen gelöscht werden. Bereit auf der Karte existierende Fahrzeuge, Fahrzeuge im Transfer und bereits alarmierte Fahrzeuge sind davon nicht betroffen.`,
        });
        if (!confirmDelete) {
            return;
        }
        this.exerciseService
            .proposeAction({
                type: '[VehicleTemplate] Delete vehicleTemplate',
                id: this.vehicleTemplateId,
            })
            .then((response) => {
                if (response.success) {
                    this.close();
                }
            });
    }

    public editVehicleTemplate({
        url,
        height,
        name,
        aspectRatio,
        patientCapacity,
        type,
        materialTemplateIds,
        personnelTemplateIds,
    }: ChangedVehicleTemplateValues): void {
        if (!this.vehicleTemplate) {
            console.error("VehicleTemplate wasn't initialized yet");
            return;
        }
        this.exerciseService
            .proposeAction({
                type: '[VehicleTemplate] Edit vehicleTemplate',
                id: this.vehicleTemplateId,
                name,
                image: {
                    url,
                    height,
                    aspectRatio,
                },
                materialTemplateIds,
                personnelTemplateIds,
                patientCapacity,
                vehicleType: type,
            })
            .then((response) => {
                if (response.success) {
                    this.close();
                }
            });
    }

    public close(): void {
        this.activeModal.close();
    }
}
