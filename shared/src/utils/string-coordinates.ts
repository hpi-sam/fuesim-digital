import { z } from 'zod';

export const coordinateStringSchema = z
    .string()
    .regex(/^-?\d{1,3}(.\d+)?$/u, 'Die Eingabe ist keine gültige Koordinate.');
export const coordinateStringToNumber = z.codec(
    coordinateStringSchema,
    z.number(),
    {
        decode: (str) => Number.parseFloat(str),
        encode: (num) => num.toFixed(6),
    }
);
