import type { AnimationPlayer, AnimationMetadata } from '@angular/animations';
import { AnimationBuilder, style, animate } from '@angular/animations';
import type { AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    inject,
    input,
    viewChild,
} from '@angular/core';
import type { HeightChangeObservationStrategies } from './height-change-observation-strategies';

/**
 * Automatically determines whether the content passed via ng-content is larger than the provided defaultHeight
 * and only shows a part that is at max {@link defaultHeight} high with the option to show all
 *
 * @example
 *```html
 * <app-show-more
 *      defaultHeight="40px"
 *      btnClasses="btn btn-sm btn-light m-1 fw-bold bg-light"
 *  >
 *      <h2>Title</h2>
 *      <p>
 *          Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
 *          eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
 *          voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet
 *          clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit
 *          amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
 *          nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat,
 *          sed diam voluptua. At vero eos et accusam et justo duo dolores et ea
 *          rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem
 *          ipsum dolor sit amet.
 *      </p>
 *  </app-show-more>
 *```
 */
@Component({
    selector: 'app-show-more',
    templateUrl: './app-show-more.component.html',
    styleUrls: ['./app-show-more.component.scss'],
    standalone: false,
})
export class AppShowMoreComponent
    implements OnChanges, AfterViewInit, OnDestroy
{
    private readonly animationBuilder = inject(AnimationBuilder);
    private readonly changeDetectorRef = inject(ChangeDetectorRef);

    /**
     * The maximum height that is shown by default without having to click on the "Show more"-button
     * You can use any valid css value like '100px', '100em', '10vh'
     */
    readonly defaultHeight = input.required<string>();
    /**
     * If the scrollHeight of the content changes, we could want to change wether the "Show more"-button is shown or not
     * Currently there seems to be no way to observe the scrollHeight of the content (https://stackoverflow.com/questions/44428370/detect-scrollheight-change-with-mutationobserver).
     * Therefore you can specify here which strategies you want to use.
     */
    readonly heightChangeObservationStrategies =
        input<HeightChangeObservationStrategies>({
            polling: false,
            resizeObserver: true,
            mutationObserver: true,
        });

    readonly wrapper = viewChild<ElementRef<HTMLDivElement>>('wrapper');
    readonly contentWrapper =
        viewChild<ElementRef<HTMLDivElement>>('contentWrapper');
    private player?: AnimationPlayer;

    public fitsIn = true;
    public showingMore = false;

    private resizeObserver?: ResizeObserver;
    private mutationObserver?: MutationObserver;
    private pollingIntervallRef?: ReturnType<typeof setInterval>;

    ngOnChanges() {
        this.updateState();
    }

    ngAfterViewInit() {
        // the ng-content makes up for the height of the wrapper -> wait until it is loaded
        setTimeout(() => this.updateState(), 0);
        // TODO:
        // observe the height of the content and update the showingMore-state whenever it changes
        // therefore we make use of up to three different strategies to detect changes in the scrollHeight
        const heightChangeObservationStrategies =
            this.heightChangeObservationStrategies();
        if (heightChangeObservationStrategies.polling) {
            this.pollingIntervallRef = setInterval(
                () => this.updateState(),
                1000
            );
        }
        const contentWrapper = this.contentWrapper();
        if (heightChangeObservationStrategies.resizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.updateState();
            });
            this.resizeObserver.observe(contentWrapper!.nativeElement);
        }
        if (heightChangeObservationStrategies.mutationObserver) {
            this.mutationObserver = new MutationObserver(() => {
                this.updateState();
            });
            this.mutationObserver.observe(contentWrapper!.nativeElement, {
                attributes: true,
                attributeOldValue: false,
                characterData: true,
                childList: true,
                subtree: true,
            });
        }
    }

    public toggleShowMore() {
        const wrapper = this.wrapper();
        if (!wrapper) {
            return;
        }
        this.showingMore = !this.showingMore;
        const currentHeight = wrapper.nativeElement.clientHeight;
        wrapper.nativeElement.style.maxHeight = '';
        if (this.showingMore) {
            // expand
            this.playAnimation([
                style({ height: currentHeight }),
                animate('0.5s ease', style({ height: '*' })),
            ]);
        } else {
            this.playAnimation([
                style({ height: '*' }),
                animate(
                    '0.5s ease',
                    style({
                        // TODO: `min(defaultHeight, scrollHeight)` would be better, but because defaultHeight doesn't have to be in px, this function is not trivial
                        height: this.defaultHeight(),
                    })
                ),
                style({ height: '', 'max-height': this.defaultHeight() }),
            ]);
        }
    }

    private playAnimation(animation: AnimationMetadata[]) {
        const wrapper = this.wrapper();
        if (!wrapper) {
            return;
        }
        this.player?.destroy();
        // play the animation
        this.player = this.animationBuilder
            .build(animation)
            .create(wrapper.nativeElement);
        this.player.play();
    }

    private updateState() {
        const wrapper = this.wrapper();
        if (!wrapper || this.showingMore) {
            return;
        }
        this.fitsIn =
            wrapper.nativeElement.scrollHeight <=
            wrapper.nativeElement.clientHeight;
        this.changeDetectorRef.markForCheck();
    }

    ngOnDestroy() {
        this.resizeObserver?.disconnect();
        this.mutationObserver?.disconnect();
        clearInterval(this.pollingIntervallRef);
    }
}
