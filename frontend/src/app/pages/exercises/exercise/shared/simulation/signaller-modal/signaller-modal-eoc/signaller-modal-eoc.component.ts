import { Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { InterfaceSignallerInteraction } from '../signaller-modal-interactions/signaller-modal-interactions.component';
import { SignallerModalDetailsService } from '../details-modal/signaller-modal-details.service';

@Component({
    selector: 'app-signaller-modal-eoc',
    templateUrl: './signaller-modal-eoc.component.html',
    styleUrls: ['./signaller-modal-eoc.component.scss'],
    standalone: false,
})
export class SignallerModalEocComponent {
    private readonly detailsModal = inject(SignallerModalDetailsService);

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
            hotkeyKeys: 'A',
            callback: () => this.requestAlarmGroupsSent(),
            hasSecondaryAction: false,
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
            hotkeyKeys: 'B',
            callback: () => this.requestArrivingVehicles(),
            hasSecondaryAction: false,
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
            hotkeyKeys: '1',
            callback: () => this.sendAlarmGroup(),
            hasSecondaryAction: false,
            requiredBehaviors: [],
            loading$: new BehaviorSubject<boolean>(false),
        },
    ];

    requestAlarmGroupsSent() {
        this.detailsModal.open(
            'Bereit alarmierte Alarmgruppen',
            this.alarmGroupsSentDisplay
        );
    }

    requestArrivingVehicles() {
        this.detailsModal.open(
            'Fahrzeuge auf Anfahrt',
            this.arrivingVehiclesDisplay
        );
    }

    sendAlarmGroup() {
        this.detailsModal.open(
            'Alarmgruppe alarmieren',
            this.sendAlarmGroupEditor
        );
    }
}
