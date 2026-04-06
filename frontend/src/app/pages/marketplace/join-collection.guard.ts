import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ApiService } from '../../core/api.service';
import { ApplicationService } from '../../core/application.service';
import { MessageService } from '../../core/messages/message.service';
import { AppState } from '../../state/app.state';
import { selectExerciseStateMode } from '../../state/application/selectors/application.selectors';
import { selectStateSnapshot } from '../../state/get-state-snapshot';
import { tryToJoinExercise } from '../exercises/shared/join-exercise-modal/try-to-join-exercise';
import { CollectionService } from '../../core/exercise-element.service';
import { JoinCollectionModalComponent } from './join-collection-modal/join-collection-modal.component';
import { firstValueFrom, lastValueFrom } from 'rxjs';

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
        const isMember =
            await this.collectionService.checkIsCollectionMember(
                collectionEntityId
            );
        const joinCode = route.queryParams['join'];

        if (!joinCode) {
            return isMember;
        }

        // Do not show join collection modal if the user is already a member of the collection
        if (isMember) {
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
            console.log({ result });

            if (!result) {
                this.router.navigate(['/']);
                return false;
            } else {
                await this.collectionService.joinCollectionByJoinCode(joinCode);
                return true;
            }
        } catch (e) {
            this.router.navigate(['/']);
            return false;
        }
    }
}
