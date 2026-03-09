import type { OnInit } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { ExerciseRadiogram, UUID } from 'fuesim-digital-shared';
import {
    currentParticipantIdOf,
    isAccepted,
    isDone,
    publishTimeOf,
    isUnpublished,
    StrictObject,
    isUnread,
    isInterfaceSignallerKey,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map, combineLatest } from 'rxjs';
import type { AppState } from '../../../../../../../state/app.state';
import { selectOwnClientId } from '../../../../../../../state/application/selectors/application.selectors';
import { selectRadiograms } from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../state/get-state-snapshot';
import { RadiogramListService } from './radiogram-list.service';

@Component({
    selector: 'app-radiogram-list',
    templateUrl: './radiogram-list.component.html',
    styleUrls: ['./radiogram-list.component.scss'],
    standalone: false,
})
export class RadiogramListComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    readonly radiogramListService = inject(RadiogramListService);

    @Input() shownInSignallerModal = false;

    ownClientId!: UUID;
    publishedRadiograms$!: Observable<ExerciseRadiogram[]>;
    visibleRadiograms$!: Observable<ExerciseRadiogram[]>;

    ngOnInit(): void {
        this.ownClientId = selectStateSnapshot(selectOwnClientId, this.store)!;

        this.publishedRadiograms$ = this.store.select(selectRadiograms).pipe(
            map((radiograms) => StrictObject.values(radiograms)),
            map((radiograms) =>
                radiograms.filter((radiogram) => !isUnpublished(radiogram))
            ),
            map((radiograms) =>
                [...radiograms].sort(this.compareRadiogramsByPublishTime)
            )
        );

        this.visibleRadiograms$ = combineLatest([
            this.publishedRadiograms$,
            this.radiogramListService.showDone$,
            this.radiogramListService.showOtherClients$,
        ]).pipe(
            map(([radiograms, showDone, showOthers]) =>
                radiograms.filter((radiogram) =>
                    this.shouldBeShown(radiogram, showDone, showOthers)
                )
            )
        );
    }

    compareRadiogramsByPublishTime(
        a: ExerciseRadiogram,
        b: ExerciseRadiogram
    ): number {
        return publishTimeOf(a) - publishTimeOf(b);
    }

    shouldBeShown(
        radiogram: ExerciseRadiogram,
        showDone: boolean,
        showOthers: boolean
    ): boolean {
        if (!showDone && isDone(radiogram)) return false;

        if (
            !showOthers &&
            isAccepted(radiogram) &&
            currentParticipantIdOf(radiogram) !== this.ownClientId
        )
            return false;

        if (
            isUnread(radiogram) &&
            isInterfaceSignallerKey(radiogram.informationRequestKey)
        )
            return false;

        return true;
    }
}
