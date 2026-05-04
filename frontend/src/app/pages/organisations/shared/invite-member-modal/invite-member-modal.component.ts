import { Component, inject, output, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GetOrganisationsResponseData } from 'fuesim-digital-shared';
import { form } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service';
import { shareLink } from '../../../../shared/functions/share';
import { MessageService } from '../../../../core/messages/message.service';

@Component({
    selector: 'app-invite-member-modal',
    templateUrl: './invite-member-modal.component.html',
    styleUrls: ['./invite-member-modal.component.scss'],
    imports: [FormsModule],
})
export class InviteMemberModalComponent {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly messageService = inject(MessageService);

    public readonly organisation = signal<
        GetOrganisationsResponseData[0] | null
    >(null);
    public readonly created = output<boolean>();

    public async invite() {
        // await this.apiService.createOrganisation(this.model());
        const inviteLink = await this.apiService.createOrganisationInviteLink(
            this.organisation()!.id
        );
        shareLink(inviteLink.inviteLink, this.messageService);
        this.created.emit(true);
        this.activeModal.close();
    }

    public close() {
        this.activeModal.close();
    }

    protected readonly form = form;
}
