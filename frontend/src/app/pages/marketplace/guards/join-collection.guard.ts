import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { RedirectCommand, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { CollectionService } from '../../../core/exercise-element.service';
import { JoinCollectionModalComponent } from '../shared/modals/join-collection-modal/join-collection-modal.component';
import { ViewCollectionGuard } from './view-collection-guard';

@Injectable({
    providedIn: 'root',
})
export class JoinCollectionGuard {
    private readonly ngbModalService = inject(NgbModal);
    private readonly router = inject(Router);
    private readonly collectionService = inject(CollectionService);
    private readonly canViewCollectionGuard = inject(ViewCollectionGuard);

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        // Do not show join collection modal if the user is already a member of the collection
        if (
            (await this.canViewCollectionGuard.canActivate(route, state)) ===
            true
        ) {
            return true;
        }

        const joinCode = route.queryParams['join'];

        if (!joinCode) {
            // if the user can not view the collection,
            // the other guard will handle that
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
                return new RedirectCommand(this.router.parseUrl('/'));
            }

            await this.collectionService.joinCollectionByJoinCode(joinCode);
            return true;
        } catch (e) {
            console.error(e);
            return new RedirectCommand(this.router.parseUrl('/'));
        }
    }
}
