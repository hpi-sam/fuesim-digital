import {
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnDestroy,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import type { Hotkey, HotkeyState } from '../../services/hotkeys.service.js';

@Component({
    selector: 'app-hotkey-indicator',
    templateUrl: './hotkey-indicator.component.html',
    styleUrls: ['./hotkey-indicator.component.scss'],
    standalone: false,
})
export class HotkeyIndicatorComponent implements OnChanges, OnDestroy {
    @Input() hotkey: Hotkey | null = null;
    @Input() keys: string | null = null;

    public state: HotkeyState = 'overridden';

    private readonly updateOrDestroy$ = new Subject<void>();

    constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

    ngOnChanges(): void {
        this.updateOrDestroy$.next();

        this.hotkey?.state$
            .pipe(takeUntil(this.updateOrDestroy$))
            .subscribe((state) => {
                this.state = state;
                this.changeDetectorRef.detectChanges();
            });
    }

    ngOnDestroy(): void {
        this.updateOrDestroy$.next();
    }
}
