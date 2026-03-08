import type { OnInit } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type { ResourceRequestRadiogram, UUID } from 'fuesim-digital-shared';
import { isAccepted, isDone } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import {
    Hotkey,
    HotkeyLayer,
    HotkeysService,
} from '../../../../../../../../../shared/services/hotkeys.service';
import { ExerciseService } from '../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../state/app.state';
import { createSelectRadiogram } from '../../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-radiogram-card-content-resource-request',
    templateUrl: './radiogram-card-content-resource-request.component.html',
    styleUrls: ['./radiogram-card-content-resource-request.component.scss'],
    standalone: false,
})
export class RadigoramCardContentResourceRequestComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly hotkeyService = inject(HotkeysService);

    @Input() radiogramId!: UUID;
    @Input() shownInSignallerModal = false;

    radiogram$!: Observable<ResourceRequestRadiogram>;
    enableActionButtons$!: Observable<boolean>;
    showAnswer$!: Observable<boolean>;

    private readonly hotkeyLayer: HotkeyLayer;
    acceptHotkey!: Hotkey;
    denyHotkey!: Hotkey;

    constructor() {
        this.hotkeyLayer = this.hotkeyService.createLayer(false, false);
    }

    acceptRequest() {
        this.exerciseService.proposeAction({
            type: '[Radiogram] Accept resource request',
            radiogramId: this.radiogramId,
        });
    }

    denyRequest() {
        this.exerciseService.proposeAction({
            type: '[Radiogram] Deny resource request',
            radiogramId: this.radiogramId,
        });
    }

    ngOnInit(): void {
        const selectRadiogram = createSelectRadiogram<ResourceRequestRadiogram>(
            this.radiogramId
        );
        this.radiogram$ = this.store.select(selectRadiogram);
        this.enableActionButtons$ = this.store.select(
            createSelector(selectRadiogram, (radiogram) =>
                isAccepted(radiogram)
            )
        );
        this.showAnswer$ = this.store.select(
            createSelector(selectRadiogram, (radiogram) => isDone(radiogram))
        );

        this.acceptHotkey = new Hotkey(
            '+',
            false,
            () => {
                this.acceptRequest();
            },
            this.enableActionButtons$
        );
        this.denyHotkey = new Hotkey(
            '-',
            false,
            () => {
                this.denyRequest();
            },
            this.enableActionButtons$
        );
        this.hotkeyLayer.addHotkey(this.acceptHotkey);
        this.hotkeyLayer.addHotkey(this.denyHotkey);
        this.hotkeyLayer.enabled = this.shownInSignallerModal;
    }
}
