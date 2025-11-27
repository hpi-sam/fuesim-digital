import { get } from 'lodash-es';
import type { TrackByFunction } from '@angular/core';
import { objectToHash } from './object-to-hash';

// TODO: This is a workaround to be able to test this function in the jest tests which are not setup for angular (via e.g. jest-preset-angular) and can therefore not parse angular pipes.
export function trackByPropertyPipeTransform<
    Items extends ReadonlyArray<any> = ReadonlyArray<any>,
    Item = Items[0],
    FirstLevelPropertyName extends number | string = keyof Item &
        (number | string),
    Path extends number | string =
        | FirstLevelPropertyName
        | `${FirstLevelPropertyName}.${string}`,
    P extends Path = Path,
>(
    propertyNames: P | P[] | '$index' | '$value',
    // only to get the type for Items, because angular pipes don't support passing types as generic parameters
    items?: Items | null
): TrackByFunction<Item> {
    // The transform function is in general called once per `trackBy:` (https://stackoverflow.com/questions/66365244/in-angular-ivy-why-pure-pipe-instance-is-not-cached-between-usages-like-in-view)
    // The here returned TrackByFunction could be called once per changeDetection cycle for each item in the ngFor loop -> should be very fast
    if (propertyNames === '$index') {
        return (index: number, item: any) => index;
    }
    if (propertyNames === '$value') {
        return (index: number, item: any) =>
            typeof item === 'object'
                ? item === null
                    ? null
                    : objectToHash(item)
                : item;
    }
    if (Array.isArray(propertyNames)) {
        // propertyNames is something like: ['user.firstName', 'user.lastName']
        return (index: number, item: any) =>
            propertyNames
                .map((propertyName) => get(item, propertyName as any))
                .join(',');
    }
    // performance improvement
    if (typeof propertyNames === 'number' || !propertyNames.includes('.')) {
        // propertyNames is something like 'user' or 1
        return (index: number, item: any) => item[propertyNames];
    }
    // propertyNames is something like: 'user.id'
    return (index: number, item: any) => get(item, propertyNames as any);
}
