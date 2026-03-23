import {
    Component,
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

@Component({
    selector: 'app-map-images-details',
    templateUrl: './map-images-details.component.html',
    styleUrls: ['./map-images-details.component.scss'],
    standalone: false,
})
export class MapImagesDetailsComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly mapImageId = input.required<UUID>();
    public readonly test!: Signal<string>;
    public readonly mapImage = signal<MapImage | null>(null);
    public readonly openScoutInfo = input<boolean>();
    activeId!: string;
    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);
    public url?: string;

    readonly scoutable = signal<Scoutable | null>(null);
    ngOnInit(): void {
        this.mapImage.set(
            this.store.selectSignal(createSelectMapImage(this.mapImageId()))()
        );
        if (this.mapImage()!.scoutableId) {
            this.scoutable.set(
                this.store.selectSignal(
                    createSelectScoutable(this.mapImage()!.scoutableId!)
                )()
            );
        }
        this.url = this.mapImage()!.image.url;
        if (this.openScoutInfo()) {
            this.activeId = 'scoutInfo';
        } else {
            this.activeId = 'Properties';
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
