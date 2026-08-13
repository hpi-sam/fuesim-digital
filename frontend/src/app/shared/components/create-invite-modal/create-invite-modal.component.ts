import {
    Component,
    inject,
    output,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';
import { CopyButtonComponent } from '../copy-button/copy-button.component';

@Component({
    selector: 'app-create-invite-modal',
    templateUrl: './create-invite-modal.component.html',
    styleUrls: ['./create-invite-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, CopyButtonComponent, NgbTooltip],
})
export class CreateInviteModalComponent {
    private readonly apiService = inject(ApiService);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly messageService = inject(MessageService);

    public titleText!: string;
    public descriptionText!: string;
    public typeText!: string;
    public createInviteFn!: () => Promise<string>;

    public readonly created = output<boolean>();
    readonly inviteLink = signal<string | null>(null);

    public async invite() {
        const inviteLink = await this.createInviteFn();
        this.inviteLink.set(inviteLink);
        this.created.emit(true);
    }

    public close() {
        this.activeModal.close();
    }
}
