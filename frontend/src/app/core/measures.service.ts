import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MeasureProperty, MeasureTemplate } from 'fuesim-digital-shared';
import { AppState } from '../state/app.state';
import { MessageService } from './messages/message.service';
import { ConfirmationModalService } from './confirmation-modal/confirmation-modal.service';

@Injectable({
    providedIn: 'root',
})
export class MeasureService {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly messageService = inject(MessageService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    private async handle(
        template: MeasureTemplate,
        property: MeasureProperty
    ): Promise<boolean> {
        switch (property.type) {
            case 'delay':
                this.messageService.postMessage({
                    color: 'info',
                    title: template.name,
                    body: `Bitte warten Sie ${property.delay}s`,
                });
                await new Promise((resolve) => {
                    setTimeout(() => resolve(null), property.delay * 1000);
                });
                return true;
            case 'response':
                await this.confirmationModalService.confirm({
                    title: template.name,
                    description: property.response,
                    confirmationString: '',
                });
                return true;
            case 'manualConfirm': {
                const res = await this.confirmationModalService.confirm({
                    title: template.name,
                    description: property.prompt,
                    confirmationString: property.confirmationString,
                });
                return res ?? false;
            }
        }
    }

    public async executeMeasure(template: MeasureTemplate) {
        for (const property of template.properties) {
            // eslint-disable-next-line no-await-in-loop
            if (!(await this.handle(template, property))) break;
        }
    }
}
