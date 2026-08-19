import { output, Component, input } from '@angular/core';

@Component({
    selector: 'app-custom-timer-progress-bar',
    templateUrl: './custom-timer-progress-bar.component.html',
    styleUrls: ['./custom-timer-progress-bar.component.scss'],
})
export class CustomTimerProgressBarComponent {
    readonly timeout = input.required<number>();
    readonly paused = input.required<boolean>();
    readonly color = input<'danger' | 'info' | 'success' | 'warning'>();

    readonly destroyed = output();
}
