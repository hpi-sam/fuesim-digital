import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { RedirectCommand, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../core/exercise-element.service';

@Injectable({
    providedIn: 'root',
})
export class ViewCollectionGuard {
    private readonly ngbModalService = inject(NgbModal);
    private readonly router = inject(Router);
    private readonly collectionService = inject(CollectionService);

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        const collectionEntityId = route.params['collectionEntityId'];

        const canAccessCollection = await this.collectionService
            .getLatestCollectionVersionByEntityId(collectionEntityId, {
                allowDraftState: true,
            })
            .then(() => true)
            .catch(() => false);

        console.log({ canAccessCollection, collectionEntityId });

        if (canAccessCollection) {
            return true;
        }
        return new RedirectCommand(this.router.parseUrl('/collections'));
    }
}
