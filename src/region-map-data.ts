import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { GeometryObject, MultiPolygon as TopologyMultiPolygon, Polygon as TopologyPolygon, Topology } from 'topojson-specification';
import { Feature, GeoJsonProperties, MultiLineString, MultiPolygon } from 'geojson';
import { assignContinent, Continent, findContinent, isPolygonal, separateFrenchTerritories } from './geography-exercise';
import { createRegionProjection } from './region-views';
import { POPULATED_REGIONS, PopulatedRegion } from './types';
import { EXERCISE_HEIGHT, EXERCISE_WIDTH } from './worksheet-layout';

type IsoCountryRow = Parameters<typeof assignContinent>[0];

// A country's shape as the 110m file holds it: a polygon or several, with properties attached.
type SourceShape = Parameters<typeof separateFrenchTerritories>[1];

export interface RegionCountry {
    // ISO numeric code, three digits. Pieces cut out of a larger shape carry their own code.
    identifier: string;
    // Display only; code compares identifiers
    name: string;
    feature: Feature;
}

// Everything a region's map draws besides the target itself.
export interface RegionDrawing {
    // All land outside the region, welded into one piece so no seams show. In the
    // Europe and Asia views it includes the whole of Russia, which the exercise
    // then covers on the side that belongs to the view.
    surroundingLand: MultiPolygon;
    // Coastlines, plus borders that touch the region
    borders: MultiLineString;
    // Borders between Russia and land outside the view, drawn only on Russia's side of the Urals.
    // Empty outside the Europe and Asia views.
    clippedRussianBorders: MultiLineString;
}

export interface RegionMapData {
    // Who may be asked about, per region. Russia sits in both Europe and Asia.
    targetsByRegion: Map<PopulatedRegion, RegionCountry[]>;
    drawingsByRegion: Map<PopulatedRegion, RegionDrawing>;
    russia: RegionCountry;
}

// A shape stripped to its arcs, which is all the mesh and the merge ask for.
type BareShape = TopologyPolygon | TopologyMultiPolygon;

// One piece of land as the mesh sees it: bare arcs, and the regions it counts as part of.
interface LandShape {
    geometry: BareShape;
    regions: readonly PopulatedRegion[];
    isRussia: boolean;
}

const TOPOLOGY_URL = '/maps/countries-110m.json';
const ISO_CODES_URL = '/maps/ISO-3166.csv';

// These repeat constants in geography-exercise.ts, which keeps them to itself.
const RUSSIA_COUNTRY_CODE = 643;
const FRANCE_COUNTRY_CODE = 250;

// French Guiana arrives inside France's shape but has an ISO code of its own.
const FRENCH_GUIANA_IDENTIFIER = '254';

// A country must show at least this many square pixels inside the map box to be asked
// about. Below it, Luxembourg is a rumour. Russia is exempt, because it is always large.
const MINIMUM_TARGET_AREA = 30;

// Loaded once at startup. Rendering stays synchronous, as the pipeline requires.
let cachedRegionMapData: RegionMapData | null = null;

function toPopulatedRegion(continent: Continent): PopulatedRegion | undefined {
    return POPULATED_REGIONS.find((region) => region === continent);
}

function formatIdentifier(code: string | number): string {
    return String(code).padStart(3, '0');
}

/**
 * Turns one shape into a GeoJSON feature. The library's typing allows a
 * collection to come back, which a single shape never produces.
 */
function toFeature(topology: Topology, shape: GeometryObject<GeoJsonProperties>): Feature {
    const converted = topojson.feature<GeoJsonProperties>(topology, shape);
    if (converted.type !== 'Feature') {
        throw new Error('A single shape converted to a collection.');
    }
    return converted;
}

function readName(geometry: SourceShape, fallback: string): string {
    const name: unknown = geometry.properties ? geometry.properties['name'] : undefined;
    return typeof name === 'string' ? name : fallback;
}

function stripShape(geometry: SourceShape): BareShape {
    return geometry.type === 'Polygon'
        ? { type: 'Polygon', arcs: geometry.arcs }
        : { type: 'MultiPolygon', arcs: geometry.arcs };
}

/**
 * Works out what surrounds one region's target: grey land, coastlines, and only
 * those borders that touch the region. Borders between two foreign countries are
 * nobody's business. Russia, being in two regions at once, gets special handling in the
 * Europe and Asia views: a border with a country in the view is drawn in full, while
 * a border with a country outside it is drawn only on Russia's side of the Urals.
 */
function buildRegionDrawing(
    topology: Topology,
    landShapes: readonly LandShape[],
    region: PopulatedRegion
): RegionDrawing {
    const isSplitView = region === 'Europe' || region === 'Asia';
    const shapeByGeometry = new Map<GeometryObject, LandShape>();
    landShapes.forEach((shape) => shapeByGeometry.set(shape.geometry, shape));

    const isInRegion = (geometry: GeometryObject): boolean => {
        const shape = shapeByGeometry.get(geometry);
        return shape !== undefined && shape.regions.includes(region);
    };
    const isRussian = (geometry: GeometryObject): boolean => {
        const shape = shapeByGeometry.get(geometry);
        return shape !== undefined && shape.isRussia;
    };

    const surroundingGeometries = landShapes
        .filter((shape) => !shape.regions.includes(region) || (isSplitView && shape.isRussia))
        .map((shape) => shape.geometry);

    const allLand: GeometryObject = {
        type: 'GeometryCollection',
        geometries: landShapes.map((shape) => shape.geometry)
    };

    const borders = topojson.mesh(topology, allLand, (first, second) => {
        if (first === second) {
            return true;
        }
        if (isSplitView && (isRussian(first) || isRussian(second))) {
            return isInRegion(isRussian(first) ? second : first);
        }
        return isInRegion(first) || isInRegion(second);
    });

    const clippedRussianBorders = topojson.mesh(topology, allLand, (first, second) => {
        if (!isSplitView || first === second || !(isRussian(first) || isRussian(second))) {
            return false;
        }
        return !isInRegion(isRussian(first) ? second : first);
    });

    return {
        surroundingLand: topojson.merge(topology, surroundingGeometries),
        borders,
        clippedRussianBorders
    };
}

/**
 * Sorts the world's countries into the six populated regions and decides who
 * is large enough to be asked about. A pure function of its inputs, so a check
 * script can feed it files from disk and see what the browser would see.
 */
export function buildRegionMapData(
    topology: Topology,
    isoRows: readonly IsoCountryRow[],
    width: number,
    height: number
): RegionMapData {
    const countries = topology.objects['countries'];
    if (!countries || countries.type !== 'GeometryCollection') {
        throw new Error('TopoJSON has no countries collection.');
    }

    const continentByCode = new Map<number, Continent>();
    isoRows.forEach((row) => {
        const continent = assignContinent(row);
        if (continent) {
            continentByCode.set(+row['country-code'], continent);
        }
    });

    const candidatesByRegion = new Map<PopulatedRegion, RegionCountry[]>();
    POPULATED_REGIONS.forEach((region) => candidatesByRegion.set(region, []));

    const addCandidate = (region: PopulatedRegion, country: RegionCountry): void => {
        const candidates = candidatesByRegion.get(region);
        if (!candidates) {
            throw new Error(`No candidate list for ${region}.`);
        }
        candidates.push(country);
    };

    const landShapes: LandShape[] = [];
    let russia: RegionCountry | undefined;

    for (const geometry of countries.geometries) {
        if (!isPolygonal(geometry)) {
            continue;
        }
        const continent = findContinent(geometry, continentByCode);
        if (continent === 'Antarctica') {
            continue;
        }
        // Drawn even without a code or a continent, so that no coastline goes missing
        const homeRegion = continent === undefined ? undefined : toPopulatedRegion(continent);
        const isRussiaShape = geometry.id !== undefined && +geometry.id === RUSSIA_COUNTRY_CODE;
        const isFranceShape = geometry.id !== undefined && +geometry.id === FRANCE_COUNTRY_CODE;
        if (isRussiaShape) {
            landShapes.push({ geometry: stripShape(geometry), regions: ['Europe', 'Asia'], isRussia: true });
        } else if (!isFranceShape) {
            landShapes.push({
                geometry: stripShape(geometry),
                regions: homeRegion ? [homeRegion] : [],
                isRussia: false
            });
        }

        // Somaliland, Kosovo and N. Cyprus have no ISO code, so nobody asks about them
        if (geometry.id === undefined || continent === undefined) {
            continue;
        }
        const identifier = formatIdentifier(geometry.id);
        const name = readName(geometry, identifier);

        if (+geometry.id === RUSSIA_COUNTRY_CODE) {
            const russianCountry = { identifier, name, feature: toFeature(topology, geometry) };
            russia = russianCountry;
            addCandidate('Europe', russianCountry);
            addCandidate('Asia', russianCountry);
        } else if (+geometry.id === FRANCE_COUNTRY_CODE) {
            const europeanArcs: number[][][] = [];
            separateFrenchTerritories(topology, geometry).forEach((territory) => {
                landShapes.push({
                    geometry: territory.geometry,
                    regions: [territory.continent === 'South America' ? 'South America' : 'Europe'],
                    isRussia: false
                });
                if (territory.continent === 'South America') {
                    addCandidate('South America', {
                        identifier: FRENCH_GUIANA_IDENTIFIER,
                        name: 'French Guiana',
                        feature: toFeature(topology, territory.geometry)
                    });
                } else if (territory.geometry.type === 'Polygon') {
                    europeanArcs.push(territory.geometry.arcs);
                } else {
                    europeanArcs.push(...territory.geometry.arcs);
                }
            });
            addCandidate('Europe', {
                identifier,
                name,
                feature: toFeature(topology, { type: 'MultiPolygon', arcs: europeanArcs })
            });
        } else {
            const region = toPopulatedRegion(continent);
            if (region) {
                addCandidate(region, { identifier, name, feature: toFeature(topology, geometry) });
            }
        }
    }

    if (!russia) {
        throw new Error('Russia is missing from the geography data, so the Ural line has nothing to divide.');
    }
    const russianIdentifier = russia.identifier;
    const russianCountry = russia;

    const targetsByRegion = new Map<PopulatedRegion, RegionCountry[]>();
    candidatesByRegion.forEach((candidates, region) => {
        const path = d3.geoPath(createRegionProjection(region, width, height));
        targetsByRegion.set(region, candidates.filter((candidate) => {
            return candidate.identifier === russianIdentifier
                || path.area(candidate.feature) >= MINIMUM_TARGET_AREA;
        }));
    });

    const drawingsByRegion = new Map<PopulatedRegion, RegionDrawing>();
    POPULATED_REGIONS.forEach((region) => {
        drawingsByRegion.set(region, buildRegionDrawing(topology, landShapes, region));
    });

    return { targetsByRegion, drawingsByRegion, russia: russianCountry };
}

/**
 * Fetches the map data and builds the region lists. Call once at startup, then
 * let the quadrants render from memory.
 */
export async function loadRegionMapData(): Promise<void> {
    if (cachedRegionMapData) {
        return;
    }

    const [topology, isoRows] = await Promise.all([
        d3.json<Topology>(TOPOLOGY_URL),
        d3.csv(ISO_CODES_URL)
    ]);

    if (!topology || !isoRows) {
        throw new Error('Region map data failed to load.');
    }

    const isoCountries: IsoCountryRow[] = isoRows.map((row) => ({
        name: row['name'] || '',
        'country-code': row['country-code'] || '',
        region: row['region'] || '',
        'sub-region': row['sub-region'] || ''
    }));

    cachedRegionMapData = buildRegionMapData(topology, isoCountries, EXERCISE_WIDTH, EXERCISE_HEIGHT);
}

export function getRegionMapData(): RegionMapData {
    if (!cachedRegionMapData) {
        throw new Error('Call loadRegionMapData() before creating a region map quadrant.');
    }
    return cachedRegionMapData;
}
