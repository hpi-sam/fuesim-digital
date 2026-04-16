import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'fuesim-digital-shared';
import { AlarmModalComponent } from './alarm-modal/alarm-modal.component';
import { EocLogModalComponent } from './eoc-log-modal/eoc-log-modal.component';

export function openEocLogModal(
    ngbModalService: NgbModal,
    message: string | null = null,
    editable: boolean = true
) {
    const modalRef = ngbModalService.open(EocLogModalComponent, {
        size: 'lg',
    });
    (modalRef.componentInstance as EocLogModalComponent).initialize(
        message,
        editable
    );
    return modalRef;
}

export function openAlarmModal(
    ngbModalService: NgbModal,
    alarmGroupIds: UUID[],
    targetTransferPointIds: UUID[]
) {
    const modalRef = ngbModalService.open(AlarmModalComponent, {
        size: 'lg',
    });
    (modalRef.componentInstance as AlarmModalComponent).initialize(
        alarmGroupIds,
        targetTransferPointIds
    );
    return modalRef;
}
