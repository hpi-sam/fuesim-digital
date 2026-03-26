import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject, input, output } from '@angular/core';
import { type Vehicle } from 'fuesim-digital-shared';
import { VehicleTagComponent } from '../vehicle-tag/vehicle-tag.component';
import { MessageService } from '../../../../../../../core/messages/message.service';

@Component({
    selector: 'app-section-leader-slot',
    templateUrl: './section-leader-slot.component.html',
    styleUrl: './section-leader-slot.component.scss',
    imports: [VehicleTagComponent, CdkDropList],
})
export class SectionLeaderSlotComponent {
    private readonly messageService = inject(MessageService);

    public readonly vehicle = input<Vehicle | null>();

    public readonly innerTitle = input<string>('Abschnittsleitung');

    /**
     * Emits the ID of the vehicle that was assigned to this slot
     */
    public readonly vehicleAssigned = output<string>();

    public onlySingleItemDropPredicate() {
        // we can only drop if there is no vehicle assigned yet
        return this.vehicle() === null;
    }

    public onVehicleDropped(event: CdkDragDrop<string[]>) {
        if (event.item.data === this.vehicle()?.id) return;

        if (this.vehicle() !== null) {
            this.messageService.postMessage({
                color: 'warning',
                title: 'Fahrzeugzuweisung fehlgeschlagen',
                body: 'Es ist bereits ein Fahrzeug als Abschnittsleiter zugewiesen.',
            });
            return;
        }

        this.vehicleAssigned.emit(event.item.data);
    }
}
