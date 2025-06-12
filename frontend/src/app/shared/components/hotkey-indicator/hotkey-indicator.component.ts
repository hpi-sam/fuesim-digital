import {
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import type { Hotkey } from '../../services/hotkeys.service';

@Component({
    selector: 'app-hotkey-indicator',
    templateUrl: './hotkey-indicator.component.html',
    styleUrls: ['./hotkey-indicator.component.scss'],
    standalone: false,
})
export class HotkeyIndicatorComponent implements OnInit, OnDestroy {
    @Input() hotkey: Hotkey | null = null;
    @Input() keys: string | null = null;

    public enabled = false;

    private readonly destroy$ = new Subject<void>();

    constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.hotkey?.enabled
            .pipe(takeUntil(this.destroy$))
            .subscribe((enabled) => {
                this.enabled = enabled;
                this.changeDetectorRef.detectChanges();
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
    }
}
