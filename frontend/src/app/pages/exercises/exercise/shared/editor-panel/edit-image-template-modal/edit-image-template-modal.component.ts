import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { MapImageTemplate, UUID } from 'fuesim-digital-shared';
import { cloneDeep } from 'lodash-es';
import { WritableDraft } from 'immer';
import type { ChangedImageTemplateValues } from '../image-template-form/image-template-form.component';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../state/app.state';
import { createSelectMapImageTemplate } from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { ImageTemplateFormComponent } from '../image-template-form/image-template-form.component';

@Component({
    selector: 'app-edit-image-template-modal',
    templateUrl: './edit-image-template-modal.component.html',
    styleUrls: ['./edit-image-template-modal.component.scss'],
    imports: [ImageTemplateFormComponent],
})
export class EditImageTemplateModalComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    readonly activeModal = inject(NgbActiveModal);

    // This is set after the modal creation and therefore accessible in ngOnInit
    public mapImageTemplateId!: UUID;

    public mapImageTemplate?: WritableDraft<MapImageTemplate>;

    ngOnInit(): void {
        this.mapImageTemplate = cloneDeep(
            selectStateSnapshot(
                createSelectMapImageTemplate(this.mapImageTemplateId),
                this.store
            )
        );
    }

    public deleteMapImageTemplate(): void {
        this.exerciseService
            .proposeAction({
                type: '[MapImageTemplate] Delete mapImageTemplate',
                id: this.mapImageTemplateId,
            })
            .then((response) => {
                if (response.success) {
                    this.close();
                }
            });
    }

    public editMapImageTemplate({
        url,
        height,
        name,
        aspectRatio,
    }: ChangedImageTemplateValues): void {
        if (!this.mapImageTemplate) {
            console.error("MapImageTemplate wasn't initialized yet");
            return;
        }
        this.exerciseService
            .proposeAction({
                type: '[MapImageTemplate] Edit mapImageTemplate',
                id: this.mapImageTemplateId,
                name,
                image: {
                    url,
                    height,
                    aspectRatio,
                },
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
