import type { OnDestroy, OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ExerciseAction,
    PatientStatus,
    PatientStatusForTransport,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import { Subject } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { HotkeyLayer } from 'src/app/shared/services/hotkeys.service';
import { HotkeysService } from 'src/app/shared/services/hotkeys.service';
import type { AppState } from 'src/app/state/app.state';
import { createSelectBehaviorStatesByType } from 'src/app/state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';
import { MessageService } from 'src/app/core/messages/message.service';
import { SignallerModalDetailsService } from '../signaller-modal-details.service';

@Component({
    selector: 'app-signaller-modal-start-transfer-of-category-modal',
    templateUrl:
        './signaller-modal-start-transfer-of-category-modal.component.html',
    styleUrls: [
        './signaller-modal-start-transfer-of-category-modal.component.scss',
    ],
    standalone: false,
})
export class SignallerModalStartTransferOfCategoryModalComponent
    implements OnInit, OnDestroy
{
    @Input() simulatedRegionId!: UUID;

    private hotkeyLayer!: HotkeyLayer;
    private readonly destroy$ = new Subject<void>();

    transportStarted = false;
    maximumStatus: PatientStatusForTransport = 'red';

    loadingCount = 0;
    anyActionError = false;

    allowedStatuses = [
        'red',
        'yellow',
        'green',
    ] as const satisfies PatientStatusForTransport[];

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly hotkeysService: HotkeysService,
        private readonly detailsModal: SignallerModalDetailsService,
        private readonly messageService: MessageService
    ) {}

    ngOnInit() {
        this.hotkeyLayer = this.hotkeysService.createLayer();

        const transportBehaviorState = this.getTransportBehaviorState();

        this.transportStarted =
            transportBehaviorState?.transportStarted ?? false;
        this.maximumStatus =
            transportBehaviorState?.maximumCategoryToTransport ?? 'red';
    }

    ngOnDestroy() {
        this.hotkeysService.removeLayer(this.hotkeyLayer);
        this.destroy$.next();
    }

    getTransportBehaviorState() {
        return selectStateSnapshot(
            createSelectBehaviorStatesByType(
                this.simulatedRegionId,
                'managePatientTransportToHospitalBehavior'
            ),
            this.store
        )[0];
    }

    public updateMaximumStatus(newStatus: PatientStatus) {
        this.maximumStatus = newStatus as PatientStatusForTransport;
    }

    public submit() {
        const transportBehaviorState = this.getTransportBehaviorState();

        if (!transportBehaviorState) {
            this.close();
            return;
        }

        // loadingCount has to be fully increased before actually proposing the first action. Otherwise, it could become 0 in between.
        // Hence, all actions to be proposed are collected here and proposed in the end.
        // const actionProposers: (() => void)[] = [];
        const actionsToPropose: ExerciseAction[] = [];

        if (
            this.maximumStatus !==
            transportBehaviorState.maximumCategoryToTransport
        ) {
            this.loadingCount++;

            actionsToPropose.push({
                type: '[ManagePatientsTransportToHospitalBehavior] Update Maximum Category To Transport',
                simulatedRegionId: this.simulatedRegionId,
                behaviorId: transportBehaviorState.id,
                maximumCategoryToTransport: this.maximumStatus,
            });
        }
        if (this.transportStarted !== transportBehaviorState.transportStarted) {
            this.loadingCount++;

            actionsToPropose.push({
                type: this.transportStarted
                    ? '[ManagePatientsTransportToHospitalBehavior] Start Transport'
                    : '[ManagePatientsTransportToHospitalBehavior] Stop Transport',
                simulatedRegionId: this.simulatedRegionId,
                behaviorId: transportBehaviorState.id,
            });
        }

        if (this.loadingCount === 0) {
            // Even if there is nothing to do, we want to show a success message
            this.loadingCount++;
            this.handlePromise({ success: true });
            return;
        }

        actionsToPropose.forEach((action) => {
            this.exerciseService
                .proposeAction(action)
                .then((result) => this.handlePromise(result));
        });
    }

    handlePromise(result: { success: boolean }) {
        this.loadingCount--;

        if (!result.success) this.anyActionError = true;

        if (this.loadingCount === 0) {
            if (this.anyActionError) {
                this.messageService.postError({
                    title: 'Fehler beim Erteilen des Befehls',
                    body: 'Die aktuellen Transporteinstellungen konnten nicht geändert werden',
                });
            } else {
                this.messageService.postMessage({
                    title: 'Befehl erteilt',
                    body: 'Der Transport wird nun wie angegeben ausgeführt',
                    color: 'success',
                });
            }

            this.anyActionError = false;

            this.close();
        }
    }

    close() {
        this.detailsModal.close();
    }
}
