import type { TemplateRef } from '@angular/core';
import { Injectable } from '@angular/core';
import type { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SignallerModalDetailsModalComponent } from './signaller-modal-details-modal/signaller-modal-details-modal.component';

@Injectable()
export class SignallerModalDetailsService {
    private readonly modals: NgbModalRef[] = [];

    constructor(private readonly ngbModalService: NgbModal) {}

    public open(title: string, body: TemplateRef<any>, hotkeysEnabled = true) {
        const modal = this.ngbModalService.open(
            SignallerModalDetailsModalComponent,
            {
                size: 'm',
                keyboard: false,
            }
        );
        const component =
            modal.componentInstance as SignallerModalDetailsModalComponent;

        component.title = title;
        component.body = body;
        component.hotkeysEnabled = hotkeysEnabled;

        this.modals.push(modal);
    }

    public close() {
        const modal = this.modals.pop();

        modal?.close();
    }
}
