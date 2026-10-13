import { LevelConfig, TableSlot, GameState, ProbeStep } from '../types/game';
import {
  calculateBaseHash,
  calculateH2,
  isSlotOccupied,
} from './hashAlgorithms';

export type GuidedActionType =
  | 'CALCULATE'
  | 'PLACE'
  | 'PROCEED_COLLISION'
  | 'NEXT_PROBE'
  | 'CONFIRM_PROBE'
  | 'COMPLETE';

export interface GuidedStepInfo {
  currentStep: number;
  totalSteps: number;
  title: string;
  badge: string;
  formulaStr: string;
  explanation: string;
  actionType: GuidedActionType;
  actionLabel: string;
  targetSlotIndex: number | null;
  isComplete: boolean;
}

/**
 * Simulates full level execution from empty state to compute total steps
 * and determines current step number and step details accurately.
 */
export function getGuidedSolveStepInfo(
  level: LevelConfig,
  slots: TableSlot[],
  keySequenceIndex: number,
  currentKey: number | null,
  calculatedIndex: number | null,
  gameState: GameState,
  isProbing: boolean,
  currentProbeStepIndex: number,
  probeSteps: ProbeStep[]
): GuidedStepInfo {
  const m = level.tableSize || 10;
  const keys = level.keysSequence;

  // 1. Simulate the entire level to determine total logical steps and prior completed steps
  let totalLevelSteps = 0;
  let stepsCompletedBeforeCurrentKey = 0;

  const simSlots: boolean[] = Array(m).fill(false);

  for (let kIdx = 0; kIdx < keys.length; kIdx++) {
    const k = keys[kIdx];
    const baseH = calculateBaseHash(k, m);
    let keySteps = 0;

    // Step 1: Calculate hash
    keySteps++;

    if (level.technique === 'chaining') {
      // Step 2: Place in bucket
      keySteps++;
      simSlots[baseH] = true;
    } else {
      if (!simSlots[baseH]) {
        // Step 2: Place in empty slot
        keySteps++;
        simSlots[baseH] = true;
      } else {
        // Collision
        if (level.id === 1) {
          // Level 1: Step 2 detect collision, Step 3 proceed/complete
          keySteps += 2;
        } else {
          // Open Addressing Probing:
          // Step 2: Detect collision & initiate probing
          keySteps++;

          // Probe sequence
          const pSteps: number[] = [];
          if (level.technique === 'linear') {
            for (let i = 0; i < m; i++) {
              const target = (baseH + i) % m;
              pSteps.push(target);
              if (!simSlots[target]) break;
            }
          } else if (level.technique === 'quadratic') {
            for (let i = 0; i < m; i++) {
              const target = (baseH + i * i) % m;
              pSteps.push(target);
              if (!simSlots[target]) break;
            }
          } else if (level.technique === 'double_hashing') {
            const h2 = calculateH2(k, undefined, m);
            for (let i = 0; i < m; i++) {
              const target = (baseH + i * h2) % m;
              pSteps.push(target);
              if (!simSlots[target]) break;
            }
          }

          // Each occupied probe step is 1 action (next probe), final empty is 1 action (confirm insert)
          const occupiedCount = pSteps.length > 0 ? pSteps.length - 1 : 0;
          keySteps += occupiedCount + 1;

          const finalTarget = pSteps[pSteps.length - 1];
          if (finalTarget !== undefined) {
            simSlots[finalTarget] = true;
          }
        }
      }
    }

    if (kIdx < keySequenceIndex) {
      stepsCompletedBeforeCurrentKey += keySteps;
    }
    totalLevelSteps += keySteps;
  }

  // 2. Determine current step within the active key
  let currentKeyStepOffset = 1;

  if (gameState === 'LEVEL_COMPLETE') {
    return {
      currentStep: totalLevelSteps,
      totalSteps: totalLevelSteps,
      title: 'Level Complete!',
      badge: 'Goal Achieved',
      formulaStr: level.formulaDisplay,
      explanation: `All keys in ${level.title} have been correctly placed into the hash table!`,
      actionType: 'COMPLETE',
      actionLabel: 'Level Completed',
      targetSlotIndex: null,
      isComplete: true,
    };
  }

  if (currentKey === null) {
    return {
      currentStep: 1,
      totalSteps: totalLevelSteps,
      title: 'Initialize Level',
      badge: 'Start',
      formulaStr: level.formulaDisplay,
      explanation: `Prepare to hash keys for ${level.title}.`,
      actionType: 'CALCULATE',
      actionLabel: 'Start Step',
      targetSlotIndex: null,
      isComplete: false,
    };
  }

  const baseHash = calculateBaseHash(currentKey, m);

  // Case A: Calculate Hash
  if (calculatedIndex === null || gameState === 'KEY_APPEARS' || gameState === 'INTRO') {
    currentKeyStepOffset = 1;
    const currentStepNum = Math.min(stepsCompletedBeforeCurrentKey + currentKeyStepOffset, totalLevelSteps);

    let formulaStr = `h(${currentKey}) = ${currentKey} % ${m} = ${baseHash}`;
    let explanation = `The hash function h(k) = k % ${m} maps key ${currentKey} to an array index. Compute ${currentKey} % ${m} = ${baseHash} to locate its target slot.`;

    if (level.technique === 'chaining') {
      formulaStr = `h(${currentKey}) = ${currentKey} % ${m} = ${baseHash}`;
      explanation = `Compute the bucket index for key ${currentKey}: ${currentKey} % ${m} = ${baseHash}. All keys mapping to this index will link into bucket [${baseHash < 10 ? `0${baseHash}` : baseHash}].`;
    } else if (level.technique === 'double_hashing') {
      const h2 = calculateH2(currentKey, undefined, m);
      formulaStr = `h1(${currentKey}) = ${currentKey} % ${m} = ${baseHash} | h2(${currentKey}) = 7 - (${currentKey} % 7) = ${h2}`;
      explanation = `Compute the primary index h1(${currentKey}) = ${currentKey} % ${m} = ${baseHash}. If slot [${baseHash < 10 ? `0${baseHash}` : baseHash}] is occupied, step size will be h2 = ${h2}.`;
    }

    return {
      currentStep: currentStepNum,
      totalSteps: totalLevelSteps,
      title: `Compute Hash: Key ${currentKey}`,
      badge: `Key ${keySequenceIndex + 1} of ${keys.length}`,
      formulaStr,
      explanation,
      actionType: 'CALCULATE',
      actionLabel: 'Calculate Hash',
      targetSlotIndex: baseHash,
      isComplete: false,
    };
  }

  // Case B: Slot checking / placement
  if (!isProbing && gameState !== 'COLLISION_PAUSE') {
    currentKeyStepOffset = 2;
    const currentStepNum = Math.min(stepsCompletedBeforeCurrentKey + currentKeyStepOffset, totalLevelSteps);
    const targetSlot = calculatedIndex;
    const slotData = slots[targetSlot];
    const isOccupied = slotData && slotData.items.length > 0;

    if (level.technique === 'chaining') {
      const existingItems = slotData?.items || [];
      const isChained = existingItems.length > 0;
      const formulaStr = `Bucket[${targetSlot}].append(${currentKey})`;
      const explanation = isChained
        ? `Bucket [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}] already contains key(s) ${existingItems.map((it) => it.value).join(', ')}. Separate Chaining resolves this collision by linking key ${currentKey} onto the existing bucket chain.`
        : `Bucket [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}] is empty. Place key ${currentKey} as the head node of this bucket chain.`;

      return {
        currentStep: currentStepNum,
        totalSteps: totalLevelSteps,
        title: `Insert Key ${currentKey} into Bucket [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}]`,
        badge: isChained ? 'Chain Attachment' : 'Direct Insert',
        formulaStr,
        explanation,
        actionType: 'PLACE',
        actionLabel: isChained ? 'Attach to Chain' : 'Place in Bucket',
        targetSlotIndex: targetSlot,
        isComplete: false,
      };
    }

    if (!isOccupied) {
      const formulaStr = `Slot[${targetSlot}] = ${currentKey}`;
      const explanation = `Slot [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}] is empty. Insert key ${currentKey} directly into this slot without any collision.`;

      return {
        currentStep: currentStepNum,
        totalSteps: totalLevelSteps,
        title: `Place Key ${currentKey} in Slot [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}]`,
        badge: 'Empty Slot',
        formulaStr,
        explanation,
        actionType: 'PLACE',
        actionLabel: `Insert into Slot [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}]`,
        targetSlotIndex: targetSlot,
        isComplete: false,
      };
    } else {
      // Occupied -> Collision
      const existingKey = slotData.items[0]?.value;
      const formulaStr = `Slot[${targetSlot}] occupied by ${existingKey} (Collision!)`;
      const techName =
        level.technique === 'linear'
          ? 'Linear Probing (+1)'
          : level.technique === 'quadratic'
          ? 'Quadratic Probing (+i²)'
          : level.technique === 'double_hashing'
          ? 'Double Hashing (+i × h2)'
          : 'Collision Detection';

      const explanation = `Slot [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}] is already occupied by key ${existingKey}! Because both keys map to remainder ${targetSlot}, a collision occurs. ${
        level.id === 1
          ? 'Notice how without resolution, keys collide.'
          : `Initiate ${techName} to search for the next open slot.`
      }`;

      return {
        currentStep: currentStepNum,
        totalSteps: totalLevelSteps,
        title: `Collision at Slot [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}]`,
        badge: 'Collision Detected',
        formulaStr,
        explanation,
        actionType: 'PLACE',
        actionLabel: level.id === 1 ? 'Detect Collision' : 'Begin Probing',
        targetSlotIndex: targetSlot,
        isComplete: false,
      };
    }
  }

  // Case C: Level 1 Collision Pause Modal
  if (gameState === 'COLLISION_PAUSE' && level.id === 1) {
    currentKeyStepOffset = 3;
    const currentStepNum = Math.min(stepsCompletedBeforeCurrentKey + currentKeyStepOffset, totalLevelSteps);

    return {
      currentStep: currentStepNum,
      totalSteps: totalLevelSteps,
      title: 'Collision Conflict Identified',
      badge: 'Level 1 Completion',
      formulaStr: `Collision on Slot [${calculatedIndex}]: 23 vs 33`,
      explanation: `In basic hashing without a collision resolution strategy, multiple keys mapping to index ${calculatedIndex} overwrite each other. Complete Level 1 to unlock resolution methods!`,
      actionType: 'PROCEED_COLLISION',
      actionLabel: 'Complete Level 1',
      targetSlotIndex: calculatedIndex,
      isComplete: false,
    };
  }

  // Case D: Probing Interaction (Levels 3, 4, 5)
  if (isProbing || gameState === 'PROBING_INTERACTION') {
    const probeStep = probeSteps[currentProbeStepIndex];
    const stepIdx = currentProbeStepIndex;
    const targetSlot = probeStep ? probeStep.targetIndex : calculatedIndex!;
    const isOccupied = probeStep ? probeStep.isOccupied : true;

    // Offset: 1 (calc) + 1 (detect collision) + stepIdx + 1 (current probe action)
    currentKeyStepOffset = 2 + stepIdx + 1;
    const currentStepNum = Math.min(stepsCompletedBeforeCurrentKey + currentKeyStepOffset, totalLevelSteps);

    if (isOccupied) {
      const nextStepIdx = stepIdx + 1;
      let nextTarget = targetSlot;
      let jumpFormula = '';

      if (level.technique === 'linear') {
        nextTarget = (baseHash + nextStepIdx) % m;
        jumpFormula = `(${baseHash} + ${nextStepIdx}) % ${m} = ${nextTarget}`;
      } else if (level.technique === 'quadratic') {
        const jump = nextStepIdx * nextStepIdx;
        nextTarget = (baseHash + jump) % m;
        jumpFormula = `(${baseHash} + ${nextStepIdx}²) % ${m} = (${baseHash} + ${jump}) % ${m} = ${nextTarget}`;
      } else if (level.technique === 'double_hashing') {
        const h2 = calculateH2(currentKey, undefined, m);
        nextTarget = (baseHash + nextStepIdx * h2) % m;
        jumpFormula = `(${baseHash} + ${nextStepIdx} × ${h2}) % ${m} = ${nextTarget}`;
      }

      const existingKey = slots[targetSlot]?.items[0]?.value;

      return {
        currentStep: currentStepNum,
        totalSteps: totalLevelSteps,
        title: `Probe Step #${stepIdx}: Slot [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}] Occupied`,
        badge: `Probe Attempt #${stepIdx}`,
        formulaStr: probeStep?.calculationStr || `Step #${stepIdx}`,
        explanation: `Slot [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}] is occupied by key ${existingKey}. Advance to probe step #${nextStepIdx} (${jumpFormula}) to test slot [${nextTarget < 10 ? `0${nextTarget}` : nextTarget}].`,
        actionType: 'NEXT_PROBE',
        actionLabel: `Test Next Slot [${nextTarget < 10 ? `0${nextTarget}` : nextTarget}]`,
        targetSlotIndex: targetSlot,
        isComplete: false,
      };
    } else {
      // Empty slot reached!
      return {
        currentStep: currentStepNum,
        totalSteps: totalLevelSteps,
        title: `Probe Step #${stepIdx}: Empty Slot Found!`,
        badge: 'Resolved Position',
        formulaStr: probeStep?.calculationStr || `Slot [${targetSlot}] Empty`,
        explanation: `Open slot [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}] located! The collision resolution sequence successfully found a valid insertion position for key ${currentKey}.`,
        actionType: 'CONFIRM_PROBE',
        actionLabel: `Insert Key ${currentKey} into Slot [${targetSlot < 10 ? `0${targetSlot}` : targetSlot}]`,
        targetSlotIndex: targetSlot,
        isComplete: false,
      };
    }
  }

  // Fallback
  return {
    currentStep: 1,
    totalSteps: totalLevelSteps,
    title: `Solve Level: ${level.title}`,
    badge: 'In Progress',
    formulaStr: level.formulaDisplay,
    explanation: `Follow the guided sequence to complete ${level.title}.`,
    actionType: 'CALCULATE',
    actionLabel: 'Next Step',
    targetSlotIndex: null,
    isComplete: false,
  };
}
