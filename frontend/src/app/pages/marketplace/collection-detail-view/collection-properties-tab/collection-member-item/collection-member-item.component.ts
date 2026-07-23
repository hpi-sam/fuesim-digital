import { Component, computed, inject, input, OnInit, output, resource } from '@angular/core';
import {
    CollectionVersion,
    Marketplace,
    OrganisationId,
} from 'fuesim-digital-shared';
import { AuthService } from '../../../../../core/auth.service';
import { ConfirmationModalService } from '../../../../../core/confirmation-modal/confirmation-modal.service';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../../../core/api.service';

@Component({
    selector: 'app-collection-member-item',
    templateUrl: './collection-member-item.component.html',
    styleUrl: './collection-member-item.component.scss',
    imports: [NgbTooltip],
})
export class CollectionMemberItemComponent {
    private readonly authService = inject(AuthService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    private readonly collectionService = inject(CollectionService);
    private readonly apiService = inject(ApiService);

    public readonly refresh = output<void>();

    public readonly member =
        input.required<
            (typeof Marketplace.Collection.GetCollectionOrganisations.Response.result)[number]
        >();
    public readonly collection = input.required<CollectionVersion>();
    public readonly showRemoveButton = input<boolean>(false);

    public organisationData = resource({
        params: () => ({
            memberId: this.member().id,
        }),
        loader: async ({params: {memberId}}) => {
            return await this.apiService.getOrganisation(memberId);
        }
    })

    public readonly ownUserId = computed(
        () => this.authService.authData().user?.id
    );

    public readonly canLeaveCollection = computed(() => {
        const orgData = this.organisationData;
        if (!orgData) return false;
        if (!orgData.hasValue) return false;

        return (
            orgData.value()?.userRole === 'editor' ||
            orgData.value()?.userRole === 'admin'
        ) && !this.member().owner;
    });

    public async removeCollectionMember(
        organisationId: OrganisationId,
        userName: string
    ) {
        const confirmationResult = await this.confirmationModalService.confirm({
            title: 'Mitglied entfernen',
            description: `Möchten Sie ${userName} wirklich entfernen? Dadurch verliert die Organisation den Zugriff auf die Sammlung. Die Organisation kann die Sammlung erneut betreten, wenn sie einen gültigen Einladungscode hat.`,
        });
        if (!confirmationResult) return;
        await this.collectionService.removeCollectionMember(
            this.collection().entityId,
            organisationId
        );
        this.refresh.emit();
    }
}
