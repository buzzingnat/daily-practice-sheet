import * as d3 from 'd3';
import { QuadrantExercise, QuadrantContext } from './worksheet-layout';
import { SANS_SERIF_FONT } from './constants';
import { createAsiaSidePolygon, createEuropeSidePolygon, createUralBoundaryLine } from './europe-asia-boundary';
import { getRegionMapData, RegionCountry } from './region-map-data';
import { createRegionProjection, getMapBox } from './region-views';
import { PopulatedRegion } from './types';

const HIGHLIGHT_FILL = '#999999';
const OUTLINE_STROKE = '#000000';
const SURROUNDING_FILL = '#D1D5DB';
const HORIZON_STROKE = '#D1D5DB';
const BACKGROUND_FILL = '#FFFFFF';

/**
 * Everyone who may be asked about in this region. Throws if the map data has
 * not been loaded, because an empty list would fail more quietly and more confusingly.
 */
export function listRegionTargets(region: PopulatedRegion): RegionCountry[] {
    const targets = getRegionMapData().targetsByRegion.get(region);
    if (!targets) {
        throw new Error(`No targets are known for ${region}.`);
    }
    return targets;
}

/**
 * Builds a "name this country" quadrant: an orthographic view of one region,
 * every country outlined, the target shaded. Russia straddles the Urals, so in
 * the Europe and Asia views it is shaded on that view's side of the line only,
 * and the line itself is drawn across it.
 */
export function createRegionMapExercise(
    region: PopulatedRegion,
    targetIdentifier: string,
    title: string = 'NAME THIS COUNTRY'
): QuadrantExercise {
    const mapData = getRegionMapData();
    const target = listRegionTargets(region).find((candidate) => candidate.identifier === targetIdentifier);
    if (!target) {
        throw new Error(`${targetIdentifier} is not a target in the ${region} view.`);
    }

    const drawing = mapData.drawingsByRegion.get(region);
    if (!drawing) {
        throw new Error(`No drawing is known for ${region}.`);
    }

    const isRussiaSplitView = region === 'Europe' || region === 'Asia';
    const russiaSide = region === 'Europe' ? createEuropeSidePolygon() : createAsiaSidePolygon();
    const uralLine = createUralBoundaryLine();

    return {
        render(quadrantContext: QuadrantContext): void {
            const { context, width, height } = quadrantContext;

            // Title text, placed where every other module puts theirs
            context.fillStyle = '#000000';
            context.font = `bold 14px ${SANS_SERIF_FONT}`;
            context.textBaseline = 'top';
            context.textAlign = 'left';
            context.fillText(title, 15, 12);

            const box = getMapBox(width, height);
            const projection = createRegionProjection(region, width, height);
            const path = d3.geoPath(projection, context);

            // Neighbours spill over the edge of the globe; the box keeps them off the title
            context.save();
            context.beginPath();
            context.rect(box.left, box.top, box.right - box.left, box.bottom - box.top);
            context.clip();

            context.lineCap = 'round';
            context.lineJoin = 'round';

            // The edge of the globe, so the land has somewhere to end
            context.strokeStyle = HORIZON_STROKE;
            context.lineWidth = 0.75;
            context.beginPath();
            path({ type: 'Sphere' });
            context.stroke();

            // Foreign land is a quiet grey. In the Europe and Asia views that includes the
            // whole of Russia, which is then wiped white on the side the view belongs to.
            context.fillStyle = SURROUNDING_FILL;
            context.beginPath();
            path(drawing.surroundingLand);
            context.fill();

            if (isRussiaSplitView) {
                context.save();
                context.fillStyle = BACKGROUND_FILL;
                context.beginPath();
                path(russiaSide);
                context.clip('evenodd');
                context.beginPath();
                path(mapData.russia.feature);
                context.fill();
                context.restore();
            }

            // The target comes before the outlines, so no outline is ever painted over
            context.fillStyle = HIGHLIGHT_FILL;
            if (isRussiaSplitView && target.identifier === mapData.russia.identifier) {
                context.save();
                context.beginPath();
                path(russiaSide);
                context.clip('evenodd');
                context.beginPath();
                path(target.feature);
                context.fill();
                context.restore();
            } else {
                context.beginPath();
                path(target.feature);
                context.fill();
            }

            context.strokeStyle = OUTLINE_STROKE;
            context.lineWidth = 0.75;
            context.beginPath();
            path(drawing.borders);
            context.stroke();

            if (isRussiaSplitView) {
                // Russia's borders with foreign land count only on its own side of the Urals
                context.save();
                context.beginPath();
                path(russiaSide);
                context.clip('evenodd');
                context.beginPath();
                path(drawing.clippedRussianBorders);
                context.stroke();
                context.restore();

                // Clipped to Russia, so the line shows only where it has a country to divide
                context.save();
                context.beginPath();
                path(mapData.russia.feature);
                context.clip();
                context.beginPath();
                path(uralLine);
                context.stroke();
                context.restore();
            }

            context.restore();

            context.strokeStyle = OUTLINE_STROKE;
            context.lineWidth = 1;
            context.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);

            // Labeled response line
            const answerBaseline = height - 10;
            const answerLabel = 'Country:';
            context.fillStyle = '#000000';
            context.font = `normal 11px ${SANS_SERIF_FONT}`;
            context.textBaseline = 'alphabetic';
            context.textAlign = 'left';
            context.fillText(answerLabel, 15, answerBaseline);

            const lineStart = 15 + context.measureText(answerLabel).width + 6;
            context.beginPath();
            context.moveTo(lineStart, answerBaseline + 1);
            context.lineTo(width - 15, answerBaseline + 1);
            context.stroke();
        }
    };
}
