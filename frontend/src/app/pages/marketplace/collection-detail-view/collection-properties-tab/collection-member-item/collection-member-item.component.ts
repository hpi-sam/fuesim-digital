import {
    Component,
    computed,
    inject,
    input,
    output,
    resource,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    CollectionVersion,
    Marketplace,
    OrganisationId,
} from 'fuesim-digital-shared';
import { AuthService } from '../../../../../core/auth.service';
import { ConfirmationModalService } from '../../../../../core/confirmation-modal/confirmation-modal.service';
import { CollectionService } from '../../../../../core/collection.service';
import { ApiService } from '../../../../../core/api.service';

@Component({
    selector: 'app-collection-member-item',
    templateUrl: './collection-member-item.component.html',
    styleUrl: './collection-member-item.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [],
})
export class CollectionMemberItemComponent {
    private readonly authService = inject(AuthService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    private readonly collectionService = inject(CollectionService);
    private readonly apiService = inject(ApiService);

    public readonly refresh = output();

    public readonly member =
        input.required<
            (typeof Marketplace.Collection.GetCollectionOrganisations.Response.result)[number]
        >();
    public readonly collection = input.required<CollectionVersion>();
    public readonly showRemoveButton = input<boolean>(false);

    public readonly ownUserId = computed(
        () => this.authService.authData().user?.id
    );

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

    public async setCollectionOwner(
        organisationId: OrganisationId,
        userName: string
    ) {
        const confirmationResult = await this.confirmationModalService.confirm({
            title: 'Besitzer ändern',
            description: `Möchten Sie ${userName} wirklich als neuen Besitzer der Sammlung festlegen?
            Dadurch verliert die vorherige Besitzer-Organisation den Bearbeitungs-Zugriff auf die Sammlung.`,
            confirmationButtonText: 'Besitzer ändern',
        });

        if (!confirmationResult) return;

        await this.collectionService.setOrganisationCollectionOwner(
            organisationId,
            this.collection().entityId
        );
        this.refresh.emit();
    }
}
