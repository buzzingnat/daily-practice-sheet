import { HalfPageLayout, QuadrantExercise } from "./worksheet-layout";
import { createKanaExercise } from './kana-exercise';
import { createAdditionExercise } from './addition-exercise';
import { createSubtractionQuadrant } from './subtraction-exercise';
import { createClockQuadrant } from './clock-exercise';
import { createFractionsQuadrant } from './fractions-exercise';


// Define the available module categories for deterministic mixing
export type ExerciseCategory = "CLOCK" | "SUBTRACTION" | "ADDITION" | "KANA" | "FRACTIONS";

export interface GenerationConstraints {
    sheetIndex: number;
    halfPageIndex: number;
    quadrantIndex: number; // 0 to 3 (topLeft, topRight, bottomLeft, bottomRight)
}

// Factories for instantiating quadrant exercises dynamically
export interface ExerciseFactories {
    createClockExercise(sheetIndex: number): QuadrantExercise;
    createSubtractionExercise(sheetIndex: number): QuadrantExercise;
    createAdditionExercise(sheetIndex: number): QuadrantExercise;
    createKanaExercise(sheetIndex: number): QuadrantExercise;
    createFractionsExercise(sheetIndex: number): QuadrantExercise;
}

/**
 * Generates an array of randomized, well-distributed categories for the grid.
 * Ensures balanced coverage so every sheet feels unique but uniform in difficulty.
 */
function generateBalancedCategoryPool(totalRequiredSlots: number): ExerciseCategory[] {
    const categories: ExerciseCategory[] = ["CLOCK", "SUBTRACTION", "ADDITION", "KANA", "FRACTIONS"];
    const pool: ExerciseCategory[] = [];

    let categoryIndex = 0;
    let poolIndex = 0;

    // Fill the pool round-robin to ensure an mathematically equal distribution
    while (poolIndex < totalRequiredSlots) {
        pool.push(categories[categoryIndex] as ExerciseCategory);
        
        categoryIndex = categoryIndex + 1;
        if (categoryIndex >= categories.length) {
            categoryIndex = 0;
        }

        poolIndex = poolIndex + 1;
    }

    // In-place Fisher-Yates shuffle to randomize distribution safely
    let currentPoolIndex = pool.length - 1;
    while (currentPoolIndex > 0) {
        const randomTargetIndex = Math.floor(Math.random() * (currentPoolIndex + 1));
        const temporaryValue = pool[currentPoolIndex];
        
        pool[currentPoolIndex] = pool[randomTargetIndex] as ExerciseCategory;
        pool[randomTargetIndex] = temporaryValue as ExerciseCategory;

        currentPoolIndex = currentPoolIndex - 1;
    }

    return pool;
}

/**
 * Resolves a specific category into a concrete initialized exercise module
 */
function instantiateExercise(
    category: ExerciseCategory,
    factories: ExerciseFactories,
    constraints: GenerationConstraints
): QuadrantExercise {
    if (category === "CLOCK") {
        return factories.createClockExercise(constraints.sheetIndex);
    }
    
    if (category === "SUBTRACTION") {
        return factories.createSubtractionExercise(constraints.sheetIndex);
    }
    
    if (category === "ADDITION") {
        return factories.createAdditionExercise(constraints.sheetIndex);
    }
    
    if (category === "KANA") {
        return factories.createKanaExercise(constraints.sheetIndex);
    }
    
    // Default fallback case handles the FRACTIONS exercise category safely
    return factories.createFractionsExercise(constraints.sheetIndex);
}

/**
 * Main Application Factory Production Object Builder
 * Computes individual parameter configurations dynamically inside the sheet loop mapping sequence.
 */
export function createWorkbookExerciseFactories(): ExerciseFactories {
    return {
        createClockExercise: (sheetIndex: number): QuadrantExercise => {
            // Alternates the task mode using explicit timing objects derived from preview data signatures
            const targetType = (sheetIndex % 2 === 0) ? "telling" : "setting";
            let targetTitle = 'SETTING TIME';
            if (targetType === 'telling') {
                targetTitle = 'TELLING TIME';
            }
            // Generate a random hour between 1 and 12 inclusive
            const randomHour = Math.floor(Math.random() * 12) + 1;
            // Generate a random minute interval snapping cleanly to 5-minute ticks
            const randomMinute = Math.floor(Math.random() * 12) * 5;
            return createClockQuadrant(targetType, targetTitle, { hours: randomHour, minutes: randomMinute });
        },
        createFractionsExercise: (sheetIndex: number): QuadrantExercise => {
            return createFractionsQuadrant('1st', 'FRACTIONS');
        },
        createSubtractionExercise: (sheetIndex: number): QuadrantExercise => {
            return createSubtractionQuadrant('1st');
        },
        createAdditionExercise: (sheetIndex: number): QuadrantExercise => {
            return createAdditionExercise('1st');
        },
        createKanaExercise: (sheetIndex: number): QuadrantExercise => {
            // Pool of data payloads matching the exact parameters observed in the frontend framework configuration script
            const charactersPool = ["お", "あ", "い", "う", "え"];
            const pronunciationPool = [
                '"o" pronounce "oa", as in boat.',
                '"a" pronounce "ah", as in father.',
                '"i" pronounce "ee", as in meet.',
                '"u" pronounce "oo", as in boot.',
                '"e" pronounce "eh", as in bet.'
            ];

            const itemPointer = sheetIndex % charactersPool.length;
            return createKanaExercise(
                "HIRAGANA PRACTICE",
                charactersPool[itemPointer] as string,
                pronunciationPool[itemPointer] as string
            );
        }
    };
}

/**
 * Core Matrix Randomizer Function
 * Compiles exactly 20 unique workbook sheets populated with distributed modules.
 */
export function generateWorkbookBatch(factories: ExerciseFactories): HalfPageLayout[][] {
    const totalSheetsCount = 20;
    const halfPagesPerSheetCount = 2;
    const quadrantsPerHalfPageCount = 4;
    const totalSlotsRequired = totalSheetsCount * halfPagesPerSheetCount * quadrantsPerHalfPageCount;

    const randomizedCategoryPool = generateBalancedCategoryPool(totalSlotsRequired);
    const workbookBatch: HalfPageLayout[][] = [];
    
    let poolExtractionPointer = 0;
    let sheetCounter = 0;

    while (sheetCounter < totalSheetsCount) {
        const currentSheetHalfPages: HalfPageLayout[] = [];
        let halfPageCounter = 0;

        while (halfPageCounter < halfPagesPerSheetCount) {
            
            const topLeftCategory = randomizedCategoryPool[poolExtractionPointer] as ExerciseCategory;
            const topRightCategory = randomizedCategoryPool[poolExtractionPointer + 1] as ExerciseCategory;
            const bottomLeftCategory = randomizedCategoryPool[poolExtractionPointer + 2] as ExerciseCategory;
            const bottomRightCategory = randomizedCategoryPool[poolExtractionPointer + 3] as ExerciseCategory;
            
            poolExtractionPointer = poolExtractionPointer + 4;

            const halfPageLayout: HalfPageLayout = {
                topLeft: instantiateExercise(topLeftCategory, factories, {
                    sheetIndex: sheetCounter,
                    halfPageIndex: halfPageCounter,
                    quadrantIndex: 0
                }),
                topRight: instantiateExercise(topRightCategory, factories, {
                    sheetIndex: sheetCounter,
                    halfPageIndex: halfPageCounter,
                    quadrantIndex: 1
                }),
                bottomLeft: instantiateExercise(bottomLeftCategory, factories, {
                    sheetIndex: sheetCounter,
                    halfPageIndex: halfPageCounter,
                    quadrantIndex: 2
                }),
                bottomRight: instantiateExercise(bottomRightCategory, factories, {
                    sheetIndex: sheetCounter,
                    halfPageIndex: halfPageCounter,
                    quadrantIndex: 3
                })
            };

            currentSheetHalfPages.push(halfPageLayout);
            halfPageCounter = halfPageCounter + 1;
        }

        workbookBatch.push(currentSheetHalfPages);
        sheetCounter = sheetCounter + 1;
    }

    return workbookBatch;
}
