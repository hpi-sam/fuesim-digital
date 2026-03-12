import type { OnDestroy, OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ExerciseAction,
    PatientStatusForTransport,
    UUID,
} from 'fuesim-digital-shared';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SignallerModalDetailsService } from '../signaller-modal-details.service';
import type { HotkeyLayer } from '../../../../../../../../shared/services/hotkeys.service';
import { HotkeysService } from '../../../../../../../../shared/services/hotkeys.service';
import { ExerciseService } from '../../../../../../../../core/exercise.service';
import { MessageService } from '../../../../../../../../core/messages/message.service';
import type { AppState } from '../../../../../../../../state/app.state';
import { createSelectBehaviorStatesByType } from '../../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../../state/get-state-snapshot';
import { AutofocusDirective } from '../../../../../../../../shared/directives/autofocus.directive';
import { PatientStatusDropdownComponent } from '../../../../../../../../shared/components/patient-status-dropdown/patient-status-dropdown.component';
import { HotkeyIndicatorComponent } from '../../../../../../../../shared/components/hotkey-indicator/hotkey-indicator.component';

@Component({
    selector: 'app-signaller-modal-start-transfer-of-category-modal',
    templateUrl:
        './signaller-modal-start-transfer-of-category-modal.component.html',
    styleUrls: [
        './signaller-modal-start-transfer-of-category-modal.component.scss',
    ],
    imports: [
        FormsModule,
        AutofocusDirective,
        PatientStatusDropdownComponent,
        HotkeyIndicatorComponent,
    ],
})
export class SignallerModalStartTransferOfCategoryModalComponent
    implements OnInit, OnDestroy
{
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly hotkeysService = inject(HotkeysService);
    private readonly detailsModal = inject(SignallerModalDetailsService);
    private readonly messageService = inject(MessageService);

    readonly simulatedRegionId = input.required<UUID>();

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
                this.simulatedRegionId(),
                'managePatientTransportToHospitalBehavior'
            ),
            this.store
        )[0];
    }

    public updateMaximumStatus(newStatus: PatientStatusForTransport) {
        this.maximumStatus = newStatus;
    }

    public submit() {
        const transportBehaviorState = this.getTransportBehaviorState();

        if (!transportBehaviorState) {
            this.close();
            return;
        }

        // loadingCount has to be fully increased before actually proposing the first action. Otherwise, it could become 0 in between.
        // Hence, all actions to be proposed are collected here and proposed in the end.
        const actionsToPropose: ExerciseAction[] = [];

        const simulatedRegionId = this.simulatedRegionId();
        if (
            this.maximumStatus !==
            transportBehaviorState.maximumCategoryToTransport
        ) {
            this.loadingCount++;

            actionsToPropose.push({
                type: '[ManagePatientsTransportToHospitalBehavior] Update Maximum Category To Transport',
                simulatedRegionId,
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
                simulatedRegionId,
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
