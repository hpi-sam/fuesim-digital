import { z } from 'zod';
import {
    femaleFirstNames,
    maleFirstNames,
    unisexNames,
} from '../../data/generator-data/first-names.js';
import { streetNames } from '../../data/generator-data/street-names.js';
import { surnames } from '../../data/generator-data/surnames.js';
import type { Sex } from './sex.js';

export const personalInformationSchema = z.strictObject({
    name: z.string(),
    address: z.string(),
    /**
     * Without year
     * @example
     * `24.02.`
     */
    birthdate: z.string(),
});
export type PersonalInformation = z.infer<typeof personalInformationSchema>;

export function generatePersonalInformation(sex: Sex): PersonalInformation {
    return {
        name: generateName(sex),
        address: generateAddress(),
        birthdate: generateBirthDate(),
    };
}

function generateAddress() {
    const streetName =
        streetNames[Math.floor(Math.random() * streetNames.length)];
    return `${streetName} ${Math.floor(Math.random() * 100) + 1}`;
}

function generateBirthDate() {
    const aDate = 1650800000000;
    const randomDate = new Date(Math.floor(Math.random() * aDate));
    return `${randomDate.getDate()}.${randomDate.getMonth() + 1}.`;
}

function generateName(sex: Sex) {
    const firstNames =
        sex === 'male'
            ? maleFirstNames
            : sex === 'female'
              ? femaleFirstNames
              : unisexNames;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    return `${firstName} ${surname}`;
}
