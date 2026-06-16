import { Component, inject, input, output } from '@angular/core';
import { GetOrganisationDetailsResponseData } from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/api.service.js';
import { MessageService } from '../../../../core/messages/message.service.js';
import { ConfirmationModalService } from '../../../../core/confirmation-modal/confirmation-modal.service.js';
import { AuthService } from '../../../../core/auth.service.js';

@Component({
    selector: 'app-organisation-tab-settings',
    imports: [FormsModule],
    templateUrl: './organisation-tab-settings.component.html',
    styleUrl: './organisation-tab-settings.component.scss',
})
export class OrganisationTabSettingsComponent {
    private readonly apiService = inject(ApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    readonly organisation =
        input.required<GetOrganisationDetailsResponseData>();
    readonly update = output<boolean>();

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

    async delete() {
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Organisation löschen',
            description: `Möchten Sie die Organisation ${this.organisation().name} wirklich löschen? Alle in dieser Organisation gespeicherten Daten werden dann ebenfalls unwiderruflich gelöscht.`,
            confirmationString: this.organisation()
                .name.toLowerCase()
                .replace(' ', ''),
        });
        if (!deletionConfirmed) {
            return;
        }
        await this.apiService.deleteOrganisation(this.organisation().id);
        this.messageService.postMessage({
            title: `Organisation ${this.organisation().name} erfolgreich gelöscht`,
            color: 'success',
        });
        this.router.navigate(['/organisations']);
    }
}
