import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    PersonnelTemplate,
    PersonnelType,
} from 'digital-fuesim-manv-shared';
import { personnelTypeNames } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import { createSelectPersonnelTemplate } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-personnel-template-display',
    templateUrl: './personnel-template-display.component.html',
    styleUrls: ['./personnel-template-display.component.scss'],
    standalone: false,
})
export class PersonnelTemplateDisplayComponent implements OnChanges {
    @Input() personnelTemplateType!: PersonnelType;

    public personnelTemplate$?: Observable<PersonnelTemplate>;

    ngOnChanges() {
        this.personnelTemplate$ = this.store.select(
            createSelectPersonnelTemplate(this.personnelTemplateType)
        );
    }

    constructor(private readonly store: Store<AppState>) {}

    public get personnelTypeNames() {
        return personnelTypeNames;
    }
}
