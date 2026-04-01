import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateMeasureTemplateModalComponent } from './create-measure-template-modal.component';

export async function openCreateMeasureTemplateModal(
    ngbModalService: NgbModal
) {
    ngbModalService.open(CreateMeasureTemplateModalComponent, { size: 'lg' });
}
