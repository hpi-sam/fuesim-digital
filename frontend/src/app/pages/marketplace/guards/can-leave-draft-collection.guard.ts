import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    GuardResult,
    RouterStateSnapshot,
} from '@angular/router';
import { CollectionService } from '../../../core/exercise-element.service';
import { MarketplaceSetDetailComponent } from '../collection-detail-view/collection-detail-view.component';
import { TwoButtonConfirmationModalService } from '../../../core/twobutton-confirmation-modal/twobutton-confirmation-modal.service';

@Injectable({
    providedIn: 'root',
})
export class LeaveDraftCollectionGuard {
    private readonly twoButtonConfirmationModalService = inject(
        TwoButtonConfirmationModalService
    );
    private readonly collectionService = inject(CollectionService);

    async canDeactivate(
        component: MarketplaceSetDetailComponent,
        currentRoute: ActivatedRouteSnapshot,
        currentState: RouterStateSnapshot,
        nextState: RouterStateSnapshot
    ): Promise<GuardResult> {
        if (!this.collectionService.versioningEnabled()) {
            return true;
        }

        const collectionEntityId = currentRoute.params['collectionEntityId'];

        const collectionIsInDraftState = await this.collectionService
            .getLatestCollectionVersionByEntityId(collectionEntityId, {
                allowDraftState: true,
            })
            .then((c) => c.draftState)
            .catch(() => false);

        if (!collectionIsInDraftState) {
            return true;
        }

        const confirm = await this.twoButtonConfirmationModalService.confirm({
            title: 'Ausstehende Version speichern',
            description:
                'Die Sammlung befindet sich noch in der Entwurfsphase. Sie müssen die Sammlung als neue Version speichern, bevor Sie sie in Übungsszenarien verwenden können.',
            dangerConfirmationButtonText: 'Als Entwurf behalten',
            successConfirmationButtonText: 'In Übungen verwenden',
            cancelButtonText: 'Auf Seite bleiben',
        });

        if (confirm === 'success') {
            await this.collectionService.saveDraftState(collectionEntityId);
        }

        if (confirm) {
            return true;
        }

        return false;
    }
}
