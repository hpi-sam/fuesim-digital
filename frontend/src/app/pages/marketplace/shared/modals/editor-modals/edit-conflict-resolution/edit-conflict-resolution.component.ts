import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ElementDto, Marketplace } from 'fuesim-digital-shared';
import { VersionedElementModalData } from '../base-versioned-element-submodal';

@Component({
    selector: 'app-edit-conflict-resolution',
    imports: [FormsModule],
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

    public resolveConflict(
        resolution: Marketplace.Element.EditConflictResolution['strategy']
    ) {
        this.data.onSubmit(this.contentToBeSubmitted, {
            strategy: resolution,
            affectingElementIds: this.affectedElementVersions.map(
                (element) => element.versionId
            ),
        });
        this.close();
        this.onDone();
    }

    public close() {
        this.activeModal.close();
    }
}
