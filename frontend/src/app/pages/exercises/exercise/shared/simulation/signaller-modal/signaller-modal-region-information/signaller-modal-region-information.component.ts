import type { OnChanges, OnInit } from '@angular/core';
import {
    Component,
    TemplateRef,
    inject,
    input,
    viewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import type { ReportableInformation, UUID } from 'fuesim-digital-shared';
import { makeInterfaceSignallerKey } from 'fuesim-digital-shared';
import { type Observable, BehaviorSubject, map } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import {
    setLoadingState,
    type InterfaceSignallerInteraction,
    SignallerModalInteractionsComponent,
} from '../signaller-modal-interactions/signaller-modal-interactions.component';
import { SignallerModalDetailsService } from '../details-modal/signaller-modal-details.service';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../state/app.state';
import { selectOwnClientId } from '../../../../../../../state/application/selectors/application.selectors';
import { createSelectBehaviorStates } from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../../state/get-state-snapshot';
import { SignallerModalRecurringReportModalComponent } from '../details-modal/signaller-modal-recurring-report-modal/signaller-modal-recurring-report-modal.component';
import { SimulationEventBasedReportEditorComponent } from '../../shared/simulation-event-based-report-editor/simulation-event-based-report-editor.component';

@Component({
    selector: 'app-signaller-modal-region-information',
    templateUrl: './signaller-modal-region-information.component.html',
    styleUrls: ['./signaller-modal-region-information.component.scss'],
    imports: [
        SignallerModalInteractionsComponent,
        SignallerModalRecurringReportModalComponent,
        SimulationEventBasedReportEditorComponent,
        AsyncPipe,
    ],
})
export class SignallerModalRegionInformationComponent
    implements OnInit, OnChanges
{
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly detailsModal = inject(SignallerModalDetailsService);

    readonly simulatedRegionId = input.required<UUID>();

    readonly recurringReportEditor = viewChild.required<TemplateRef<any>>(
        'recurringReportEditor'
    );

    informationTypeToEdit: ReportableInformation | null = null;

    private clientId!: UUID;

    informationInteractions: InterfaceSignallerInteraction[] = [
        {
            key: 'patientCount',
            name: 'Anzahl Patienten',
            details: 'nach Sichtungskategorie',
            keywords: [
                'patient',
                'patienten',
                'zahl',
                'anzahl',
                'zahlen',
                'zählen',
                'menge',
            ],
            hotkeyKeys: 'A',
            callback: () => this.requestPatientCount(),
            hasSecondaryAction: true,
            secondaryHotkeyKeys: '⇧ + A',
            secondaryCallback: () =>
                this.openRecurringReportModal('patientCount'),
            requiredBehaviors: ['treatPatientsBehavior'],
            errorMessage: 'Dieser Bereich behandelt keine Patienten',
            loading$: new BehaviorSubject<boolean>(false),
        },
        {
            key: 'transportProgressFull',
            name: 'Transportfortschritt',
            keywords: [
                'transport',
                'krankenhaus',
                'fortschritt',
                'status',
                'abtransport',
            ],
            details: 'für von hier verwaltete Bereiche',
            hotkeyKeys: 'B',
            callback: () => this.requestFullTransportProgress(),
            hasSecondaryAction: true,
            secondaryHotkeyKeys: '⇧ + B',
            secondaryCallback: () =>
                this.openRecurringReportModal(
                    'transportManagementTransferCounts'
                ),
            requiredBehaviors: ['managePatientTransportToHospitalBehavior'],
            errorMessage: 'Dieser Bereich verwaltet keine Transporte',
            loading$: new BehaviorSubject<boolean>(false),
        },
        {
            key: 'transportProgressRegion',
            name: 'Transportfortschritt',
            keywords: [
                'transport',
                'krankenhaus',
                'fortschritt',
                'status',
                'abtransport',
            ],
            details: 'für diesen Bereich',
            hotkeyKeys: 'C',
            callback: () => this.requestRegionTransportProgress(),
            hasSecondaryAction: true,
            secondaryHotkeyKeys: '⇧ + C',
            secondaryCallback: () =>
                this.openRecurringReportModal('singleRegionTransferCounts'),
            requiredBehaviors: ['transferToHospitalBehavior'],
            errorMessage: 'Dieser Bereich verwaltet keine Transporte',
            loading$: new BehaviorSubject<boolean>(false),
        },
        {
            key: 'vehicleCount',
            name: 'Anzahl Fahrzeuge',
            keywords: [
                'fahrzeug',
                'fahrzeuge',
                'zahl',
                'anzahl',
                'zahlen',
                'zählen',
                'menge',
            ],
            details: 'nach Typ',
            hotkeyKeys: 'D',
            callback: () => this.requestVehicleCount(),
            hasSecondaryAction: true,
            secondaryHotkeyKeys: '⇧ + D',
            secondaryCallback: () =>
                this.openRecurringReportModal('vehicleCount'),
            requiredBehaviors: [],
            loading$: new BehaviorSubject<boolean>(false),
        },
        {
            key: 'requiredResources',
            name: 'Benötigte Fahrzeuge',
            keywords: [
                'patient',
                'patienten',
                'zahl',
                'anzahl',
                'zahlen',
                'menge',
                'benötigt',
                'bedarf',
                'notwendig',
                'erfordert',
                'erforderlich',
            ],
            details: 'um alle Patienten in dieser PA zu behandeln',
            hotkeyKeys: 'E',
            callback: () => this.requestRequiredResources(),
            hasSecondaryAction: true,
            secondaryHotkeyKeys: '⇧ + E',
            secondaryCallback: () =>
                this.openRecurringReportModal('requiredResources'),
            requiredBehaviors: ['requestBehavior'],
            errorMessage:
                'Dieser Bereich benötigt keine Fahrzeuge für seine Arbeit',
            loading$: new BehaviorSubject<boolean>(false),
        },
        {
            key: 'treatmentStatus',
            name: 'Behandlungsstatus',
            keywords: [
                'behandlung',
                'patient',
                'patienten',
                'sichten',
                'zählen',
                'versorgung',
                'erstversorgung',
                'sicher',
                'sichergestellt',
                'status',
                'fortschritt',
                'zustand',
            ],
            details: '(Erstversorgung sichergestellt?)',
            hotkeyKeys: 'F',
            callback: () => this.requestTreatmentStatus(),
            hasSecondaryAction: true,
            secondaryHotkeyKeys: '⇧ + F',
            secondaryCallback: () =>
                this.openRecurringReportModal('treatmentStatus'),
            requiredBehaviors: ['treatPatientsBehavior'],
            errorMessage: 'Dieser Bereich behandelt keine Patienten',
            loading$: new BehaviorSubject<boolean>(false),
        },
        {
            key: 'vehicleOccupations',
            name: 'Nutzung der Fahrzeuge',
            keywords: [
                'fahrzeug',
                'fahrzeuge',
                'aufgabe',
                'aufgaben',
                'nutzung',
                'zweck',
                'genutzt',
                'benutzt',
            ],
            details:
                'für welche Aufgaben die verfügbaren Fahrzeuge gerade genutzt werden',
            hotkeyKeys: 'G',
            callback: () => this.requestVehicleOccupations(),
            hasSecondaryAction: true,
            secondaryHotkeyKeys: '⇧ + G',
            secondaryCallback: () =>
                this.openRecurringReportModal('vehicleOccupations'),
            requiredBehaviors: [],
            loading$: new BehaviorSubject<boolean>(false),
        },
        {
            key: 'transferConnections',
            name: 'Bekannte Standorte anderer Bereiche',
            keywords: [
                'transfer',
                'transport',
                'verbindung',
                'verbinden',
                'verbunden',
                'bekannt',
                'kennt',
                'nachbar',
                'erreichbar',
                'erreichen',
                'bereich',
                'bereiche',
                'abschnitt',
                'abschnitte',
            ],
            details:
                '(welche anderen Bereiche sind bekannt, sodass z.B. Fahrzeuge dorthin fahren können?)',
            hotkeyKeys: 'H',
            callback: () => this.requestTransferConnections(),
            hasSecondaryAction: true,
            secondaryHotkeyKeys: '⇧ + H',
            secondaryCallback: () =>
                this.openRecurringReportModal('transferConnections'),
            requiredBehaviors: [],
            loading$: new BehaviorSubject<boolean>(false),
        },
        {
            key: 'personnelCount',
            name: 'Anzahl Personal',
            keywords: [
                'personal',
                'personen',
                'zahl',
                'anzahl',
                'zahlen',
                'zählen',
                'menge',
            ],
            details: 'nach Typ',
            hotkeyKeys: 'I',
            callback: () => this.requestPersonnelCount(),
            hasSecondaryAction: true,
            secondaryHotkeyKeys: '⇧ + I',
            secondaryCallback: () =>
                this.openRecurringReportModal('personnelCount'),
            requiredBehaviors: [],
            loading$: new BehaviorSubject<boolean>(false),
        },
    ];
    reportBehaviorId$!: Observable<UUID | null>;

    ngOnInit() {
        this.clientId = selectStateSnapshot(selectOwnClientId, this.store)!;
    }

    ngOnChanges() {
        const behaviors$ = this.store.select(
            createSelectBehaviorStates(this.simulatedRegionId())
        );

        this.reportBehaviorId$ = behaviors$.pipe(
            map(
                (behaviors) =>
                    behaviors.find(
                        (behavior) => behavior.type === 'reportBehavior'
                    )?.id ?? null
            )
        );
    }

    public openRecurringReportModal(informationType: ReportableInformation) {
        this.informationTypeToEdit = informationType;

        this.detailsModal.open(
            'Automatischen Bericht bearbeiten',
            this.recurringReportEditor()
        );
    }

    public requestPatientCount() {
        this.requestSimpleReport('patientCount', 'patientCount');
    }

    public requestFullTransportProgress() {
        this.requestSimpleReport(
            'transportManagementTransferCounts',
            'transportProgressFull'
        );
    }

    public requestRegionTransportProgress() {
        this.requestSimpleReport(
            'singleRegionTransferCounts',
            'transportProgressRegion'
        );
    }

    public requestRequiredResources() {
        this.requestSimpleReport('requiredResources', 'requiredResources');
    }

    public requestVehicleCount() {
        this.requestSimpleReport('vehicleCount', 'vehicleCount');
    }

    public requestTreatmentStatus() {
        this.requestSimpleReport('treatmentStatus', 'treatmentStatus');
    }

    public requestVehicleOccupations() {
        this.requestSimpleReport('vehicleOccupations', 'vehicleOccupations');
    }

    public requestTransferConnections() {
        this.requestSimpleReport('transferConnections', 'transferConnections');
    }

    public requestPersonnelCount() {
        this.requestSimpleReport('personnelCount', 'personnelCount');
    }

    /**
     * Requests an information trough the report behavior
     * @param informationType The information to be requested
     */
    requestSimpleReport(informationType: ReportableInformation, key: string) {
        if (this.requestBlocked(key)) return;

        setLoadingState(this.informationInteractions, key, true);

        this.exerciseService.proposeAction({
            type: '[ReportBehavior] Create Report',
            simulatedRegionId: this.simulatedRegionId(),
            informationType,
            interfaceSignallerKey: makeInterfaceSignallerKey(
                this.clientId,
                key
            ),
        });
    }

    requestBlocked(key: string) {
        return (
            this.informationInteractions
                .find((information) => information.key === key)
                ?.loading$?.getValue() ?? false
        );
    }
}
