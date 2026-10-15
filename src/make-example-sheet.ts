import {
  buildCompositeWorksheet,
  HalfPageLayout,
  QuadrantExercise
} from './worksheet-layout';
import { createClockExercise } from './clock-exercise';
import { createKanaExercise } from './kana-exercise';
import { createBlankExercise, createPlaceholderExercise } from './utils';

/**
 * Triggers the complete component compilation and outputs a Letter-sized PDF download.
 */
export async function executeTestSheetGeneration(): Promise<void> {
  console.log('Initializing quadrant components...');

  // --- 1. Top Half-Sheet Component Assignments ---
  const topHalfLayout: HalfPageLayout = {
    // Top-Left Quadrant: Student reads clock and writes digital time
    topLeft: createClockExercise(
      'telling',
      'TELLING TIME',
      { hours: 10, minutes: 10 }
    ),

    // Top-Right Quadrant: Student practices the Hiragana character 'う'
    topRight: createKanaExercise(
      'HIRAGANA PRACTICE',
      'う',
      '"u" pronounce "oo", as in zoo.'
    ),

    // Bottom-Left Quadrant: Empty placeholder to build out fractions/math later
    bottomLeft: createBlankExercise(),

    // Bottom-Right Quadrant: Empty placeholder to build out spelling/geography later
    bottomRight: createPlaceholderExercise('GEOGRAPHY QUESTION')
  };

  // --- 2. Bottom Half-Sheet Component Assignments ---
  const bottomHalfLayout: HalfPageLayout = {
    // Top-Left Quadrant: Student practices a different Hiragana character 'あ'
    topLeft: createKanaExercise(
      'HIRAGANA PRACTICE',
      'あ',
      '"a" pronounce "ah", as in father.'
    ),

    // Top-Right Quadrant: Empty placeholder slot
    topRight: createPlaceholderExercise('SUBTRACTION PRACTICE'),

    // Bottom-Left Quadrant: Student views digital target text and draws clock hands
    bottomLeft: createClockExercise(
      'setting',
      'SETTING TIME',
      { hours: 3, minutes: 45 },
      '3:45 am'
    ),

    // Bottom-Right Quadrant: Empty placeholder slot
    bottomRight: createPlaceholderExercise('VOCABULARY MATCHING')
  };

  try {
    console.log('Compiling offscreen canvas contexts...');

    // Run the asynchronous compilation engine to render and embed the graphics layers
    const finalWorksheetDoc = await buildCompositeWorksheet(topHalfLayout, bottomHalfLayout);

    console.log('Dispatched completed PDF package to browser engine.');

    // Automatically triggers native browser document file saving pipeline
    finalWorksheetDoc.save('mixed_quadrant_2nd_grade_worksheet.pdf');

  } catch (error) {
    console.error('An error occurred during worksheet document assembly pipeline:', error);
  }
}
