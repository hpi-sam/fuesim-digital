import type { UUID } from 'fuesim-digital-shared';
import type { Store } from '@ngrx/store';
import type { AppState } from '../../../../../../state/app.state';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { selectConfiguration } from '../../../../../../state/application/selectors/exercise.selectors';

export function determineMarkedElements(
    store: Store<AppState>,
    ownId: UUID,
    otherIds: UUID[]
) {
    const highlightRelatedElements = selectStateSnapshot(
        selectConfiguration,
        store
    ).highlightRelatedElements;

    const trainer = [ownId];
    const participant = [ownId];

    if (highlightRelatedElements === 'trainersOnly') trainer.push(...otherIds);
    else if (highlightRelatedElements === 'all') {
        trainer.push(...otherIds);
        participant.push(...otherIds);
    }

    return { trainer, participant };
}
