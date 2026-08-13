import { Component, computed, input, linkedSignal, model } from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';

export enum TimeUnit {
    min = 'min',
    s = 's',
}

@Component({
    selector: 'app-time-input',
    imports: [FormsModule],
    templateUrl: './time-input.component.html',
})
export class TimeInputComponent implements FormValueControl<number> {
    readonly unit = input<TimeUnit>(TimeUnit.min);

    /**
     * Time input as ms
     */
    readonly value = model(0);
    readonly displayValue = linkedSignal(
        () => this.value() / this.timeConversionFactor(),
        {
            set: (displayValue) =>
                this.value.set(displayValue * this.timeConversionFactor()),
        }
    );

    readonly required = input<boolean>(false);
    readonly title = input<string>('');
    readonly unitDescription = computed<string>(() => this.unit());

    readonly timeConversionFactor = computed(() => {
        switch (this.unit()) {
            case TimeUnit.min:
                return 1000 * 60;
            case TimeUnit.s:
                return 1000;
        }
    });
}
