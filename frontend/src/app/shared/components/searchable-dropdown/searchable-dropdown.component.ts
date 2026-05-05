import type { AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import {
    Component,
    ElementRef,
    inject,
    input,
    output,
    viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { HotkeyLayer } from '../../services/hotkeys.service';
import { Hotkey, HotkeysService } from '../../services/hotkeys.service';
import { HotkeyIndicatorComponent } from '../hotkey-indicator/hotkey-indicator.component';

export interface SearchableDropdownOption<T extends string = string> {
    key: T;
    name: string;
    color?: string;
    backgroundColor?: string;
}

@Component({
    selector: 'app-searchable-dropdown',
    templateUrl: './searchable-dropdown.component.html',
    styleUrls: ['./searchable-dropdown.component.scss'],
    imports: [FormsModule, HotkeyIndicatorComponent],
})
export class SearchableDropdownComponent<Key extends string>
    implements OnInit, AfterViewInit, OnDestroy
{
    private readonly hotkeysService = inject(HotkeysService);

    public readonly options = input<SearchableDropdownOption<Key>[]>([]);
    public readonly initialSelection = input<SearchableDropdownOption<Key>>();

    public readonly selected = output<SearchableDropdownOption<Key>>();

    public filter = '';
    public selectedIndex = -1;

    public get filteredOptions() {
        return this.options().filter((option) =>
            option.name.toLowerCase().includes(this.filter.toLowerCase())
        );
    }

    private hotkeyLayer!: HotkeyLayer;
    private readonly upHotkey = new Hotkey('up', false, () =>
        this.decreaseSelectedIndex()
    );
    private readonly downHotkey = new Hotkey('down', false, () =>
        this.increaseSelectedIndex()
    );
    private readonly confirmHotkey = new Hotkey('Enter', false, () =>
        this.confirmSelection()
    );

    private readonly searchInput =
        viewChild.required<ElementRef>('searchInput');

    ngOnInit() {
        this.hotkeyLayer = this.hotkeysService.createLayer(true);
        this.hotkeyLayer.addHotkey(this.upHotkey);
        this.hotkeyLayer.addHotkey(this.downHotkey);
        this.hotkeyLayer.addHotkey(this.confirmHotkey);
        if (this.initialSelection()) {
        }
    }

    ngAfterViewInit() {
        this.searchInput().nativeElement.focus();
    }

    ngOnDestroy(): void {
        this.hotkeysService.removeLayer(this.hotkeyLayer);
    }

    increaseSelectedIndex() {
        if (this.selectedIndex + 1 < this.filteredOptions.length)
            this.selectedIndex++;
    }

    decreaseSelectedIndex() {
        if (this.selectedIndex - 1 >= -1) this.selectedIndex--;
    }

    resetSelectedIndex() {
        if (this.filteredOptions.length === 1) {
            this.selectedIndex = 0;
        } else {
            this.selectedIndex = -1;
        }
    }

    confirmSelection() {
        if (
            this.selectedIndex > -1 &&
            this.selectedIndex < this.filteredOptions.length
        ) {
            this.selected.emit(this.filteredOptions[this.selectedIndex]!);
        }
    }
}
