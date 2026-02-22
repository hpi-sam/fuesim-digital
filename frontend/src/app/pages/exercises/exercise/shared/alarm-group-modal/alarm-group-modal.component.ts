import { Component, inject, resource } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap/modal';
import { Store } from '@ngrx/store';
import {
    AlarmGroup,
    cloneDeepMutable,
    TemplateVersion,
} from 'fuesim-digital-shared';
import { Subject } from 'rxjs';
import { AppState } from '../../../../../state/app.state';
import { selectSelectedCollections } from '../../../../../state/application/selectors/exercise.selectors';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { ElementCardComponent } from '../../../../marketplace/shared/cards/element-card/element-card.component';

@Component({
    selector: 'app-alarm-group-modal',
    templateUrl: './alarm-group-modal.component.html',
    styleUrls: ['./alarm-group-modal.component.scss'],
    imports: [ElementCardComponent],
})
export class AlarmGroupModalComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly activeModal = inject(NgbActiveModal);
    private readonly store = inject(Store<AppState>);

    public readonly alarmGroupSelection$ = new Subject<AlarmGroup>();

    public exerciseCollections = this.store.selectSignal(
        selectSelectedCollections
    );

    public collectionElements = resource({
        params: () => ({
            collections: this.exerciseCollections(),
        }),
        loader: async ({ params: { collections } }) =>
            Promise.all(
                collections.map(async (collection) => ({
                    collection:
                        await this.collectionService.getCollectionVersion(
                            collection
                        ),
                    elements:
                        await this.collectionService.getElementsOfCollectionVersion(
                            collection
                        ),
                }))
            ),
    });

    public filterAlarmGroups(elements: TemplateVersion[]) {
        return elements.filter(
            (element) => element.content.type === 'alarmGroup'
        );
    }

    public close(element?: AlarmGroup) {
        if (element) {
            this.alarmGroupSelection$.next(cloneDeepMutable(element));
        }
        this.alarmGroupSelection$.complete();
        this.activeModal.close();
    }
}
