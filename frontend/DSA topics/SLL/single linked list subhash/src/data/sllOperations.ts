import { SLLNode, SLLPointerState } from '../types/sllGame';

export interface SLLOperationStep {
  stepIndex: number;
  instruction: string;
  actionHint: string;
  expectedAction: string;
  targetAddress?: number;
}

export interface SLLOperationDef {
  id: string;
  levelId: number;
  title: string;
  shortDesc: string;
  timeComplexity: string;
  spaceComplexity: string;
  badgeColor: string;
  iconName: 'plus' | 'link' | 'arrow-right' | 'trash' | 'eye' | 'search' | 'zap';
  initialNodes: SLLNode[];
  initialPointers: SLLPointerState;
  initialStagedNode: SLLNode | null;
  targetValue?: number;
  steps: SLLOperationStep[];
  conceptExplanation: string;
  pointerRule: string;
  xpReward: number;
}

export const SLL_OPERATIONS: Record<string, SLLOperationDef> = {
  // =========================================================================
  // LEVEL 1: CREATION & INSERTION
  // =========================================================================
  L1_CREATE: {
    id: 'L1_CREATE',
    levelId: 1,
    title: 'Create & Allocate Node',
    shortDesc: 'Allocate memory for a new node storing DATA = 25 and NEXT = NULL.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    badgeColor: 'blue',
    iconName: 'plus',
    initialNodes: [
      { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
      { id: 'n2', data: 20, address: 1002, nextAddress: 1003 },
      { id: 'n3', data: 30, address: 1003, nextAddress: 1004 },
      { id: 'n4', data: 40, address: 1004, nextAddress: null },
    ],
    initialPointers: {
      headAddress: 1001,
      tailAddress: 1004,
      currentAddress: null,
      tempAddress: null,
      prevAddress: null,
    },
    initialStagedNode: null,
    steps: [
      {
        stepIndex: 0,
        instruction: 'Click "ALLOCATE NODE [ 25 ]" to allocate memory in Heap.',
        actionHint: 'A new node is created with DATA = 25 and its NEXT pointer initialized to NULL.',
        expectedAction: 'ALLOCATE_25',
      },
    ],
    conceptExplanation: 'Node creation in Heap memory takes constant O(1) time. Every new node must store DATA and initialize NEXT to NULL.',
    pointerRule: 'new_node = malloc(sizeof(Node)); new_node->data = 25; new_node->next = NULL;',
    xpReward: 30,
  },

  L1_INSERT_BEG: {
    id: 'L1_INSERT_BEG',
    levelId: 1,
    title: 'Insert at Beginning (Head)',
    shortDesc: 'Link new node 25 to HEAD (1001), then update HEAD pointer to 1005.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    badgeColor: 'violet',
    iconName: 'arrow-right',
    initialNodes: [
      { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
      { id: 'n2', data: 20, address: 1002, nextAddress: 1003 },
      { id: 'n3', data: 30, address: 1003, nextAddress: 1004 },
      { id: 'n4', data: 40, address: 1004, nextAddress: null },
    ],
    initialPointers: {
      headAddress: 1001,
      tailAddress: 1004,
      currentAddress: null,
      tempAddress: null,
      prevAddress: null,
    },
    initialStagedNode: {
      id: 'n25',
      data: 25,
      address: 1005,
      nextAddress: null,
    },
    steps: [
      {
        stepIndex: 0,
        instruction: 'Step 1: Link new node 25 to the current HEAD (1001). Click Node 10 or click "Link 25.NEXT = 1001".',
        actionHint: 'Always wire new_node.next before moving HEAD to avoid losing reference to the rest of the list.',
        expectedAction: 'LINK_BEG_NEXT',
        targetAddress: 1001,
      },
      {
        stepIndex: 1,
        instruction: 'Step 2: Update HEAD pointer to point to the new node at Address 1005. Click Node 25 or click "Update HEAD = 1005".',
        actionHint: 'HEAD now marks the new first node of the singly linked list.',
        expectedAction: 'UPDATE_HEAD_1005',
        targetAddress: 1005,
      },
    ],
    conceptExplanation: 'Insertion at the beginning runs in O(1) constant time regardless of list size because no elements need shifting.',
    pointerRule: 'new_node->next = head; head = new_node;',
    xpReward: 35,
  },

  L1_INSERT_END: {
    id: 'L1_INSERT_END',
    levelId: 1,
    title: 'Insert at End (Tail)',
    shortDesc: 'Connect old tail 40.NEXT to address 1006, then update TAIL to 1006.',
    timeComplexity: 'O(1) with TAIL / O(N) without',
    spaceComplexity: 'O(1)',
    badgeColor: 'emerald',
    iconName: 'link',
    initialNodes: [
      { id: 'n25', data: 25, address: 1005, nextAddress: 1001 },
      { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
      { id: 'n2', data: 20, address: 1002, nextAddress: 1003 },
      { id: 'n3', data: 30, address: 1003, nextAddress: 1004 },
      { id: 'n4', data: 40, address: 1004, nextAddress: null },
    ],
    initialPointers: {
      headAddress: 1005,
      tailAddress: 1004,
      currentAddress: null,
      tempAddress: null,
      prevAddress: null,
    },
    initialStagedNode: {
      id: 'n50',
      data: 50,
      address: 1006,
      nextAddress: null,
    },
    steps: [
      {
        stepIndex: 0,
        instruction: 'Step 1: Connect the current last node (Node 40) NEXT pointer to 1006. Click Node 40 or click "Link Tail.NEXT = 1006".',
        actionHint: 'Update Node 40 next pointer from NULL to address 1006.',
        expectedAction: 'LINK_TAIL_NEXT',
        targetAddress: 1004,
      },
      {
        stepIndex: 1,
        instruction: 'Step 2: Update TAIL pointer to the new node at 1006. Click Node 50 or click "Update TAIL = 1006".',
        actionHint: 'TAIL now directly references the newly appended last node.',
        expectedAction: 'UPDATE_TAIL_1006',
        targetAddress: 1006,
      },
    ],
    conceptExplanation: 'When maintaining a direct TAIL pointer, inserting at the end is O(1) constant time.',
    pointerRule: 'tail->next = new_node; tail = new_node;',
    xpReward: 35,
  },

  // =========================================================================
  // LEVEL 2: DELETION OPERATIONS
  // =========================================================================
  L2_DEL_BEG: {
    id: 'L2_DEL_BEG',
    levelId: 2,
    title: 'Delete at Beginning (Head)',
    shortDesc: 'Advance HEAD pointer to the second node, then release memory of the old head.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    badgeColor: 'rose',
    iconName: 'trash',
    initialNodes: [
      { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
      { id: 'n2', data: 20, address: 1002, nextAddress: 1003 },
      { id: 'n3', data: 30, address: 1003, nextAddress: 1004 },
      { id: 'n4', data: 40, address: 1004, nextAddress: null },
    ],
    initialPointers: {
      headAddress: 1001,
      tailAddress: 1004,
      currentAddress: null,
      tempAddress: null,
      prevAddress: null,
    },
    initialStagedNode: null,
    steps: [
      {
        stepIndex: 0,
        instruction: 'Step 1: Advance HEAD pointer to HEAD.next (Address 1002). Click Node 20 or click "Advance HEAD = 1002".',
        actionHint: 'Move HEAD to the second node so you maintain access to the rest of the list.',
        expectedAction: 'ADVANCE_HEAD_1002',
        targetAddress: 1002,
      },
      {
        stepIndex: 1,
        instruction: 'Step 2: Free detached memory of old head (Node 10 at 1001). Click Node 10 or click "Free Node 10".',
        actionHint: 'Deallocate the detached node memory to prevent memory leaks.',
        expectedAction: 'FREE_NODE_1001',
        targetAddress: 1001,
      },
    ],
    conceptExplanation: 'Deleting the head node takes O(1) time because no search or pointer traversal is required.',
    pointerRule: 'temp = head; head = head->next; free(temp);',
    xpReward: 50,
  },

  L2_DEL_END: {
    id: 'L2_DEL_END',
    levelId: 2,
    title: 'Delete at End (Tail)',
    shortDesc: 'Traverse to the second-to-last node, set its NEXT to NULL, and free the last node.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    badgeColor: 'amber',
    iconName: 'trash',
    initialNodes: [
      { id: 'n2', data: 20, address: 1002, nextAddress: 1003 },
      { id: 'n3', data: 30, address: 1003, nextAddress: 1004 },
      { id: 'n4', data: 40, address: 1004, nextAddress: null },
    ],
    initialPointers: {
      headAddress: 1002,
      tailAddress: 1004,
      currentAddress: null,
      tempAddress: null,
      prevAddress: null,
    },
    initialStagedNode: null,
    steps: [
      {
        stepIndex: 0,
        instruction: 'Step 1: Disconnect the last node by setting second-to-last node (Node 30) NEXT = NULL. Click Node 30 or click "Set 30.NEXT = NULL".',
        actionHint: 'Traverse to the node right before the tail and sever the link to the tail.',
        expectedAction: 'SEVER_TAIL_LINK',
        targetAddress: 1003,
      },
      {
        stepIndex: 1,
        instruction: 'Step 2: Free the detached Node 40 and update TAIL = 1003. Click Node 40 or click "Free Tail Node 40".',
        actionHint: 'Deallocate the last node and update TAIL to address 1003.',
        expectedAction: 'FREE_TAIL_1004',
        targetAddress: 1004,
      },
    ],
    conceptExplanation: 'Deleting the last node in a singly linked list requires O(N) time because we must traverse from HEAD to find the second-to-last node.',
    pointerRule: 'prev->next = NULL; free(tail); tail = prev;',
    xpReward: 50,
  },

  // =========================================================================
  // LEVEL 3: SEQUENTIAL TRAVERSAL
  // =========================================================================
  L3_INTERACTIVE_TRAVERSAL: {
    id: 'L3_INTERACTIVE_TRAVERSAL',
    levelId: 3,
    title: 'Interactive Click Traversal',
    shortDesc: 'Step through every node in order by clicking the matching NEXT address node in the workspace.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    badgeColor: 'blue',
    iconName: 'eye',
    initialNodes: [
      { id: 'n1', data: 10, address: 2001, nextAddress: 2002 },
      { id: 'n2', data: 20, address: 2002, nextAddress: 2003 },
      { id: 'n3', data: 30, address: 2003, nextAddress: 2004 },
      { id: 'n4', data: 40, address: 2004, nextAddress: 2005 },
      { id: 'n5', data: 50, address: 2005, nextAddress: null },
    ],
    initialPointers: {
      headAddress: 2001,
      tailAddress: 2005,
      currentAddress: 2001,
      tempAddress: null,
      prevAddress: null,
    },
    initialStagedNode: null,
    steps: [
      {
        stepIndex: 0,
        instruction: 'CURRENT is at HEAD (2001, Node 10). Read NEXT (2002) and click Node 20 (2002) in the workspace.',
        actionHint: 'Follow the NEXT pointer stored in Node 10.',
        expectedAction: 'VISIT_2002',
        targetAddress: 2002,
      },
      {
        stepIndex: 1,
        instruction: 'CURRENT is at 2002 (Node 20). Read NEXT (2003) and click Node 30 (2003).',
        actionHint: 'Follow NEXT pointer: CURRENT = CURRENT.next.',
        expectedAction: 'VISIT_2003',
        targetAddress: 2003,
      },
      {
        stepIndex: 2,
        instruction: 'CURRENT is at 2003 (Node 30). Read NEXT (2004) and click Node 40 (2004).',
        actionHint: 'Advance forward to address 2004.',
        expectedAction: 'VISIT_2004',
        targetAddress: 2004,
      },
      {
        stepIndex: 3,
        instruction: 'CURRENT is at 2004 (Node 40). Read NEXT (2005) and click Node 50 (2005).',
        actionHint: 'Advance forward to address 2005.',
        expectedAction: 'VISIT_2005',
        targetAddress: 2005,
      },
      {
        stepIndex: 4,
        instruction: 'CURRENT is at 2005 (Node 50). Its NEXT is NULL! Click "Finish Traversal (NULL)".',
        actionHint: 'Single linked list traversal finishes when CURRENT.next == NULL.',
        expectedAction: 'FINISH_TRAVERSAL',
      },
    ],
    conceptExplanation: 'Traversal moves sequentially from HEAD to NULL in O(N) time. Random access is not possible in Singly Linked Lists.',
    pointerRule: 'while (current != NULL) { print(current->data); current = current->next; }',
    xpReward: 60,
  },

  L3_AUTO_TRAVERSAL: {
    id: 'L3_AUTO_TRAVERSAL',
    levelId: 3,
    title: 'Auto Traversal & Output Buffer',
    shortDesc: 'Watch the traversal algorithm visit nodes sequentially and stream data to the output buffer.',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    badgeColor: 'blue',
    iconName: 'eye',
    initialNodes: [
      { id: 'n1', data: 10, address: 2001, nextAddress: 2002 },
      { id: 'n2', data: 20, address: 2002, nextAddress: 2003 },
      { id: 'n3', data: 30, address: 2003, nextAddress: 2004 },
      { id: 'n4', data: 40, address: 2004, nextAddress: 2005 },
      { id: 'n5', data: 50, address: 2005, nextAddress: null },
    ],
    initialPointers: {
      headAddress: 2001,
      tailAddress: 2005,
      currentAddress: 2001,
      tempAddress: null,
      prevAddress: null,
    },
    initialStagedNode: null,
    steps: [
      {
        stepIndex: 0,
        instruction: 'Click "START AUTO RUN" to stream traversal across all nodes from HEAD to NULL.',
        actionHint: 'Observe CURRENT pointer moving sequentially from address 2001 to 2005.',
        expectedAction: 'RUN_AUTO_TRAVERSE',
      },
    ],
    conceptExplanation: 'Linear traversal visits every single node exactly once, ensuring full coverage in O(N) time.',
    pointerRule: 'current = current->next;',
    xpReward: 40,
  },

  // =========================================================================
  // LEVEL 4: SEQUENTIAL LINEAR SEARCH
  // =========================================================================
  L4_SEARCH_EXISTS: {
    id: 'L4_SEARCH_EXISTS',
    levelId: 4,
    title: 'Search Target Value [ 30 ]',
    shortDesc: 'Scan nodes sequentially from HEAD until finding target element 30 at address 3004.',
    timeComplexity: 'O(k) where k is target index',
    spaceComplexity: 'O(1)',
    badgeColor: 'emerald',
    iconName: 'search',
    targetValue: 30,
    initialNodes: [
      { id: 'n1', data: 12, address: 3001, nextAddress: 3002 },
      { id: 'n2', data: 18, address: 3002, nextAddress: 3003 },
      { id: 'n3', data: 25, address: 3003, nextAddress: 3004 },
      { id: 'n4', data: 30, address: 3004, nextAddress: 3005 },
      { id: 'n5', data: 40, address: 3005, nextAddress: null },
    ],
    initialPointers: {
      headAddress: 3001,
      tailAddress: 3005,
      currentAddress: 3001,
      tempAddress: null,
      prevAddress: null,
    },
    initialStagedNode: null,
    steps: [
      {
        stepIndex: 0,
        instruction: 'Click "START SEARCH [ 30 ]" to sequentially inspect nodes starting from HEAD.',
        actionHint: 'CURRENT will inspect 12, then 18, then 25, and halt when 30 == 30.',
        expectedAction: 'SEARCH_30',
      },
    ],
    conceptExplanation: 'Sequential search compares each node\'s data with target. It stops immediately upon matching in O(k) steps.',
    pointerRule: 'if (current->data == target) return FOUND; current = current->next;',
    xpReward: 50,
  },

  L4_SEARCH_ABSENT: {
    id: 'L4_SEARCH_ABSENT',
    levelId: 4,
    title: 'Search Absent Value [ 99 ]',
    shortDesc: 'Scan all nodes until reaching NULL without finding a match (Worst-Case O(N)).',
    timeComplexity: 'O(N) Worst Case',
    spaceComplexity: 'O(1)',
    badgeColor: 'rose',
    iconName: 'search',
    targetValue: 99,
    initialNodes: [
      { id: 'n1', data: 12, address: 3001, nextAddress: 3002 },
      { id: 'n2', data: 18, address: 3002, nextAddress: 3003 },
      { id: 'n3', data: 25, address: 3003, nextAddress: 3004 },
      { id: 'n4', data: 30, address: 3004, nextAddress: 3005 },
      { id: 'n5', data: 40, address: 3005, nextAddress: null },
    ],
    initialPointers: {
      headAddress: 3001,
      tailAddress: 3005,
      currentAddress: 3001,
      tempAddress: null,
      prevAddress: null,
    },
    initialStagedNode: null,
    steps: [
      {
        stepIndex: 0,
        instruction: 'Click "SEARCH FOR [ 99 ]" to observe full O(N) traversal when element is absent.',
        actionHint: 'Inspects all 5 nodes and returns NOT FOUND when reaching NULL.',
        expectedAction: 'SEARCH_99',
      },
    ],
    conceptExplanation: 'When an element does not exist in the singly linked list, search takes worst-case O(N) time because all nodes must be checked.',
    pointerRule: 'if (current == NULL) return NOT_FOUND;',
    xpReward: 50,
  },

  // =========================================================================
  // LEVEL 5: MASTER CHALLENGE
  // =========================================================================
  L5_MASTER: {
    id: 'L5_MASTER',
    levelId: 5,
    title: 'Grand Master Sequence',
    shortDesc: 'Perform all 7 core single linked list operations consecutively with zero mistakes.',
    timeComplexity: 'O(1) ~ O(N)',
    spaceComplexity: 'O(1)',
    badgeColor: 'violet',
    iconName: 'zap',
    initialNodes: [
      { id: 'm20', data: 20, address: 4002, nextAddress: 4003 },
      { id: 'm40', data: 40, address: 4003, nextAddress: 4004 },
      { id: 'm60', data: 60, address: 4004, nextAddress: null },
    ],
    initialPointers: {
      headAddress: 4002,
      tailAddress: 4004,
      currentAddress: null,
      tempAddress: null,
      prevAddress: null,
    },
    initialStagedNode: null,
    steps: [
      {
        stepIndex: 0,
        instruction: 'Mission 1/7: Allocate memory for Node 10 with NEXT = NULL. Click "Allocate Node 10".',
        actionHint: 'Create node [ 10 | NULL ] at address 4001.',
        expectedAction: 'M_CREATE_10',
      },
      {
        stepIndex: 1,
        instruction: 'Mission 2/7: Insert Node 10 at HEAD. Click "Insert 10 at Head".',
        actionHint: 'Set 10.next = 4002, HEAD = 4001.',
        expectedAction: 'M_INSERT_BEG',
        targetAddress: 4001,
      },
      {
        stepIndex: 2,
        instruction: 'Mission 3/7: Insert Node 80 at TAIL. Click "Insert 80 at Tail".',
        actionHint: 'Set 60.next = 4005, TAIL = 4005.',
        expectedAction: 'M_INSERT_END',
        targetAddress: 4005,
      },
      {
        stepIndex: 3,
        instruction: 'Mission 4/7: Delete the first node (Node 10). Click "Delete First Node".',
        actionHint: 'Advance HEAD to 4002 and free Node 10.',
        expectedAction: 'M_DEL_BEG',
      },
      {
        stepIndex: 4,
        instruction: 'Mission 5/7: Delete the last node (Node 80). Click "Delete Last Node".',
        actionHint: 'Set 60.next = NULL, TAIL = 4004, free Node 80.',
        expectedAction: 'M_DEL_END',
      },
      {
        stepIndex: 5,
        instruction: 'Mission 6/7: Search for element 40. Click "Search for 40".',
        actionHint: 'Scan list until finding 40 at address 4003.',
        expectedAction: 'M_SEARCH_40',
      },
      {
        stepIndex: 6,
        instruction: 'Mission 7/7: Traverse and verify final list (20 → 40 → 60 → NULL). Click "Verify Traversal".',
        actionHint: 'Complete the grand certification traversal!',
        expectedAction: 'M_TRAVERSE_ALL',
      },
    ],
    conceptExplanation: 'Demonstrates end-to-end mastery of node lifecycle, pointer manipulations, sequential traversal, and memory cleanup.',
    pointerRule: 'Mastery over heap allocation, pointer linkings, boundary cases, and search algorithms.',
    xpReward: 100,
  },
};

export const LEVEL_OPERATIONS_MAP: Record<number, string[]> = {
  1: ['L1_CREATE', 'L1_INSERT_BEG', 'L1_INSERT_END'],
  2: ['L2_DEL_BEG', 'L2_DEL_END'],
  3: ['L3_INTERACTIVE_TRAVERSAL', 'L3_AUTO_TRAVERSAL'],
  4: ['L4_SEARCH_EXISTS', 'L4_SEARCH_ABSENT'],
  5: ['L5_MASTER'],
};
