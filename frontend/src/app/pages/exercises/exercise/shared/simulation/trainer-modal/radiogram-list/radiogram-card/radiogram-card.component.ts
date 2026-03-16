import type {
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type {
    ExerciseRadiogram,
    SimulatedRegion,
    UUID,
} from 'fuesim-digital-shared';
import {
    Client,
    ClientRole,
    currentParticipantIdOf,
    isAccepted,
    isDone,
    isUnread,
} from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { NgClass, AsyncPipe } from '@angular/common';
import { SelectSignallerRegionService } from '../../../signaller-modal/select-signaller-region.service';
import type { HotkeyLayer } from '../../../../../../../../shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from '../../../../../../../../shared/services/hotkeys.service';
import { ExerciseService } from '../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../state/app.state';
import { selectOwnClientId } from '../../../../../../../../state/application/selectors/application.selectors';
import {
    createSelectRadiogram,
    selectSimulatedRegions,
    selectClients,
} from '../../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../../state/get-state-snapshot';
import { HotkeyIndicatorComponent } from '../../../../../../../../shared/components/hotkey-indicator/hotkey-indicator.component';
import { RadiogramCardContentComponent } from './radiogram-card-content/radiogram-card-content.component';

// Clients that leave are lost from the state but radiograms might point to them.
// This is a fallback to show something useful in the UI
const unavailableClient = Client.create(
    'Unbekannt',
    ClientRole.create('participant', 'mapOperator')
);

@Component({
    selector: 'app-radiogram-card',
    templateUrl: './radiogram-card.component.html',
    styleUrls: ['./radiogram-card.component.scss'],
    imports: [
        NgClass,
        RadiogramCardContentComponent,
        HotkeyIndicatorComponent,
        AsyncPipe,
    ],
})
export class RadiogramCardComponent implements OnInit, OnChanges, OnDestroy {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly hotkeyService = inject(HotkeysService);
    private readonly selectRegionService = inject(SelectSignallerRegionService);

    readonly radiogramId = input.required<UUID>();
    readonly shownInSignallerModal = input(false);
    readonly first = input.required<boolean>();

    radiogram$!: Observable<ExerciseRadiogram>;
    simulatedRegion$!: Observable<SimulatedRegion | undefined>;

    ownClientId!: UUID;

    status$!: Observable<
        'done' | 'otherAccepted' | 'ownAccepted' | 'unread' | undefined
    >;
    acceptingClient$!: Observable<Client | undefined>;

    private readonly hotkeyLayer: HotkeyLayer;
    readonly acceptHotkey = new Hotkey('F1', false, () => {
        this.acceptOrMarkAsDone();
    });
    readonly returnHotkey = new Hotkey('⇧ + F1', false, () => {
        if (
            isAccepted(
                selectStateSnapshot(
                    createSelectRadiogram(this.radiogramId()),
                    this.store
                )
            )
        ) {
            this.returnRadiogram();
        }
    });

    constructor() {
        this.hotkeyLayer = this.hotkeyService.createLayer(false, false);
        this.hotkeyLayer.addHotkey(this.acceptHotkey);
        this.hotkeyLayer.addHotkey(this.returnHotkey);
    }

    ngOnInit(): void {
        this.ownClientId = selectStateSnapshot(selectOwnClientId, this.store)!;

        const selectRadiogram = createSelectRadiogram(this.radiogramId());
        this.radiogram$ = this.store.select(selectRadiogram);

        this.simulatedRegion$ = this.store.select(
            createSelector(
                selectRadiogram,
                selectSimulatedRegions,
                (radiogram, simulatedRegions) =>
                    simulatedRegions[radiogram.simulatedRegionId]
            )
        );

        this.status$ = this.radiogram$.pipe(
            map((radiogram) => {
                if (isUnread(radiogram)) return 'unread';
                if (isAccepted(radiogram)) {
                    return currentParticipantIdOf(radiogram) ===
                        this.ownClientId
                        ? 'ownAccepted'
                        : 'otherAccepted';
                }
                if (isDone(radiogram)) return 'done';
                return undefined;
            })
        );

        const selectClient = createSelector(
            selectRadiogram,
            selectClients,
            (radiogram, clients) => {
                if (!isAccepted(radiogram)) {
                    return undefined;
                }
                const clientId = currentParticipantIdOf(radiogram);
                return clients[clientId] ?? unavailableClient;
            }
        );

        this.acceptingClient$ = this.store.select(selectClient);
    }

    ngOnChanges(changes: SimpleChanges) {
        if ('first' in changes) {
            this.hotkeyLayer.enabled =
                this.first() && this.shownInSignallerModal();
        }
    }

    ngOnDestroy() {
        this.hotkeyService.removeLayer(this.hotkeyLayer);
    }

    acceptOrMarkAsDone() {
        if (
            isAccepted(
                selectStateSnapshot(
                    createSelectRadiogram(this.radiogramId()),
                    this.store
                )
            )
        ) {
            this.markRadiogramAsDone();
        } else {
            this.acceptRadiogram();
        }
    }

    acceptRadiogram() {
        this.exerciseService
            .proposeAction({
                type: '[Radiogram] Accept radiogram',
                clientId: this.ownClientId,
                radiogramId: this.radiogramId(),
            })
            .then((result) => {
                if (result.success && this.shownInSignallerModal()) {
                    this.selectRegionService.selectSimulatedRegion(
                        selectStateSnapshot(
                            createSelectRadiogram(this.radiogramId()),
                            this.store
                        ).simulatedRegionId
                    );
                }
            });
    }

    returnRadiogram() {
        this.exerciseService.proposeAction({
            type: '[Radiogram] Return radiogram',
            radiogramId: this.radiogramId(),
        });
    }

    markRadiogramAsDone() {
        this.exerciseService.proposeAction({
            type: '[Radiogram] Mark as done',
            clientId: this.ownClientId,
            radiogramId: this.radiogramId(),
        });
    }
}
