import * as d3 from 'd3';
import { GeoProjection } from 'd3';
import { MultiPoint } from 'geojson';
import { GeographicPoint, PopulatedRegion } from './types';

export interface RegionView {
    centerLongitude: number;
    centerLatitude: number;
    // Extreme points of the region. The map is zoomed until all of them fit the map box.
    frame: readonly GeographicPoint[];
}

export interface MapBox {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

// The map takes the middle; the title takes the top and the answer line the bottom.
// The box is taller than the continent exercise's, because Africa and South
// America are portrait-shaped and need the room.
const MAP_SIDE_MARGIN = 15;
const MAP_TOP_MARGIN = 28;
const MAP_BOTTOM_MARGIN = 24;

// The frame is fitted this far inside the box, so a cape or a coast never sits on the border.
const FRAME_PADDING = 5;

// Hand-placed and tuned by eye. A point on the far side of the globe is dropped
// by the fit without complaint, so a frame point that vanishes is a frame point to move.
const REGION_VIEWS: Record<PopulatedRegion, RegionView> = {
    'Central America': {
        centerLongitude: -88,
        centerLatitude: 18,
        frame: [
            [-117, 32], [-110, 23], [-92, 14.5], [-83.7, 8.5], [-77.5, 7.2],
            [-60.9, 10.8], [-65, 18.5], [-73, 22], [-77, 26.7], [-97, 26]
        ]
    },
    'Europe': {
        centerLongitude: 15,
        centerLatitude: 52,
        frame: [
            [-24, 64.5], [-10, 36], [26, 35.5], [40, 42],
            [60, 52], [60, 66], [28, 71]
        ]
    },
    'Asia': {
        centerLongitude: 95,
        centerLatitude: 40,
        frame: [
            [26, 38], [45, 13], [77, 7], [95, -6], [125, -9],
            [146, 45], [178, 66], [100, 77], [60, 70]
        ]
    },
    'Africa': {
        centerLongitude: 20,
        centerLatitude: 3,
        frame: [
            [-17.5, 15], [10, 37.5], [34, 31], [51.4, 11.8],
            [47, -25], [20, -35], [10, -18]
        ]
    },
    'North America': {
        centerLongitude: -100,
        centerLatitude: 45,
        frame: [
            [-168, 65], [-95, 83], [-18, 81], [-12, 70], [-52, 47],
            [-60, 10], [-80, 7], [-92, 14], [-118, 32]
        ]
    },
    'South America': {
        centerLongitude: -60,
        centerLatitude: -15,
        frame: [
            [-81, -5], [-72, 12.5], [-61, 10.7], [-35, -7],
            [-52, -33], [-68, -55], [-75, -50]
        ]
    },
    'Oceania': {
        centerLongitude: 160,
        centerLatitude: -20,
        frame: [
            [113, -22], [130, -11], [142, -10], [155, -5], [179, -17],
            [178, -38.5], [168, -46.5], [147, -43.6], [135, -35], [115, -34]
        ]
    }
};

export function getMapBox(width: number, height: number): MapBox {
    return {
        left: MAP_SIDE_MARGIN,
        top: MAP_TOP_MARGIN,
        right: width - MAP_SIDE_MARGIN,
        bottom: height - MAP_BOTTOM_MARGIN
    };
}

/**
 * An orthographic globe turned to face the region, zoomed to fit its frame, and
 * clipped to the map box. Clipping at the projection means the area of a country
 * measured through it is the area a student can actually see.
 */
export function createRegionProjection(
    region: PopulatedRegion,
    width: number,
    height: number
): GeoProjection {
    const view = REGION_VIEWS[region];
    const box = getMapBox(width, height);
    const extent: [[number, number], [number, number]] = [[box.left, box.top], [box.right, box.bottom]];
    const frameExtent: [[number, number], [number, number]] = [
        [box.left + FRAME_PADDING, box.top + FRAME_PADDING],
        [box.right - FRAME_PADDING, box.bottom - FRAME_PADDING]
    ];

    const frame: MultiPoint = {
        type: 'MultiPoint',
        coordinates: view.frame.map((point) => [point[0], point[1]])
    };

    const projection = d3.geoOrthographic().rotate([-view.centerLongitude, -view.centerLatitude]);
    projection.fitExtent(frameExtent, frame);
    projection.clipExtent(extent);
    return projection;
}
