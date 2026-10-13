import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Binary,
  RotateCcw,
  Sparkles,
  Trophy,
  Check,
  Film,
} from 'lucide-react';
import { soundManager } from '../../utils/audio';
import { useUserProgress } from '../../context/UserProgressContext';

export type VisualizerTopic =
  | 'bst-rule'
  | 'insertion'
  | 'search'
  | 'deletion'
  | 'traversal'
  // Legacy mappings for backwards compatibility
  | 'deletion-case-1'
  | 'deletion-case-2'
  | 'deletion-case-3'
  | 'inorder'
  | 'preorder'
  | 'postorder';

export type PlaySpeed = '0.5x' | '1x';

interface TreeNodeData {
  value: number;
  x: number;
  y: number;
  label?: string;
  status?: 'default' | 'active' | 'visited' | 'success' | 'danger' | 'successor';
}

interface TreeEdgeData {
  from: number;
  to: number;
  isHighlighted?: boolean;
}

interface AnimationStep {
  stepNumber: number;
  totalSteps: number;
  explanation: string;
  comparisonText?: string;
  comparisonDirection?: 'left' | 'right' | 'equal' | 'found' | 'none';
  nodes: TreeNodeData[];
  edges: TreeEdgeData[];
  traversalOutput?: number[];
  emptySlot?: { x: number; y: number; label: string } | null;
}

// Standard coordinates for [50, 30, 20, 40, 70]
const POS_50: TreeNodeData = { value: 50, x: 300, y: 55 };
const POS_30: TreeNodeData = { value: 30, x: 180, y: 140 };
const POS_70: TreeNodeData = { value: 70, x: 420, y: 140 };
const POS_20: TreeNodeData = { value: 20, x: 110, y: 225 };
const POS_40: TreeNodeData = { value: 40, x: 250, y: 225 };
const POS_60: TreeNodeData = { value: 60, x: 360, y: 225 };
const POS_35: TreeNodeData = { value: 35, x: 215, y: 305 };

const SPEED_MS: Record<PlaySpeed, number> = {
  '0.5x': 3600,
  '1x': 2200,
};

// 1. BST Rule Steps (5 steps)
function getBstRuleSteps(): AnimationStep[] {
  return [
    {
      stepNumber: 1,
      totalSteps: 5,
      explanation: 'Start with 50 as the root node of our Binary Search Tree.',
      comparisonText: 'Root Node: 50',
      comparisonDirection: 'none',
      nodes: [{ ...POS_50, status: 'active', label: 'Root' }],
      edges: [],
    },
    {
      stepNumber: 2,
      totalSteps: 5,
      explanation: '30 is smaller than 50, so it is placed on the left branch.',
      comparisonText: '30 < 50 → Go Left',
      comparisonDirection: 'left',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'active', label: 'Left' },
      ],
      edges: [{ from: 50, to: 30, isHighlighted: true }],
    },
    {
      stepNumber: 3,
      totalSteps: 5,
      explanation: '20 is less than 50, and 20 is less than 30, so it goes to the left of 30.',
      comparisonText: '20 < 50 → Left, 20 < 30 → Go Left',
      comparisonDirection: 'left',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'visited' },
        { ...POS_20, status: 'active', label: 'Left' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: true },
      ],
    },
    {
      stepNumber: 4,
      totalSteps: 5,
      explanation: '40 is less than 50, but 40 is greater than 30, so it goes to the right of 30.',
      comparisonText: '40 < 50 → Left, 40 > 30 → Go Right',
      comparisonDirection: 'right',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'visited' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'active', label: 'Right' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: true },
      ],
    },
    {
      stepNumber: 5,
      totalSteps: 5,
      explanation: '70 is greater than 50, so it is placed to the right of the root. The BST invariant holds!',
      comparisonText: '70 > 50 → Go Right',
      comparisonDirection: 'right',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'default' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'default' },
        { ...POS_70, status: 'success', label: 'Right' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: true },
      ],
    },
  ];
}

// 2. BST Insertion Steps (5 steps)
function getInsertionSteps(): AnimationStep[] {
  return [
    {
      stepNumber: 1,
      totalSteps: 5,
      explanation: 'Inserting 60: Compare 60 with root 50. Since 60 > 50, branch to the right child.',
      comparisonText: '60 > 50 → Go Right',
      comparisonDirection: 'right',
      nodes: [
        { ...POS_50, status: 'active', label: 'Compare' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: true },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
      ],
    },
    {
      stepNumber: 2,
      totalSteps: 5,
      explanation: 'Compare 60 with node 70. Since 60 < 70, branch to the left child.',
      comparisonText: '60 < 70 → Go Left',
      comparisonDirection: 'left',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'active', label: 'Compare' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: true },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
      ],
    },
    {
      stepNumber: 3,
      totalSteps: 5,
      explanation: 'The left pointer of 70 is null. Found target insertion slot!',
      comparisonText: 'Empty left-child slot under 70',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'visited' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: true },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
      ],
      emptySlot: { x: POS_60.x, y: POS_60.y, label: 'Insert 60' },
    },
    {
      stepNumber: 4,
      totalSteps: 5,
      explanation: 'Attach new node 60 as the left child of 70.',
      comparisonText: 'Attach 60 to node 70',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'visited' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'default' },
        { ...POS_60, status: 'success' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
        { from: 70, to: 60, isHighlighted: true },
      ],
    },
    {
      stepNumber: 5,
      totalSteps: 5,
      explanation: 'Node 60 is successfully inserted! The BST property remains fully preserved.',
      comparisonText: '60 inserted successfully!',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'default' },
        { ...POS_60, status: 'success' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
        { from: 70, to: 60, isHighlighted: false },
      ],
    },
  ];
}

// 3. BST Search Steps (3 steps)
function getSearchSteps(): AnimationStep[] {
  return [
    {
      stepNumber: 1,
      totalSteps: 3,
      explanation: 'Searching for 40: Compare target 40 with root 50. 40 < 50, so move Left.',
      comparisonText: '40 < 50 → Go Left',
      comparisonDirection: 'left',
      nodes: [
        { ...POS_50, status: 'active', label: 'Compare' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: true },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
      ],
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      explanation: 'Compare target 40 with node 30. 40 > 30, so move Right.',
      comparisonText: '40 > 30 → Go Right',
      comparisonDirection: 'right',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'active', label: 'Compare' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: true },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: true },
      ],
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      explanation: 'Compare target 40 with node 40. 40 == 40 → Target found in O(log N) time!',
      comparisonText: '40 = 40 → Value found!',
      comparisonDirection: 'found',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'visited' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'success', label: 'Found!' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: true },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: true },
      ],
    },
  ];
}

// 4. Unified BST Deletion (Cases 1, 2, and 3 as a single unit) - 13 steps
function getUnifiedDeletionSteps(): AnimationStep[] {
  const total = 13;
  return [
    // Case 1: Leaf Node Deletion (Steps 1 - 4)
    {
      stepNumber: 1,
      totalSteps: total,
      explanation: '[Case 1: Leaf Node] Locate node 20 to delete: 50 → 30 → 20.',
      comparisonText: 'Case 1: Locate leaf node 20',
      comparisonDirection: 'left',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'visited' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'active', label: 'Target' },
        { ...POS_40, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: true },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: true },
        { from: 30, to: 40, isHighlighted: false },
      ],
    },
    {
      stepNumber: 2,
      totalSteps: total,
      explanation: '[Case 1: Leaf Node] Node 20 has zero children (degree 0). It is a pure leaf.',
      comparisonText: 'Node 20 has 0 children (Leaf)',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'danger', label: 'Leaf' },
        { ...POS_40, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: true },
        { from: 30, to: 40, isHighlighted: false },
      ],
    },
    {
      stepNumber: 3,
      totalSteps: total,
      explanation: '[Case 1: Leaf Node] Set parent pointer (30.left) to null and remove node 20.',
      comparisonText: 'Disconnect parent pointer (30.left = null)',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { ...POS_30, status: 'active' },
        { ...POS_70, status: 'default' },
        { ...POS_40, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
      ],
    },
    {
      stepNumber: 4,
      totalSteps: total,
      explanation: '[Case 1 Complete] Leaf deletion is done with zero restructuring needed.',
      comparisonText: 'Case 1 Complete: Leaf removed',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'default' },
        { ...POS_40, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
      ],
    },

    // Case 2: One Child Deletion (Steps 5 - 8)
    {
      stepNumber: 5,
      totalSteps: total,
      explanation: '[Case 2: One Child] Locate node 40, which has exactly one child (35).',
      comparisonText: 'Case 2: Target 40 has 1 child (35)',
      comparisonDirection: 'right',
      nodes: [
        { ...POS_50, status: 'visited' },
        { ...POS_30, status: 'visited' },
        { ...POS_70, status: 'default' },
        { ...POS_40, status: 'active', label: 'Target' },
        { ...POS_35, status: 'default', label: 'Child (35)' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: true },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: true },
        { from: 40, to: 35, isHighlighted: false },
      ],
    },
    {
      stepNumber: 6,
      totalSteps: total,
      explanation: '[Case 2: One Child] Target 40 has exactly one child. Parent 30 must adopt child 35.',
      comparisonText: 'Bypass node 40: 30 adopts 35',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'default' },
        { ...POS_40, status: 'danger', label: 'Delete 40' },
        { ...POS_35, status: 'successor', label: 'Adopted' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
        { from: 40, to: 35, isHighlighted: true },
      ],
    },
    {
      stepNumber: 7,
      totalSteps: total,
      explanation: '[Case 2: One Child] Promote child 35 directly into 40’s position, bypassing 40.',
      comparisonText: 'Bypassing 40: 30.right = 35',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'default' },
        { value: 35, x: POS_40.x, y: POS_40.y, status: 'success' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 35, isHighlighted: true },
      ],
    },
    {
      stepNumber: 8,
      totalSteps: total,
      explanation: '[Case 2 Complete] Single-child bypass complete. BST ordering invariant is preserved.',
      comparisonText: 'Case 2 Complete: 30 → 35',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { ...POS_30, status: 'default' },
        { ...POS_70, status: 'default' },
        { value: 35, x: POS_40.x, y: POS_40.y, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 35, isHighlighted: false },
      ],
    },

    // Case 3: Two Children Deletion (Steps 9 - 13)
    {
      stepNumber: 9,
      totalSteps: total,
      explanation: '[Case 3: Two Children] Delete node 30, which has two children (20 and 40).',
      comparisonText: 'Case 3: Node 30 has 2 children',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { ...POS_30, status: 'danger', label: 'Delete 30' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'default' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: true },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: false },
      ],
    },
    {
      stepNumber: 10,
      totalSteps: total,
      explanation: '[Case 3: Two Children] Find the Inorder Successor (smallest value in the right subtree: node 40).',
      comparisonText: 'Inorder Successor = 40 (min of right)',
      comparisonDirection: 'right',
      nodes: [
        { ...POS_50, status: 'default' },
        { ...POS_30, status: 'danger', label: 'Replace 30' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'successor', label: 'Successor (40)' },
      ],
      edges: [
        { from: 50, to: 30, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 30, to: 20, isHighlighted: false },
        { from: 30, to: 40, isHighlighted: true },
      ],
    },
    {
      stepNumber: 11,
      totalSteps: total,
      explanation: '[Case 3: Two Children] Copy successor value (40) into the position of deleted node 30.',
      comparisonText: 'Copy 40 into node 30 position',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { value: 40, x: POS_30.x, y: POS_30.y, status: 'success', label: 'Copied 40' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'default' },
        { ...POS_40, status: 'danger', label: 'Remove duplicate' },
      ],
      edges: [
        { from: 50, to: 40, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 40, to: 20, isHighlighted: false },
      ],
    },
    {
      stepNumber: 12,
      totalSteps: total,
      explanation: '[Case 3: Two Children] Delete original successor node from its old spot (which is a leaf or 1-child).',
      comparisonText: 'Remove original successor node',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { value: 40, x: POS_30.x, y: POS_30.y, status: 'default' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'default' },
      ],
      edges: [
        { from: 50, to: 40, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 40, to: 20, isHighlighted: false },
      ],
    },
    {
      stepNumber: 13,
      totalSteps: total,
      explanation: '[All 3 Cases Complete] Leaf, One-Child, and Two-Children deletion mastered! Valid BST preserved.',
      comparisonText: 'All 3 Deletion Cases Mastered!',
      comparisonDirection: 'none',
      nodes: [
        { ...POS_50, status: 'default' },
        { value: 40, x: POS_30.x, y: POS_30.y, status: 'success' },
        { ...POS_70, status: 'default' },
        { ...POS_20, status: 'default' },
      ],
      edges: [
        { from: 50, to: 40, isHighlighted: false },
        { from: 50, to: 70, isHighlighted: false },
        { from: 40, to: 20, isHighlighted: false },
      ],
    },
  ];
}

// 5. Unified BST Traversals (Inorder, Preorder, Postorder) - 15 steps
function getUnifiedTraversalSteps(): AnimationStep[] {
  const baseNodes = [POS_50, POS_30, POS_70, POS_20, POS_40];
  const baseEdges = [
    { from: 50, to: 30, isHighlighted: false },
    { from: 50, to: 70, isHighlighted: false },
    { from: 30, to: 20, isHighlighted: false },
    { from: 30, to: 40, isHighlighted: false },
  ];
  const total = 15;

  // Inorder: 20, 30, 40, 50, 70
  const inorderOrder = [20, 30, 40, 50, 70];
  const inorderExplanations = [
    '[Inorder: Left → Root → Right] Visit leftmost node 20.',
    '[Inorder] Visit parent node 30.',
    '[Inorder] Visit right child of 30: node 40.',
    '[Inorder] Visit root node 50.',
    '[Inorder Complete] Visit right child 70. Notice output is in sorted ascending order!',
  ];

  // Preorder: 50, 30, 20, 40, 70
  const preorderOrder = [50, 30, 20, 40, 70];
  const preorderExplanations = [
    '[Preorder: Root → Left → Right] Visit root node 50 first.',
    '[Preorder] Visit left child 30.',
    '[Preorder] Visit left leaf 20.',
    '[Preorder] Visit right child 40.',
    '[Preorder Complete] Visit right subtree node 70.',
  ];

  // Postorder: 20, 40, 30, 70, 50
  const postorderOrder = [20, 40, 30, 70, 50];
  const postorderExplanations = [
    '[Postorder: Left → Right → Root] Visit bottom-left leaf 20 first.',
    '[Postorder] Visit bottom-right leaf 40.',
    '[Postorder] Visit parent node 30 after its children.',
    '[Postorder] Visit right child 70.',
    '[Postorder Complete] Visit root node 50 last. Ideal for tree deletion!',
  ];

  const steps: AnimationStep[] = [];

  // Inorder (1-5)
  inorderOrder.forEach((val, idx) => {
    const output = inorderOrder.slice(0, idx + 1);
    steps.push({
      stepNumber: idx + 1,
      totalSteps: total,
      explanation: inorderExplanations[idx],
      comparisonText: `Inorder: Visit ${val} (Left → Root → Right)`,
      comparisonDirection: 'none',
      nodes: baseNodes.map((n) => ({
        ...n,
        status: n.value === val ? 'success' : output.includes(n.value) ? 'visited' : 'default',
      })),
      edges: baseEdges,
      traversalOutput: output,
    });
  });

  // Preorder (6-10)
  preorderOrder.forEach((val, idx) => {
    const output = preorderOrder.slice(0, idx + 1);
    steps.push({
      stepNumber: idx + 6,
      totalSteps: total,
      explanation: preorderExplanations[idx],
      comparisonText: `Preorder: Visit ${val} (Root → Left → Right)`,
      comparisonDirection: 'none',
      nodes: baseNodes.map((n) => ({
        ...n,
        status: n.value === val ? 'success' : output.includes(n.value) ? 'visited' : 'default',
      })),
      edges: baseEdges,
      traversalOutput: output,
    });
  });

  // Postorder (11-15)
  postorderOrder.forEach((val, idx) => {
    const output = postorderOrder.slice(0, idx + 1);
    steps.push({
      stepNumber: idx + 11,
      totalSteps: total,
      explanation: postorderExplanations[idx],
      comparisonText: `Postorder: Visit ${val} (Left → Right → Root)`,
      comparisonDirection: 'none',
      nodes: baseNodes.map((n) => ({
        ...n,
        status: n.value === val ? 'success' : output.includes(n.value) ? 'visited' : 'default',
      })),
      edges: baseEdges,
      traversalOutput: output,
    });
  });

  return steps;
}

interface VideoPageProps {
  initialTopic?: VisualizerTopic;
}

export const VideoPage: React.FC<VideoPageProps> = ({ initialTopic }) => {
  const { completedVideos, completeVideo, visualizationPoints } = useUserProgress();

  // Normalize initial topic into one of the 5 canonical videos
  const normalizeTopic = (topic?: VisualizerTopic): VisualizerTopic => {
    if (!topic) return 'bst-rule';
    if (topic === 'deletion-case-1' || topic === 'deletion-case-2' || topic === 'deletion-case-3') {
      return 'deletion';
    }
    if (topic === 'inorder' || topic === 'preorder' || topic === 'postorder') {
      return 'traversal';
    }
    return topic;
  };

  const [activeTopic, setActiveTopic] = useState<VisualizerTopic>(normalizeTopic(initialTopic));
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<PlaySpeed>('1x');

  // Synchronize when initialTopic prop changes
  useEffect(() => {
    if (initialTopic) {
      setActiveTopic(normalizeTopic(initialTopic));
      setCurrentStepIndex(0);
      setIsPlaying(false);
    }
  }, [initialTopic]);

  // Compute steps deterministically for the 5 videos
  const steps: AnimationStep[] = useMemo(() => {
    switch (activeTopic) {
      case 'bst-rule':
        return getBstRuleSteps();
      case 'insertion':
        return getInsertionSteps();
      case 'search':
        return getSearchSteps();
      case 'deletion':
        return getUnifiedDeletionSteps();
      case 'traversal':
        return getUnifiedTraversalSteps();
      default:
        return getBstRuleSteps();
    }
  }, [activeTopic]);

  // The 5 Canonical Videos Definition (Each 4 points, Total 20 points)
  const videoCatalog = [
    {
      id: 'bst-rule',
      number: 1,
      title: 'BST Invariant Rule',
      subtitle: 'Left < Root < Right',
      points: 4,
      totalSteps: 5,
    },
    {
      id: 'insertion',
      number: 2,
      title: 'BST Node Insertion',
      subtitle: 'Path Trace & Leaf Slot',
      points: 4,
      totalSteps: 5,
    },
    {
      id: 'search',
      number: 3,
      title: 'BST Value Search',
      subtitle: 'Logarithmic O(log N)',
      points: 4,
      totalSteps: 3,
    },
    {
      id: 'deletion',
      number: 4,
      title: 'BST Deletion (Cases 1, 2 & 3)',
      subtitle: 'Leaf, 1-Child & Successor',
      points: 4,
      totalSteps: 13,
    },
    {
      id: 'traversal',
      number: 5,
      title: 'BST Traversals',
      subtitle: 'Inorder, Preorder, Postorder',
      points: 4,
      totalSteps: 15,
    },
  ];

  // Video Selection
  const handleSelectTopic = (newTopic: VisualizerTopic) => {
    soundManager.playClick();
    setActiveTopic(normalizeTopic(newTopic));
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Backward Navigation Only: Step Back (preserves playback state)
  const handleStepBack = () => {
    soundManager.playClick();
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  // Backward Navigation Only: Restart Video to beginning
  const handleRestartVideo = () => {
    soundManager.playClick();
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Play / Pause Toggle Handler
  const handlePlayPause = () => {
    soundManager.playClick();
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentStepIndex >= steps.length - 1) {
        setCurrentStepIndex(0);
      }
      setIsPlaying(true);
    }
  };

  // Auto-play timer loop (No skip/fast-forwarding allowed, standard pace)
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = SPEED_MS[speed];
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          soundManager.playStep();
          return prev + 1;
        } else {
          setIsPlaying(false);
          // Video fully finished
          return prev;
        }
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, speed, steps.length]);

  // Award points only when the video is fully completed
  const isCurrentVideoCompleted = (completedVideos || []).includes(activeTopic);
  const isAtFinalStep = currentStepIndex === steps.length - 1 && steps.length > 0;

  useEffect(() => {
    if (isAtFinalStep && !isCurrentVideoCompleted) {
      soundManager.playSuccess();
      completeVideo(activeTopic);
    }
  }, [isAtFinalStep, isCurrentVideoCompleted, activeTopic, completeVideo]);

  const currentStep = steps[currentStepIndex] || steps[0];

  const getNodeColor = (status?: TreeNodeData['status']) => {
    switch (status) {
      case 'active':
        return {
          fill: '#6366f1',
          stroke: '#c7d2fe',
          text: '#ffffff',
          halo: true,
        };
      case 'visited':
        return {
          fill: '#4338ca',
          stroke: '#a5b4fc',
          text: '#ffffff',
          halo: false,
        };
      case 'success':
        return {
          fill: '#059669',
          stroke: '#6ee7b7',
          text: '#ffffff',
          halo: false,
        };
      case 'danger':
        return {
          fill: '#e11d48',
          stroke: '#fda4af',
          text: '#ffffff',
          halo: true,
        };
      case 'successor':
        return {
          fill: '#0891b2',
          stroke: '#67e8f9',
          text: '#ffffff',
          halo: true,
        };
      default:
        return {
          fill: 'var(--node-fill, #1e293b)',
          stroke: 'var(--node-stroke, #475569)',
          text: 'var(--node-text, #f8fafc)',
          halo: false,
        };
    }
  };

  return (
    <div
      id="bst-visualizer-page"
      className="space-y-5 pb-12 [--node-fill:#ffffff] [--node-stroke:#cbd5e1] [--node-text:#1e293b] dark:[--node-fill:#0f172a] dark:[--node-stroke:#475569] dark:[--node-text:#f8fafc]"
    >
      {/* Top Points Summary Banner */}
      <div className="bg-white dark:bg-[#0b0f19] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-indigo-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Visualization Section (5 Videos)
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Watch each video until completion to earn 4 points per video. Total: 20 points.
            </p>
          </div>
        </div>

        {/* Live Visualization Points Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs flex items-center gap-1.5 shadow-2xs">
            <Trophy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Visualization Points: {visualizationPoints} / 20 pts</span>
          </div>
        </div>
      </div>

      {/* 5 Video Cards Grid (Each clearly displaying points available "+4 pts") */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {videoCatalog.map((vid) => {
          const isActive = activeTopic === vid.id;
          const isDone = (completedVideos || []).includes(vid.id);

          return (
            <button
              key={vid.id}
              onClick={() => handleSelectTopic(vid.id as VisualizerTopic)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                isActive
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 dark:border-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                  : isDone
                  ? 'bg-white dark:bg-[#0b0f19] border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-400'
                  : 'bg-white dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              {/* Card Header with Video # and Points Badge */}
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Video {vid.number}
                </span>

                {isDone ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-2xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>+4 pts</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                    +4 pts
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {vid.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {vid.subtitle}
                </p>
              </div>

              {/* Status Footer */}
              <div className="flex items-center justify-between text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span>{vid.totalSteps} steps</span>
                {isDone ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Completed</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">Unwatched</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Animation Area */}
      <div className="bg-white dark:bg-[#0b0f19] rounded-2xl border border-slate-200 dark:border-indigo-900/30 p-4 sm:p-6 shadow-xs flex flex-col items-center justify-between min-h-[350px] space-y-4">
        {/* Step Indicator & Direction Banner */}
        <div className="w-full flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 flex-wrap">
          <div className="flex items-center gap-2.5 font-mono text-xs flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-black text-white dark:bg-black dark:text-white font-mono font-black text-xs border-2 border-black dark:border-slate-700 shadow-sm">
              Step {currentStep?.stepNumber || 1} of {currentStep?.totalSteps || 1}
            </span>
            {currentStep?.comparisonText && (
              <span className="px-3 py-1.5 rounded-xl bg-black text-white dark:bg-black dark:text-white border-2 border-black dark:border-slate-700 font-mono font-black text-xs tracking-wide shadow-sm flex items-center gap-2">
                {currentStep.comparisonDirection === 'left' && (
                  <ArrowLeft className="w-3.5 h-3.5 text-white" />
                )}
                {currentStep.comparisonDirection === 'right' && (
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                )}
                {currentStep.comparisonDirection === 'found' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{currentStep.comparisonText}</span>
              </span>
            )}
          </div>

          {/* Current Video Points Indicator */}
          <div className="flex items-center gap-1.5">
            {isCurrentVideoCompleted ? (
              <span className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Earned: 4/4 pts</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-xl text-xs font-bold font-mono bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                Points Available: +4 pts
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Responsive SVG Tree Area */}
        <div className="w-full flex items-center justify-center overflow-x-auto py-2">
          <svg
            viewBox="0 0 600 350"
            className="w-full max-w-[600px] h-[270px] sm:h-[310px] select-none"
          >
            {/* Edges */}
            {currentStep?.edges?.map((edge, idx) => {
              const fromNode = currentStep.nodes.find((n) => n.value === edge.from);
              const toNode = currentStep.nodes.find((n) => n.value === edge.to);
              if (!fromNode || !toNode) return null;

              return (
                <line
                  key={`edge-${idx}-${edge.from}-${edge.to}`}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={edge.isHighlighted ? '#6366f1' : '#cbd5e1'}
                  strokeWidth={edge.isHighlighted ? 3.5 : 2}
                  className="transition-all duration-300 dark:stroke-slate-700"
                  strokeDasharray={edge.isHighlighted ? '4 2' : 'none'}
                />
              );
            })}

            {/* Empty Slot Indicator */}
            {currentStep?.emptySlot && (
              <g
                transform={`translate(${currentStep.emptySlot.x}, ${currentStep.emptySlot.y})`}
                className="animate-pulse"
              >
                <circle
                  r={22}
                  fill="none"
                  stroke="#000000"
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                  className="dark:stroke-slate-300"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs font-mono fill-black dark:fill-white font-black"
                >
                  {currentStep.emptySlot.label || 'Null'}
                </text>
              </g>
            )}

            {/* Nodes */}
            {currentStep?.nodes?.map((node) => {
              const style = getNodeColor(node.status);
              return (
                <g
                  key={`node-${node.value}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="transition-transform duration-300"
                >
                  {/* Halo */}
                  {style.halo && (
                    <circle
                      r={29}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      className="opacity-80"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={22}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={2.5}
                    className="shadow-sm transition-colors duration-300"
                  />

                  {/* Node Value */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={style.text}
                    className="text-sm font-mono font-extrabold select-none pointer-events-none"
                  >
                    {node.value}
                  </text>

                  {/* Highlight Note Label below node */}
                  {node.label && node.label.trim() !== String(node.value) && (() => {
                    const badgeWidth = Math.max(node.label.length * 8.5 + 22, 54);
                    return (
                      <g transform="translate(0, 36)" className="select-none pointer-events-none">
                        <polygon
                          points="-5,-11 0,-15 5,-11"
                          fill="#000000"
                          stroke="#000000"
                          strokeWidth={1}
                        />
                        <rect
                          x={-badgeWidth / 2}
                          y={-11}
                          width={badgeWidth}
                          height={22}
                          rx={6}
                          fill="#000000"
                          stroke="#000000"
                          strokeWidth={2}
                          className="dark:stroke-slate-600"
                        />
                        <text
                          x={0}
                          y={1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          className="text-[11.5px] font-mono font-black select-none pointer-events-none tracking-wider uppercase"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Traversal Output Sequence if present */}
        {currentStep?.traversalOutput && (
          <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Traversal Output Sequence
            </span>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {currentStep.traversalOutput.map((val, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-700 flex items-center justify-center font-mono font-bold text-sm text-indigo-700 dark:text-indigo-300 shadow-2xs"
                >
                  {val}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Fully Completed Banner */}
        {isAtFinalStep && (
          <div className="w-full p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold shadow-2xs animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Video Completed! +4 Visualization Points Awarded (Saved to Progress).</span>
          </div>
        )}
      </div>

      {/* Short Explanation Card ("What is happening?") */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-indigo-900/30 space-y-1 shadow-xs">
        <span className="text-xs font-mono font-black uppercase tracking-wider text-black dark:text-white">
          What is happening?
        </span>
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
          {currentStep?.explanation || 'Loading step explanation...'}
        </p>
      </div>

      {/* Animation Controls: Backward navigation ONLY (No skip or forward allowed), Play/Pause */}
      <div className="bg-white dark:bg-[#0b0f19] p-4 rounded-2xl border border-slate-200 dark:border-indigo-900/30 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Playback Controls */}
        <div className="flex items-center gap-2.5">
          {/* Play / Pause Toggle Button */}
          <button
            onClick={handlePlayPause}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-indigo-600/25 cursor-pointer active:scale-95"
            title={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{currentStepIndex >= steps.length - 1 ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          {/* Backward Navigation: Previous Step */}
          <button
            onClick={handleStepBack}
            disabled={currentStepIndex === 0}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Step backward to rewatch previous step"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Step Back</span>
          </button>

          {/* Backward Navigation: Restart to beginning */}
          <button
            onClick={handleRestartVideo}
            disabled={currentStepIndex === 0}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Rewind to start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rewind</span>
          </button>
        </div>

        {/* Speed Controls: 0.5x, 1x only (No fast-forwarding >1x) */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 dark:text-slate-400 font-bold">Playback Speed:</span>
          <div className="flex items-center gap-1">
            {(['0.5x', '1x'] as const).map((spd) => {
              const isSpdActive = speed === spd;
              return (
                <button
                  key={spd}
                  onClick={() => {
                    soundManager.playClick();
                    setSpeed(spd);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSpdActive
                      ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {spd === '1x' ? '1x (Normal)' : '0.5x (Slow)'}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const VisualizePage = VideoPage;
