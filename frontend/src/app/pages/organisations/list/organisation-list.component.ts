import { Component, inject } from '@angular/core';
import type { GetOrganisationsResponseData } from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../core/api.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { OrganisationCardComponent } from '../shared/organisation-card/organisation-card.component';
import { CreateOrganisationModalComponent } from '../shared/create-organisation-modal/create-organisation-modal.component';

@Component({
    selector: 'app-organisation-list',
    templateUrl: './organisation-list.component.html',
    styleUrls: ['./organisation-list.component.scss'],
    imports: [HeaderComponent, FooterComponent, OrganisationCardComponent],
})
export class OrganisationListComponent {
    private readonly apiService = inject(ApiService);
    private readonly ngbModalService = inject(NgbModal);

    organisations: HttpResourceRef<GetOrganisationsResponseData | undefined>;

    constructor() {
        this.organisations = this.apiService.getOrganisationsResource();
    }
    async create() {
        const modalRef = this.ngbModalService.open(
            CreateOrganisationModalComponent
        );
        const componentInstance =
            modalRef.componentInstance as CreateOrganisationModalComponent;
        componentInstance.created.subscribe((val) => {
            if (val) {
                this.organisations.reload();
            }
        });
    }
}
