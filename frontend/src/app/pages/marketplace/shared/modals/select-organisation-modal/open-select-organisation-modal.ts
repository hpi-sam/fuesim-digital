import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { SelectOrganisationModalComponent } from "./select-organisation-modal.component";
import { firstValueFrom } from "rxjs";

export async function openSelectOrganisationModal(ngbModalService: NgbModal, opts: {
    descriptionText: string;
}) {
    const modalRef = ngbModalService.open(SelectOrganisationModalComponent, {
        size: 'md',
    });

    const componentInstance = modalRef.componentInstance as SelectOrganisationModalComponent;
    componentInstance.descriptionText = opts.descriptionText;
    return await firstValueFrom(componentInstance.selected$);
}
