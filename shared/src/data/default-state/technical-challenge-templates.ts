import type { TechnicalChallengeTemplate } from '../../models/technical-challenge/technical-challenge-template.js';
import type { UUID } from '../../utils/uuid.js';
import { getDefaultTechnicalChallengeTemplate } from './tmp-default-technical-challenge.js';
import { getBasementExplosionTechnicalChallenge } from './tmp-basementexplosion-technical-challenge.js';

export const defaultTechnicalChallengeTemplates: {
    [key in UUID]: TechnicalChallengeTemplate;
} = Object.fromEntries(
    [
        getDefaultTechnicalChallengeTemplate(),
        getBasementExplosionTechnicalChallenge(),
    ].map((t) => [t.id, t])
);
