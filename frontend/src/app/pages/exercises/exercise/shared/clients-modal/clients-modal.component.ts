import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ExerciseKey, Role } from 'fuesim-digital-shared';
import { QrCodeComponent } from 'ng-qrcode';
import { AppState } from '../../../../../state/app.state';
import { selectParticipantKey } from '../../../../../state/application/selectors/exercise.selectors';
import { selectExerciseKey } from '../../../../../state/application/selectors/application.selectors';
import { ClientOverviewTableComponent } from '../client-overview-table/client-overview-table.component';
import { CopyButtonComponent } from '../../../../../shared/components/copy-button/copy-button.component';
import { selectOwnClient } from '../../../../../state/application/selectors/shared.selectors';

@Component({
    selector: 'app-clients-modal',
    imports: [
        CommonModule,
        NgbTooltip,
        ClientOverviewTableComponent,
        CopyButtonComponent,
        QrCodeComponent,
    ],
    templateUrl: './clients-modal.component.html',
    styleUrl: './clients-modal.component.scss',
})
export class ClientsModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly store = inject<Store<AppState>>(Store);

    public readonly ownClient = this.store.selectSignal(selectOwnClient);
    public readonly showTable = signal<boolean>(false);
    public readonly shareRole = signal<Role | null>(null);

    readonly shareRoleInfo = computed(() => {
        switch (this.shareRole()) {
            case 'participant':
                return {
                    name: 'Teilnehmende',
                    keyName: 'Teilnehmenden-PIN',
                    alertType: 'info' as const,
                    qrHintText: `Über diesen QR-Code können Teilnehmende der Übung beitreten. Alle Teilnehmenden müssen ${this.ownClient()?.role.mainRole === 'trainer' ? 'von Ihnen' : 'von Übungsleitenden'} bestätigt werden.`,
                    linkHintText: `Über diesen Link können Teilnehmende der Übung beitreten. Alle Teilnehmenden müssen ${this.ownClient()?.role.mainRole === 'trainer' ? 'von Ihnen' : 'von Übungsleitenden'} bestätigt werden.`,
                };
            case 'trainer':
                return {
                    name: 'Übungsleitende',
                    keyName: 'Übungsleitungs-PIN',
                    alertType: 'warning' as const,
                    qrHintText:
                        'Über diesen QR-Code können weitere Personen diese Übung verwalten. Teilen Sie diesen QR-Code nicht mit Teilnehmenden!',
                    linkHintText:
                        'Über diesen Link können weitere Personen diese Übung verwalten. Teilen Sie diesen Link nicht mit Teilnehmenden!',
                };
            default:
                return null;
        }
    });

    public readonly shareKey = computed<ExerciseKey | undefined>(() =>
        this.store.selectSignal(
            this.shareRole() === 'trainer'
                ? selectExerciseKey
                : selectParticipantKey
        )()
    );

    readonly shareUrl = computed(
        () => `${location.origin}/exercises/${this.shareKey()}`
    );

    readonly showQrCode = computed(() => this.shareRoleInfo() !== null);

    public close() {
        this.activeModal.close();
    }
}
