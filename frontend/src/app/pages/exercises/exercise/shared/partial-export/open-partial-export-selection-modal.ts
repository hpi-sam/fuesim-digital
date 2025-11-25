import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PartialExportModalComponent } from './partial-export-modal/partial-export-modal.component.js';

export function openPartialExportModal(ngbModalService: NgbModal) {
    ngbModalService.open(PartialExportModalComponent, {
        size: 'm',
    });
}
