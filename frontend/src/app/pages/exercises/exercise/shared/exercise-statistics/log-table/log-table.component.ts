import type {
    OnChanges,
    OnDestroy,
    SimpleChanges,
    AfterViewInit,
} from '@angular/core';
import { Component, Input } from '@angular/core';
import type { LogEntry, Tag } from 'digital-fuesim-manv-shared';
import { StrictObject } from 'digital-fuesim-manv-shared';
import { difference } from 'lodash-es';
import { Subject, takeUntil } from 'rxjs';
import type { SearchableDropdownOption } from 'src/app/shared/components/searchable-dropdown/searchable-dropdown.component';
import { StatisticsTimeSelectionService } from '../statistics-time-selection.service';

type KnownSpecifier = Omit<Tag, 'category'>;

interface Filter {
    category: string;
    specifiers: KnownSpecifier[];
}

@Component({
    selector: 'app-log-table',
    templateUrl: './log-table.component.html',
    styleUrls: ['./log-table.component.scss'],
    standalone: false,
})
export class LogTableComponent implements OnChanges, OnDestroy, AfterViewInit {
    @Input() public logEntries!: readonly LogEntry[];

    public knownCategories: {
        [category: string]: { [specifier: string]: KnownSpecifier };
    } = {};

    public filters: Filter[] = [];
    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly statisticsTimeSelectionService: StatisticsTimeSelectionService
    ) {}

    public get availableCategories() {
        const knownCategoryNames = Object.keys(this.knownCategories);
        const categoriesInUse = this.filters.map((filter) => filter.category);

        return difference(knownCategoryNames, categoriesInUse)
            .sort((a, b) => a.localeCompare(b))
            .map((categoryName) => ({
                key: categoryName,
                name: categoryName,
            }));
    }

    public get availableSpecifiersPerCategory() {
        return StrictObject.fromEntries(
            StrictObject.entries(this.knownCategories).map(
                ([knownCategory, knownSpecifiers]) => [
                    knownCategory,
                    Object.values(knownSpecifiers)
                        .filter(
                            (knownSpecifier) =>
                                this.filters
                                    .find(
                                        (filter) =>
                                            filter.category === knownCategory
                                    )
                                    ?.specifiers.every(
                                        (specifierInUse) =>
                                            specifierInUse.specifier !==
                                            knownSpecifier.specifier
                                    ) ?? true
                        )
                        .map((availableSpecifier) => ({
                            key: availableSpecifier.specifier,
                            name: availableSpecifier.name,
                            color: availableSpecifier.color,
                            backgroundColor: availableSpecifier.backgroundColor,
                        })),
                ]
            )
        );
    }

    public get filteredLogEntries() {
        const predicate = (logEntry: LogEntry) =>
            this.filters.every((filter) => {
                if (filter.specifiers.length === 0) {
                    return logEntry.tags.some(
                        (tag) => tag.category === filter.category
                    );
                }

                return filter.specifiers.some((specifier) =>
                    logEntry.tags.some(
                        (tag) =>
                            tag.category === filter.category &&
                            tag.specifier === specifier.specifier
                    )
                );
            });

        return this.logEntries.filter(predicate);
    }

    ngAfterViewInit(): void {
        this.statisticsTimeSelectionService.selectedTime$
            .pipe(takeUntil(this.destroy$))
            .subscribe((update) => {
                if (update !== undefined) {
                    const { time, cause } = update;
                    if (cause === 'log') return;
                    const index = this.filteredLogEntries.findIndex(
                        (entry) => entry.timestamp >= time
                    );
                    document
                        .querySelector(
                            `#log-entry-${
                                index === -1
                                    ? this.filteredLogEntries.length - 1
                                    : index
                            }`
                        )
                        ?.scrollIntoView({ behavior: 'smooth' });
                }
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!('logEntries' in changes)) return;

        this.knownCategories = {};

        // Process all tags in reverse order to use the latest available display name and color
        [...this.logEntries].reverse().forEach((logEntry) => {
            logEntry.tags.forEach((tag) => {
                if (!(tag.category in this.knownCategories)) {
                    this.knownCategories[tag.category] = {};
                }

                const knownCategory = this.knownCategories[tag.category]!;

                if (!(tag.specifier in knownCategory)) {
                    knownCategory[tag.specifier] = {
                        specifier: tag.specifier,
                        name: tag.name,
                        color: tag.color,
                        backgroundColor: tag.backgroundColor,
                    };
                }
            });
        });
    }

    addCategory(selectedCategory: SearchableDropdownOption) {
        if (
            !this.filters.some(
                (filter) => filter.category === selectedCategory.key
            )
        ) {
            this.filters.push({
                category: selectedCategory.key,
                specifiers: [],
            });
        }
    }

    removeCategory(category: string) {
        const categoryIndex = this.filters.findIndex(
            (filter) => filter.category === category
        );

        if (categoryIndex !== -1) {
            this.filters.splice(categoryIndex, 1);
        }
    }

    clearFilters() {
        this.filters = [];
    }

    addSpecifierToCategory(
        selectedSpecifier: SearchableDropdownOption,
        category: string
    ) {
        const categoryFilter = this.filters.find(
            (filter) => filter.category === category
        );

        if (!categoryFilter) return;

        const specifierPresent = categoryFilter.specifiers.some(
            (filter) => filter.specifier === selectedSpecifier.key
        );

        if (!specifierPresent) {
            categoryFilter.specifiers.push(
                this.knownCategories[category]![selectedSpecifier.key]!
            );
        }
    }

    removeSpecifierFromCategory(specifier: string, category: string) {
        const categoryFilter = this.filters.find(
            (filter) => filter.category === category
        );

        if (!categoryFilter) return;

        const specifierIndex = categoryFilter.specifiers.findIndex(
            (filter) => filter.specifier === specifier
        );

        if (specifierIndex !== -1) {
            categoryFilter.specifiers.splice(specifierIndex, 1);
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
    }
}
