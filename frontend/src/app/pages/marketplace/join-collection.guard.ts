import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { CollectionService } from '../../core/exercise-element.service';
import { JoinCollectionModalComponent } from './shared/modals/join-collection-modal/join-collection-modal.component';

@Injectable({
    providedIn: 'root',
})
export class JoinCollectionGuard {
    private readonly ngbModalService = inject(NgbModal);
    private readonly router = inject(Router);
    private readonly collectionService = inject(CollectionService);

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        const collectionEntityId = route.params['collectionEntityId'];
        const collectionRole =
            await this.collectionService.getUserCollectionRole(
                collectionEntityId
            );
        const canOpenCollection = collectionRole !== null;

        const joinCode = route.queryParams['join'];

        if (!joinCode) {
            return canOpenCollection;
        }

        // Do not show join collection modal if the user is already a member of the collection
        if (canOpenCollection) {
            return true;
        }
        try {
            const preview =
                await this.collectionService.getJoinCodePreview(joinCode);
            const modal = this.ngbModalService.open(
                JoinCollectionModalComponent
            );
            modal.componentInstance.collection = preview;
            const result = await firstValueFrom(modal.componentInstance.onJoin);

            if (!result) {
                this.router.navigate(['/']);
                return false;
            }

            await this.collectionService.joinCollectionByJoinCode(joinCode);
            return true;
        } catch (e) {
            console.error(e);
            this.router.navigate(['/']);
            return false;
        }
    }
}
