import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'fuesim-digital-shared';
import { MeasureTemplateModalComponent } from './measure-template-modal.component';

export function openCreateMeasureTemplateModal(
    ngbModalService: NgbModal,
    categoryName?: string
) {
    const modalRef = ngbModalService.open(MeasureTemplateModalComponent, {
        size: 'lg',
    });
    const componentInstance =
        modalRef.componentInstance as MeasureTemplateModalComponent;
    componentInstance.categoryName = categoryName;
}

export function openEditMeasureTemplateModal(
    ngbModalService: NgbModal,
    measureTemplateId: UUID
) {
    const modalRef = ngbModalService.open(MeasureTemplateModalComponent, {
        size: 'lg',
    });
    const componentInstance =
        modalRef.componentInstance as MeasureTemplateModalComponent;
    componentInstance.measureTemplateId = measureTemplateId;
}
