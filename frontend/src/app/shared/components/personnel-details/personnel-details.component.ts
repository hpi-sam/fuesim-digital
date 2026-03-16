import { input, OnInit, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Personnel, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../state/app.state';
import { createSelectPersonnel } from '../../../state/application/selectors/exercise.selectors';
import { CaterCapacityComponent } from '../cater-capacity/cater-capacity.component';
import { CaterCapacityCountPipe } from '../../pipes/cater-capacity-count.pipe';

@Component({
    selector: 'app-personnel-details',
    templateUrl: './personnel-details.component.html',
    styleUrls: ['./personnel-details.component.scss'],
    imports: [CaterCapacityComponent, AsyncPipe, CaterCapacityCountPipe],
})
export class PersonnelDetailsComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly personnelId = input<UUID>('');

    public personnel$?: Observable<Personnel>;

    ngOnInit(): void {
        this.personnel$ = this.store.select(
            createSelectPersonnel(this.personnelId())
        );
    }
}
