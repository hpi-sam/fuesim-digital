import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import { Immutable } from 'immer';

@Pipe({ name: 'orderBy' })
export class OrderByPipe implements PipeTransform {
    public transform<Item extends object>(
        array: Immutable<Item[]> | null | undefined,
        getOrderByValue:
            | ((item: Immutable<Item>) => number)
            | ((item: Immutable<Item>) => string),
        order: 'asc' | 'desc' = 'asc'
    ): Immutable<Item[]> {
        if (array === null || array === undefined) {
            return [];
        }
        const arrayToOrder = array.map((element) => ({
            element,
            sortValue: getOrderByValue(element),
        }));
        const orderFactor = order === 'asc' ? 1 : -1;
        arrayToOrder.sort((left, right) => {
            const leftComparer = left.sortValue;
            const rightComparer = right.sortValue;
            return (
                (typeof leftComparer === 'number'
                    ? leftComparer - (rightComparer as number)
                    : leftComparer.localeCompare(rightComparer as string)) *
                orderFactor
            );
        });
        return arrayToOrder.map((entry) => entry.element);
    }
}
