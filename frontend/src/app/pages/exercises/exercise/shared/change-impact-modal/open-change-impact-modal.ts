import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { ChangeImpact, ElementDto } from 'fuesim-digital-shared';
import type { ObservedValueOf } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ChangeImpactModalComponent } from './change-impact-modal.component';

/**
 * INFO: This function skips and just prompts a confirmation modal if there are no change impacts
 */
export async function openChangeImpactModal(
    ngbModalService: NgbModal,
    data: {
        changeImpacts: ChangeImpact[];
        visibleAvailableElements: ElementDto[];
    }
): Promise<ObservedValueOf<ChangeImpactModalComponent['submitChanges']>> {
    if (data.changeImpacts.length === 0) {
        return {
            apply: true,
            confirmationSuggested: true,
            changes: [],
        };
    }

    const modal = ngbModalService.open(ChangeImpactModalComponent, {
        size: 'xl',
    });
    const componentInstance =
        modal.componentInstance as ChangeImpactModalComponent;
    console.log('Calculated change impacts:', data.changeImpacts);
    componentInstance.changes = data.changeImpacts;
    componentInstance.collectionElements = data.visibleAvailableElements;

    const result = await firstValueFrom(componentInstance.submitChanges);

    return result;
}
