import * as d3 from 'd3';
import * as d3_geo from "d3-geo";
import * as topojson from 'topojson-client';
import {
    GeometryCollection as TopologyGeometryCollection,
    GeometryObject,
    MultiPolygon as TopologyMultiPolygon,
    Polygon as TopologyPolygon,
    Topology
} from 'topojson-specification';
import { GeoJsonProperties, GeometryCollection, MultiLineString, MultiPolygon } from 'geojson';
import { QuadrantExercise, QuadrantContext } from '../../worksheet/worksheet-layout';
import { drawAnswerLine } from './answer-line';
import { SANS_SERIF_FONT, COLOR_BLACK, COLOR_MEDIUM_GREY } from '../../constants';
import { traceAsiaSideRegion, traceEuropeSideRegion, traceUralBoundary } from './europe-asia-boundary';

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
    // Coastlines plus borders between continents, with Russia's Asian borders left out
    outlineLines: MultiLineString;
    // Russia's borders with Asian countries, kept apart so only the western stretch is drawn
    russianAsianBorder: MultiLineString;
}

interface ContinentalGeometry {
    geometry: PlainPolygonalGeometry;
    continent: Continent;
}

type SourcePolygonalGeometry =
    | TopologyPolygon<GeoJsonProperties>
    | TopologyMultiPolygon<GeoJsonProperties>;

type PlainPolygonalGeometry = TopologyPolygon | TopologyMultiPolygon;

const TOPOLOGY_URL = '/maps/countries-110m.json';
const ISO_CODES_URL = '/maps/ISO-3166.csv';

// Russia is filed under Europe, and the Ural cut is made inside that shape at draw time.
const RUSSIA_COUNTRY_CODE = 643;

// France owns a piece of South America, and the map should know whose it is.
const FRANCE_COUNTRY_CODE = 250;

// Any French polygon west of this longitude belongs to the Americas, not to Paris.
const AMERICAS_EASTERN_LIMIT = -30;

const HIGHLIGHT_FILL = COLOR_MEDIUM_GREY;
const OUTLINE_STROKE = COLOR_BLACK;

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

export function isPolygonal(geometry: GeometryObject<GeoJsonProperties>): geometry is SourcePolygonalGeometry {
    return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon';
}

/**
 * Looks up a country's continent by numeric code, falling back to the
 * shape's name for the handful of disputed territories without a code.
 */
export function findContinent(
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
 * Splits France into its pieces and sends each to the right continent.
 * Each polygon is judged by where its centre sits, so the rule survives
 * a reshuffled data file better than a hard-coded polygon index would.
 */
export function separateFrenchTerritories(
    topology: Topology,
    geometry: SourcePolygonalGeometry
): ContinentalGeometry[] {
    if (geometry.type === 'Polygon') {
        return [{ geometry: stripProperties(geometry), continent: 'Europe' }];
    }

    return geometry.arcs.map((polygonArcs) => {
        const polygon: TopologyPolygon = { type: 'Polygon', arcs: polygonArcs };
        const [longitude] = d3.geoCentroid(topojson.feature(topology, polygon));
        const continent: Continent = longitude < AMERICAS_EASTERN_LIMIT ? 'South America' : 'Europe';
        return { geometry: polygon, continent };
    });
}

/**
 * Fetches the map data, sorts every country into its continent, and welds
 * each continent into a single landmass for filling. Outlines come from a
 * border mesh instead, because the Russian border east of the Urals divides
 * nothing and must not be drawn. Call once at startup, then let the
 * quadrants render from memory.
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
    const continentByGeometry = new Map<GeometryObject, Continent>();
    const russiaGeometries = new Set<GeometryObject>();
    const allGeometries: PlainPolygonalGeometry[] = [];

    const registerGeometry = (geometry: PlainPolygonalGeometry, continent: Continent): void => {
        allGeometries.push(geometry);
        continentByGeometry.set(geometry, continent);
        const existingGeometries = geometriesByContinent.get(continent) || [];
        existingGeometries.push(geometry);
        geometriesByContinent.set(continent, existingGeometries);
    };

    for (const geometry of countries.geometries) {
        if (!isPolygonal(geometry)) {
            continue;
        }
        const continent = findContinent(geometry, continentByCode);
        if (!continent) {
            continue;
        }

        if (geometry.id !== undefined && +geometry.id === FRANCE_COUNTRY_CODE) {
            separateFrenchTerritories(topology, geometry).forEach((territory) => {
                registerGeometry(territory.geometry, territory.continent);
            });
            continue;
        }

        const plainGeometry = stripProperties(geometry);
        registerGeometry(plainGeometry, continent);
        if (geometry.id !== undefined && +geometry.id === RUSSIA_COUNTRY_CODE) {
            russiaGeometries.add(plainGeometry);
        }
    }

    if (russiaGeometries.size === 0) {
        throw new Error('Russia is missing from the geography data, so the Ural line has nothing to divide.');
    }

    const landmassByContinent = new Map<Continent, MultiPolygon>();
    geometriesByContinent.forEach((geometries, continent) => {
        landmassByContinent.set(continent, topojson.merge(topology, geometries));
    });

    const world: GeometryCollection = {
        type: 'GeometryCollection',
        geometries: Array.from(landmassByContinent.values())
    };

    // A border involving Russia and an Asian country is a Europe/Asia border only
    // west of the Urals, so it is pulled out here and clipped at draw time.
    const isRussianAsianBorder = (first: GeometryObject, second: GeometryObject): boolean => {
        const involvesRussia = russiaGeometries.has(first) || russiaGeometries.has(second);
        const involvesAsia = continentByGeometry.get(first) === 'Asia'
            || continentByGeometry.get(second) === 'Asia';
        return involvesRussia && involvesAsia;
    };

    const allLand: TopologyGeometryCollection = {
        type: 'GeometryCollection',
        geometries: allGeometries
    };

    // Equal geometries mean an exterior arc, which is to say a coastline.
    const outlineLines = topojson.mesh(topology, allLand, (first, second) => {
        if (first === second) {
            return true;
        }
        if (continentByGeometry.get(first) === continentByGeometry.get(second)) {
            return false;
        }
        return !isRussianAsianBorder(first, second);
    });

    const russianAsianBorder = topojson.mesh(topology, allLand, (first, second) => {
        return first !== second && isRussianAsianBorder(first, second);
    });

    cachedGeographyData = { landmassByContinent, world, outlineLines, russianAsianBorder };
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

    // One drawing routine serves both sheets; the answer sheet writes the answer on the response line
    const draw = (quadrantContext: QuadrantContext, showAnswers: boolean): void => {
        const { context, width, height } = quadrantContext;

        // Title text, placed where every other module puts theirs
        context.fillStyle = COLOR_BLACK;
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

        // the following projection doesn't work because it is not included in base d3
        // it does not work with a simple switch to d3-geo
        // should try other things to get it to work
        // const projection = d3.geoInterruptedMollweideHemispheres();
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

                    // Two fills meeting at an edge leave a hairline of white between them.
                    // A stroke in the fill colour, east of the Urals only, sews the seam shut.
                    context.save();
                    context.strokeStyle = HIGHLIGHT_FILL;
                    context.lineWidth = 1.5;
                    context.beginPath();
                    path(geographyData.russianAsianBorder);
                    context.stroke();
                    context.restore();
                }
            }
        }

        // Coastlines and continental borders, drawn once each
        context.strokeStyle = OUTLINE_STROKE;
        context.lineWidth = 0.75;

        context.beginPath();
        path(geographyData.outlineLines);
        context.stroke();

        // Russia's border with Asian countries counts only west of the Urals
        context.save();
        context.beginPath();
        traceEuropeSideRegion(context, projection);
        context.clip();
        context.beginPath();
        path(geographyData.russianAsianBorder);
        context.stroke();
        context.restore();

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
        drawAnswerLine(context, width, height, 'Continent:', showAnswers ? targetContinent : undefined);
    };

    return {
        render(quadrantContext: QuadrantContext): void {
            draw(quadrantContext, false);
        },
        renderAnswers(quadrantContext: QuadrantContext): void {
            draw(quadrantContext, true);
        }
    };
}
