import type { OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import { TransferPoint } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { SearchableDropdownOption } from 'src/app/shared/components/searchable-dropdown/searchable-dropdown.component';
import type { HotkeyLayer } from 'src/app/shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from 'src/app/shared/services/hotkeys.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectTransferPoint,
    selectTransferPoints,
} from 'src/app/state/application/selectors/exercise.selectors';
import { MessageService } from 'src/app/core/messages/message.service';
import { SignallerModalDetailsService } from '../signaller-modal-details.service';

@Component({
    selector: 'app-signaller-modal-transfer-connections-editor',
    templateUrl: './signaller-modal-transfer-connections-editor.component.html',
    styleUrls: ['./signaller-modal-transfer-connections-editor.component.scss'],
    standalone: false,
})
export class SignallerModalTransferConnectionsEditorComponent
    implements OnInit, OnChanges, OnDestroy
{
    @Input() transferPointId!: UUID;

    private hotkeyLayer!: HotkeyLayer;
    submitHotkey = new Hotkey('Enter', false, () => this.addConnection());

    selectedTransferPoint: SearchableDropdownOption | null = null;
    loading = false;

    public connectedTransferPointNames$!: Observable<string[]>;
    public transferPointsToBeAdded$!: Observable<SearchableDropdownOption[]>;

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService,
        private readonly detailsModal: SignallerModalDetailsService,
        private readonly hotkeysService: HotkeysService,
        private readonly messageService: MessageService
    ) {}

    ngOnInit() {
        this.hotkeyLayer = this.hotkeysService.createLayer();
        this.hotkeyLayer.addHotkey(this.submitHotkey);
    }

    ngOnChanges() {
        const transferPoint$ = this.store.select(
            createSelectTransferPoint(this.transferPointId)
        );

        const transferPoints$ = this.store.select(selectTransferPoints);

        this.transferPointsToBeAdded$ = transferPoints$.pipe(
            map((transferPoints) => {
                const currentTransferPoint =
                    transferPoints[this.transferPointId]!;
                return Object.entries(transferPoints)
                    .filter(
                        ([key]) =>
                            key !== this.transferPointId &&
                            !currentTransferPoint.reachableTransferPoints[key]
                    )
                    .map(([id, transferPoint]) => ({
                        key: id,
                        name: TransferPoint.getFullName(transferPoint),
                    }));
            })
        );

        this.connectedTransferPointNames$ = combineLatest([
            transferPoint$,
            transferPoints$,
        ]).pipe(
            map(([transferPoint, transferPoints]) =>
                Object.entries(transferPoint.reachableTransferPoints)
                    .map(([key, value]) =>
                        TransferPoint.getFullName(transferPoints[key]!)
                    )
                    .sort((a, b) => a.localeCompare(b))
            )
        );
    }

    ngOnDestroy() {
        this.hotkeysService.removeLayer(this.hotkeyLayer);
    }

    public selectTransferPoint(
        selectedTransferPoint: SearchableDropdownOption
    ) {
        this.selectedTransferPoint = selectedTransferPoint;
    }

    public addConnection() {
        if (!this.selectedTransferPoint) return;

        this.exerciseService
            .proposeAction({
                type: '[TransferPoint] Connect TransferPoints',
                transferPointId1: this.transferPointId,
                transferPointId2: this.selectedTransferPoint.key,
            })
            .then((result) => {
                this.loading = false;

                if (result.success) {
                    this.close();
                    this.messageService.postMessage({
                        title: 'Befehl erteilt',
                        body: 'Der Standort des anderen Bereichs wurde erfolgreich übermittelt',
                        color: 'success',
                    });
                } else {
                    this.messageService.postError({
                        title: 'Fehler beim Erteilen des Befehls',
                        body: 'Der Standort des anderen Bereichs konnte nicht mitgeteilt werden',
                    });
                }
            });

        this.loading = true;
    }

    close() {
        this.detailsModal.close();
    }
}
