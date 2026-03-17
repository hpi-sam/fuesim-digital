import { z } from 'zod';
import type { PatientStatus } from './patient-status.js';

export const healthPointsDefaults = {
    max: 100_000,
    min: 0,
    greenMax: 100_000,
    greenAverage: 85_000,
    yellowMax: 66_000,
    yellowAverage: 50_000,
    redMax: 33_000,
    redAverage: 20_000,
    blackMax: 0,
};

export const healthPointsSchema = z
    .number()
    .min(healthPointsDefaults.min)
    .max(healthPointsDefaults.max);
export type HealthPoints = z.infer<typeof healthPointsSchema>;

export function getStatus(health: HealthPoints): PatientStatus {
    if (health <= healthPointsDefaults.blackMax) {
        return 'black';
    }
    if (health <= healthPointsDefaults.redMax) {
        return 'red';
    }
    if (health <= healthPointsDefaults.yellowMax) {
        return 'yellow';
    }
    return 'green';
}

export function isValidHealthPoint(health: HealthPoints) {
    return (
        health >= healthPointsDefaults.min && health <= healthPointsDefaults.max
    );
}

export function isGreen(health: HealthPoints) {
    return (
        health > healthPointsDefaults.yellowMax &&
        health <= healthPointsDefaults.greenMax
    );
}

export function isYellow(health: HealthPoints) {
    return (
        health > healthPointsDefaults.redMax &&
        health <= healthPointsDefaults.yellowMax
    );
}

export function isRed(health: HealthPoints) {
    return (
        health > healthPointsDefaults.blackMax &&
        health <= healthPointsDefaults.redMax
    );
}

export function isBlack(health: HealthPoints) {
    return (
        health >= healthPointsDefaults.min &&
        health <= healthPointsDefaults.blackMax
    );
}

export function isAlive(health: HealthPoints) {
    return (
        health > healthPointsDefaults.blackMax &&
        health <= healthPointsDefaults.greenMax
    );
}
