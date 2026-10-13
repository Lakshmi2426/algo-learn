import { BinarySearchChallenge } from '../data/gameData';

export type GuidedSubStage =
  | 'EXPLAIN_RANGE'
  | 'CALCULATE_MID'
  | 'COMPARE'
  | 'ACTION_RESULT'
  | 'TARGET_FOUND'
  | 'TARGET_NOT_FOUND';

export interface GuidedStepDetails {
  subStage: GuidedSubStage;
  stepNumber: number;
  totalSteps: number;
  low: number;
  high: number;
  mid: number;
  target: number;
  array: number[];
  activeRangeCount: number;
  isOutOfRange: boolean;
  expectedAction: 'LEFT' | 'RIGHT' | 'FOUND' | 'NOT_FOUND';
  title: string;
  guidanceText: string;
  instructionPrompt: string;
  isWaitingForPlayer: boolean;
  highlightConcept: 'range' | 'mid' | 'compare' | 'low' | 'high' | null;

  midCalculation?: {
    formulaStandard: string;
    formulaSafe: string;
    evaluatedStandard: string;
    evaluatedSafe: string;
    midIndex: number;
    midValue: number | null;
  };

  comparison?: {
    targetVal: number;
    midVal: number | null;
    symbol: '>' | '<' | '===' | 'crossed';
    expression: string;
    explanation: string;
    directionQuestion: string;
    suggestedDirection?: 'LEFT' | 'RIGHT';
  };

  boundaryUpdate?: {
    pointerUpdated: 'LOW' | 'HIGH';
    oldValue: number;
    newValue: number;
    formula: string;
    explanation: string;
  };
}

/**
 * Simulates binary search from (startLow, startHigh) to calculate the total
 * number of meaningful guided stages required for the challenge.
 */
export function calculateTotalGuideStages(
  challenge: BinarySearchChallenge,
  startLow: number,
  startHigh: number
): number {
  // Single-decision question or midpoint verification
  if (challenge.targetAction === 'FOUND') {
    return 3; // 1: Range -> 2: Mid -> 3: Compare & Found
  }
  if (challenge.targetAction) {
    return 4; // 1: Range -> 2: Mid -> 3: Compare & Decision -> 4: Boundary/Result Explanation
  }

  const array = challenge.array;
  const target = challenge.target;
  let curL = startLow;
  let curH = startHigh;
  let stages = 0;

  // Simulate step by step
  while (true) {
    if (curL > curH) {
      stages += 1; // Final: Range empty & Target Not Found
      break;
    }

    const curM = Math.floor(curL + (curH - curL) / 2);
    const midVal = array[curM];

    if (midVal === target) {
      // First occurrence duplicate: must continue searching left
      if (
        challenge.mode === 'first-occurrence' &&
        curM > 0 &&
        array[curM - 1] === target
      ) {
        stages += 4; // Range, Mid, Compare & Choose Left, Boundary Update
        curH = curM - 1;
        continue;
      }
      // Last occurrence duplicate: must continue searching right
      if (
        challenge.mode === 'last-occurrence' &&
        curM < array.length - 1 &&
        array[curM + 1] === target
      ) {
        stages += 4; // Range, Mid, Compare & Choose Right, Boundary Update
        curL = curM + 1;
        continue;
      }

      // Target matched terminal iteration
      stages += 3; // Range, Mid, Compare & Target Found!
      break;
    }

    // Directional iteration
    stages += 4; // Range, Mid, Compare & Action, Boundary Update
    if (target < midVal) {
      curH = curM - 1;
    } else {
      curL = curM + 1;
    }
  }

  return Math.max(1, stages);
}

/**
 * Returns the expected action for the current state of binary search.
 */
export function getExpectedAction(
  challenge: BinarySearchChallenge,
  low: number,
  high: number,
  mid: number
): 'LEFT' | 'RIGHT' | 'FOUND' | 'NOT_FOUND' {
  if (low > high) {
    return 'NOT_FOUND';
  }

  if (challenge.targetAction) {
    return challenge.targetAction;
  }

  const midVal = challenge.array[mid];
  const target = challenge.target;

  if (midVal === target) {
    if (
      challenge.mode === 'first-occurrence' &&
      mid > 0 &&
      challenge.array[mid - 1] === target
    ) {
      return 'LEFT';
    }
    if (
      challenge.mode === 'last-occurrence' &&
      mid < challenge.array.length - 1 &&
      challenge.array[mid + 1] === target
    ) {
      return 'RIGHT';
    }
    return 'FOUND';
  }

  return target < midVal ? 'LEFT' : 'RIGHT';
}

/**
 * Generates rich guided step details for the current game state and sub-stage.
 */
export function getGuidedStepDetails(
  challenge: BinarySearchChallenge,
  low: number,
  high: number,
  mid: number,
  subStage: GuidedSubStage,
  stepNumber: number,
  totalSteps: number,
  lastSuccess?: {
    pointerUpdated: 'LOW' | 'HIGH';
    oldValue: number;
    newValue: number;
    formula: string;
    explanation: string;
  } | null
): GuidedStepDetails {
  const array = challenge.array;
  const target = challenge.target;
  const isOutOfRange = low > high;
  const activeRangeCount = Math.max(0, high - low + 1);
  const midVal = mid >= 0 && mid < array.length ? array[mid] : null;
  const expectedAction = getExpectedAction(challenge, low, high, mid);

  // Formulas evaluated with real current numbers
  const formulaStandard = 'mid = Math.floor((low + high) / 2)';
  const formulaSafe = 'mid = low + Math.floor((high - low) / 2)';
  const evaluatedStandard = `Math.floor((${low} + ${high}) / 2) = ${mid}`;
  const evaluatedSafe = `${low} + Math.floor((${high} - ${low}) / 2) = ${mid}`;

  const midCalculation = {
    formulaStandard,
    formulaSafe,
    evaluatedStandard,
    evaluatedSafe,
    midIndex: mid,
    midValue: midVal,
  };

  // Build comparison data
  let symbol: '>' | '<' | '===' | 'crossed' = '===';
  let expression = '';
  let comparisonExplanation = '';
  let directionQuestion = 'Which action should we take?';

  if (isOutOfRange) {
    symbol = 'crossed';
    expression = `low (${low}) > high (${high})`;
    comparisonExplanation =
      'The lower pointer has crossed the higher pointer. The remaining search interval is empty, definitively proving the target is not present in the array.';
    directionQuestion = 'Confirm the target is absent.';
  } else if (midVal !== null) {
    if (midVal === target) {
      symbol = '===';
      expression = `target (${target}) === arr[${mid}] (${midVal})`;

      if (
        challenge.mode === 'first-occurrence' &&
        mid > 0 &&
        array[mid - 1] === target
      ) {
        comparisonExplanation = `We found ${target} at index [${mid}], but index [${mid - 1}] is also equal to ${target}! In duplicate arrays, to find the FIRST occurrence (lower bound), we must continue searching left.`;
        directionQuestion = 'Which half should we search for earlier duplicates?';
      } else if (
        challenge.mode === 'last-occurrence' &&
        mid < array.length - 1 &&
        array[mid + 1] === target
      ) {
        comparisonExplanation = `We found ${target} at index [${mid}], but index [${mid + 1}] is also equal to ${target}! In duplicate arrays, to find the LAST occurrence (upper bound), we must continue searching right.`;
        directionQuestion = 'Which half should we search for later duplicates?';
      } else {
        comparisonExplanation = `The value at middle index [${mid}] (${midVal}) matches our target (${target})! The search has succeeded.`;
        directionQuestion = 'Confirm the match by selecting Target Found!';
      }
    } else if (target > midVal) {
      symbol = '>';
      expression = `target (${target}) > arr[${mid}] (${midVal})`;

      if (challenge.id.startsWith('l6-c1') || challenge.id === 'l6-c1' || challenge.mode === 'debug') {
        comparisonExplanation = `Target (${target}) > arr[${mid}] (${midVal}). The buggy code incorrectly executed low = mid - 1 (or failed to advance low past mid). To advance into the right half and avoid an infinite loop, we must advance LOW forward past mid (low = mid + 1).`;
        directionQuestion = 'Which pointer update fixes the search?';
      } else {
        comparisonExplanation = `The target (${target}) is greater than arr[${mid}] (${midVal}). Because the array is sorted in ascending order, all elements at and to the left of mid are too small. The target must be in the right half.`;
        directionQuestion = 'Which half should we search?';
      }
    } else {
      symbol = '<';
      expression = `target (${target}) < arr[${mid}] (${midVal})`;

      if (challenge.mode === 'debug') {
        comparisonExplanation = `Target (${target}) < arr[${mid}] (${midVal}). The buggy code moved right, which would eliminate the target! The correct algorithmic update is to search left by setting high = mid - 1.`;
        directionQuestion = 'Which pointer update fixes the search?';
      } else {
        comparisonExplanation = `The target (${target}) is less than arr[${mid}] (${midVal}). Because the array is sorted in ascending order, all elements at and to the right of mid are too large. The target must be in the left half.`;
        directionQuestion = 'Which half should we search?';
      }
    }
  }

  const comparison = {
    targetVal: target,
    midVal,
    symbol,
    expression,
    explanation: comparisonExplanation,
    directionQuestion,
    suggestedDirection:
      expectedAction === 'LEFT' || expectedAction === 'RIGHT'
        ? expectedAction
        : undefined,
  };

  // Build stage specific titles and guidance
  let title = '';
  let guidanceText = '';
  let instructionPrompt = '';
  let isWaitingForPlayer = false;
  let highlightConcept: 'range' | 'mid' | 'compare' | 'low' | 'high' | null = null;

  switch (subStage) {
    case 'EXPLAIN_RANGE':
      title = 'Step 1: Understand Search Range';
      guidanceText = isOutOfRange
        ? `Pointers have crossed: low (${low}) > high (${high}). The search interval contains 0 elements.`
        : `We are currently searching between LOW (index [${low}]) and HIGH (index [${high}]). The target must be somewhere inside this ${activeRangeCount}-element range.`;
      instructionPrompt = 'Click NEXT STEP to calculate the middle element for this range.';
      isWaitingForPlayer = false;
      highlightConcept = 'range';
      break;

    case 'CALCULATE_MID':
      title = 'Step 2: Calculate Middle Element';
      guidanceText = `Binary Search inspects the midpoint to divide the problem space in half. Using integer floor division: mid = Math.floor((${low} + ${high}) / 2) = [${mid}]. The value at index [${mid}] is ${midVal}.`;
      instructionPrompt = 'Click NEXT STEP to compare this middle value against our target.';
      isWaitingForPlayer = false;
      highlightConcept = 'mid';
      break;

    case 'COMPARE':
      title = 'Step 3: Compare Target with MID';
      isWaitingForPlayer = true;
      highlightConcept = 'compare';

      if (expectedAction === 'FOUND') {
        guidanceText = `arr[${mid}] is ${midVal}, matching target ${target}. The target has been located!`;
        instructionPrompt = 'YOUR TURN: Confirm that the target is found.';
      } else if (expectedAction === 'NOT_FOUND') {
        guidanceText = `low (${low}) > high (${high}). Pointers crossed with no matches found.`;
        instructionPrompt = 'YOUR TURN: Confirm that the target is not in the array.';
      } else if (expectedAction === 'RIGHT') {
        guidanceText = comparisonExplanation;
        instructionPrompt = 'YOUR TURN: Choose the correct half.';
      } else {
        guidanceText = comparisonExplanation;
        instructionPrompt = 'YOUR TURN: Choose the correct half.';
      }
      break;

    case 'ACTION_RESULT':
      title = 'Step 4: Update Boundary Pointers';
      isWaitingForPlayer = false;
      highlightConcept = lastSuccess?.pointerUpdated === 'LOW' ? 'low' : 'high';
      guidanceText =
        lastSuccess?.explanation ||
        `Boundary updated: ${lastSuccess?.formula}. Search range narrowed.`;
      instructionPrompt =
        'Click NEXT STEP to inspect the new search window and calculate the next midpoint.';
      break;

    case 'TARGET_FOUND':
      title = 'Target Located Successfully!';
      guidanceText = `Target ${target} was verified at index [${mid}]. The search has completed in logarithmic time!`;
      instructionPrompt = 'Challenge complete! Well done!';
      isWaitingForPlayer = false;
      highlightConcept = 'mid';
      break;

    case 'TARGET_NOT_FOUND':
      title = 'Target Absence Confirmed!';
      guidanceText = `The search space was completely exhausted (low: ${low} > high: ${high}). Target ${target} does not exist in the array.`;
      instructionPrompt = 'Target Not Found confirmed (returns -1).';
      isWaitingForPlayer = false;
      highlightConcept = null;
      break;
  }

  return {
    subStage,
    stepNumber,
    totalSteps,
    low,
    high,
    mid,
    target,
    array,
    activeRangeCount,
    isOutOfRange,
    expectedAction,
    title,
    guidanceText,
    instructionPrompt,
    isWaitingForPlayer,
    highlightConcept,
    midCalculation,
    comparison,
    boundaryUpdate: lastSuccess || undefined,
  };
}

// Backward-compatibility export for any legacy references
export interface GuidedStep {
  stepNumber: number;
  totalSteps: number;
  operation: string;
  displayLabel: string;
  actionExplanation: string;
  resultExplanation: string;
  conceptNote: string;
  resultingStack: (number | string)[];
  resultingTop: number | string | null;
  statusBadge?: string;
}
