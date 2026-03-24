import {
    afterEveryRender,
    Component,
    computed,
    ElementRef,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Vehicle } from 'fuesim-digital-shared';
import { VehicleTagComponent } from '../vehicle-tag/vehicle-tag.component';

@Component({
    selector: 'app-vehicles-zone',
    templateUrl: './vehicles-zone.component.html',
    styleUrl: './vehicles-zone.component.scss',
    imports: [VehicleTagComponent, CdkDropList, CdkDrag],
})
export class VehiclesZoneComponent {
    public readonly vehicles = input<Vehicle[]>();
    public readonly vehicleDropped = output<string>();

    public readonly mode = input<'x-scroll' | 'y-scroll'>('x-scroll');
    public readonly isX = computed(() => this.mode() === 'x-scroll');
    public readonly isY = computed(() => this.mode() === 'y-scroll');

    public readonly vehicleZoneEl = computed(
        () => this.vehicleZone()?.nativeElement
    );
    public readonly isScrollable = signal<boolean>(false);
    public readonly scrollAmount = computed(() => {
        if (this.isX()) {
            return (this.vehicleZoneEl()?.clientWidth ?? 0) / 2;
        }
        return (this.vehicleZoneEl()?.clientHeight ?? 0) / 2;
    });

    constructor() {
        afterEveryRender(() => {
            this.checkScrollable();
        });
    }

    public readonly vehicleZone =
        viewChild<ElementRef<HTMLElement>>('vehicleZone');

    public scroll(amount: number) {
        const scroll: ScrollToOptions = {
            behavior: 'smooth',
            [this.isX() ? 'left' : 'top']: amount,
        };
        this.vehicleZoneEl()?.scrollBy(scroll);
    }

    private checkScrollable() {
        const el = this.vehicleZoneEl();
        if (!el) return;

        this.isScrollable.set(
            this.isX()
                ? el.scrollWidth > el.clientWidth
                : el.scrollHeight > el.clientHeight
        );
    }
}
