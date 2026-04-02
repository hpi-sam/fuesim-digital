import {
    Component,
    computed,
    inject,
    input,
    OnInit,
    Signal,
    signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import type { ChangeZIndexMapImageAction, UUID } from 'fuesim-digital-shared';
import { MapImage, Scoutable } from 'fuesim-digital-shared';
import { AppState } from '../../../state/app.state';
import { ExerciseService } from '../../../core/exercise.service';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
import {
    createSelectMapImage,
    createSelectScoutable,
} from '../../../state/application/selectors/exercise.selectors';
import { DisplayValidationComponent } from '../../validation/display-validation/display-validation.component';
import { ScoutableObjectNavItemComponent } from '../scoutable-object-nav-item/scoutable-object-nav-item.component';
import { FormsModule } from '@angular/forms';
import { ImageExistsValidatorDirective } from '../../validation/image-exists-validator.directive';
import { IntegerValidatorDirective } from '../../validation/integer-validator.directive';
import { AppSaveOnTypingDirective } from '../../directives/app-save-on-typing.directive';
import {
    NgbNav,
    NgbNavContent,
    NgbNavItem,
    NgbNavLink,
    NgbNavLinkBase,
    NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-map-images-details',
    templateUrl: './map-images-details.component.html',
    styleUrls: ['./map-images-details.component.scss'],
    imports: [
        DisplayValidationComponent,
        ScoutableObjectNavItemComponent,
        FormsModule,
        ImageExistsValidatorDirective,
        DisplayValidationComponent,
        IntegerValidatorDirective,
        AppSaveOnTypingDirective,
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbNavLinkBase,
        NgbNavContent,
        NgbNavOutlet,
    ],
})
export class MapImagesDetailsComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly mapImageId = input.required<UUID>();
    public readonly mapImage = computed(() => {
        return this.store.selectSignal(
            createSelectMapImage(this.mapImageId())
        )();
    });
    public readonly openScoutInfo = input<boolean>(false);
    activeId = signal<string>('properties');
    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);
    public url?: string;
    ngOnInit(): void {
        this.url = this.mapImage()!.image.url;
        if (this.openScoutInfo()) {
            this.activeId.set('scoutInfo');
        }
    }
    public saveUrl() {
        this.exerciseService.proposeAction({
            type: '[MapImage] Reconfigure Url',
            mapImageId: this.mapImageId(),
            newUrl: this.url!,
        });
    }
    public resizeImage(newHeight: number) {
        this.exerciseService.proposeAction({
            type: '[MapImage] Scale MapImage',
            mapImageId: this.mapImageId(),
            newHeight,
        });
    }
    public setLocked(newLocked: boolean) {
        this.exerciseService.proposeAction({
            type: '[MapImage] Set isLocked',
            mapImageId: this.mapImageId(),
            newLocked,
        });
    }

    public changeZIndex(mode: ChangeZIndexMapImageAction['mode']) {
        this.exerciseService.proposeAction({
            type: '[MapImage] Change zIndex',
            mapImageId: this.mapImageId(),
            mode,
        });
    }
}
