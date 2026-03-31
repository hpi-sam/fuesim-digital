import { Component, inject } from '@angular/core';
import { DisplayValidationComponent } from '../../../../shared/validation/display-validation/display-validation.component';
import { FormsModule } from '@angular/forms';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { ValuesPipe } from '../../../../shared/pipes/values.pipe';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { VersionedElementModalData } from '../versioned-element-modal/versioned-element-modal.component';
import { ElementDto, ElementVersionId, Marketplace } from 'fuesim-digital-shared';

@Component({
    selector: 'app-edit-conflict-resolution',
    imports: [
        DisplayValidationComponent,
        FormsModule,
        AutofocusDirective,
        AsyncPipe,
        ValuesPipe,
        JsonPipe
    ],
    templateUrl: './edit-conflict-resolution.component.html',
    styleUrls: ['./edit-conflict-resolution.component.html'],
})
export class EditConflictResolutionComponent {
    private readonly activeModal = inject(NgbActiveModal);

    // THIS NEEDS TO BE SET VIA COMPONENTINSTANCE
    public readonly data!: VersionedElementModalData<any>;
    public readonly affectedElementVersions!: ElementDto[];
    public readonly contentToBeSubmitted!: any;
    public readonly onDone!: () => void;

    constructor() { }

    public resolveConflict(resolution: Marketplace.Element.EditConflictResolution["strategy"]) {
        console.log('Resolving conflict with strategy', resolution, this.data, this.affectedElementVersions);
        this.data.onSubmit(this.contentToBeSubmitted, {
            strategy: resolution,
            affectingElementIds: this.affectedElementVersions.map((element) => element.versionId),
        });
        this.close();
        this.onDone?.();
    }

    public close() {
        this.activeModal.close();
    }
}
