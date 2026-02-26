import type { OnChanges } from '@angular/core';
import {
    Component,
    TemplateRef,
    inject,
    input,
    viewChild,
} from '@angular/core';
import type {
    ExerciseSimulationBehaviorType,
    UUID,
} from 'fuesim-digital-shared';
import { isInSpecificSimulatedRegion } from 'fuesim-digital-shared';
import { Store, createSelector } from '@ngrx/store';
import { map, type Observable } from 'rxjs';
import { SignallerModalDetailsService } from '../details-modal/signaller-modal-details.service';
import type { InterfaceSignallerInteraction } from '../signaller-modal-interactions/signaller-modal-interactions.component';
import type { AppState } from '../../../../../../../state/app.state';
import {
    selectTransferPoints,
    createSelectBehaviorStatesByType,
} from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-signaller-modal-region-commands',
    templateUrl: './signaller-modal-region-commands.component.html',
    styleUrls: ['./signaller-modal-region-commands.component.scss'],
    standalone: false,
})
export class SignallerModalRegionCommandsComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly detailsModal = inject(SignallerModalDetailsService);

    readonly simulatedRegionId = input.required<UUID>();

    readonly transferConnectionsEditor = viewChild.required<TemplateRef<any>>(
        'transferConnectionsEditor'
    );
    readonly transferTraysEditor = viewChild.required<TemplateRef<any>>(
        'transferTraysEditor'
    );
    readonly transportOfCategoryEditor = viewChild.required<TemplateRef<any>>(
        'transportOfCategoryEditor'
    );
    readonly provideVehiclesEditor = viewChild.required<TemplateRef<any>>(
        'provideVehiclesEditor'
    );
    readonly requestTargetEditor = viewChild.required<TemplateRef<any>>(
        'requestTargetEditor'
    );
    readonly transportRequestTargetEditor = viewChild.required<
        TemplateRef<any>
    >('transportRequestTargetEditor');

    ownTransferPointId$!: Observable<UUID>;
    manageTransportBehaviorId$!: Observable<UUID | null>;
    transferVehiclesBehaviorId$!: Observable<UUID | null>;
    requestBehaviorId$!: Observable<UUID | null>;

    commandInteractions: InterfaceSignallerInteraction[] = [
        {
            key: 'editTransferConnections',
            name: 'Standort eines Bereichs',
            details: '(macht den Standort eines anderen Bereichs bekannt)',
            keywords: [
                'bereich',
                'bereiche',
                'abschnitt',
                'abschnitte',
                'ort',
                'lage',
                'verknüpfung',
                'verbindung',
                'transfer',
                'transport',
                'kennen',
                'bekannt',
            ],
            hotkeyKeys: '1',
            callback: () => this.editTransferConnections(),
            hasSecondaryAction: false,
            requiredBehaviors: [],
        },
        {
            key: 'editTransferPatientTrays',
            name: 'PAs für Abtransport festlegen',
            details:
                '(aus welchen Patientenablagen sollen Patienten ins Krankenhaus gebracht werden)',
            keywords: [
                'ablage',
                'ablagen',
                'patientenablage',
                'patientenablagen',
                'transport',
                'transfer',
                'krankenhaus',
                'auswahl',
                'abtransport',
            ],
            hotkeyKeys: '2',
            callback: () => this.editTransferPatientTrays(),
            hasSecondaryAction: false,
            requiredBehaviors: ['managePatientTransportToHospitalBehavior'],
            errorMessage: 'Dieser Bereich verwaltet keine Transporte',
        },
        {
            key: 'startTransportOfCategory',
            name: 'Patienten abtransportieren',
            details:
                '(Transport starten, stoppen oder Sichtungskategorien zum Abtransport festlegen)',
            keywords: [
                'start',
                'starten',
                'transport',
                'abtransport',
                'transfer',
                'krankenhaus',
            ],
            hotkeyKeys: '3',
            callback: () => this.startTransportOfCategory(),
            hasSecondaryAction: false,
            requiredBehaviors: ['managePatientTransportToHospitalBehavior'],
            errorMessage: 'Dieser Bereich verwaltet keine Transporte',
        },
        {
            key: 'provideVehicles',
            name: 'Fahrzeuge entsenden',
            details: '(entsendet Fahrzeuge in einen anderen Bereich)',
            keywords: [
                'fahrzeug',
                'fahrzeuge',
                'senden',
                'versenden',
                'entsenden',
                'bereitstellen',
                'bereitstellung',
                'abrufen',
                'transfer',
            ],
            hotkeyKeys: '4',
            callback: () => this.provideVehicles(),
            hasSecondaryAction: false,
            requiredBehaviors: ['transferBehavior'],
            errorMessage: 'Dieser Bereich kann keine Fahrzeuge bereitstellen',
        },
        {
            key: 'setRequestTarget',
            name: 'Ziel für Fahrzeuganfragen (von PA/B-Raum) festlegen',
            details:
                '(ob Fahrzeuge bei Einsatzleitung oder B-Raum angefragt werden sollen)',
            keywords: [
                'ziel',
                'anfrage',
                'anfragen',
                'bereitstellen',
                'bereitstellung',
                'raum',
                'b-raum',
                'b raum',
                'bereitstellungsraum',
                'einsatzleitung',
                'leitung',
            ],
            hotkeyKeys: '5',
            callback: () => this.setRequestTarget(),
            hasSecondaryAction: false,
            requiredBehaviors: ['requestBehavior'],
            errorMessage: 'Dieser Bereich fragt keine Fahrzeuge an',
        },
        {
            key: 'setTransportRequestTarget',
            name: 'Ziel für Fahrzeuganfragen (für Transport) festlegen',
            details:
                '(von welchem B-Raum Fahrzeuge für den Patiententransport abgerufen werden sollen)',
            keywords: [
                'ziel',
                'anfrage',
                'anfragen',
                'bereitstellen',
                'bereitstellung',
                'raum',
                'b-raum',
                'b raum',
                'bereitstellungsraum',
                'transport',
                'organisation',
                'transportorganisation',
            ],
            hotkeyKeys: '6',
            callback: () => this.setTransportRequestTarget(),
            hasSecondaryAction: false,
            requiredBehaviors: ['managePatientTransportToHospitalBehavior'],
            errorMessage: 'Dieser Bereich verwaltet keine Transporte',
        },
    ];

    ngOnChanges() {
        this.ownTransferPointId$ = this.store.select(
            createSelector(
                selectTransferPoints,
                (transferPoints) =>
                    Object.values(transferPoints).find((transferPoint) =>
                        isInSpecificSimulatedRegion(
                            transferPoint,
                            this.simulatedRegionId()
                        )
                    )!.id
            )
        );

        this.manageTransportBehaviorId$ = this.selectBehaviorId(
            'managePatientTransportToHospitalBehavior'
        );

        this.transferVehiclesBehaviorId$ =
            this.selectBehaviorId('transferBehavior');

        this.requestBehaviorId$ = this.selectBehaviorId('requestBehavior');
    }

    selectBehaviorId(type: ExerciseSimulationBehaviorType) {
        return this.store
            .select(
                createSelectBehaviorStatesByType(this.simulatedRegionId(), type)
            )
            .pipe(map((behaviorStates) => behaviorStates[0]?.id ?? null));
    }

    editTransferConnections() {
        this.detailsModal.open(
            'Transferverbindungen bearbeiten',
            this.transferConnectionsEditor()
        );
    }

    editTransferPatientTrays() {
        this.detailsModal.open(
            'PAs für Abtransport festlegen',
            this.transferTraysEditor()
        );
    }

    startTransportOfCategory() {
        this.detailsModal.open(
            'Abtransport starten/stoppen/ändern',
            this.transportOfCategoryEditor()
        );
    }

    provideVehicles() {
        this.detailsModal.open(
            'Fahrzeuge bereitstellen',
            this.provideVehiclesEditor()
        );
    }

    setRequestTarget() {
        this.detailsModal.open(
            'Ziel für Fahrzeuganfragen (PA/B-Raum)',
            this.requestTargetEditor()
        );
    }

    setTransportRequestTarget() {
        this.detailsModal.open(
            'Ziel für Fahrzeuganfragen (Transport)',
            this.transportRequestTargetEditor()
        );
    }
}
