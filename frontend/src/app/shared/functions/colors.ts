/**
 * The key is the color name and the value the rgb color code
 * They are sorted in a way that consecutive colors are not too similar
 * The colors have been taken from here https://getbootstrap.com/docs/5.1/customize/color/#all-colors
 */
export const rgbColorPalette = {
    blue: 'rgb(13, 110, 253)',
    yellow: 'rgb(255, 193, 7)',
    green: 'rgb(25, 135, 84)',
    red: 'rgb(220, 53, 69)',
    indigo: 'rgb(102, 16, 242)',
    orange: 'rgb(253, 126, 20)',
    pink: 'rgb(214, 51, 132)',
    teal: 'rgb(32, 201, 151)',
    cyan: 'rgb(13, 202, 240)',
    purple: 'rgb(111, 66, 193)',
    grey: 'rgb(173, 181, 189)',
    black: 'rgb(33, 37, 41)',
    white: 'rgb(248, 249, 250)',
} as const;

/**
 * @param color
 * @param alpha
 * @returns a color like `rgba(13, 110, 253, 0.75)`
 */
export function getRgbaColor(
    color: keyof typeof rgbColorPalette,
    alpha: number
): string {
    return rgbColorPalette[color]
        .replace('rgb', 'rgba')
        .replace(')', `, ${alpha})`);
}
