import {
    Component,
    computed,
    HostListener,
    inject,
    signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { MeasureTemplate } from 'fuesim-digital-shared';
import type { AppState } from '../../../../../state/app.state';
import { selectMeasureTemplateCategories } from '../../../../../state/application/selectors/exercise.selectors';
import { MeasureService } from '../../../../../core/measure.service';
import { ScrollButtonsComponent } from '../../../../../shared/components/scroll-buttons/scroll-buttons.component';
import { MeasureDetailsComponent } from '../exercise-map/shared/measure-details/measure-details.component';

@Component({
    selector: 'app-map-operator-toolbar',
    templateUrl: './map-operator-toolbar.component.html',
    styleUrls: ['./map-operator-toolbar.component.scss'],
    imports: [ScrollButtonsComponent, MeasureDetailsComponent],
})
export class MapOperatorToolbarComponent {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly measureService = inject(MeasureService);

    private readonly categoriesMap = this.store.selectSignal(
        selectMeasureTemplateCategories
    );
    public readonly categories = computed(() =>
        Object.values(this.categoriesMap())
    );

    public readonly isToolbarVisible = signal(false);
    public readonly selectedCategoryName = signal<string | null>(null);

    public readonly selectedCategoryTemplates = computed<MeasureTemplate[]>(
        () => {
            const name = this.selectedCategoryName();
            if (name === null) {
                return [];
            }
            const category = this.categoriesMap()[name];
            return category ? Object.values(category.templates) : [];
        }
    );

    public onMeasureTemplateSelect(template: MeasureTemplate) {
        this.measureService.executeMeasure(template);
    }

    public onCategoryClick(name: string) {
        if (this.isToolbarVisible() && this.selectedCategoryName() === name) {
            this.isToolbarVisible.set(false);
            return;
        }
        this.selectedCategoryName.set(name);
        this.isToolbarVisible.set(true);
    }

    @HostListener('document:mousedown', ['$event'])
    public onDocumentMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }
        if (
            target.closest('.map-toolbar-toggle') ||
            target.closest('.map-toolbar') ||
            target.closest('.scroll-btn')
        ) {
            return;
        }
        this.isToolbarVisible.set(false);
    }
}
