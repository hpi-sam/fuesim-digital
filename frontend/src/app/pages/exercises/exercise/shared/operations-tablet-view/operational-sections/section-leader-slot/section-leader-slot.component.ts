import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Vehicle } from 'digital-fuesim-manv-shared';
import { MessageService } from '../../../../../../../core/messages/message.service';

@Component({
    selector: 'app-section-leader-slot',
    standalone: false,
    templateUrl: './section-leader-slot.component.html',
    styleUrl: './section-leader-slot.component.scss',
})
export class SectionLeaderSlotComponent {

    constructor(
        private readonly messageService: MessageService
    ) { }

    @Input()
    public vehicle?: Vehicle | null = null;

    /**
     * Emits the ID of the vehicle that was assigned to this slot
     */
    @Output()
    public vehicleAssigned = new EventEmitter<string>();

    public onlySigleItemDropPredicate() {
        // we can only drop if there is no vehicle assigned yet
        return this.vehicle == null;
    }

    public onVehicleDropped(event: CdkDragDrop<string[]>) {
        if (event.item.data === this.vehicle?.id) return;

        if (this.vehicle != null) {
            this.messageService.postMessage(
                {
                    color: 'warning',
                    title: 'Fahrzeugzuweisung fehlgeschlagen',
                    body: 'Es ist bereits ein Fahrzeug als Abschnittsleiter zugewiesen.',
                }
            );
            return;
        }

        this.vehicleAssigned.emit(event.item.data);
    }
}
