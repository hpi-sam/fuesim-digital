import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { RedirectCommand, Router } from '@angular/router';
import { CollectionService } from '../../../core/collection.service';
import { MessageService } from '../../../core/messages/message.service';

@Injectable({
    providedIn: 'root',
})
export class ViewCollectionGuard {
    private readonly messageService = inject(MessageService);
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

        if (canAccessCollection) {
            return true;
        }

        this.messageService.postError({
            title: 'Zugriff verweigert',
            body: 'Sie haben keinen Zugriff auf diese Sammlung.',
        });

        return new RedirectCommand(this.router.parseUrl('/collections'));
    }
}
