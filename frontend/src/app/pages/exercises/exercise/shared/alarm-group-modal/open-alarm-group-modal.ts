import type { NgbModal } from '@ng-bootstrap/ng-bootstrap/modal';
import { firstValueFrom } from 'rxjs';
import { AlarmGroupModalComponent } from './alarm-group-modal.component';

export async function openAlarmGroupModal(modalService: NgbModal) {
    const modalRef = modalService.open(AlarmGroupModalComponent, {
        size: 'lg',
    });

    const componentInstance =
        modalRef.componentInstance as AlarmGroupModalComponent;

    return firstValueFrom(componentInstance.alarmGroupSelection$);
}
