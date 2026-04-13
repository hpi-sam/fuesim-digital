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
import { ActivatedRoute } from '@angular/router';
import { QrCodeComponent } from 'ng-qrcode';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ExerciseStateBadgeInnerComponent } from '../../../shared/components/exercise-state-badge-inner/exercise-state-badge-inner.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { InlineTextEditorComponent } from '../../../shared/components/inline-text-editor/inline-text-editor.component';
import { InviteMemberModalComponent } from '../shared/invite-member-modal/invite-member-modal.component';

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
        } finally {
            this.organisation.reload();
        }
    }

    constructor() {
        this.organisation = this.apiService.getOrganisationResource(
            this.route.snapshot.params['id']
        );
    }
}
