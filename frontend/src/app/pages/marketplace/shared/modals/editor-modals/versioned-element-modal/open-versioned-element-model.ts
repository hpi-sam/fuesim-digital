import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { VersionedElementModalData } from '../base-versioned-element-submodal';
import type { ConfirmationModalService } from '../../../../../../core/confirmation-modal/confirmation-modal.service';
import { VersionedElementModalComponent } from './versioned-element-modal.component';

export function openVersionedElementModal<T>(
    ngbModal: NgbModal,
    confirmationService: ConfirmationModalService,
    data: VersionedElementModalData<T>,
    opts: {
        size?: string;
        showConfirmationOnDismiss?: boolean;
    } = {
        size: 'xl',
        showConfirmationOnDismiss: false,
    }
) {
    const modal = ngbModal.open(VersionedElementModalComponent, {
        size: opts.size,
        beforeDismiss: async () => {
            if (!opts.showConfirmationOnDismiss) return true;

            const confirmationResult = await confirmationService.confirm({
                title: 'Ungespeicherte Änderungen gehen verloren',
                description:
                    'Durch Schließen dieses Fensters gehen ggf. ungespeicherte Änderungen verloren.',
                confirmationButtonText: 'Fenster schließen',
            });

            return confirmationResult === true;
        },
    });

    const componentInstance =
        modal.componentInstance as VersionedElementModalComponent;
    componentInstance.data = data;
    return modal;
}
