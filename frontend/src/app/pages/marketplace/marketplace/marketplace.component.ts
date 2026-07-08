import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../core/exercise-element.service';
import { CollectionCardComponent } from '../shared/cards/collection-card/collection-card.component';
import { openCreateCollectionModal } from '../shared/modals/create-collection-modal/open-create-collection-modal';
import { AuthService } from '../../../core/auth.service';
import { UserAccountNavbarItemComponent } from '../../../shared/components/user-account-navbar-item/user-account-navbar-item.component';

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
}
