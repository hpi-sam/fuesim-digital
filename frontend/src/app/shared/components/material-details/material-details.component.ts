import { input, OnInit, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Material, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../state/app.state';
import { createSelectMaterial } from '../../../state/application/selectors/exercise.selectors';
import { CaterCapacityComponent } from '../cater-capacity/cater-capacity.component';
import { CaterCapacityCountPipe } from '../../pipes/cater-capacity-count.pipe';

@Component({
    selector: 'app-material-details',
    templateUrl: './material-details.component.html',
    styleUrls: ['./material-details.component.scss'],
    imports: [CaterCapacityComponent, AsyncPipe, CaterCapacityCountPipe],
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
