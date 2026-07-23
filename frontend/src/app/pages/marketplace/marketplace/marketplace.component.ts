import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CollectionVersion } from 'fuesim-digital-shared';
import { CollectionService } from '../../../core/exercise-element.service';
import { CollectionCardComponent } from '../shared/cards/collection-card/collection-card.component';
import { openCreateCollectionModal } from '../shared/modals/create-collection-modal/open-create-collection-modal';
import { AuthService } from '../../../core/auth.service';
import { UserAccountNavbarItemComponent } from '../../../shared/components/user-account-navbar-item/user-account-navbar-item.component';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';
import { PromptModalComponent } from '../../../core/prompt-modal/prompt-modal.component';
import { PromptModalService } from '../../../core/prompt-modal/prompt-modal.service';
import { openSelectOrganisationModal } from '../shared/modals/select-organisation-modal/open-select-organisation-modal';

@Component({
    selector: 'app-marketplace',
    templateUrl: './marketplace.component.html',
    styleUrl: './marketplace.component.scss',
    imports: [
        RouterLink,
        NgbTooltip,
        CollectionCardComponent,
        UserAccountNavbarItemComponent,
    ],
})
export class MarketplaceComponent {
    private readonly confirmationService = inject(ConfirmationModalService);
    private readonly promptService = inject(PromptModalService);
    private readonly collectionService = inject(CollectionService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly authService = inject(AuthService);

    public readonly userAvailableCollections = resource({
        params: () => ({
            isAuthenticated: this.isAuthenticated(),
        }),
        loader: async ({ params: { isAuthenticated } }) =>
            isAuthenticated ? this.collectionService.getMyCollections() : [],
    });

    public readonly publicCollections = resource({
        loader: async () => this.collectionService.getPublicCollections(),
    });

    public readonly isAuthenticated = computed(
        () => !!this.authService.authData().user
    );

    public async createNewCollection() {
        openCreateCollectionModal(this.ngbModalService).subscribe((created) => {
            if (created) {
                this.userAvailableCollections.reload();
            }
        });
    }

    public async joinCollection() {
        const promptResult = await this.promptService.prompt({
            title: 'Sammlung beitreten',
            description:
                'Bitte geben Sie den Einladungscode ein, um der Sammlung beizutreten.',
            placeholder: "Einladungscode",
            confirmationButtonText: 'Beitreten',
        })

        if (promptResult.result !== true) return;

        const collectionPreview = await this.collectionService.getJoinCodePreview(promptResult.value);

        console.log(collectionPreview);

        const organisationId = await openSelectOrganisationModal(this.ngbModalService, {
            descriptionText: `Bitte wählen Sie die Organisation aus, mit der Sie der Sammlung "${collectionPreview.title}" beitreten möchten. Die Sammlung wird dann in dieser Organisation verfügbar sein.`,
        })

        console.log(organisationId);

        await this.collectionService.joinCollectionByJoinCode(promptResult.value, organisationId);

    }

    public async archiveCollection(collection: CollectionVersion) {
        const confirm = await this.confirmationService.confirm({
            title: 'Sammlung archivieren',
            description:
                'Möchten Sie die Sammlung wirklich archivieren? Sie wird dann nicht mehr in der Übersicht angezeigt, kann aber weiterhin in bestehenden Übungen verwendet werden und wiederhergestellt werden.',
            confirmationButtonText: 'Archivieren',
        });
        if (!confirm) return;

        this.collectionService
            .archiveCollection(collection.entityId)
            .then(() => {
                this.userAvailableCollections.reload();
            });
    }
}
