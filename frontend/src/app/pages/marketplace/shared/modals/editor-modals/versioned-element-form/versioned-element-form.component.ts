import {
    Component,
    computed,
    Injector,
    input,
    output,
    ChangeDetectionStrategy,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { getMarketplaceElementByType } from 'fuesim-digital-shared';
import {
    FormOutputInjectionToken,
    VersionedElementModalData,
} from '../base-versioned-element-submodal';
import { marketplaceComponentDefinitions } from '../../../definitions';

@Component({
    selector: 'app-versioned-element-form',
    templateUrl: './versioned-element-form.component.html',
    styleUrl: './versioned-element-form.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgComponentOutlet],
})
export class VersionedElementFormComponent {
    public readonly data = input.required<VersionedElementModalData<any>>();
    public readonly btnText = input.required<string>();
    public readonly disabled = input<boolean>(false);

    public readonly dataSubmit = output<any>();
    public readonly discardChanges = output();

    public readonly formComponent = computed(
        () =>
            marketplaceComponentDefinitions[this.data().type]
                .elementFormComponent
    );

    public readonly formComponentInput = computed(() => ({
        data: this.data(),
        btnText: this.generateButtonText(),
        disabled: this.disabled(),
    }));

    public readonly formInjector = Injector.create({
        providers: [
            {
                provide: FormOutputInjectionToken,
                useValue: {
                    dataSubmit: (data: any) => this.dataSubmit.emit(data),
                    discardChanges: () => this.discardChanges.emit(),
                },
            },
        ],
    });

    public generateButtonText() {
        const type = this.data().type;
        return `${getMarketplaceElementByType(type).naming.singular} speichern`;
    }
}
