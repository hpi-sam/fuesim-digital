import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';

@Pipe({ name: 'values' })
export class ValuesPipe implements PipeTransform {
    /**
     * @param object The **immutable** object to get the values from
     * @returns an array of the values in the object in their original order
     */
    // Accepts undefined and null too, to make it easier to use in templates with e.g. | async
    transform<
        Value extends { [key: string]: Item } | null | undefined,
        // When the `:` side is used, `Item` is unused
        Item = Value extends { [key: string]: infer T } ? T : never,
    >(object: Value): Value extends null | undefined ? Value : Item[] {
        if (!object) {
            return object as any;
        }
        return Object.values(object) as any;
    }
}
