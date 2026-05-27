import { Component, computed, input } from '@angular/core';
import { formatNumber } from '@angular/common';

@Component({
    selector: 'app-progress-bar',
    imports: [],
    templateUrl: './progress-bar.component.html',
    styleUrl: './progress-bar.component.scss',
})
export class ProgressBarComponent {
    readonly paused = input.required<boolean>();
    readonly current = input.required<number>();
    readonly max = input.required<number>();
    readonly unit = input<string>('s');

    readonly progressPercentage = computed<number>(
        () => (this.current() / this.max()) * 100
    );
    readonly finished = computed<boolean>(() => this.current() >= this.max());
    protected readonly formatNumber = formatNumber;
}
