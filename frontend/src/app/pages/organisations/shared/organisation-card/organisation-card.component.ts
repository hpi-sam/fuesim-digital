import { Component, input, output, inject } from '@angular/core';
import type {
    GetOrganisationsResponseData,
    PatchOrganisationRequestData,
} from 'fuesim-digital-shared';
import { RouterLink } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalService } from '../../../../core/confirmation-modal/confirmation-modal.service';
import { ApiService } from '../../../../core/api.service';
import { MessageService } from '../../../../core/messages/message.service';

@Component({
    selector: 'app-organisation-card',
    templateUrl: './organisation-card.component.html',
    styleUrls: ['./organisation-card.component.scss'],
    imports: [RouterLink, NgbTooltip],
})
export class OrganisationCardComponent {
    private readonly apiService = inject(ApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    readonly organisation = input.required<GetOrganisationsResponseData[0]>();
    readonly updated = output();

    async patchOrganisation(data: PatchOrganisationRequestData) {
        await this.apiService.patchOrganisation(this.organisation().id, data);
        this.updated.emit();
    }
}
