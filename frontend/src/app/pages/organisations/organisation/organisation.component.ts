import { Component, inject } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import {
    NgbModal,
    NgbNav,
    NgbNavContent,
    NgbNavItem,
    NgbNavLink,
    NgbNavOutlet,
    NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import {
    GetOrganisationDetailsResponseDataSchema,
    OrganisationMembershipId,
    OrganisationMembershipRole,
    organisationMembershipRoleAllowedValues,
    organisationMembershipRoleToGermanNameDictionary,
    PatchOrganisationRequestData,
} from 'fuesim-digital-shared';
import { ActivatedRoute, Router } from '@angular/router';
import { QrCodeComponent } from 'ng-qrcode';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ExerciseStateBadgeInnerComponent } from '../../../shared/components/exercise-state-badge-inner/exercise-state-badge-inner.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { InlineTextEditorComponent } from '../../../shared/components/inline-text-editor/inline-text-editor.component';
import { InviteMemberModalComponent } from '../shared/invite-member-modal/invite-member-modal.component';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';
import { AuthService } from '../../../core/auth.service';

@Component({
    selector: 'app-organisation',
    templateUrl: './organisation.component.html',
    styleUrls: ['./organisation.component.scss'],
    imports: [
        HeaderComponent,
        ExerciseStateBadgeInnerComponent,
        QrCodeComponent,
        FooterComponent,
        NgbTooltip,
        InlineTextEditorComponent,
        NgbNav,
        NgbNavItem,
        NgbNavOutlet,
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbNavContent,
        FormsModule,
    ],
})
export class OrganisationComponent {
    private readonly apiService = inject(ApiService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    organisationMembershipRoleToGermanNameDictionary =
        organisationMembershipRoleToGermanNameDictionary;
    organisationMembershipRoleAllowedValues =
        organisationMembershipRoleAllowedValues;

    organisation: HttpResourceRef<
        GetOrganisationDetailsResponseDataSchema | undefined
    >;

    async patchOrganisation(data: PatchOrganisationRequestData) {
        const organisation = this.organisation.value();
        if (!organisation) return;
        await this.apiService.patchOrganisation(organisation.id, data);
        this.organisation.reload();
    }

    async invite() {
        const modalRef = this.ngbModalService.open(InviteMemberModalComponent);
        const componentInstance =
            modalRef.componentInstance as InviteMemberModalComponent;
        componentInstance.organisation.set(this.organisation.value()!);
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
            this.organisation.reload();
        }
    }

    async deleteMembership(
        member: GetOrganisationDetailsResponseDataSchema['members'][0]
    ) {
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Mitglied aus der Organisation entfernen',
            description: `Möchten Sie das Mitglied ${member.user.displayName} aus der Organisation ${this.organisation.value()!.name} entfernen?`,
        });
        if (!deletionConfirmed) {
            return;
        }
        await this.apiService.deleteOrganisationMembership(member.id);
        this.messageService.postMessage({
            title: `${member.user.displayName} erfolgreich entfernt`,
            color: 'success',
        });
        this.organisation.reload();
    }

    async leave() {
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Organisation verlassen',
            description: `Möchten Sie die Organisation ${this.organisation.value()!.name} wirklich verlassen? Sie haben danach keinen Zugriff mehr auf die dort gespeicherten Daten.`,
        });
        if (!deletionConfirmed) {
            return;
        }
        await this.apiService.leaveOrganisation(this.organisation.value()!.id);
        this.messageService.postMessage({
            title: `Organisation ${this.organisation.value()!.name} erfolgreich verlassen`,
            color: 'success',
        });
        this.router.navigate(['/organisations']);
    }

    async delete() {
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Organisation löschen',
            description: `Möchten Sie die Organisation ${this.organisation.value()!.name} wirklich löschen? Alle in dieser Organisation gespeicherten Daten werden dann ebenfalls unwiderruflich gelöscht.`,
            confirmationString: this.organisation
                .value()!
                .name.toLowerCase()
                .replace(' ', ''),
        });
        if (!deletionConfirmed) {
            return;
        }
        await this.apiService.deleteOrganisation(this.organisation.value()!.id);
        this.messageService.postMessage({
            title: `Organisation ${this.organisation.value()!.name} erfolgreich gelöscht`,
            color: 'success',
        });
        this.router.navigate(['/organisations']);
    }

    constructor() {
        this.organisation = this.apiService.getOrganisationResource(
            this.route.snapshot.params['id']
        );
    }
}
