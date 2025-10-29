import type { ExerciseState } from '../../state.js';

export function getPersonnelTypes(state: ExerciseState) {
    return Object.keys(state.personnelTemplates);
}
