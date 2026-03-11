import type { OnChanges } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Viewport, UUID } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import type { AppState } from '../../../state/app.state';
import { createSelectViewport } from '../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-viewport-name',
    templateUrl: './viewport-name.component.html',
    styleUrls: ['./viewport-name.component.scss'],
    standalone: false,
})
export class ViewportNameComponent implements OnChanges {
    private readonly store = inject<Store<AppState>>(Store);

    readonly viewportId = input.required<UUID>();

    public viewport$?: Observable<Viewport>;

    ngOnChanges() {
        this.viewport$ = this.store.select(
            createSelectViewport(this.viewportId())
        );
    }
}
