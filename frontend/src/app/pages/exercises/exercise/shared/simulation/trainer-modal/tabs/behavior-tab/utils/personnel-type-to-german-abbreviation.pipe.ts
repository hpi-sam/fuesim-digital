import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { PersonnelType } from 'digital-fuesim-manv-shared';

const personnelTypeToGermanAbbreviationDictionary: {
    [Key in PersonnelType]: string;
} = {
    gf: 'GF',
    notarzt: 'NA',
    notSan: 'NFS',
    rettSan: 'RS',
    san: 'San',
};

@Pipe({
    name: 'personnelTypeToGermanAbbreviation',
    standalone: false,
})
export class PersonnelTypeToGermanAbbreviationPipe implements PipeTransform {
    transform(value: PersonnelType): string {
        return personnelTypeToGermanAbbreviationDictionary[value];
    }
}
