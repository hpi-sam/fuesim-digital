import { Component, inject, input, output } from '@angular/core';
import {
    GetOrganisationDetailsResponseData,
    OrganisationMembershipId,
    OrganisationMembershipRole,
    organisationMembershipRoleAllowedValues,
    organisationMembershipRoleToGermanNameDictionary,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { InviteMemberModalComponent } from '../../shared/invite-member-modal/invite-member-modal.component.js';
import { ApiService } from '../../../../core/api.service.js';
import { MessageService } from '../../../../core/messages/message.service.js';
import { ConfirmationModalService } from '../../../../core/confirmation-modal/confirmation-modal.service.js';
import { AuthService } from '../../../../core/auth.service.js';

@Component({
    selector: 'app-organisation-tab-members',
    imports: [FormsModule],
    templateUrl: './organisation-tab-members.component.html',
    styleUrl: './organisation-tab-members.component.scss',
})
export class OrganisationTabMembersComponent {
    private readonly apiService = inject(ApiService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly messageService = inject(MessageService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly organisation =
        input.required<GetOrganisationDetailsResponseData>();
    readonly update = output<boolean>();

    organisationMembershipRoleToGermanNameDictionary =
        organisationMembershipRoleToGermanNameDictionary;
    organisationMembershipRoleAllowedValues =
        organisationMembershipRoleAllowedValues;

    async invite() {
        const modalRef = this.ngbModalService.open(InviteMemberModalComponent);
        const componentInstance =
            modalRef.componentInstance as InviteMemberModalComponent;
        componentInstance.organisation.set(this.organisation());
    }

    async updateMembershipRole(
        id: OrganisationMembershipId,
        role: OrganisationMembershipRole
    ) {
        try {
            await this.apiService.updateOrganisationMembershipRole(id, role);
            this.messageService.postMessage({
                title: `Die Rolle des Mitglieds wurde erfolgreich geändert.`,
                color: 'success',
            });
        } finally {
            this.update.emit(true);
        }
    }

    async deleteMembership(
        member: GetOrganisationDetailsResponseData['members'][0]
    ) {
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Mitglied aus der Organisation entfernen',
            description: `Möchten Sie das Mitglied ${member.user.displayName} aus der Organisation ${this.organisation().name} entfernen?`,
        });
        if (!deletionConfirmed) {
            return;
        }
        await this.apiService.deleteOrganisationMembership(member.id);
        this.messageService.postMessage({
            title: `${member.user.displayName} erfolgreich entfernt`,
            color: 'success',
        });
        this.update.emit(true);
    }

    async leave() {
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Organisation verlassen',
            description: `Möchten Sie die Organisation ${this.organisation().name} wirklich verlassen? Sie haben danach keinen Zugriff mehr auf die dort gespeicherten Daten.`,
        });
        if (!deletionConfirmed) {
            return;
        }
        await this.apiService.leaveOrganisation(this.organisation().id);
        this.messageService.postMessage({
            title: `Organisation ${this.organisation().name} erfolgreich verlassen`,
            color: 'success',
        });
        this.router.navigate(['/organisations']);
    }
}
