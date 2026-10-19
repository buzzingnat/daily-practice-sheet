// Weights for how bright each channel looks to the eye (ITU-R BT.601)
const RED_WEIGHT = 0.299;
const GREEN_WEIGHT = 0.587;
const BLUE_WEIGHT = 0.114;

/**
 * Turns RGBA pixels gray in place, keeping transparency. The worksheets are monochrome by
 * design and print on whatever ink the printer has, so a color emoji gives up its colors.
 */
export function convertToGrayscale(pixels: Uint8ClampedArray): void {
    if (pixels.length % 4 !== 0) {
        throw new Error(`Pixel data comes in fours (red, green, blue, alpha), not ${pixels.length}.`);
    }
    for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index] ?? 0;
        const green = pixels[index + 1] ?? 0;
        const blue = pixels[index + 2] ?? 0;
        const gray = Math.round(red * RED_WEIGHT + green * GREEN_WEIGHT + blue * BLUE_WEIGHT);
        pixels[index] = gray;
        pixels[index + 1] = gray;
        pixels[index + 2] = gray;
    }
}
