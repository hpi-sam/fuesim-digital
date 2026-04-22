import { OnInit, Component, inject, Signal } from '@angular/core';
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { PopupService } from '../../utility/popup.service';
import { TechnicalChallengeDetailsComponent } from '../../../../../../../shared/components/technical-challenge-details/technical-challenge-details.component';
import { AppState } from '../../../../../../../state/app.state';
import { createSelectTechnicalChallenge } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-technical-challenge-popup',
    templateUrl: './technical-challenge-popup.component.html',
    styleUrls: ['./technical-challenge-popup.component.scss'],
    imports: [TechnicalChallengeDetailsComponent],
})
export class TechnicalChallengePopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly popupService = inject(PopupService);

    // Set via popup context before OnInit
    public technicalChallengeId!: TechnicalChallengeId;

    // eslint-disable-next-line
    public technicalChallenge!: Signal<TechnicalChallenge>;

    ngOnInit(): void {
        this.technicalChallenge = this.store.selectSignal(
            createSelectTechnicalChallenge(this.technicalChallengeId)
        );
    }

    public closePopup() {
        this.popupService.dismissPopup();
    }
}
