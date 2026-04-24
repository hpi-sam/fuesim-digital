import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { PartialExport } from 'fuesim-digital-shared';
import { PartialImportModalComponent } from './partial-import-modal/partial-import-modal.component';

/**
 *
 * @param partialExport The migrated {@link PartialExport} to import.
 */
export function openPartialImportOverwriteModal(
    ngbModalService: NgbModal,
    partialExport: PartialExport
) {
    const modelRef = ngbModalService.open(PartialImportModalComponent, {
        size: 'm',
    });
    const componentInstance =
        modelRef.componentInstance as PartialImportModalComponent;
    componentInstance.partialExport = partialExport;
}
