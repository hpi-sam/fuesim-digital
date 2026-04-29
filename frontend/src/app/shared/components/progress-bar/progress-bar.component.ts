import { Component, computed, input } from '@angular/core';

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

    readonly progressPercentage = computed<number>(
        () => (this.current() / this.max()) * 100
    );
    readonly finished = computed<boolean>(() => this.current() >= this.max());
}
