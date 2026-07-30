import {
    Component,
    inject,
    input,
    type OnInit,
    output,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    CollectionVersion,
    ExtendedCollectionVersion,
    GetOrganisationDetailsResponseData,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { openCreateCollectionModal } from '../../../marketplace/shared/modals/create-collection-modal/open-create-collection-modal';
import { CollectionService } from '../../../../core/exercise-element.service';
import { CollectionCardComponent } from '../../../marketplace/shared/cards/collection-card/collection-card.component';
import { ConfirmationModalService } from '../../../../core/confirmation-modal/confirmation-modal.service';
import { showJoinCollectionWorkflow } from '../../../marketplace/shared/modals/show-join-collection-workflow';
import { PromptModalService } from '../../../../core/prompt-modal/prompt-modal.service';

@Component({
    selector: 'app-organisation-tab-exercise-elements',
    imports: [FormsModule, CollectionCardComponent],
    templateUrl: './organisation-tab-exercise-elements.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './organisation-tab-exercise-elements.component.scss',
})
export class OrganisationTabExerciseElementsComponent implements OnInit {
    private readonly ngbModalService = inject(NgbModal);
    private readonly collectionService = inject(CollectionService);
    private readonly confirmService = inject(ConfirmationModalService);
    private readonly promptService = inject(PromptModalService);

    readonly organisation =
        input.required<GetOrganisationDetailsResponseData>();
    readonly update = output<boolean>();

    readonly collections = signal<ExtendedCollectionVersion[] | undefined>(
        undefined
    );

    public async createCollection() {
        openCreateCollectionModal(this.ngbModalService).subscribe((created) => {
            if (created) {
                this.reload();
            }
        });
    }

    public joinCollection() {
        showJoinCollectionWorkflow(
            this.promptService,
            this.collectionService,
            this.ngbModalService,
            this.organisation().id
        );
    }

    public async leaveCollection(collection: CollectionVersion) {
        const result = await this.confirmService.confirm({
            title: 'Sammlung verlassen',
            description:
                'Möchten Sie mit dieser Organisation der Sammlung austreten? Sie verlieren dadurch den Zugriff auf die Sammlung und deren Inhalte.',
            confirmationButtonText: 'Verlassen',
        });

        if (!result) return;

        this.collectionService.leaveCollection(collection.entityId).then(() => {
            this.reload();
        });
    }

    reload() {
        this.collectionService
            .getCollectionsForOrganisation(this.organisation().id)
            .then((collections) => {
                this.collections.set(collections);
            });
    }
    ngOnInit() {
        this.reload();
    }
}
