import { Component, input, output, inject } from '@angular/core';
import type {
    GetOrganisationsResponseDataSchema,
    PatchOrganisationRequestData,
} from 'fuesim-digital-shared';
import { RouterLink } from '@angular/router';
import { ConfirmationModalService } from '../../../../core/confirmation-modal/confirmation-modal.service';
import { ApiService } from '../../../../core/api.service';
import { MessageService } from '../../../../core/messages/message.service';
import { InlineTextEditorComponent } from '../../../../shared/components/inline-text-editor/inline-text-editor.component';

@Component({
    selector: 'app-organisation-card',
    templateUrl: './organisation-card.component.html',
    styleUrls: ['./organisation-card.component.scss'],
    imports: [RouterLink, InlineTextEditorComponent],
})
export class OrganisationCardComponent {
    private readonly apiService = inject(ApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    readonly organisation =
        input.required<GetOrganisationsResponseDataSchema[0]>();
    readonly updated = output();

    async patchOrganisation(data: PatchOrganisationRequestData) {
        await this.apiService.patchOrganisation(this.organisation().id, data);
        this.updated.emit();
    }
}
