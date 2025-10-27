import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { MaterialTemplate } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectMaterialTemplate } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-material-template-display',
    templateUrl: './material-template-display.component.html',
    styleUrls: ['./material-template-display.component.scss'],
    standalone: false,
})
export class MaterialTemplateDisplayComponent implements OnChanges {
    @Input() materialTemplateType!: string;

    public materialTemplate$?: Observable<MaterialTemplate>;

    ngOnChanges() {
        this.materialTemplate$ = this.store.select(
            createSelectMaterialTemplate(this.materialTemplateType)
        );
    }

    constructor(private readonly store: Store<AppState>) {}
}
