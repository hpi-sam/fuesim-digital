import type { OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { TransferPoint } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import { SignallerModalDetailsService } from '../signaller-modal-details.service';
import type { HotkeyLayer } from '../../../../../../../../shared/services/hotkeys.service';
import {
    Hotkey,
    HotkeysService,
} from '../../../../../../../../shared/services/hotkeys.service';
import { ExerciseService } from '../../../../../../../../core/exercise.service';
import { MessageService } from '../../../../../../../../core/messages/message.service';
import { SearchableDropdownOption } from '../../../../../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import type { AppState } from '../../../../../../../../state/app.state';
import {
    createSelectTransferPoint,
    selectTransferPoints,
} from '../../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-signaller-modal-transfer-connections-editor',
    templateUrl: './signaller-modal-transfer-connections-editor.component.html',
    styleUrls: ['./signaller-modal-transfer-connections-editor.component.scss'],
    standalone: false,
})
export class SignallerModalTransferConnectionsEditorComponent
    implements OnInit, OnChanges, OnDestroy
{
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly detailsModal = inject(SignallerModalDetailsService);
    private readonly hotkeysService = inject(HotkeysService);
    private readonly messageService = inject(MessageService);

    @Input() transferPointId!: UUID;

    private hotkeyLayer!: HotkeyLayer;
    submitHotkey = new Hotkey('Enter', false, () => this.addConnection());

    selectedTransferPoint: SearchableDropdownOption | null = null;
    loading = false;

    public connectedTransferPointNames$!: Observable<string[]>;
    public transferPointsToBeAdded$!: Observable<SearchableDropdownOption[]>;

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
