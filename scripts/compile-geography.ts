import * as fs from "fs";
import * as path from "path";
import { JSDOM } from "jsdom";
import * as d3Base from "d3";
import * as d3GeoProj from "d3-geo-projection";

// Merge d3-geo-projection features directly into the core d3 namespace
const d3 = { ...d3Base, ...d3GeoProj };

interface GeoJsonFeature {
    type: string;
    properties: {
        CONTINENT?: string;
        NAME?: string;
    };
    geometry: any;
}

/**
 * Executes an offline D3 pipeline to project global geometry into a static 
 * Winkel Tripel TypeScript module fitting our tight 266pt x 155pt bounding boxes.
 */
async function generateGeographyDataset(): Promise<void> {
    console.log("Starting offline geographic vector projection pipeline...");

    // 1. Fetch a lightweight, reliable global GeoJSON dataset (110m low-res Natural Earth)
    const geoJsonUrl = "https://githubusercontent.com";
    const continentsUrl = "https://githubusercontent.com";

    try {
        const landResponse = await fetch(geoJsonUrl);
        const landData = await landResponse.json();

        const countriesResponse = await fetch(continentsUrl);
        const countriesData = await countriesResponse.json();

        // 2. Set up an artificial headless DOM environment for D3 path generation
        const headlessWindow = new JSDOM("<!DOCTYPE html><html><body></body></html>");
        const document = headlessWindow.window.document;

        // 3. Define our rigid workspace dimensions (Matching our 266pt x 155pt layout contract)
        const targetWidth = 266;
        const targetHeight = 155;
        const paddingOffset = 10;

        // 4. Initialize our Winkel Tripel Projection Matrix
        const projectionEngine = d3.geoWinkel3()
            .fitExtent(
                [
                    [paddingOffset, paddingOffset], 
                    [targetWidth - paddingOffset, targetHeight - paddingOffset]
                ], 
                landData
            );

        const geoPathGenerator = d3.geoPath().projection(projectionEngine);

        // 5. Generate the base global outline path string
        const globalWorldMapPath = geoPathGenerator(landData) || "";

        // 6. Extract independent continent outlines by grouping global features
        const continentMappings: Record<string, string> = {
            "Africa": "africa",
            "Asia": "asia",
            "Europe": "europe",
            "North America": "northAmerica",
            "South America": "southAmerica",
            "Oceania": "oceania"
        };

        const processedRegions: Array<{ id: string; name: string; svgPathData: string }> = [];

        for (const [displayName, systemId] of Object.entries(continentMappings)) {
            // Filter features matching our target geographic boundary group
            const regionalFeatures = (countriesData.features as GeoJsonFeature[]).filter(
                (feature) => feature.properties.CONTINENT === displayName
            );

            if (regionalFeatures.length > 0) {
                const combinedFeatureCollection = {
                    type: "FeatureCollection",
                    features: regionalFeatures
                };
                
                const regionalPathString = geoPathGenerator(combinedFeatureCollection) || "";
                processedRegions.push({
                    id: systemId,
                    name: displayName,
                    svgPathData: regionalPathString
                });
            }
        }

        // 7. Format the structural string outputs following strict TypeScript standards
        const fileContentOutput = `/**
 * Core Geographic Region Path Definitions
 * 
 * Auto-generated via D3 offline projection utility. Do not modify by hand.
 * Map projection context: Winkel Tripel (d3.geoWinkel3)
 * Target Dimensions: 266pt x 155pt bounding surface area.
 */

export interface GeographicRegion {
    id: string;
    name: string;
    svgPathData: string;
}

export const WORLD_BASE_MAP = "${globalWorldMapPath}";

export const GEOGRAPHY_REGIONS: GeographicRegion[] = ${JSON.stringify(processedRegions, null, 4)};
`;

        // 8. Ensure output directory exists and write the structured dataset file
        const targetPathDestination = path.join(__dirname, "..", "src", "data", "geographyData.ts");
        fs.mkdirSync(path.dirname(targetPathDestination), { recursive: true });
        fs.writeFileSync(targetPathDestination, fileContentOutput, "utf-8");

        console.log(`Successfully compiled and wrote geography database to: ${targetPathDestination}`);
    } catch (networkError) {
        console.error("Failed to generate geography vector maps due to error:", networkError);
    }
}

generateGeographyDataset();
