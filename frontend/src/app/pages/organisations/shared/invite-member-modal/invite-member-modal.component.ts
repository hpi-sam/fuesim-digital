import { Component, inject, output, signal } from '@angular/core';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import {
    GetOrganisationsResponseData,
    PostOrganisationInviteLinkResponseData,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service';
import { MessageService } from '../../../../core/messages/message.service';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component.js';

@Component({
    selector: 'app-invite-member-modal',
    templateUrl: './invite-member-modal.component.html',
    styleUrls: ['./invite-member-modal.component.scss'],
    imports: [FormsModule, CopyButtonComponent, NgbTooltip],
})
export class InviteMemberModalComponent {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly messageService = inject(MessageService);

    public readonly organisation = signal<
        GetOrganisationsResponseData[0] | null
    >(null);
    public readonly created = output<boolean>();
    readonly inviteLink = signal<PostOrganisationInviteLinkResponseData | null>(
        null
    );

    public async invite() {
        const inviteLink = await this.apiService.createOrganisationInviteLink(
            this.organisation()!.id
        );
        this.inviteLink.set(inviteLink);
        this.created.emit(true);
    }

    public close() {
        this.activeModal.close();
    }
}
