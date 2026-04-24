import { Directive, HostListener, output } from '@angular/core';

/**
 * This directive must only be used on file inputs and provides an output similar to `(input)`,
 * but consistent across all supported browsers.
 *
 * @example
 * ````html
 * <input type="file" (appFileInput)="processFileList($event)" />
 * ````
 */
@Directive({ selector: 'input[appFileInput]' })
export class FileInputDirective {
    readonly appFileInput = output<FileList>();

    @HostListener('input', ['$event'])
    public onInput(event: Event) {
        const inputElement = event.target as HTMLInputElement;
        this.appFileInput.emit(inputElement.files!);
        // This is a workaround to fix Chrome not allowing to import the same file twice in a row
        // See https://stackoverflow.com/questions/12030686/html-input-file-selection-event-not-firing-upon-selecting-the-same-file
        inputElement.value = '';
    }
}
