import { GeoProjection } from 'd3';

// Degrees on the globe, longitude first, the way d3 insists on having them.
type GeographicPoint = readonly [longitude: number, latitude: number];

// Long edges are cut into steps this short, so the line bends the way the map bends.
const MAXIMUM_STEP_DEGREES = 2;

// The Europe/Asia line, north to south. Hand-placed and good enough at 110m, where
// one degree is under a pixel. Tune by eye if a quadrant looks wrong.
const URAL_BOUNDARY_POINTS: readonly GeographicPoint[] = [
    [70, 84],
    [70, 75.5],
    [66.5, 73.8],
    [62, 72],
    [60.5, 69.8],
    [63.3, 68.5],
    [65.5, 67.5],
    [62.8, 66.2],
    [60.2, 65],
    [59.3, 63],
    [59, 61],
    [59.5, 59],
    [59.8, 57.5],
    [60, 56.8],
    [59.3, 55.2],
    [58.3, 54.2],
    [58.7, 52.8],
    [58.6, 51.2],
    [55.1, 51.8],
    [51.4, 51.2],
    [51.2, 50.2],
    [51.8, 49],
    [51.9, 47.1],
    [51.7, 46.8]
];

// Closes the Europe side by walking south, west, north and back to the start.
// The line ends where it began, so no closing edge is left to guesswork.
const EUROPE_SIDE_CLOSING_POINTS: readonly GeographicPoint[] = [
    [51.7, 30],
    [-30, 30],
    [-30, 84],
    [70, 84]
];

const EUROPE_SIDE_RING: readonly GeographicPoint[] = [
    ...URAL_BOUNDARY_POINTS,
    ...EUROPE_SIDE_CLOSING_POINTS
];

// The northern world, as a frame to subtract Europe from. It stops at 20 degrees north
// because France carries French Guiana into the Europe landmass, and nobody wants
// the Amazon coast mistaken for Siberia.
const NORTHERN_WORLD_RING: readonly GeographicPoint[] = [
    [-180, 20],
    [180, 20],
    [180, 90],
    [-180, 90],
    [-180, 20]
];

function projectPoint(projection: GeoProjection, point: GeographicPoint): [number, number] {
    const projected = projection([point[0], point[1]]);
    if (projected === null) {
        throw new Error(`Point ${point[0]}, ${point[1]} would not project onto the map.`);
    }
    return projected;
}

/**
 * Inserts intermediate points along every edge. A straight line in degrees
 * becomes a curve once projected, and a skipped curve is a visible lie.
 */
function densifyPath(points: readonly GeographicPoint[]): GeographicPoint[] {
    const densePoints: GeographicPoint[] = [];
    let previousPoint: GeographicPoint | undefined;

    for (const point of points) {
        if (previousPoint === undefined) {
            densePoints.push(point);
        } else {
            const longitudeSpan = point[0] - previousPoint[0];
            const latitudeSpan = point[1] - previousPoint[1];
            const largestSpan = Math.max(Math.abs(longitudeSpan), Math.abs(latitudeSpan));
            const stepCount = Math.max(1, Math.ceil(largestSpan / MAXIMUM_STEP_DEGREES));
            for (let step = 1; step <= stepCount; step += 1) {
                const fraction = step / stepCount;
                densePoints.push([
                    previousPoint[0] + longitudeSpan * fraction,
                    previousPoint[1] + latitudeSpan * fraction
                ]);
            }
        }
        previousPoint = point;
    }

    return densePoints;
}

/**
 * Adds the projected points to the current canvas path: a move to the first,
 * a line to the rest. Beginning and closing the path stays with the caller.
 */
function appendProjectedPoints(
    context: CanvasRenderingContext2D,
    projection: GeoProjection,
    points: readonly GeographicPoint[]
): void {
    let isFirstPoint = true;
    for (const point of densifyPath(points)) {
        const [screenX, screenY] = projectPoint(projection, point);
        if (isFirstPoint) {
            context.moveTo(screenX, screenY);
            isFirstPoint = false;
        } else {
            context.lineTo(screenX, screenY);
        }
    }
}

/**
 * Traces the Europe side of the line as a closed region. Clip to it with the
 * default fill rule, and everything east of the Urals falls outside.
 */
export function traceEuropeSideRegion(
    context: CanvasRenderingContext2D,
    projection: GeoProjection
): void {
    appendProjectedPoints(context, projection, EUROPE_SIDE_RING);
    context.closePath();
}

/**
 * Traces the Asia side of the line: the northern world with the Europe side
 * cut out of it. Two rings are meant to be clipped with the 'evenodd' rule,
 * which is what turns a pair of loops into a loop with a hole.
 */
export function traceAsiaSideRegion(
    context: CanvasRenderingContext2D,
    projection: GeoProjection
): void {
    appendProjectedPoints(context, projection, NORTHERN_WORLD_RING);
    context.closePath();
    appendProjectedPoints(context, projection, EUROPE_SIDE_RING);
    context.closePath();
}

/**
 * Traces the open line itself, for stroking. Clip it to the Europe landmass
 * first, so that it shows only where it has something to divide.
 */
export function traceUralBoundary(
    context: CanvasRenderingContext2D,
    projection: GeoProjection
): void {
    appendProjectedPoints(context, projection, URAL_BOUNDARY_POINTS);
}
