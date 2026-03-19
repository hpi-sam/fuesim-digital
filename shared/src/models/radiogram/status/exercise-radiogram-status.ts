import { z } from 'zod';
import { radiogramAcceptedStatus } from './radiogram-accepted-status.js';
import { radiogramDoneStatus } from './radiogram-done-status.js';
import { radiogramUnpublishedStatus } from './radiogram-unpublished-status.js';
import { radiogramUnreadStatus } from './radiogram-unread-status.js';

export const exerciseRadiogramStatusSchema = z.discriminatedUnion('type', [
    radiogramAcceptedStatus,
    radiogramDoneStatus,
    radiogramUnreadStatus,
    radiogramUnpublishedStatus,
]);

export type ExerciseRadiogramStatus = z.infer<
    typeof exerciseRadiogramStatusSchema
>;

export const radiogramStatusTypeToGermanDictionary: {
    [Key in ExerciseRadiogramStatus['type']]: string;
} = {
    acceptedRadiogramStatus: 'angenommen',
    doneRadiogramStatus: 'durchgesagt',
    unreadRadiogramStatus: 'veröffentlicht',
    unpublishedRadiogramStatus: 'noch nicht veröffentlicht',
};
