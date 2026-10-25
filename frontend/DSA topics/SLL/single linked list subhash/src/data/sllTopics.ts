export type SLLTopicId = 'insertion' | 'deletion' | 'traversal';

export interface SLLTopicTask {
  id: string; // Underlying task ID in SLL_TASKS
  taskNumber: number;
  title: string;
  description: string;
  xpReward: number;
}

export interface SLLTopic {
  id: SLLTopicId;
  title: string;
  description: string;
  badge: string;
  tasks: SLLTopicTask[];
}

export const SLL_TOPICS: Record<SLLTopicId, SLLTopic> = {
  insertion: {
    id: 'insertion',
    title: 'Insertion',
    description: 'Learn how to create nodes and insert them at different positions in a linked list.',
    badge: '25 Points',
    tasks: [
      {
        id: 'L1_T1',
        taskNumber: 1,
        title: 'Create a Node',
        description: 'Allocate a new node on the Heap, assign memory address, and initialize DATA with NEXT set to NULL.',
        xpReward: 6,
      },
      {
        id: 'L1_T3',
        taskNumber: 2,
        title: 'Insert at Beginning',
        description: 'Connect the new node to the current list, then advance the HEAD pointer to the new node in O(1) time.',
        xpReward: 6,
      },
      {
        id: 'L1_T4',
        taskNumber: 3,
        title: 'Insert at End',
        description: 'Connect the last node\'s NEXT pointer to the new node and update the TAIL pointer in O(1) time.',
        xpReward: 6,
      },
      {
        id: 'L4_T1',
        taskNumber: 4,
        title: 'Insert at Any Position',
        description: 'Insert a node between two existing nodes by properly ordering NEXT pointer reassignments.',
        xpReward: 7,
      },
    ],
  },
  deletion: {
    id: 'deletion',
    title: 'Deletion',
    description: 'Learn how to delete nodes from different positions in a linked list.',
    badge: '25 Points',
    tasks: [
      {
        id: 'L2_T1',
        taskNumber: 1,
        title: 'Delete at Beginning',
        description: 'Advance HEAD pointer to the next node and release the old head node\'s memory back to the Heap in O(1) time.',
        xpReward: 8,
      },
      {
        id: 'L2_T2',
        taskNumber: 2,
        title: 'Delete at End',
        description: 'Traverse to the second-to-last node, set its NEXT to NULL, and free the former TAIL node.',
        xpReward: 8,
      },
      {
        id: 'L4_T2',
        taskNumber: 3,
        title: 'Delete at Any Position',
        description: 'Bridge the pointer from the predecessor directly to the successor, then free the targeted node.',
        xpReward: 9,
      },
    ],
  },
  traversal: {
    id: 'traversal',
    title: 'Traversal',
    description: 'Learn how to traverse a linked list and access all nodes.',
    badge: '10 Points',
    tasks: [
      {
        id: 'L3_T1',
        taskNumber: 1,
        title: 'Traverse and Print',
        description: 'Follow sequential NEXT memory pointers starting from HEAD and process node data until reaching NULL in O(N) time.',
        xpReward: 10,
      },
    ],
  },
};
