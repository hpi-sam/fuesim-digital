import {
    afterEveryRender,
    Component,
    computed,
    contentChild,
    DestroyRef,
    ElementRef,
    inject,
    signal,
} from '@angular/core';

@Component({
    selector: 'app-scroll-buttons',
    templateUrl: './scroll-buttons.component.html',
    styleUrl: './scroll-buttons.component.scss',
})
export class ScrollButtonsComponent {
    private readonly destroyRef = inject(DestroyRef);

    public readonly scrollContainer =
        contentChild<ElementRef<HTMLElement>>('scrollContainer');

    private readonly scrollContainerEl = computed(
        () => this.scrollContainer()?.nativeElement
    );

    public readonly isXScrollable = signal<boolean>(false);
    public readonly isYScrollable = signal<boolean>(false);

    public readonly xScrollAmount = computed(
        () => (this.scrollContainerEl()?.clientWidth ?? 0) / 2
    );

    public readonly yScrollAmount = computed(
        () => (this.scrollContainerEl()?.clientHeight ?? 0) / 2
    );

    constructor() {
        afterEveryRender(() => {
            this.checkScrollable();
            this.setupWheelRedirect();
        });
        this.destroyRef.onDestroy(() => {
            this.teardownWheelRedirect();
        });
    }

    public scrollX(amount: number) {
        this.scrollContainerEl()?.scrollBy({
            behavior: 'smooth',
            left: amount,
        });
    }

    public scrollY(amount: number) {
        this.scrollContainerEl()?.scrollBy({
            behavior: 'smooth',
            top: amount,
        });
    }

    private readonly wheelListener = (event: WheelEvent) => {
        const el = this.scrollContainerEl();
        if (!el) return;
        if (!this.isXScrollable() || this.isYScrollable()) return;

        if (event.deltaY !== 0) {
            event.preventDefault();
            el.scrollBy({ left: event.deltaY });
        }
    };

    private wheelListenerAttachedTo: HTMLElement | undefined;

    private setupWheelRedirect() {
        const el = this.scrollContainerEl();
        if (el === this.wheelListenerAttachedTo) return;
        this.teardownWheelRedirect();
        if (!el) return;

        el.addEventListener('wheel', this.wheelListener, { passive: false });
        this.wheelListenerAttachedTo = el;
    }

    private teardownWheelRedirect() {
        this.wheelListenerAttachedTo?.removeEventListener(
            'wheel',
            this.wheelListener
        );
        this.wheelListenerAttachedTo = undefined;
    }

    private checkScrollable() {
        const el = this.scrollContainerEl();
        if (!el) return;

        this.isXScrollable.set(el.scrollWidth > el.clientWidth);
        this.isYScrollable.set(el.scrollHeight > el.clientHeight);
    }
}
