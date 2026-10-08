// Define a central cache to hold our loaded images
const imageCache: Record<string, HTMLImageElement> = {};

/**
 * Loads an image once and caches it for future application-wide reuse.
 */
export async function getSharedImage(url: string): Promise<HTMLImageElement> {
    // If the image is already cached, return it instantly
    if (imageCache[url]) {
        return imageCache[url] as HTMLImageElement;
    }

    // Otherwise, load it, save it to cache, and return it
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache[url] = img; // Save to memory cache
            resolve(img);
        };
        img.onerror = (err) => reject(new Error(`Failed to load asset: ${url}`));
        img.src = url;
    });
}

export function getSharedImageSync(url: string): HTMLImageElement | null {
    if (imageCache[url]) {
        return imageCache[url] as HTMLImageElement;
    }
    return null;
}
