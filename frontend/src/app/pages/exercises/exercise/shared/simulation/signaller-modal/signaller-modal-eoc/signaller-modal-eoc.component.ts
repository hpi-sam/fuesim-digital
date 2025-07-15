import { Component, TemplateRef, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Hotkey } from 'src/app/shared/services/hotkeys.service';
import { Store } from '@ngrx/store';
import type { AppState } from 'src/app/state/app.state';
import type { InterfaceSignallerInteraction } from '../signaller-modal-interactions/signaller-modal-interactions.component';
import { SignallerModalDetailsService } from '../details-modal/signaller-modal-details.service';

@Component({
    selector: 'app-signaller-modal-eoc',
    templateUrl: './signaller-modal-eoc.component.html',
    styleUrls: ['./signaller-modal-eoc.component.scss'],
    standalone: false,
})
export class SignallerModalEocComponent {
    @ViewChild('alarmGroupsSentDisplay')
    alarmGroupsSentDisplay!: TemplateRef<any>;
    @ViewChild('arrivingVehiclesDisplay')
    arrivingVehiclesDisplay!: TemplateRef<any>;
    @ViewChild('sendAlarmGroupEditor')
    sendAlarmGroupEditor!: TemplateRef<any>;

    informationInteractions: InterfaceSignallerInteraction[] = [
        {
            key: 'alarmGroupsSent',
            name: 'Alarmierte Alarmgruppen',
            details: 'Fragt ab, welche Alarmgruppen bereits alarmiert wurden',
            keywords: [
                'alarm',
                'gruppe',
                'gruppen',
                'alarmgruppe',
                'alarmgruppen',
                'alarmiert',
                'ausgelöst',
                'gestartet',
                'gesendet',
            ],
            hotkey: new Hotkey('A', false, () => this.requestAlarmGroupsSent()),
            requiredBehaviors: [],
            loading$: new BehaviorSubject<boolean>(false),
        },
        {
            key: 'arrivingVehicles',
            name: 'Fahrzeuge auf Anfahrt',
            details:
                'Fragt ab, wie viele und welche Fahrzeuge aktuell auf Anfahrt sind und wie lange sie brauchen',
            keywords: [
                'fahrzeug',
                'fahrzeuge',
                'fahren',
                'anfahrt',
                'kommen',
                'ankommen',
                'anfahren',
                'ankunft',
                'zeit',
                'dauer',
                'zahl',
                'anzahl',
                'menge',
            ],
            hotkey: new Hotkey('B', false, () =>
                this.requestArrivingVehicles()
            ),
            requiredBehaviors: [],
            loading$: new BehaviorSubject<boolean>(false),
        },
    ];

    commandInteractions: InterfaceSignallerInteraction[] = [
        {
            key: 'sendAlarmGroup',
            name: 'Alarmgruppe alarmieren',
            details: 'Erhöht die Alarmstufe durch Senden weiterer Alarmgruppen',
            keywords: [
                'alarm',
                'gruppe',
                'gruppen',
                'alarmgruppe',
                'alarmgruppen',
                'alarmieren',
                'auslösen',
                'starten',
                'senden',
                'erhöhen',
            ],
            hotkey: new Hotkey('1', false, () => this.sendAlarmGroup()),
            requiredBehaviors: [],
            loading$: new BehaviorSubject<boolean>(false),
        },
    ];

    constructor(
        private readonly store: Store<AppState>,
        private readonly detailsModal: SignallerModalDetailsService
    ) {}

    requestAlarmGroupsSent() {
        this.detailsModal.open(
            'Bereit alarmierte Alarmgruppen',
            this.alarmGroupsSentDisplay,
            false
        );
    }

    requestArrivingVehicles() {
        this.detailsModal.open(
            'Fahrzeuge auf Anfahrt',
            this.arrivingVehiclesDisplay,
            false
        );
    }

    sendAlarmGroup() {
        this.detailsModal.open(
            'Alarmgruppe alarmieren',
            this.sendAlarmGroupEditor
        );
    }
}
