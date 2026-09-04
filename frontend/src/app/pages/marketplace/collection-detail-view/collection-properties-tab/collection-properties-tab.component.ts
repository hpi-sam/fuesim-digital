import {
    Component,
    effect,
    inject,
    input,
    resource,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    collectionOrganisationRelationshipTypeAllowedValues,
    CollectionVersion,
} from 'fuesim-digital-shared';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../../core/collection.service';
import { DisplayValidationComponent } from '../../../../shared/validation/display-validation/display-validation.component';
import { AuthService } from '../../../../core/auth.service';
import { ConfirmationModalService } from '../../../../core/confirmation-modal/confirmation-modal.service';
import { ApiService } from '../../../../core/api.service';
import { openCreateInviteModal } from '../../../../shared/components/create-invite-modal/open-create-invite-modal';
import { openSelectOrganisationModal } from '../../shared/modals/select-organisation-modal/open-select-organisation-modal';
import { CollectionMemberItemComponent } from './collection-member-item/collection-member-item.component';

@Component({
    selector: 'app-collection-details-tab',
    imports: [
        FormsModule,
        DisplayValidationComponent,
        NgbDropdownModule,
        CollectionMemberItemComponent,
    ],
    templateUrl: './collection-properties-tab.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './collection-properties-tab.component.scss',
})
export class CollectionDetailsTabComponent {
    private readonly authService = inject(AuthService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly collectionService = inject(CollectionService);
    private readonly router = inject(Router);
    private readonly apiService = inject(ApiService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    public readonly allowedRoleValues =
        collectionOrganisationRelationshipTypeAllowedValues;

    public readonly collection = input.required<CollectionVersion>();

    public readonly members = resource({
        params: () => ({
            collectionEntityId: this.collection().entityId,
        }),
        loader: async ({ params: { collectionEntityId } }) =>
            (
                await this.collectionService
                    .getCollectionMembers(collectionEntityId)
                    .then((e) => e)
                    .catch((err) => {
                        // we may have lost permission to access this properties view
                        location.reload();
                        return [];
                    })
            )
                .sort((a, b) => b.name.localeCompare(a.name))
                .sort((a, b) => Number(b.isOwner) - Number(a.isOwner)),
    });

    public readonly userIsEditor = resource({
        params: () => ({
            membersData: this.members.hasValue()
                ? this.members.value()
                : undefined,
        }),
        loader: async ({ params: { membersData: members } }) => {
            if (!members) return false;

            const userId = this.authService.authData().user?.id;
            if (!userId) return false;

            const ownerOrganisation = members.find((member) => member.isOwner);
            if (!ownerOrganisation) return false;

            try {
                const ownerOrga = await this.apiService.getOrganisation(
                    ownerOrganisation.id
                );
                return (
                    ownerOrga.userRole === 'editor' ||
                    ownerOrga.userRole === 'admin'
                );
            } catch (err) {
                console.error('Error fetching owner organisation:', err);
                return false;
            }
        },
    });

    public readonly collectionTitle = signal('');

    constructor() {
        effect(() => {
            this.collectionTitle.set(this.collection().title);
        });
    }

    public async addOrganisation() {
        const organisationId = await openSelectOrganisationModal(
            this.ngbModalService,
            {
                descriptionText:
                    'Bitte wählen Sie eine der Organisationen, bei der sie Bearbeiter oder Administrator sind, aus, um sie zu dieser Sammlung als Mitglied hinzuzufügen. Die Organisation wird als Betrachter hinzugefügt.',
            }
        );

        await this.collectionService.addOrganisationToCollection(
            organisationId,
            this.collection().entityId
        );
        this.members.reload();
    }

    public async invite() {
        openCreateInviteModal(this.ngbModalService, {
            title: 'Mitglieder einladen',
            description: `Sie können an dieser Stelle einen Zugriffscode erstellen, den sie an andere
                Personen weitergeben können und welcher sieben Tage lang gültig ist.
                Diese können dann über die Übungselemente-Startseite mit ihrem Benutzeraccount oder mit einer Organisationen bei der sie Mitglied sind dieser Sammlung beitreten.
                Der neu begetretene Benutzeraccount bzw. die neu beigetretene Organisationen wird initial als Betrachter geführt.
                `,
            type: 'Zugriffscode',
            createInviteFn: async () =>
                this.collectionService
                    .createCollectionInviteCode(this.collection().entityId)
                    .then((response) => response.code),
        });
    }

    public async revokeInviteCode() {
        const confirmationResult = await this.confirmationModalService.confirm({
            title: 'Alle Einladungscodes widerrufen',
            description:
                'Möchten Sie wirklich alle Einladungscode widerrufen? Dadurch können bereits verteilte Einladungscodes nicht mehr genutzt werden. Diese Aktion kann nicht rückgängig gemacht werden.',
            confirmationButtonText: 'Alle Einladungscodes widerrufen',
        });
        if (!confirmationResult) return;
        await this.collectionService.revokeCollectionInviteCode(
            this.collection().entityId
        );
    }

    public async updateCollectionTitle() {
        await this.collectionService.updateCollectionData(
            this.collection().entityId,
            {
                title: this.collectionTitle(),
            }
        );
    }

    public async makeCollectionPublic() {
        const confirmationResult = await this.confirmationModalService.confirm({
            title: 'Sammlung veröffentlichen',
            description:
                'Möchten Sie diese Sammlung wirklich veröffentlichen? Dadurch wird sie für alle Nutzer sichtbar und nutzbar. Diese Aktion kann nicht rückgängig gemacht werden.',
            confirmationString: 'veröffentlichen',
            confirmationButtonText: 'Sammlung veröffentlichen',
        });
        if (!confirmationResult) return;
        await this.collectionService.makeCollectionPublic(
            this.collection().entityId
        );
    }

    public async archiveCollection() {
        const confirmationResult = await this.confirmationModalService.confirm({
            title: 'Sammlung archivieren',
            description: 'Möchten Sie diese Sammlung wirklich archivieren?',
            confirmationButtonText: 'Sammlung archivieren',
        });
        if (!confirmationResult) return;
        await this.collectionService.archiveCollection(
            this.collection().entityId
        );
        this.router.navigate(['/collections']);
    }
}
