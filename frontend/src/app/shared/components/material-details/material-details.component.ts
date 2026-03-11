import { input, OnInit, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Material, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../state/app.state';
import { createSelectMaterial } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-material-details',
    templateUrl: './material-details.component.html',
    styleUrls: ['./material-details.component.scss'],
    standalone: false,
})
export class MaterialDetailsComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly materialId = input<UUID>('');

    public material$?: Observable<Material>;

    ngOnInit(): void {
        this.material$ = this.store.select(
            createSelectMaterial(this.materialId())
        );
    }
}
