import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'fuesim-digital-shared';
import { AlarmModalComponent } from './alarm-modal/alarm-modal.component';
import { EocLogModalComponent } from './eoc-log-modal/eoc-log-modal.component';

export function openEocLogModal(
    ngbModalService: NgbModal,
    message: string | null = null,
    editable: boolean = true,
    templateName?: string
) {
    const modalRef = ngbModalService.open(EocLogModalComponent, {
        size: 'lg',
    });
    (modalRef.componentInstance as EocLogModalComponent).initialize(
        message,
        editable,
        templateName
    );
    return modalRef;
}

export function openAlarmModal(
    ngbModalService: NgbModal,
    alarmGroupIds: UUID[],
    targetTransferPointIds: UUID[],
    templateName?: string
) {
    const modalRef = ngbModalService.open(AlarmModalComponent, {
        size: 'lg',
    });
    (modalRef.componentInstance as AlarmModalComponent).initialize(
        alarmGroupIds,
        targetTransferPointIds,
        templateName
    );
    return modalRef;
}
