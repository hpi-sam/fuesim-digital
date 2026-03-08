import {
    trigger,
    style,
    animate,
    state,
    transition,
} from '@angular/animations';
import type { OnChanges, OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReplaySubject, Subject, delay, switchMap, takeUntil, tap } from 'rxjs';
import { CustomTimer } from '../../../core/messages/custom-timer';
import { SimpleChangesGeneric } from '../../../shared/types/simple-changes-generic';

@Component({
    selector: 'app-custom-timer-progress-bar',
    templateUrl: './custom-timer-progress-bar.component.html',
    styleUrls: ['./custom-timer-progress-bar.component.scss'],
    // eslint-disable-next-line @angular-eslint/component-max-inline-declarations
    animations: [
        trigger('addProgress', [
            state('playing', style({ width: '100%' })),
            state(
                'stopping',
                style({
                    // maybe the special value '!' would do so too - but this is safer
                    width: '{{ startWidth }}%',
                    // TODO: would be animated to from (stopping => playing)
                    // opacity: '50%',
                }),
                {
                    params: {
                        startWidth: '',
                    },
                }
            ),
            transition(
                '* => playing',
                animate('{{ transitionDuration }}ms linear'),
                {
                    params: {
                        transitionDuration: 10000,
                    },
                }
            ),
        ]),
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class CustomTimerProgressBarComponent implements OnChanges, OnDestroy {
    @Input() timer!: CustomTimer;
    @Input() color?: 'danger' | 'info' | 'success' | 'warning';

    private readonly destroyed$ = new ReplaySubject<void>(1);
    private readonly timer$ = new Subject<CustomTimer>();

    public readonly animationParams$ = new ReplaySubject<
        | {
              value: 'playing';
              params: {
                  transitionDuration: number;
              };
          }
        | {
              value: 'stopping';
              params: {
                  startWidth: number;
              };
          }
        | undefined
    >(1);

    constructor() {
        // ngOnInit would be after first OnChanges
        this.timer$
            .pipe(
                tap(() => {
                    this.animationParams$.next(undefined);
                }),
                switchMap((timer) => timer.state$),
                // async to first set the progressbar to 'width: 0' so that the animation is played correctly from the start on
                delay(0),
                takeUntil(this.destroyed$)
            )
            .subscribe((timerState) => {
                switch (timerState) {
                    case 'start':
                        {
                            let transitionDuration = this.timer.getTimeLeft();
                            if (transitionDuration < 0) {
                                transitionDuration = 0;
                            }
                            this.animationParams$.next({
                                value: 'playing',
                                params: {
                                    transitionDuration,
                                },
                            });
                        }
                        break;
                    case 'stop':
                        this.animationParams$.next({
                            value: 'stopping',
                            params: {
                                startWidth:
                                    // percent
                                    100 *
                                    (1 -
                                        this.timer.getTimeLeft() /
                                            this.timer.time),
                            },
                        });
                        break;
                }
            });
    }

    ngOnChanges(changes: SimpleChangesGeneric<this>) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (changes.timer) {
            this.animationParams$.next(undefined);
            this.timer$.next(this.timer);
        }
    }

    ngOnDestroy() {
        this.destroyed$.next(undefined);
    }
}
