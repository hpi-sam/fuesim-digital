export interface ExerciseKeys {
    readonly participantKey: string;
    readonly trainerKey: string;
}

export interface ExerciseAccessIds {
    readonly participantId: string;
    readonly trainerId: string;
}

export interface UserDataResponse {
    user: /* logged in */
    | {
              readonly id: string;
              readonly display_name: string;
              readonly username: string;
          }
        /* not logged in */
        | null
        /* no data yet */
        | undefined;
    expired?: boolean;
}

export interface AuthQueryParams {
    logoutstatus?: 'loggedout' | 'nosessionfound' | 'sessionexpired';
    loginfailure?: string;
    loginsuccess?: boolean;
}
