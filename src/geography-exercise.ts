import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import {
    GeometryObject,
    MultiPolygon as TopologyMultiPolygon,
    Polygon as TopologyPolygon,
    Topology
} from 'topojson-specification';
import { GeoJsonProperties, GeometryCollection, MultiPolygon } from 'geojson';
import { QuadrantExercise, QuadrantContext } from './worksheet-layout';
import { SANS_SERIF_FONT } from './constants';
import {
    traceAsiaSideRegion,
    traceEuropeSideRegion,
    traceUralBoundary
} from './europe-asia-boundary';

export const CONTINENTS = [
    'Africa',
    'Antarctica',
    'Asia',
    'Europe',
    'North America',
    'Oceania',
    'South America'
] as const;

export type Continent = typeof CONTINENTS[number];

interface IsoCountryRow {
    name: string;
    'country-code': string;
    region: string;
    'sub-region': string;
}

interface GeographyData {
    landmassByContinent: Map<Continent, MultiPolygon>;
    world: GeometryCollection;
}

type SourcePolygonalGeometry =
    | TopologyPolygon<GeoJsonProperties>
    | TopologyMultiPolygon<GeoJsonProperties>;

type PlainPolygonalGeometry = TopologyPolygon | TopologyMultiPolygon;

const TOPOLOGY_URL = '/maps/countries-110m.json';
const ISO_CODES_URL = '/maps/ISO-3166.csv';
// Russia is filed under Europe, and the Ural cut is made inside that shape at draw time.
const RUSSIA_COUNTRY_CODE = 643;

const HIGHLIGHT_FILL = '#999999';
const OUTLINE_STROKE = '#000000';

// A few shapes in the 110m file carry no numeric id, so their names must vouch for them.
const CONTINENT_BY_UNNUMBERED_NAME = new Map<string, Continent>([
    ['Somaliland', 'Africa'],
    ['Kosovo', 'Europe'],
    ['N. Cyprus', 'Asia']
]);

// Loaded once at startup. Rendering stays synchronous, as the pipeline requires.
let cachedGeographyData: GeographyData | null = null;

/**
 * Maps one ISO row to one of the seven continents. The UN file lumps the
 * Americas together, but its sub-region column already singles out South
 * America, so that column does the splitting. Rows with no region at all
 * (Antarctica and assorted remote islands) return null, except Antarctica,
 * which the name vouches for.
 */
export function assignContinent(row: IsoCountryRow): Continent | null {
    const region = row.region.trim();
    const subRegion = row['sub-region'].trim();

    if (region === 'Africa') {
        return 'Africa';
    } else if (region === 'Asia') {
        return 'Asia';
    } else if (region === 'Europe') {
        return 'Europe';
    } else if (region === 'Oceania') {
        return 'Oceania';
    } else if (region === 'Americas') {
        return subRegion === 'South America' ? 'South America' : 'North America';
    } else if (row.name === 'Antarctica') {
        return 'Antarctica';
    } else {
        return null;
    }
}

function isPolygonal(geometry: GeometryObject<GeoJsonProperties>): geometry is SourcePolygonalGeometry {
    return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon';
}

/**
 * Looks up a country's continent by numeric code, falling back to the
 * shape's name for the handful of disputed territories without a code.
 */
function findContinent(
    geometry: SourcePolygonalGeometry,
    continentByCode: Map<number, Continent>
): Continent | undefined {
    if (geometry.id !== undefined) {
        return continentByCode.get(+geometry.id);
    }

    const name: unknown = geometry.properties ? geometry.properties['name'] : undefined;
    if (typeof name === 'string') {
        return CONTINENT_BY_UNNUMBERED_NAME.get(name);
    }

    return undefined;
}

/**
 * Copies a geometry down to its bare arcs. The merge step only wants shapes,
 * not their baggage, and a property-free copy fits its typing either way.
 */
function stripProperties(geometry: SourcePolygonalGeometry): PlainPolygonalGeometry {
    if (geometry.type === 'Polygon') {
        return { type: 'Polygon', arcs: geometry.arcs };
    } else {
        return { type: 'MultiPolygon', arcs: geometry.arcs };
    }
}

/**
 * Fetches the map data, sorts every country into its continent, and welds
 * each continent into a single landmass. Call once at startup, then let
 * the quadrants render from memory.
 */
export async function loadGeographyData(): Promise<void> {
    if (cachedGeographyData) {
        return;
    }

    const [topology, isoRows] = await Promise.all([
        d3.json<Topology>(TOPOLOGY_URL),
        d3.csv(ISO_CODES_URL)
    ]);

    if (!topology || !isoRows) {
        throw new Error('Geography map data failed to load.');
    }

    const countries = topology.objects['countries'];
    if (!countries || countries.type !== 'GeometryCollection') {
        throw new Error('TopoJSON has no countries collection.');
    }

    const isoCountries: IsoCountryRow[] = isoRows.map((row) => ({
        name: row['name'] || '',
        'country-code': row['country-code'] || '',
        region: row['region'] || '',
        'sub-region': row['sub-region'] || ''
    }));

    const continentByCode = new Map<number, Continent>();
    isoCountries.forEach((row) => {
        const continent = assignContinent(row);
        if (continent) {
            continentByCode.set(+row['country-code'], continent);
        }
    });
    // Pinned rather than trusted to the CSV, because the Ural cut depends on it.
    continentByCode.set(RUSSIA_COUNTRY_CODE, 'Europe');

    const geometriesByContinent = new Map<Continent, PlainPolygonalGeometry[]>();
    countries.geometries.forEach((geometry) => {
        if (!isPolygonal(geometry)) {
            return;
        }
        const continent = findContinent(geometry, continentByCode);
        if (!continent) {
            return;
        }
        const existingGeometries = geometriesByContinent.get(continent) || [];
        existingGeometries.push(stripProperties(geometry));
        geometriesByContinent.set(continent, existingGeometries);
    });

    const landmassByContinent = new Map<Continent, MultiPolygon>();
    geometriesByContinent.forEach((geometries, continent) => {
        landmassByContinent.set(continent, topojson.merge(topology, geometries));
    });

    const world: GeometryCollection = {
        type: 'GeometryCollection',
        geometries: Array.from(landmassByContinent.values())
    };

    cachedGeographyData = { landmassByContinent, world };
}

/**
 * Builds a "name this continent" quadrant. The map data must be preloaded,
 * because a quadrant that fetches mid-render would be late to its own party.
 * Russia sits whole inside the Europe landmass, so the fills are clipped at
 * the Urals and a thin line marks the cut on every map.
 */
export function createGeographyExercise(
    targetContinent: Continent,
    title: string = 'NAME THIS CONTINENT'
): QuadrantExercise {
    if (!cachedGeographyData) {
        throw new Error('Call loadGeographyData() before creating a geography quadrant.');
    }
    const geographyData = cachedGeographyData;

    const europeLandmass = geographyData.landmassByContinent.get('Europe');
    if (!europeLandmass) {
        throw new Error('Europe is missing from the geography data, so the Ural line has nothing to divide.');
    }

    return {
        render(quadrantContext: QuadrantContext): void {
            const { context, width, height } = quadrantContext;

            // Title text, placed where every other module puts theirs
            context.fillStyle = '#000000';
            context.font = `bold 14px ${SANS_SERIF_FONT}`;
            context.textBaseline = 'top';
            context.textAlign = 'left';
            context.fillText(title, 15, 12);

            // The map takes the middle; the answer line takes the bottom
            const mapLeft = 15;
            const mapRight = width - 15;
            const mapTop = 34;
            const mapBottom = height - 34;

            const projection = d3.geoNaturalEarth1().fitExtent(
                [[mapLeft, mapTop], [mapRight, mapBottom]],
                geographyData.world
            );
            const path = d3.geoPath(projection, context);

            context.strokeStyle = OUTLINE_STROKE;
            context.lineWidth = 0.75;
            context.lineCap = 'round';
            context.lineJoin = 'round';

            // Fills come first, so no neighbour's fill ever paints over an outline
            const targetLandmass = geographyData.landmassByContinent.get(targetContinent);
            if (targetLandmass) {
                context.fillStyle = HIGHLIGHT_FILL;
                if (targetContinent === 'Europe') {
                    // Europe keeps the western side of Russia; Siberia belongs to Asia
                    context.save();
                    context.beginPath();
                    traceEuropeSideRegion(context, projection);
                    context.clip();
                    context.beginPath();
                    path(targetLandmass);
                    context.fill();
                    context.restore();
                } else {
                    context.beginPath();
                    path(targetLandmass);
                    context.fill();

                    if (targetContinent === 'Asia') {
                        // The other half of Russia, borrowed from the Europe landmass
                        context.save();
                        context.beginPath();
                        traceAsiaSideRegion(context, projection);
                        context.clip('evenodd');
                        context.beginPath();
                        path(europeLandmass);
                        context.fill();
                        context.restore();
                    }
                }
            }

            // Outlines for every landmass, target included
            geographyData.landmassByContinent.forEach((landmass) => {
                context.beginPath();
                path(landmass);
                context.stroke();
            });

            // The Ural line, clipped to Europe's landmass so it appears only inside Russia
            context.save();
            context.beginPath();
            path(europeLandmass);
            context.clip();
            context.beginPath();
            traceUralBoundary(context, projection);
            context.stroke();
            context.restore();

            // Labeled response line
            const answerBaseline = height - 10;
            const answerLabel = 'Continent:';
            context.fillStyle = '#000000';
            context.font = `normal 11px ${SANS_SERIF_FONT}`;
            context.textBaseline = 'alphabetic';
            context.textAlign = 'left';
            context.fillText(answerLabel, 15, answerBaseline);

            const lineStart = 15 + context.measureText(answerLabel).width + 6;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(lineStart, answerBaseline + 1);
            context.lineTo(width - 15, answerBaseline + 1);
            context.stroke();
        }
    };
}
