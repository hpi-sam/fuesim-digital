import {
    ChangeDetectorRef,
    Component,
    OnChanges,
    OnDestroy,
    inject,
    input,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import type { Hotkey, HotkeyState } from '../../services/hotkeys.service';

@Component({
    selector: 'app-hotkey-indicator',
    templateUrl: './hotkey-indicator.component.html',
    styleUrls: ['./hotkey-indicator.component.scss'],
    standalone: false,
})
export class HotkeyIndicatorComponent implements OnChanges, OnDestroy {
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    readonly hotkey = input<Hotkey | null>(null);
    readonly keys = input<string | null>(null);

    public state: HotkeyState = 'overridden';

    private readonly updateOrDestroy$ = new Subject<void>();

    ngOnChanges(): void {
        this.updateOrDestroy$.next();

        this.hotkey()
            ?.state$.pipe(takeUntil(this.updateOrDestroy$))
            .subscribe((state) => {
                this.state = state;
                this.changeDetectorRef.detectChanges();
            });
    }

    ngOnDestroy(): void {
        this.updateOrDestroy$.next();
    }
}
