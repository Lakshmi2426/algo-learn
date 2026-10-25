import { SLLNode, SLLPointerState, SLLTaskDef, SLLTeacherStep } from '../types/sllGame';
import { validateTaskAnswer } from './sllValidator';

// Helper to traverse ordered nodes from HEAD
function getOrderedNodesList(nodes: SLLNode[] = [], pointers?: SLLPointerState): SLLNode[] {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safePointers = pointers && typeof pointers === 'object' ? pointers : undefined;
  const list: SLLNode[] = [];
  const visited = new Set<number>();
  let curr = safePointers?.headAddress ?? (safeNodes[0] ? safeNodes[0].address : null);
  while (curr !== null && !visited.has(curr)) {
    visited.add(curr);
    const node = safeNodes.find((n) => n.address === curr);
    if (node) {
      list.push(node);
      curr = node.nextAddress;
    } else {
      break;
    }
  }
  return list;
}

/**
 * Computes the new node specification (data and memory address) dynamically
 * for any insertion position and linked list state.
 */
export function getInsertionNewNodeSpec(
  nodes: SLLNode[] = [],
  pointers?: SLLPointerState,
  insertPosition: number = 3
): { data: number; address: number } {
  const defaultChain = [
    { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
    { id: 'n2', data: 20, address: 1002, nextAddress: 1003 },
    { id: 'n3', data: 30, address: 1003, nextAddress: 1004 },
    { id: 'n4', data: 40, address: 1004, nextAddress: 1005 },
    { id: 'n5', data: 50, address: 1005, nextAddress: null },
  ];
  const chain = defaultChain;
  const n = chain.length;
  const validPos = Math.max(1, Math.min(n + 1, insertPosition));

  // If a node already exists in memory outside the original chain, use its exact address and data
  const chainAddrs = new Set(chain.map((c) => c.address));
  const unlinked = (nodes || []).find((node) => !chainAddrs.has(node.address));
  if (unlinked) {
    return { data: unlinked.data, address: unlinked.address };
  }

  // Derive next address dynamically
  const existingAddrs = (nodes || []).map((node) => node.address);
  const maxAddr = existingAddrs.length > 0 ? Math.max(...existingAddrs) : 1005;
  const newAddr = maxAddr >= 1000 ? Math.max(maxAddr + 1, 1006) : 1006;

  let newData: number;
  if (validPos === 1) {
    newData = chain[0] ? Math.max(1, chain[0].data - 5) : 5;
  } else if (validPos > n) {
    newData = chain[n - 1] ? chain[n - 1].data + 10 : 60;
  } else {
    const prev = chain[validPos - 2];
    const succ = chain[validPos - 1];
    newData = Math.round((prev.data + succ.data) / 2);
    if (newData === prev.data || newData === succ.data) {
      newData = prev.data + 5;
    }
  }

  return { data: newData, address: newAddr };
}

/**
 * Explicit Step Definitions for every Task in the game.
 * Guarantees a real step-based state machine with zero fake steps.
 */
export const TASK_STEP_BUILDERS: Record<
  string,
  (nodes: SLLNode[], pointers: SLLPointerState, deletePosition?: number) => SLLTeacherStep[]
> = {
  // ---------------------------------------------------------------------------
  // LEVEL 01 - TASK 01: Build First 2-Node Linked List [ 10 → 20 ]
  // ---------------------------------------------------------------------------
  L1_T1: () => [
    {
      stepNumber: 1,
      totalSteps: 5,
      title: 'Create First Node (10)',
      what: "Let's create your first node with DATA = 10 at Address 1001.",
      why: 'In linked lists, memory must be allocated on the Heap before pointers can reference it.',
      actionType: 'create_node',
      targetAddress: 1001,
      targetData: 10,
      nextAddress: null,
      createdNodeData: { data: 10, address: 1001 },
      resultMessage: "✓ Node created! Next, we'll make this node the HEAD.",
      nextStepPreview: 'Step 2: Point HEAD to Node 1001.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 5,
      title: 'Set First Node as HEAD',
      what: 'HEAD points to the first node in a linked list. Point HEAD to Node 1001.',
      why: 'HEAD gives the computer the entry point address to access the list in memory.',
      actionType: 'set_head',
      targetAddress: 1001,
      targetPointer: 'head',
      resultMessage: '✓ HEAD is set! Now let\'s create the next node.',
      nextStepPreview: 'Step 3: Create the second node (DATA: 20 at Address 1002).',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 5,
      title: 'Create Second Node (20)',
      what: 'Create the second node with DATA = 20 at Address 1002.',
      why: 'The second node needs to exist in RAM before we can connect the first node to it.',
      actionType: 'create_node',
      targetAddress: 1002,
      targetData: 20,
      nextAddress: null,
      createdNodeData: { data: 20, address: 1002 },
      resultMessage: '✓ Node 20 created! Next, connect Node 10 to Node 20.',
      nextStepPreview: 'Step 4: Connect Node 10\'s NEXT pointer to Node 20 (Address 1002).',
      isCompleted: false,
    },
    {
      stepNumber: 4,
      totalSteps: 5,
      title: 'Connect First Node → Second Node',
      what: 'NEXT stores the address of the next node. Connect Node 1001\'s NEXT to 1002.',
      why: 'By storing Address 1002 inside Node 1001\'s NEXT field, we link the two nodes in RAM.',
      actionType: 'connect_next',
      targetAddress: 1001,
      nextAddress: 1002,
      resultMessage: '✓ Connected! Node 10 now points to Node 20.',
      nextStepPreview: 'Step 5: Verify the last node terminates at NULL and set TAIL.',
      isCompleted: false,
    },
    {
      stepNumber: 5,
      totalSteps: 5,
      title: 'Set TAIL to Node 1002',
      what: 'The last node in the chain is the TAIL. Click Node 1002 to set TAIL.',
      why: 'In singly linked lists, TAIL points to the last node and its NEXT terminates at NULL.',
      actionType: 'set_tail',
      targetAddress: 1002,
      targetPointer: 'tail',
      resultMessage: '✓ TAIL is set! All 5 steps completed! You successfully built your first linked list.',
      nextStepPreview: 'Task Finished! You can now proceed to the next task.',
      isCompleted: true,
    },
  ],

  // ---------------------------------------------------------------------------
  // LEVEL 01 - TASK 02: Point HEAD & TAIL to First Node
  // ---------------------------------------------------------------------------
  L1_T2: () => [
    {
      stepNumber: 1,
      totalSteps: 2,
      title: 'Point HEAD to Node 1001',
      what: 'Make Node 10 (Address 1001) the HEAD of the list.',
      why: 'HEAD tells the program where the linked list chain begins.',
      actionType: 'set_head',
      targetAddress: 1001,
      targetPointer: 'head',
      resultMessage: '✓ HEAD now points to Node 1001.',
      nextStepPreview: 'Step 2: Point TAIL to Node 1001.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 2,
      title: 'Point TAIL to Node 1001',
      what: 'Set TAIL pointer to Node 10 (Address 1001).',
      why: 'In a 1-node list, the same node is both the HEAD (first) and TAIL (last).',
      actionType: 'set_tail',
      targetAddress: 1001,
      targetPointer: 'tail',
      resultMessage: '✓ TAIL now points to Node 1001. List initialized correctly!',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  // ---------------------------------------------------------------------------
  // LEVEL 01 - TASK 03: Insert at Beginning (Prepend)
  // ---------------------------------------------------------------------------
  L1_T3: () => [
    {
      stepNumber: 1,
      totalSteps: 2,
      title: 'Connect New Node to Current HEAD',
      what: 'Connect new Node 5 (Address 1000) NEXT pointer to Node 10 (Address 1001).',
      why: 'Always connect the new node FIRST (`newNode->next = head`) to avoid losing the list!',
      actionType: 'connect_next',
      targetAddress: 1000,
      nextAddress: 1001,
      resultMessage: '✓ Node 5 is now linked to Node 10 (5 → 10).',
      nextStepPreview: 'Step 2: Update HEAD to point to Node 5.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 2,
      title: 'Update HEAD to Node 5',
      what: 'Point HEAD to new Node 5 (Address 1000).',
      why: 'Now that Node 5 is the first element, `head = newNode` completes the O(1) prepend.',
      actionType: 'set_head',
      targetAddress: 1000,
      targetPointer: 'head',
      resultMessage: '✓ HEAD updated to Node 5! Prepend completed successfully.',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  // ---------------------------------------------------------------------------
  // LEVEL 01 - TASK 04: Insert at End (Append)
  // ---------------------------------------------------------------------------
  L1_T4: () => [
    {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Connect Old Tail to New Node',
      what: 'Connect Node 10 (Address 1001) NEXT pointer to new Node 20 (Address 1002).',
      why: 'In appending, the current tail\'s NEXT must point to the new node (`tail->next = newNode`).',
      actionType: 'connect_next',
      targetAddress: 1001,
      nextAddress: 1002,
      resultMessage: '✓ Node 10 connected to Node 20 (10 → 20).',
      nextStepPreview: 'Step 2: Update TAIL pointer to Node 20.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Update TAIL to Node 20',
      what: 'Update TAIL to point to Node 20 (Address 1002).',
      why: 'TAIL must always point to the last element (`tail = newNode`).',
      actionType: 'set_tail',
      targetAddress: 1002,
      targetPointer: 'tail',
      resultMessage: '✓ TAIL updated to Node 20.',
      nextStepPreview: 'Step 3: Ensure Node 20 NEXT is NULL.',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Verify Last Node NEXT → NULL',
      what: 'Confirm that Node 20\'s NEXT pointer is NULL.',
      why: 'The last node marks the end of the list with NEXT = NULL.',
      actionType: 'verify_null',
      targetAddress: 1002,
      nextAddress: null,
      resultMessage: '✓ Verified! Append completed with O(1) time complexity.',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  // ---------------------------------------------------------------------------
  // LEVEL 02 - TASK 01: Delete from Beginning (HEAD Deletion)
  // ---------------------------------------------------------------------------
  L2_T1: (nodes = [], pointers) => {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    // The target head node to be deleted is original head Node 10 (1001)
    const headNode =
      safeNodes.find((n) => n.address === 1001) ||
      safeNodes.find((n) => n.nextAddress === 1002) ||
      { id: 'n1', data: 10, address: 1001, nextAddress: 1002 };
    // The new head target is Node 20 (1002)
    const secondNode =
      safeNodes.find((n) => n.address === 1002) ||
      (headNode.nextAddress ? safeNodes.find((n) => n.address === headNode.nextAddress) : null) ||
      { id: 'n2', data: 20, address: 1002, nextAddress: 1003 };

    return [
      {
        stepNumber: 1,
        totalSteps: 3,
        title: 'Highlight ONLY First HEAD Node',
        what: `Highlight ONLY the first HEAD node: Node [${headNode.data}] (Address ${headNode.address}).`,
        why: 'Deletion at beginning begins by identifying and isolating the first node before modifying pointers.',
        pointersUpdated: 'None yet (locating target node)',
        actionType: 'select_node',
        targetAddress: headNode.address,
        targetData: headNode.data,
        highlightAddresses: [headNode.address],
        resultMessage: `✓ First HEAD Node [${headNode.data}] (Address ${headNode.address}) identified and highlighted.`,
        nextStepPreview: `Step 2: Update HEAD to point to Node [${secondNode.data}] (HEAD.next).`,
        isCompleted: false,
      },
      {
        stepNumber: 2,
        totalSteps: 3,
        title: 'Update HEAD to HEAD.next',
        what: `Update HEAD pointer to HEAD.next (Node [${secondNode.data}] at Address ${secondNode.address}).`,
        why: 'Advancing HEAD decouples the first node from the active list without breaking remaining links.',
        pointersUpdated: `HEAD = ${secondNode.address} (points to Node [${secondNode.data}])`,
        actionType: 'set_head',
        targetAddress: secondNode.address,
        targetPointer: 'head',
        highlightAddresses: [headNode.address, secondNode.address],
        resultMessage: `✓ HEAD moved forward to Node [${secondNode.data}] (Address ${secondNode.address}). Old and new HEAD nodes highlighted.`,
        nextStepPreview: `Step 3: Detach and delete the old HEAD Node [${headNode.data}].`,
        isCompleted: false,
      },
      {
        stepNumber: 3,
        totalSteps: 3,
        title: 'Detach and Delete Old HEAD Node',
        what: `Detach and delete the old HEAD Node [${headNode.data}] (Address ${headNode.address}) from heap memory.`,
        why: 'In C/C++, free(temp) deallocates memory and prevents leaks after removing the node from the list.',
        pointersUpdated: `Old Node [${headNode.data}] deallocated (free(temp))`,
        actionType: 'delete_node',
        targetAddress: headNode.address,
        highlightAddresses: [headNode.address],
        detachedAddress: headNode.address,
        resultMessage: `✓ Node [${headNode.data}] freed from RAM! Deletion from head completed.`,
        nextStepPreview: 'Task Finished!',
        isCompleted: true,
      },
    ];
  },

  // ---------------------------------------------------------------------------
  // LEVEL 02 - TASK 02: Delete from End (TAIL Deletion)
  // ---------------------------------------------------------------------------
  L2_T2: (nodes = [], pointers) => {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    // The target tail to delete is original tail Node 30 (1003)
    const lastNode =
      safeNodes.find((n) => n.address === 1003) ||
      safeNodes.find((n) => n.nextAddress === null && n.address !== 1002) ||
      { id: 'n3', data: 30, address: 1003, nextAddress: null };
    // The second-last node becoming new tail is Node 20 (1002)
    const secondLastNode =
      safeNodes.find((n) => n.address === 1002) ||
      safeNodes.find((n) => n.nextAddress === lastNode.address) ||
      { id: 'n2', data: 20, address: 1002, nextAddress: 1003 };

    return [
      {
        stepNumber: 1,
        totalSteps: 4,
        title: 'Identify and Highlight Last Node',
        what: `Identify and highlight ONLY the last node: Node [${lastNode.data}] (Address ${lastNode.address}).`,
        why: 'Deletion at ending targets the final node in the chain.',
        pointersUpdated: 'None yet (locating target node)',
        actionType: 'select_node',
        targetAddress: lastNode.address,
        targetData: lastNode.data,
        highlightAddresses: [lastNode.address],
        resultMessage: `✓ Last Node [${lastNode.data}] (Address ${lastNode.address}) identified and highlighted.`,
        nextStepPreview: `Step 2: Update secondLast.next to NULL (Node [${secondLastNode.data}] NEXT = NULL).`,
        isCompleted: false,
      },
      {
        stepNumber: 2,
        totalSteps: 4,
        title: 'Update secondLast.next to NULL',
        what: `Disconnect last node by setting Node [${secondLastNode.data}]'s NEXT pointer to NULL.`,
        why: 'The second-to-last node is becoming the new terminator of the list, so its NEXT must point to NULL.',
        pointersUpdated: `Node [${secondLastNode.data}] NEXT = NULL`,
        actionType: 'connect_next',
        targetAddress: secondLastNode.address,
        nextAddress: null,
        highlightAddresses: [secondLastNode.address, lastNode.address],
        resultMessage: `✓ Node [${secondLastNode.data}] NEXT set to NULL. Last node is detached.`,
        nextStepPreview: `Step 3: Move TAIL pointer to Node [${secondLastNode.data}].`,
        isCompleted: false,
      },
      {
        stepNumber: 3,
        totalSteps: 4,
        title: 'Update TAIL to Second-Last Node',
        what: `Update TAIL pointer to the second-last Node [${secondLastNode.data}] (Address ${secondLastNode.address}).`,
        why: 'TAIL must point to the new end of the list.',
        pointersUpdated: `TAIL = ${secondLastNode.address} (points to Node [${secondLastNode.data}])`,
        actionType: 'set_tail',
        targetAddress: secondLastNode.address,
        targetPointer: 'tail',
        highlightAddresses: [secondLastNode.address],
        resultMessage: `✓ TAIL moved to Node [${secondLastNode.data}] (Address ${secondLastNode.address}).`,
        nextStepPreview: `Step 4: Free the detached old tail Node [${lastNode.data}].`,
        isCompleted: false,
      },
      {
        stepNumber: 4,
        totalSteps: 4,
        title: 'Detach and Delete Last Node',
        what: `Deallocate / delete old tail Node [${lastNode.data}] (Address ${lastNode.address}) from RAM.`,
        why: 'Freeing unused heap nodes prevents memory leaks.',
        pointersUpdated: `Old Node [${lastNode.data}] deallocated (free(tail))`,
        actionType: 'delete_node',
        targetAddress: lastNode.address,
        highlightAddresses: [lastNode.address],
        detachedAddress: lastNode.address,
        resultMessage: `✓ Node [${lastNode.data}] freed! Tail deletion complete.`,
        nextStepPreview: 'Task Finished!',
        isCompleted: true,
      },
    ];
  },

  // ---------------------------------------------------------------------------
  // LEVEL 02 - TASK 03: Empty List Condition (Underflow Guard)
  // ---------------------------------------------------------------------------
  L2_T3: () => [
    {
      stepNumber: 1,
      totalSteps: 1,
      title: 'Empty List Guard Check',
      what: 'List is empty. Cannot delete.',
      why: 'When HEAD == NULL, attempting to access head->next causes a null pointer dereference (segmentation fault). Check if (head == NULL) before deleting.',
      pointersUpdated: 'HEAD == NULL, TAIL == NULL',
      actionType: 'verify_null',
      targetAddress: null,
      resultMessage: '✓ Underflow guarded: "List is empty. Cannot delete."',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  // ---------------------------------------------------------------------------
  // LEVEL 02 - TASK 04: Delete Single-Node List (Boundary Case)
  // ---------------------------------------------------------------------------
  L2_T4: (nodes = []) => {
    const onlyNode = nodes[0] || { id: 'n1', data: 10, address: 1001, nextAddress: null };
    return [
      {
        stepNumber: 1,
        totalSteps: 3,
        title: 'Highlight the Only Node',
        what: `Highlight the solitary Node [${onlyNode.data}] (Address ${onlyNode.address}).`,
        why: 'In a 1-node list, HEAD and TAIL both point to the same node.',
        pointersUpdated: 'None yet',
        actionType: 'select_node',
        targetAddress: onlyNode.address,
        highlightAddresses: [onlyNode.address],
        resultMessage: `✓ Solitary Node [${onlyNode.data}] (Address ${onlyNode.address}) highlighted.`,
        nextStepPreview: `Step 2: Delete Node [${onlyNode.data}].`,
        isCompleted: false,
      },
      {
        stepNumber: 2,
        totalSteps: 3,
        title: 'Delete Node',
        what: `Delete Node [${onlyNode.data}] (Address ${onlyNode.address}) from heap memory.`,
        why: 'Releases the allocated heap memory (free(head)).',
        pointersUpdated: `Node [${onlyNode.data}] deallocated`,
        actionType: 'delete_node',
        targetAddress: onlyNode.address,
        highlightAddresses: [onlyNode.address],
        detachedAddress: onlyNode.address,
        resultMessage: `✓ Node [${onlyNode.data}] deleted from heap memory.`,
        nextStepPreview: 'Step 3: Update HEAD = NULL and TAIL = NULL.',
        isCompleted: false,
      },
      {
        stepNumber: 3,
        totalSteps: 3,
        title: 'Update HEAD = NULL and TAIL = NULL',
        what: 'Update HEAD = NULL and TAIL = NULL.',
        why: 'When the only node is deleted, both HEAD and TAIL must be reset to NULL to represent an empty list.',
        pointersUpdated: 'HEAD = NULL, TAIL = NULL',
        actionType: 'set_head',
        targetAddress: null,
        resultMessage: '✓ HEAD = NULL and TAIL = NULL. List is safely empty.',
        nextStepPreview: 'Task Finished!',
        isCompleted: true,
      },
    ];
  },

  // ---------------------------------------------------------------------------
  // LEVEL 03 - TASK 01: Traversal Stream
  // ---------------------------------------------------------------------------
  L3_T1: () => [
    {
      stepNumber: 1,
      totalSteps: 5,
      title: 'Select the HEAD Node',
      what: 'Select the HEAD node (Node 10 at Address 1001).',
      why: 'Traversal always begins at the starting address stored in HEAD.',
      pointersUpdated: 'CURRENT = 1001 (points to Node 10)',
      actionType: 'traverse_step',
      targetAddress: 1001,
      targetData: 10,
      highlightAddresses: [1001],
      resultMessage: '✓ CURRENT initialized to Node 10 (Address 1001). Streamed DATA: 10.',
      nextStepPreview: 'Step 2: Follow NEXT pointer and select Node 20 (Address 1002).',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 5,
      title: 'Move CURRENT to Node 20',
      what: 'Follow NEXT pointer and select Node 20 (Address 1002).',
      why: 'Node 10 has NEXT = 1002. Advancing `current = current->next` moves CURRENT to Node 20.',
      pointersUpdated: 'CURRENT = 1002 (points to Node 20)',
      actionType: 'traverse_step',
      targetAddress: 1002,
      targetData: 20,
      highlightAddresses: [1001, 1002],
      resultMessage: '✓ CURRENT moved to Node 20 (Address 1002). Streamed DATA: 20.',
      nextStepPreview: 'Step 3: Follow NEXT pointer and select Node 30 (Address 1003).',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 5,
      title: 'Move CURRENT to Node 30',
      what: 'Follow NEXT pointer and select Node 30 (Address 1003).',
      why: 'Node 20 has NEXT = 1003. Advancing `current = current->next` moves CURRENT to Node 30.',
      pointersUpdated: 'CURRENT = 1003 (points to Node 30)',
      actionType: 'traverse_step',
      targetAddress: 1003,
      targetData: 30,
      highlightAddresses: [1002, 1003],
      resultMessage: '✓ CURRENT moved to Node 30 (Address 1003). Streamed DATA: 30.',
      nextStepPreview: 'Step 4: Follow NEXT pointer and select Node 40 (Address 1004).',
      isCompleted: false,
    },
    {
      stepNumber: 4,
      totalSteps: 5,
      title: 'Move CURRENT to Node 40',
      what: 'Follow NEXT pointer and select Node 40 (Address 1004).',
      why: 'Node 30 has NEXT = 1004. Advancing `current = current->next` moves CURRENT to Node 40.',
      pointersUpdated: 'CURRENT = 1004 (points to Node 40)',
      actionType: 'traverse_step',
      targetAddress: 1004,
      targetData: 40,
      highlightAddresses: [1003, 1004],
      resultMessage: '✓ CURRENT moved to Node 40 (Address 1004). Streamed DATA: 40.',
      nextStepPreview: 'Final Step: Move CURRENT to NULL.',
      isCompleted: false,
    },
    {
      stepNumber: 5,
      totalSteps: 5,
      title: 'Move CURRENT to NULL',
      what: 'Node 40 has NEXT = NULL. Select NULL to complete traversal.',
      why: 'When CURRENT reaches NULL (`current == NULL`), the traversal loop finishes.',
      pointersUpdated: 'CURRENT = NULL',
      actionType: 'traverse_step',
      targetAddress: null,
      highlightAddresses: [1004],
      resultMessage: '✓ Traversal complete! Output stream: [10, 20, 30, 40] → NULL.',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  // ---------------------------------------------------------------------------
  // LEVEL 04 - TASK 01: Insert at Any Position (Beginning, Middle, End)
  // ---------------------------------------------------------------------------
  L4_T1: (nodes = [], pointers, insertPosition = 3) => {
    const defaultChain = [
      { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
      { id: 'n2', data: 20, address: 1002, nextAddress: 1003 },
      { id: 'n3', data: 30, address: 1003, nextAddress: 1004 },
      { id: 'n4', data: 40, address: 1004, nextAddress: 1005 },
      { id: 'n5', data: 50, address: 1005, nextAddress: null },
    ];
    const chain = defaultChain;
    const n = chain.length;
    const validPos = Math.max(1, Math.min(n + 1, insertPosition));
    const newSpec = getInsertionNewNodeSpec(nodes, pointers, validPos);
    const newAddr = newSpec.address;
    const newVal = newSpec.data;

    // Case 1: Position 1 (Beginning Insertion)
    if (validPos === 1) {
      const headNode = chain[0];
      const tailNode = chain[n - 1];
      return [
        {
          stepNumber: 1,
          totalSteps: 5,
          title: 'Prepare the New Node',
          what: `Allocate new Node [${newVal}] at Address ${newAddr} in Heap RAM with NEXT = NULL.`,
          why: 'In linked lists, heap memory is allocated before pointers can reference the new node.',
          pointersUpdated: `Allocated Node [${newVal}] @ ${newAddr} (NEXT = NULL)`,
          actionType: 'create_node',
          targetAddress: newAddr,
          targetData: newVal,
          createdNodeData: { data: newVal, address: newAddr },
          nextAddress: null,
          highlightAddresses: [newAddr],
          resultMessage: `✓ Node [${newVal}] created at Address ${newAddr}!`,
          nextStepPreview: `Step 2: Connect Node [${newVal}] to current HEAD (Node [${headNode.data}]).`,
          isCompleted: false,
        },
        {
          stepNumber: 2,
          totalSteps: 5,
          title: 'Connect the New Node',
          what: `Set newNode->next = head (point Node [${newVal}] NEXT to Node [${headNode.data}] at Address ${headNode.address}).`,
          why: 'Always connect the new node to the existing chain first so no existing nodes are lost.',
          pointersUpdated: `newNode->next = ${headNode.address}`,
          actionType: 'connect_next',
          targetAddress: newAddr,
          nextAddress: headNode.address,
          highlightAddresses: [newAddr, headNode.address],
          resultMessage: `✓ Node [${newVal}] now points to current HEAD (Node [${headNode.data}])!`,
          nextStepPreview: `Step 3: Update HEAD pointer to Node [${newVal}].`,
          isCompleted: false,
        },
        {
          stepNumber: 3,
          totalSteps: 5,
          title: 'Update the Head Pointer',
          what: `Set head = newNode (update HEAD pointer to Address ${newAddr}).`,
          why: 'The new node is now the first element in the list, so HEAD must point to it.',
          pointersUpdated: `HEAD = ${newAddr}`,
          actionType: 'set_head',
          targetAddress: newAddr,
          targetPointer: 'head',
          highlightAddresses: [newAddr],
          resultMessage: `✓ HEAD pointer updated to Node [${newVal}]!`,
          nextStepPreview: 'Step 4: Verify TAIL pointer.',
          isCompleted: false,
        },
        {
          stepNumber: 4,
          totalSteps: 5,
          title: 'Verify TAIL Pointer',
          what: `Confirm TAIL pointer remains unchanged at Node [${tailNode.data}] (Address ${tailNode.address}).`,
          why: 'Beginning insertion prepends to the front of the list; the existing tail remains intact.',
          pointersUpdated: `TAIL remains ${tailNode.address}`,
          actionType: 'select_node',
          targetAddress: tailNode.address,
          highlightAddresses: [tailNode.address],
          resultMessage: `✓ TAIL pointer verified at Node [${tailNode.data}]!`,
          nextStepPreview: 'Step 5: Verify the final linked list.',
          isCompleted: false,
        },
        {
          stepNumber: 5,
          totalSteps: 5,
          title: 'Verify the Result',
          what: `Confirm that Node [${newVal}] is at Position 1, followed by [${chain.map((c) => c.data).join(' → ')} → NULL].`,
          why: 'Validates that the new node occupies Position 1, node count increased by 1, and the chain is intact.',
          pointersUpdated: `List verified: [${newVal} → ${chain.map((c) => c.data).join(' → ')} → NULL]`,
          actionType: 'select_node',
          targetAddress: newAddr,
          highlightAddresses: [newAddr],
          resultMessage: `✓ Position 1 (Beginning) insertion verified! List: [${newVal} → ${chain.map((c) => c.data).join(' → ')} → NULL].`,
          nextStepPreview: 'Task Finished!',
          isCompleted: true,
        },
      ];
    }

    // Case 2: Position n+1 (End Insertion)
    if (validPos > n) {
      const tailNode = chain[n - 1];
      return [
        {
          stepNumber: 1,
          totalSteps: 5,
          title: 'Prepare the New Node',
          what: `Allocate new Node [${newVal}] at Address ${newAddr} with NEXT = NULL in Heap RAM.`,
          why: 'The new node will become the last element, so its NEXT pointer must be initialized to NULL.',
          pointersUpdated: `Allocated Node [${newVal}] @ ${newAddr} (NEXT = NULL)`,
          actionType: 'create_node',
          targetAddress: newAddr,
          targetData: newVal,
          createdNodeData: { data: newVal, address: newAddr },
          nextAddress: null,
          highlightAddresses: [newAddr],
          resultMessage: `✓ Node [${newVal}] created at Address ${newAddr} with NEXT = NULL!`,
          nextStepPreview: `Step 2: Identify current TAIL Node [${tailNode.data}].`,
          isCompleted: false,
        },
        {
          stepNumber: 2,
          totalSteps: 5,
          title: 'Identify the Current Tail',
          what: `Highlight current TAIL Node [${tailNode.data}] (Address ${tailNode.address}) and new Node [${newVal}].`,
          why: 'Appending to the list requires connecting the current last node to the new node.',
          pointersUpdated: `Referenced TAIL = ${tailNode.address}`,
          actionType: 'select_node',
          targetAddress: tailNode.address,
          highlightAddresses: [tailNode.address, newAddr],
          resultMessage: `✓ Current TAIL Node [${tailNode.data}] identified!`,
          nextStepPreview: `Step 3: Connect current TAIL Node [${tailNode.data}] to Node [${newVal}].`,
          isCompleted: false,
        },
        {
          stepNumber: 3,
          totalSteps: 5,
          title: 'Connect Old Tail to New Node',
          what: `Set tail->next = newNode (connect Node [${tailNode.data}] NEXT to Node [${newVal}] at Address ${newAddr}).`,
          why: 'Links the existing last node to the new node, extending the chain.',
          pointersUpdated: `Node [${tailNode.data}]->next = ${newAddr}`,
          actionType: 'connect_next',
          targetAddress: tailNode.address,
          nextAddress: newAddr,
          highlightAddresses: [tailNode.address, newAddr],
          resultMessage: `✓ Old TAIL connected to Node [${newVal}]!`,
          nextStepPreview: `Step 4: Update TAIL pointer to Node [${newVal}].`,
          isCompleted: false,
        },
        {
          stepNumber: 4,
          totalSteps: 5,
          title: 'Update the Tail Pointer',
          what: `Set tail = newNode (update TAIL pointer to Address ${newAddr}).`,
          why: 'The new node is now the last node of the list, so TAIL must reference it for O(1) operations.',
          pointersUpdated: `TAIL = ${newAddr}`,
          actionType: 'set_tail',
          targetAddress: newAddr,
          targetPointer: 'tail',
          highlightAddresses: [newAddr],
          resultMessage: `✓ TAIL pointer updated to Node [${newVal}]!`,
          nextStepPreview: 'Step 5: Verify the final linked list.',
          isCompleted: false,
        },
        {
          stepNumber: 5,
          totalSteps: 5,
          title: 'Verify the Result',
          what: `Confirm that Node [${newVal}] is the last node with NEXT = NULL, TAIL points to it, and node count increased by one.`,
          why: 'Ensures the append operation is valid and HEAD remains unchanged.',
          pointersUpdated: `List verified: [${chain.map((c) => c.data).join(' → ')} → ${newVal} → NULL]`,
          actionType: 'select_node',
          targetAddress: newAddr,
          highlightAddresses: [newAddr],
          resultMessage: `✓ Position ${validPos} (End) insertion complete!`,
          nextStepPreview: 'Task Finished!',
          isCompleted: true,
        },
      ];
    }

    // Case 3: Middle Insertion (1 < validPos <= n)
    const prevNode = chain[validPos - 2];
    const succNode = chain[validPos - 1];
    return [
      {
        stepNumber: 1,
        totalSteps: 5,
        title: 'Prepare the New Node',
        what: `Allocate new Node [${newVal}] at Address ${newAddr} in Heap RAM.`,
        why: 'Memory must be allocated on the heap before the node can be spliced into the list.',
        pointersUpdated: `Allocated Node [${newVal}] @ ${newAddr}`,
        actionType: 'create_node',
        targetAddress: newAddr,
        targetData: newVal,
        createdNodeData: { data: newVal, address: newAddr },
        nextAddress: null,
        highlightAddresses: [newAddr],
        resultMessage: `✓ Node [${newVal}] created at Address ${newAddr}!`,
        nextStepPreview: `Step 2: Identify predecessor Node [${prevNode.data}] and successor Node [${succNode.data}].`,
        isCompleted: false,
      },
      {
        stepNumber: 2,
        totalSteps: 5,
        title: 'Identify the Insertion Location',
        what: `Locate Position ${validPos} between predecessor Node [${prevNode.data}] (Address ${prevNode.address}) and successor Node [${succNode.data}] (Address ${succNode.address}).`,
        why: `Inserting at Position ${validPos} requires splicing between the predecessor (Pos ${validPos - 1}) and successor (Pos ${validPos}).`,
        pointersUpdated: `Referenced: prev = ${prevNode.address}, next = ${succNode.address}`,
        actionType: 'select_node',
        targetAddress: prevNode.address,
        highlightAddresses: [prevNode.address, succNode.address],
        resultMessage: `✓ Insertion location identified between Node [${prevNode.data}] and Node [${succNode.data}]!`,
        nextStepPreview: `Step 3: Connect Node [${newVal}] to successor Node [${succNode.data}].`,
        isCompleted: false,
      },
      {
        stepNumber: 3,
        totalSteps: 5,
        title: 'Connect New Node to Successor',
        what: `Set newNode->next = prev->next (connect Node [${newVal}] NEXT to Node [${succNode.data}] at Address ${succNode.address}).`,
        why: 'CRITICAL: Always link the new node to the successor FIRST so you do not lose the address of the rest of the list!',
        pointersUpdated: `newNode->next = ${succNode.address}`,
        actionType: 'connect_next',
        targetAddress: newAddr,
        nextAddress: succNode.address,
        highlightAddresses: [newAddr, succNode.address],
        resultMessage: `✓ Node [${newVal}] now points to successor Node [${succNode.data}]!`,
        nextStepPreview: `Step 4: Connect predecessor Node [${prevNode.data}] to Node [${newVal}].`,
        isCompleted: false,
      },
      {
        stepNumber: 4,
        totalSteps: 5,
        title: 'Connect Predecessor to New Node',
        what: `Set prev->next = newNode (connect Node [${prevNode.data}] NEXT to Node [${newVal}] at Address ${newAddr}).`,
        why: 'Now update the predecessor pointer to splice the new node into the list, completing the insertion.',
        pointersUpdated: `Node [${prevNode.data}]->next = ${newAddr}`,
        actionType: 'connect_next',
        targetAddress: prevNode.address,
        nextAddress: newAddr,
        highlightAddresses: [prevNode.address, newAddr],
        resultMessage: `✓ Predecessor Node [${prevNode.data}] connected to Node [${newVal}]!`,
        nextStepPreview: 'Step 5: Verify the final linked list.',
        isCompleted: false,
      },
      {
        stepNumber: 5,
        totalSteps: 5,
        title: 'Verify the Result',
        what: `Confirm that Node [${newVal}] occupies Position ${validPos}, all NEXT pointers are valid, and node count increased by one.`,
        why: 'Ensures the list structure is intact and HEAD/TAIL remain unchanged.',
        pointersUpdated: `List verified with Node [${newVal}] at Position ${validPos}`,
        actionType: 'select_node',
        targetAddress: newAddr,
        highlightAddresses: [newAddr],
        resultMessage: `✓ Middle insertion at Position ${validPos} complete!`,
        nextStepPreview: 'Task Finished!',
        isCompleted: true,
      },
    ];
  },

  // ---------------------------------------------------------------------------
  // LEVEL 04 - TASK 02: Delete at Any Position (Middle Deletion)
  // ---------------------------------------------------------------------------
  L4_T2: (nodes = [], pointers, deletePosition = 2) => {
    const defaultChain = [
      { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
      { id: 'n2', data: 20, address: 1002, nextAddress: 1003 },
      { id: 'n3', data: 30, address: 1003, nextAddress: 1004 },
      { id: 'n4', data: 40, address: 1004, nextAddress: 1005 },
      { id: 'n5', data: 50, address: 1005, nextAddress: null },
    ];
    const chain = defaultChain;
    const validPos = Math.max(1, Math.min(chain.length, deletePosition));
    const targetIndex = validPos - 1;
    const targetNode = chain[targetIndex];

    // Case 1: Position = 1 (Delete at Beginning)
    if (validPos === 1) {
      const nextNode = chain[1] || null;
      return [
        {
          stepNumber: 1,
          totalSteps: 4,
          title: 'Highlight Target Node to Delete',
          what: `Highlight ONLY the HEAD / first node at Position 1: Node [${targetNode.data}] (Address ${targetNode.address}).`,
          why: 'Locating the target node by position is the first step before updating adjacent pointers.',
          pointersUpdated: 'None yet (locating target node)',
          actionType: 'select_node',
          targetAddress: targetNode.address,
          targetData: targetNode.data,
          highlightAddresses: [targetNode.address],
          resultMessage: `✓ Target Node [${targetNode.data}] (Position 1) identified and highlighted.`,
          nextStepPreview: nextNode ? `Step 2: Advance HEAD to Node [${nextNode.data}].` : 'Step 2: Set HEAD = NULL.',
          isCompleted: false,
        },
        {
          stepNumber: 2,
          totalSteps: 4,
          title: 'Advance HEAD Pointer',
          what: nextNode
            ? `Update HEAD = target.next (advance HEAD to Node [${nextNode.data}] at Address ${nextNode.address}).`
            : 'Update HEAD = NULL (list becomes empty).',
          why: 'Preserves the access point to the rest of the list.',
          pointersUpdated: `HEAD = ${nextNode ? nextNode.address : 'NULL'}`,
          actionType: 'set_head',
          targetAddress: nextNode ? nextNode.address : null,
          highlightAddresses: nextNode ? [targetNode.address, nextNode.address] : [targetNode.address],
          resultMessage: `✓ HEAD pointer updated to ${nextNode ? `Node [${nextNode.data}]` : 'NULL'}!`,
          nextStepPreview: 'Step 3: Detach target node.',
          isCompleted: false,
        },
        {
          stepNumber: 3,
          totalSteps: 4,
          title: 'Detach Target Node',
          what: `Detach target Node [${targetNode.data}] by clearing its NEXT pointer (NEXT = NULL).`,
          why: 'Visually separates the target node from the active list.',
          pointersUpdated: `Target Node [${targetNode.data}] NEXT = NULL (detached)`,
          actionType: 'connect_next',
          targetAddress: targetNode.address,
          nextAddress: null,
          highlightAddresses: [targetNode.address],
          detachedAddress: targetNode.address,
          resultMessage: `✓ Target Node [${targetNode.data}] detached and shown separately.`,
          nextStepPreview: 'Step 4: Delete target node from RAM.',
          isCompleted: false,
        },
        {
          stepNumber: 4,
          totalSteps: 4,
          title: 'Delete Target Node',
          what: `Deallocate Node [${targetNode.data}] from heap memory (free(target)).`,
          why: 'Releases allocated memory, completing deletion at beginning.',
          pointersUpdated: `Target Node [${targetNode.data}] deallocated (free(target))`,
          actionType: 'delete_node',
          targetAddress: targetNode.address,
          highlightAddresses: [],
          detachedAddress: targetNode.address,
          resultMessage: `✓ Node [${targetNode.data}] freed from memory! Deletion at beginning completed.`,
          nextStepPreview: 'Task Finished!',
          isCompleted: true,
        },
      ];
    }

    // Case 2: Position = Last (Delete at Ending)
    if (validPos === chain.length) {
      const prevNode = chain[targetIndex - 1];
      return [
        {
          stepNumber: 1,
          totalSteps: 5,
          title: 'Highlight Target Node to Delete',
          what: `Highlight ONLY the TAIL / last node at Position ${validPos}: Node [${targetNode.data}] (Address ${targetNode.address}).`,
          why: 'Locating the target node by position is the first step before updating adjacent pointers.',
          pointersUpdated: 'None yet (locating target node)',
          actionType: 'select_node',
          targetAddress: targetNode.address,
          targetData: targetNode.data,
          highlightAddresses: [targetNode.address],
          resultMessage: `✓ Target TAIL Node [${targetNode.data}] (Position ${validPos}) identified and highlighted.`,
          nextStepPreview: `Step 2: Identify previous node [${prevNode.data}] and target node [${targetNode.data}].`,
          isCompleted: false,
        },
        {
          stepNumber: 2,
          totalSteps: 5,
          title: 'Identify Adjacent Nodes',
          what: `Highlight Previous Node [${prevNode.data}] (${prevNode.address}) and Target Node [${targetNode.data}] (${targetNode.address}).`,
          why: 'Locates the second-to-last node whose NEXT pointer must become NULL.',
          pointersUpdated: 'Nodes referenced: prev, target',
          actionType: 'select_node',
          targetAddress: prevNode.address,
          highlightAddresses: [prevNode.address, targetNode.address],
          resultMessage: `✓ Previous [${prevNode.data}] and Target [${targetNode.data}] identified.`,
          nextStepPreview: `Step 3: Update pointer previous.next = NULL.`,
          isCompleted: false,
        },
        {
          stepNumber: 3,
          totalSteps: 5,
          title: 'Update Pointer',
          what: `Update pointer: previous.next = NULL (Node [${prevNode.data}] NEXT = NULL) and set TAIL = ${prevNode.address}.`,
          why: 'Makes the second-to-last node the new end of the list.',
          pointersUpdated: `Node [${prevNode.data}] NEXT = NULL, TAIL = ${prevNode.address}`,
          actionType: 'connect_next',
          targetAddress: prevNode.address,
          nextAddress: null,
          highlightAddresses: [prevNode.address],
          resultMessage: `✓ Node [${prevNode.data}] is now the new end of list with NEXT = NULL.`,
          nextStepPreview: `Step 4: Detach target Node [${targetNode.data}].`,
          isCompleted: false,
        },
        {
          stepNumber: 4,
          totalSteps: 5,
          title: 'Detach Target Node',
          what: `Show Node [${targetNode.data}] as DETACHED.`,
          why: 'Visually separates the target node from the active list before deallocation.',
          pointersUpdated: `Target Node [${targetNode.data}] NEXT = NULL (detached)`,
          actionType: 'connect_next',
          targetAddress: targetNode.address,
          nextAddress: null,
          highlightAddresses: [targetNode.address],
          detachedAddress: targetNode.address,
          resultMessage: `✓ Target Node [${targetNode.data}] detached.`,
          nextStepPreview: `Step 5: Delete target Node [${targetNode.data}] from memory.`,
          isCompleted: false,
        },
        {
          stepNumber: 5,
          totalSteps: 5,
          title: 'Delete Target Node',
          what: `Delete target Node [${targetNode.data}] (Address ${targetNode.address}) from heap memory (free(target)).`,
          why: 'Releases allocated memory, completing deletion at end.',
          pointersUpdated: `Target Node [${targetNode.data}] deallocated (free(target))`,
          actionType: 'delete_node',
          targetAddress: targetNode.address,
          highlightAddresses: [],
          detachedAddress: targetNode.address,
          resultMessage: `✓ Node [${targetNode.data}] freed from memory! Deletion at ending completed.`,
          nextStepPreview: 'Task Finished!',
          isCompleted: true,
        },
      ];
    }

    // Case 3: Middle Deletion (1 < validPos < chain.length)
    const prevNode = chain[targetIndex - 1];
    const nextNode = chain[targetIndex + 1];

    return [
      {
        stepNumber: 1,
        totalSteps: 5,
        title: 'Highlight Target Node to Delete',
        what: `Highlight ONLY the target node to delete at position ${validPos}: Node [${targetNode.data}] (Address ${targetNode.address}).`,
        why: 'Locating the target node by position is the first step before updating adjacent pointers.',
        pointersUpdated: 'None yet (locating target node)',
        actionType: 'select_node',
        targetAddress: targetNode.address,
        targetData: targetNode.data,
        highlightAddresses: [targetNode.address],
        resultMessage: `✓ Target Node [${targetNode.data}] (Address ${targetNode.address}) identified and highlighted.`,
        nextStepPreview: `Step 2: Identify adjacent nodes: Previous [${prevNode.data}], Target [${targetNode.data}], and Next [${nextNode.data}].`,
        isCompleted: false,
      },
      {
        stepNumber: 2,
        totalSteps: 5,
        title: 'Identify Adjacent Nodes',
        what: `Highlight ONLY Previous Node [${prevNode.data}] (${prevNode.address}), Target Node [${targetNode.data}] (${targetNode.address}), and Next Node [${nextNode.data}] (${nextNode.address}).`,
        why: 'To bridge pointers around the target node, we must identify both the predecessor and successor nodes.',
        pointersUpdated: 'Nodes referenced: prev, target, next',
        actionType: 'select_node',
        targetAddress: prevNode.address,
        highlightAddresses: [prevNode.address, targetNode.address, nextNode.address],
        resultMessage: `✓ Previous [${prevNode.data}], Target [${targetNode.data}], and Next [${nextNode.data}] identified.`,
        nextStepPreview: `Step 3: Update pointer previous.next = target.next ([${prevNode.data}] → [${nextNode.data}]).`,
        isCompleted: false,
      },
      {
        stepNumber: 3,
        totalSteps: 5,
        title: 'Update Pointer',
        what: `Perform: previous.next = target.next. Change [${prevNode.data}] → [${targetNode.data}] to [${prevNode.data}] → [${nextNode.data}] at Address ${nextNode.address}.`,
        why: 'Bypasses the target node so the list remains continuously connected without breaking subsequent links.',
        pointersUpdated: `Node [${prevNode.data}] NEXT = ${nextNode.address} (points to Node [${nextNode.data}])`,
        actionType: 'connect_next',
        targetAddress: prevNode.address,
        nextAddress: nextNode.address,
        highlightAddresses: [prevNode.address, nextNode.address],
        resultMessage: `✓ Pointer bridged! Node [${prevNode.data}] now points directly to Node [${nextNode.data}].`,
        nextStepPreview: `Step 4: Detach target Node [${targetNode.data}].`,
        isCompleted: false,
      },
      {
        stepNumber: 4,
        totalSteps: 5,
        title: 'Detach Target Node',
        what: `Node [${targetNode.data}] should visually disconnect from the linked list. Show [${prevNode.data}] → [${nextNode.data}] and separately: [${targetNode.data}] DETACHED.`,
        why: 'Clears the outgoing pointer from the target node, completely separating it from the active chain.',
        pointersUpdated: `Target Node [${targetNode.data}] NEXT = NULL (detached)`,
        actionType: 'connect_next',
        targetAddress: targetNode.address,
        nextAddress: null,
        highlightAddresses: [targetNode.address],
        detachedAddress: targetNode.address,
        resultMessage: `✓ Target Node [${targetNode.data}] detached and shown separately.`,
        nextStepPreview: `Step 5: Delete target Node [${targetNode.data}] from RAM.`,
        isCompleted: false,
      },
      {
        stepNumber: 5,
        totalSteps: 5,
        title: 'Delete Target Node',
        what: `Remove Node [${targetNode.data}] (Address ${targetNode.address}) from RAM (free(target)).`,
        why: 'Releases the allocated heap memory, completing deletion at position.',
        pointersUpdated: `Target Node [${targetNode.data}] deallocated (free(target))`,
        actionType: 'delete_node',
        targetAddress: targetNode.address,
        highlightAddresses: [],
        detachedAddress: targetNode.address,
        resultMessage: `✓ Node [${targetNode.data}] freed from memory! Deletion at position ${validPos} completed.`,
        nextStepPreview: 'Task Finished!',
        isCompleted: true,
      },
    ];
  },

  // ---------------------------------------------------------------------------
  // LEVEL 04 - TASK 03: Linear Search
  // ---------------------------------------------------------------------------
  L4_T3: () => [
    {
      stepNumber: 1,
      totalSteps: 4,
      title: 'Initialize Search at HEAD',
      what: 'Point search pointer CURRENT to HEAD (Node 10, Address 1001).',
      why: 'Search starts at the first node to inspect each value sequentially.',
      actionType: 'search_step',
      targetAddress: 1001,
      resultMessage: '✓ CURRENT at Node 1001 (DATA: 10). Target is 40.',
      nextStepPreview: 'Step 2: Compare 10 with 40, advance to Node 1002.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 4,
      title: 'Inspect Node 10 & Advance',
      what: '10 ≠ 40. Advance CURRENT to `current->next` (Node 20, Address 1002).',
      why: 'When current node does not match target, follow NEXT pointer.',
      actionType: 'search_step',
      targetAddress: 1002,
      resultMessage: '✓ CURRENT advanced to Node 1002 (DATA: 20).',
      nextStepPreview: 'Step 3: Compare 20 with 40, advance to Node 1004.',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 4,
      title: 'Inspect Node 20 & Advance',
      what: '20 ≠ 40. Advance CURRENT to `current->next` (Node 40, Address 1004).',
      why: 'Continuing linear scan down the list.',
      actionType: 'search_step',
      targetAddress: 1004,
      resultMessage: '✓ CURRENT advanced to Node 1004 (DATA: 40).',
      nextStepPreview: 'Step 4: Compare 40 with 40 (Match!).',
      isCompleted: false,
    },
    {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Target Found at Node 1004',
      what: 'DATA 40 == 40. Target value found! Search completes.',
      why: 'Matching node address returned in O(k) steps.',
      actionType: 'search_step',
      targetAddress: 1004,
      resultMessage: '✓ Target 40 found at Address 1004! Search successful.',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  // ---------------------------------------------------------------------------
  // LEVEL 05 - MASTER MISSIONS (L5_M1 to L5_M7)
  // ---------------------------------------------------------------------------
  L5_M1: () => [
    {
      stepNumber: 1,
      totalSteps: 7,
      title: 'Create Node 10 (Addr 5001)',
      what: 'Allocate the first node with DATA = 10 at Address 5001 on the Heap.',
      why: 'Memory allocation in Heap is required before pointers can reference the first node.',
      pointersUpdated: 'Allocated Node 10 at Address 5001 with NEXT = NULL',
      actionType: 'create_node',
      targetAddress: 5001,
      targetData: 10,
      nextAddress: null,
      createdNodeData: { data: 10, address: 5001 },
      resultMessage: '✓ Node 10 (5001) created in Heap RAM.',
      nextStepPreview: 'Step 2: Point HEAD to Node 5001.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 7,
      title: 'Set HEAD to Node 5001',
      what: 'Point the HEAD pointer to Node 10 (Address 5001).',
      why: 'HEAD provides the entry point address to access the linked list chain.',
      pointersUpdated: 'HEAD = 5001 (points to Node 10)',
      actionType: 'set_head',
      targetAddress: 5001,
      targetPointer: 'head',
      resultMessage: '✓ HEAD pointer set to Address 5001.',
      nextStepPreview: 'Step 3: Create second node (DATA: 20 at Address 5002).',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 7,
      title: 'Create Node 20 (Addr 5002)',
      what: 'Allocate the second node with DATA = 20 at Address 5002.',
      why: 'The second node must exist in RAM before we can connect the first node to it.',
      pointersUpdated: 'Allocated Node 20 at Address 5002 with NEXT = NULL',
      actionType: 'create_node',
      targetAddress: 5002,
      targetData: 20,
      nextAddress: null,
      createdNodeData: { data: 20, address: 5002 },
      resultMessage: '✓ Node 20 (5002) created.',
      nextStepPreview: 'Step 4: Connect Node 5001 NEXT to Node 5002.',
      isCompleted: false,
    },
    {
      stepNumber: 4,
      totalSteps: 7,
      title: 'Connect Node 5001 → Node 5002',
      what: 'Wire Node 5001\'s NEXT pointer to point to Node 20 (Address 5002).',
      why: 'Storing 5002 in Node 5001\'s NEXT field links the first and second nodes.',
      pointersUpdated: 'Node 5001 NEXT = 5002 (10 → 20)',
      actionType: 'connect_next',
      targetAddress: 5001,
      nextAddress: 5002,
      resultMessage: '✓ Node 10 (5001) linked to Node 20 (5002).',
      nextStepPreview: 'Step 5: Create third node (DATA: 30 at Address 5003).',
      isCompleted: false,
    },
    {
      stepNumber: 5,
      totalSteps: 7,
      title: 'Create Node 30 (Addr 5003)',
      what: 'Allocate the third node with DATA = 30 at Address 5003.',
      why: 'The third node must exist in memory to complete the 3-node sequence.',
      pointersUpdated: 'Allocated Node 30 at Address 5003 with NEXT = NULL',
      actionType: 'create_node',
      targetAddress: 5003,
      targetData: 30,
      nextAddress: null,
      createdNodeData: { data: 30, address: 5003 },
      resultMessage: '✓ Node 30 (5003) created.',
      nextStepPreview: 'Step 6: Connect Node 5002 NEXT to Node 5003.',
      isCompleted: false,
    },
    {
      stepNumber: 6,
      totalSteps: 7,
      title: 'Connect Node 5002 → Node 5003',
      what: 'Wire Node 5002\'s NEXT pointer to point to Node 30 (Address 5003).',
      why: 'Extends the forward pointer chain from the second node to the third node.',
      pointersUpdated: 'Node 5002 NEXT = 5003 (20 → 30)',
      actionType: 'connect_next',
      targetAddress: 5002,
      nextAddress: 5003,
      resultMessage: '✓ Node 20 (5002) linked to Node 30 (5003).',
      nextStepPreview: 'Step 7: Set TAIL to Node 5003.',
      isCompleted: false,
    },
    {
      stepNumber: 7,
      totalSteps: 7,
      title: 'Set TAIL to Node 5003',
      what: 'Point TAIL to Node 30 (Address 5003) and ensure its NEXT terminates at NULL.',
      why: 'In singly linked lists, TAIL tracks the final node, enabling O(1) appends.',
      pointersUpdated: 'TAIL = 5003 (Node 5003 NEXT terminates at NULL)',
      actionType: 'set_tail',
      targetAddress: 5003,
      targetPointer: 'tail',
      resultMessage: '✓ TAIL set to 5003! 3-node list [10 → 20 → 30 → NULL] built successfully.',
      nextStepPreview: 'Task Finished! All 7 steps completed.',
      isCompleted: true,
    },
  ],

  L5_M2: () => [
    {
      stepNumber: 1,
      totalSteps: 2,
      title: 'Connect New Node 15 to Node 20',
      what: 'Connect staged Node 15 (Address 5004) NEXT pointer to Node 20 (Address 5002).',
      why: 'Crucial linked list rule: always wire new_node->next first to avoid breaking or losing the downstream chain.',
      pointersUpdated: 'Node 5004 NEXT = 5002 (15 → 20)',
      actionType: 'connect_next',
      targetAddress: 5004,
      nextAddress: 5002,
      highlightAddresses: [5004, 5002],
      resultMessage: '✓ Node 15 connected to Node 20 (15 → 20). Downstream list safely preserved.',
      nextStepPreview: 'Step 2: Connect predecessor Node 10 (5001) NEXT to Node 15 (5004).',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 2,
      title: 'Connect Predecessor Node 10 to Node 15',
      what: 'Connect Node 10 (Address 5001) NEXT pointer to new Node 15 (Address 5004).',
      why: 'Completes middle insertion: predecessor->next = new_node. The list becomes [10 → 15 → 20 → 30].',
      pointersUpdated: 'Node 5001 NEXT = 5004 (10 → 15 → 20)',
      actionType: 'connect_next',
      targetAddress: 5001,
      nextAddress: 5004,
      highlightAddresses: [5001, 5004],
      resultMessage: '✓ Insertion complete! Node 15 is now spliced between 10 and 20.',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  L5_M3: () => [
    {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Update Node 20 NEXT to NULL',
      what: 'Disconnect last Node 30 by setting Node 20\'s (5002) NEXT pointer to NULL.',
      why: 'Node 20 will become the new end of the chain, so its NEXT pointer must terminate at NULL.',
      pointersUpdated: 'Node 5002 NEXT = NULL (Node 30 detached)',
      actionType: 'connect_next',
      targetAddress: 5002,
      nextAddress: null,
      highlightAddresses: [5002, 5003],
      resultMessage: '✓ Node 20 NEXT set to NULL. Node 30 is now detached from the chain.',
      nextStepPreview: 'Step 2: Update TAIL pointer to Node 20 (Address 5002).',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Update TAIL to Node 20',
      what: 'Update the TAIL pointer to point to Node 20 (Address 5002).',
      why: 'TAIL must always reference the current last node in the list.',
      pointersUpdated: 'TAIL = 5002 (points to Node 20)',
      actionType: 'set_tail',
      targetAddress: 5002,
      targetPointer: 'tail',
      highlightAddresses: [5002],
      resultMessage: '✓ TAIL moved to Node 20 (Address 5002).',
      nextStepPreview: 'Step 3: Free detached Node 30 from Heap RAM.',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Free Detached Node 30',
      what: 'Delete detached Node 30 (Address 5003) from memory (free(node30)).',
      why: 'Deallocating unreferenced heap memory prevents memory leaks.',
      pointersUpdated: 'Node 5003 deallocated from RAM (free(tail))',
      actionType: 'delete_node',
      targetAddress: 5003,
      detachedAddress: 5003,
      resultMessage: '✓ Node 30 freed from RAM! Tail deletion complete.',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  L5_M4: () => [
    {
      stepNumber: 1,
      totalSteps: 2,
      title: 'Connect New Node 5 to Current HEAD',
      what: 'Connect new Node 5 (Address 5000) NEXT pointer to current HEAD Node 10 (Address 5001).',
      why: 'In prepending, always wire new_node->next = head first so existing elements are never lost.',
      pointersUpdated: 'Node 5000 NEXT = 5001 (5 → 10)',
      actionType: 'connect_next',
      targetAddress: 5000,
      nextAddress: 5001,
      highlightAddresses: [5000, 5001],
      resultMessage: '✓ Node 5 connected to current HEAD (5 → 10).',
      nextStepPreview: 'Step 2: Update HEAD pointer to Node 5 (Address 5000).',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 2,
      title: 'Update HEAD to Node 5',
      what: 'Point the HEAD pointer to new Node 5 (Address 5000).',
      why: 'Completes O(1) prepend: head = new_node. The list now begins at Node 5.',
      pointersUpdated: 'HEAD = 5000 (points to Node 5)',
      actionType: 'set_head',
      targetAddress: 5000,
      targetPointer: 'head',
      highlightAddresses: [5000],
      resultMessage: '✓ HEAD updated to Node 5! Prepend completed in O(1) time.',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  L5_M5: () => [
    {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Connect Tail Node 20 to New Node 40',
      what: 'Connect current TAIL Node 20 (Address 5002) NEXT pointer to new Node 40 (Address 5005).',
      why: 'In appending with a TAIL pointer, link current tail->next = new_node in constant O(1) time.',
      pointersUpdated: 'Node 5002 NEXT = 5005 (20 → 40)',
      actionType: 'connect_next',
      targetAddress: 5002,
      nextAddress: 5005,
      highlightAddresses: [5002, 5005],
      resultMessage: '✓ Node 20 connected to Node 40 (20 → 40).',
      nextStepPreview: 'Step 2: Update TAIL pointer to Node 40 (Address 5005).',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Update TAIL to Node 40',
      what: 'Move TAIL pointer to point to Node 40 (Address 5005).',
      why: 'TAIL must maintain reference to the new final node of the linked list.',
      pointersUpdated: 'TAIL = 5005 (points to Node 40)',
      actionType: 'set_tail',
      targetAddress: 5005,
      targetPointer: 'tail',
      highlightAddresses: [5005],
      resultMessage: '✓ TAIL pointer updated to Node 40 (Address 5005).',
      nextStepPreview: 'Step 3: Verify Node 40 NEXT terminates at NULL.',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Verify Node 40 NEXT Terminates at NULL',
      what: 'Verify that Node 40\'s NEXT pointer is NULL.',
      why: 'Every valid singly linked list must terminate with NEXT = NULL at the tail.',
      pointersUpdated: 'Node 5005 NEXT = NULL (list terminator)',
      actionType: 'verify_null',
      targetAddress: 5005,
      nextAddress: null,
      highlightAddresses: [5005],
      resultMessage: '✓ Verified! Node 40 terminates with NEXT = NULL. Append complete.',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  L5_M6: () => [
    {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Inspect HEAD (Node 5 at 5000)',
      what: 'Initialize CURRENT at HEAD (Address 5000). Compare Node DATA 5 with Target 15.',
      why: 'Linear search sequentially compares each node starting from HEAD. 5 ≠ 15 (No match).',
      pointersUpdated: 'CURRENT = 5000 (evaluating 5 ≠ 15)',
      actionType: 'search_step',
      targetAddress: 5000,
      highlightAddresses: [5000],
      resultMessage: '✓ CURRENT at Node 5 (5000). 5 ≠ 15. Advancing along NEXT pointer.',
      nextStepPreview: 'Step 2: Advance CURRENT to Node 10 (Address 5001).',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Advance to Node 10 (Addr 5001)',
      what: 'Advance CURRENT = current->next to Node 10 (Address 5001). Compare 10 with Target 15.',
      why: '10 ≠ 15 (No match). The pointer advances down the chain.',
      pointersUpdated: 'CURRENT = 5001 (evaluating 10 ≠ 15)',
      actionType: 'search_step',
      targetAddress: 5001,
      highlightAddresses: [5001],
      resultMessage: '✓ CURRENT at Node 10 (5001). 10 ≠ 15. Advancing along NEXT pointer.',
      nextStepPreview: 'Step 3: Advance CURRENT to Node 15 (Address 5004).',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Advance to Node 15 & Match Target',
      what: 'Advance CURRENT to Node 15 (Address 5004). Compare DATA 15 == Target 15 (Match!).',
      why: 'Target located! Search halts immediately in O(k) steps without scanning the rest of the list.',
      pointersUpdated: 'CURRENT = 5004 (TARGET MATCH: 15 == 15)',
      actionType: 'search_step',
      targetAddress: 5004,
      highlightAddresses: [5004],
      resultMessage: '✓ Target Value 15 FOUND at Address 5004! Search halts successfully.',
      nextStepPreview: 'Task Finished! Target located.',
      isCompleted: true,
    },
  ],

  L5_M7: () => [
    {
      stepNumber: 1,
      totalSteps: 6,
      title: 'Start Traversal at HEAD (Node 5)',
      what: 'Set CURRENT = HEAD (Node 5 at Address 5000). Stream DATA = 5 to output.',
      why: 'Traversal reads the list in forward order starting from the entry pointer HEAD.',
      pointersUpdated: 'CURRENT = 5000 | Output: [5]',
      actionType: 'traverse_step',
      targetAddress: 5000,
      targetData: 5,
      highlightAddresses: [5000],
      resultMessage: '✓ CURRENT at Node 5 (5000). Streamed DATA: 5.',
      nextStepPreview: 'Step 2: Advance to Node 10 (Address 5001).',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 6,
      title: 'Advance CURRENT to Node 10',
      what: 'Follow NEXT pointer to Node 10 (Address 5001). Stream DATA = 10 to output.',
      why: 'Advancing `current = current->next` moves to the second node.',
      pointersUpdated: 'CURRENT = 5001 | Output: [5, 10]',
      actionType: 'traverse_step',
      targetAddress: 5001,
      targetData: 10,
      highlightAddresses: [5000, 5001],
      resultMessage: '✓ CURRENT moved to Node 10 (5001). Streamed DATA: 10.',
      nextStepPreview: 'Step 3: Advance to Node 15 (Address 5004).',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 6,
      title: 'Advance CURRENT to Node 15',
      what: 'Follow NEXT pointer to Node 15 (Address 5004). Stream DATA = 15 to output.',
      why: 'Node 10 has NEXT = 5004. Reads spliced middle node.',
      pointersUpdated: 'CURRENT = 5004 | Output: [5, 10, 15]',
      actionType: 'traverse_step',
      targetAddress: 5004,
      targetData: 15,
      highlightAddresses: [5001, 5004],
      resultMessage: '✓ CURRENT moved to Node 15 (5004). Streamed DATA: 15.',
      nextStepPreview: 'Step 4: Advance to Node 20 (Address 5002).',
      isCompleted: false,
    },
    {
      stepNumber: 4,
      totalSteps: 6,
      title: 'Advance CURRENT to Node 20',
      what: 'Follow NEXT pointer to Node 20 (Address 5002). Stream DATA = 20 to output.',
      why: 'Node 15 has NEXT = 5002. Reads the fourth node.',
      pointersUpdated: 'CURRENT = 5002 | Output: [5, 10, 15, 20]',
      actionType: 'traverse_step',
      targetAddress: 5002,
      targetData: 20,
      highlightAddresses: [5004, 5002],
      resultMessage: '✓ CURRENT moved to Node 20 (5002). Streamed DATA: 20.',
      nextStepPreview: 'Step 5: Advance to Node 40 (Address 5005).',
      isCompleted: false,
    },
    {
      stepNumber: 5,
      totalSteps: 6,
      title: 'Advance CURRENT to Node 40',
      what: 'Follow NEXT pointer to Node 40 (Address 5005). Stream DATA = 40 to output.',
      why: 'Node 20 has NEXT = 5005. Reads the final node.',
      pointersUpdated: 'CURRENT = 5005 | Output: [5, 10, 15, 20, 40]',
      actionType: 'traverse_step',
      targetAddress: 5005,
      targetData: 40,
      highlightAddresses: [5002, 5005],
      resultMessage: '✓ CURRENT moved to Node 40 (5005). Streamed DATA: 40.',
      nextStepPreview: 'Step 6: Reach NULL to complete traversal.',
      isCompleted: false,
    },
    {
      stepNumber: 6,
      totalSteps: 6,
      title: 'Reach End of List (NULL)',
      what: 'Node 40 has NEXT = NULL. Select NULL to complete traversal.',
      why: 'When CURRENT becomes NULL, the traversal terminates safely.',
      pointersUpdated: 'CURRENT = NULL | Final Stream: 5 → 10 → 15 → 20 → 40 → NULL',
      actionType: 'traverse_step',
      targetAddress: null,
      highlightAddresses: [5005],
      resultMessage: '✓ Master Traversal Complete! [5 → 10 → 15 → 20 → 40 → NULL]. Master Certification Unlocked! 🏆',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],
};

/**
 * Returns all step definitions for a task.
 */
export function getAllTaskSteps(
  task: SLLTaskDef,
  nodesOrDeletePos: SLLNode[] | number = [],
  pointers: SLLPointerState = { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null },
  deletePosition?: number
): SLLTeacherStep[] {
  if (!task) return [];

  let safeNodes: SLLNode[] = [];
  let safePointers: SLLPointerState =
    pointers && typeof pointers === 'object'
      ? pointers
      : { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
  let safeDeletePos = deletePosition;

  if (typeof nodesOrDeletePos === 'number') {
    safeDeletePos = nodesOrDeletePos;
    safeNodes = Array.isArray(task?.initialNodes) ? JSON.parse(JSON.stringify(task.initialNodes)) : [];
  } else if (safeDeletePos === undefined) {
    safeDeletePos = task.id === 'L4_T1' ? 3 : 2;
  } else if (Array.isArray(nodesOrDeletePos)) {
    safeNodes = nodesOrDeletePos;
  } else if (Array.isArray(task?.initialNodes)) {
    safeNodes = JSON.parse(JSON.stringify(task.initialNodes));
  }

  const builder = TASK_STEP_BUILDERS[task.id];
  if (builder) {
    try {
      return builder(safeNodes, safePointers, safeDeletePos);
    } catch (err) {
      console.warn(`[sllStepAssistant] Builder error for ${task.id}:`, err);
    }
  }

  // Fallback synthesis if task has guideSteps
  if (task.guideSteps && task.guideSteps.length > 0) {
    const total = task.guideSteps.length;
    return task.guideSteps.map((gs, idx) => ({
      stepNumber: gs.stepNumber || idx + 1,
      totalSteps: total,
      title: `Step ${idx + 1}: ${gs.instruction}`,
      what: gs.instruction,
      why: gs.explanation,
      actionType: (gs.targetAction as any) || 'check_answer',
      targetAddress: gs.targetNodeAddress ?? null,
      resultMessage: `✓ Completed step ${idx + 1}`,
      nextStepPreview: idx + 1 < total ? `Step ${idx + 2}` : 'Finished',
      isCompleted: idx + 1 === total,
    }));
  }

  // Generic fallback
  return [
    {
      stepNumber: 1,
      totalSteps: 1,
      title: task.title || 'Task',
      what: task.objective || 'Complete task',
      why: task.conceptExplanation || '',
      actionType: 'check_answer',
      resultMessage: '✓ Task requirements satisfied!',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ];
}

/**
 * Returns the exact step for the specified step number (1-based).
 */
export function getTaskStep(
  task: SLLTaskDef,
  stepNumber: number,
  nodesOrDeletePos: SLLNode[] | number = [],
  pointers: SLLPointerState = { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null },
  deletePosition?: number
): SLLTeacherStep | null {
  const steps = getAllTaskSteps(task, nodesOrDeletePos, pointers, deletePosition);
  const found = steps.find((s) => s.stepNumber === stepNumber);
  if (found) return found;
  if (stepNumber >= 1 && stepNumber <= steps.length) {
    return steps[stepNumber - 1];
  }
  return null;
}

/**
 * Returns total steps for a task.
 */
export function getTaskTotalSteps(
  task: SLLTaskDef,
  nodesOrDeletePos: SLLNode[] | number = [],
  pointers: SLLPointerState = { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null },
  deletePosition?: number
): number {
  const steps = getAllTaskSteps(task, nodesOrDeletePos, pointers, deletePosition);
  return steps.length;
}

/**
 * Evaluates whether a specific teacher step has already been satisfied by the live game state.
 */
export function isStepSatisfied(
  step: SLLTeacherStep,
  nodes: SLLNode[] = [],
  pointers: SLLPointerState = { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null },
  traversalOutput: number[] = [],
  searchCompleted: boolean = false
): boolean {
  if (!step) return false;

  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safePointers = pointers || { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };

  switch (step.actionType) {
    case 'create_node': {
      const address = step.createdNodeData?.address ?? step.targetAddress;
      const data = step.createdNodeData?.data ?? step.targetData;
      return safeNodes.some((n) => n.address === address || (data !== undefined && n.data === data));
    }

    case 'set_head': {
      const expected = step.targetAddress !== undefined ? step.targetAddress : null;
      return safePointers.headAddress === expected;
    }

    case 'set_tail': {
      const expected = step.targetAddress !== undefined ? step.targetAddress : null;
      return safePointers.tailAddress === expected;
    }

    case 'connect_next': {
      if (step.targetAddress === undefined || step.targetAddress === null) return true;
      const node = safeNodes.find((n) => n.address === step.targetAddress);
      if (!node) return false;
      const expectedNext = step.nextAddress !== undefined ? step.nextAddress : null;
      return node.nextAddress === expectedNext;
    }

    case 'delete_node': {
      if (step.targetAddress === undefined || step.targetAddress === null) return true;
      return !safeNodes.some((n) => n.address === step.targetAddress);
    }

    case 'select_node':
    case 'highlight_target': {
      return false;
    }

    case 'traverse_step': {
      if (step.targetAddress === null) {
        return safePointers.currentAddress === null && traversalOutput.length > 0;
      }
      if (step.targetData !== undefined && traversalOutput.includes(step.targetData)) {
        return true;
      }
      return safePointers.currentAddress === step.targetAddress;
    }

    case 'search_step': {
      if (searchCompleted) return true;
      if (step.isCompleted && safePointers.currentAddress === step.targetAddress) return true;
      return false;
    }

    case 'verify_null': {
      if (step.targetAddress === undefined || step.targetAddress === null) return true;
      const node = safeNodes.find((n) => n.address === step.targetAddress);
      const isTail = safePointers.tailAddress === step.targetAddress;
      return Boolean(node && node.nextAddress === null && isTail);
    }

    case 'check_answer': {
      return false;
    }

    default:
      return false;
  }
}

/**
 * Derives the exact next uncompleted step number (1-indexed) from actual game state.
 * Supports starting at beginning, middle, or end of a game without repeating or skipping steps.
 */
export function getNextUncompletedStepNumber(
  task: SLLTaskDef,
  nodes: SLLNode[] = [],
  pointers: SLLPointerState = { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null },
  traversalOutput: number[] = [],
  searchCompleted: boolean = false,
  deletePosition?: number
): number {
  if (!task) return 1;

  const safeDeletePos = deletePosition ?? (task.id === 'L4_T1' ? 3 : 2);
  const steps = getAllTaskSteps(task, nodes, pointers, safeDeletePos);
  if (steps.length === 0) return 1;

  // Authoritative validation check
  const val = validateTaskAnswer(task, nodes, pointers, traversalOutput, searchCompleted, safeDeletePos);
  if (val.isValid) {
    return steps.length + 1; // All steps finished!
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // If any later mutating step is satisfied, prior steps are satisfied
    let subsequentSatisfied = false;
    for (let j = i + 1; j < steps.length; j++) {
      if (isStepSatisfied(steps[j], nodes, pointers, traversalOutput, searchCompleted)) {
        subsequentSatisfied = true;
        break;
      }
    }

    if (subsequentSatisfied) {
      continue;
    }

    if (!isStepSatisfied(step, nodes, pointers, traversalOutput, searchCompleted)) {
      return i + 1;
    }
  }

  return steps.length;
}

/**
 * Executes exactly ONE logical action on the shared game state.
 * Guaranteed to actually modify nodes, pointers, and memory state.
 */
export function executeSingleTeacherStep(
  step: SLLTeacherStep,
  currentState: {
    nodes: SLLNode[];
    pointers: SLLPointerState;
    traversalOutput: number[];
  }
): {
  nodes: SLLNode[];
  pointers: SLLPointerState;
  traversalOutput: number[];
  feedbackMessage: string;
} {
  let newNodes: SLLNode[] = Array.isArray(currentState?.nodes) ? JSON.parse(JSON.stringify(currentState.nodes)) : [];
  let newPointers: SLLPointerState = currentState?.pointers
    ? { ...currentState.pointers }
    : { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
  let newOutput: number[] = Array.isArray(currentState?.traversalOutput) ? [...currentState.traversalOutput] : [];

  switch (step.actionType) {
    case 'create_node': {
      const data = step.createdNodeData?.data ?? step.targetData ?? 10;
      const address = step.createdNodeData?.address ?? step.targetAddress ?? 1001;
      const nextAddr = step.nextAddress !== undefined ? step.nextAddress : null;

      // Only add if not already in memory at that address
      if (!newNodes.some((n) => n.address === address)) {
        newNodes.push({
          id: `node-${address}`,
          data,
          address,
          nextAddress: nextAddr,
        });
      }
      break;
    }

    case 'set_head': {
      newPointers.headAddress = step.targetAddress !== undefined ? step.targetAddress : null;
      if (step.targetAddress === null && (step.title?.includes('TAIL = NULL') || step.what?.includes('TAIL = NULL'))) {
        newPointers.tailAddress = null;
      }
      // Do not silently set tail here so tasks teaching HEAD and TAIL can teach them as separate steps
      break;
    }

    case 'set_tail': {
      newPointers.tailAddress = step.targetAddress !== undefined ? step.targetAddress : null;
      break;
    }

    case 'select_node':
    case 'highlight_target': {
      // Step to identify / highlight target node - acknowledge action
      break;
    }

    case 'connect_next': {
      if (step.targetAddress !== undefined && step.targetAddress !== null) {
        newNodes = newNodes.map((n) =>
          n.address === step.targetAddress
            ? { ...n, nextAddress: step.nextAddress !== undefined ? step.nextAddress : null }
            : n
        );
      }
      break;
    }

    case 'delete_node': {
      if (step.targetAddress !== undefined && step.targetAddress !== null) {
        newNodes = newNodes
          .filter((n) => n.address !== step.targetAddress)
          .map((n) => (n.nextAddress === step.targetAddress ? { ...n, nextAddress: null } : n));
        if (newPointers.headAddress === step.targetAddress) newPointers.headAddress = null;
        if (newPointers.tailAddress === step.targetAddress) newPointers.tailAddress = null;
        if (newPointers.currentAddress === step.targetAddress) newPointers.currentAddress = null;
      }
      break;
    }

    case 'traverse_step': {
      if (step.targetAddress !== undefined && step.targetAddress !== null) {
        newPointers.currentAddress = step.targetAddress;
        const tgtNode = newNodes.find((n) => n.address === step.targetAddress);
        const dataToAdd = step.targetData !== undefined ? step.targetData : tgtNode?.data;
        if (dataToAdd !== undefined && !newOutput.includes(dataToAdd)) {
          newOutput.push(dataToAdd);
        }
      } else {
        newPointers.currentAddress = null;
      }
      break;
    }

    case 'search_step': {
      if (step.targetAddress !== undefined && step.targetAddress !== null) {
        newPointers.currentAddress = step.targetAddress;
      }
      break;
    }

    case 'verify_null': {
      if (step.targetAddress !== undefined && step.targetAddress !== null) {
        newNodes = newNodes.map((n) =>
          n.address === step.targetAddress ? { ...n, nextAddress: null } : n
        );
        newPointers.tailAddress = step.targetAddress;
      }
      break;
    }

    default:
      break;
  }

  return {
    nodes: newNodes,
    pointers: newPointers,
    traversalOutput: newOutput,
    feedbackMessage: step.resultMessage,
  };
}

/**
 * Returns the current teacher step based on currentStep index or state analysis.
 */
export function getNextTeacherStep(
  task: SLLTaskDef,
  nodes: SLLNode[],
  pointers: SLLPointerState,
  traversalOutput: number[] = [],
  searchResult: string = 'idle',
  searchCurrentNode: SLLNode | null = null,
  currentStepIndex?: number,
  deletePosition: number = 2
): SLLTeacherStep | null {
  const stepIdx =
    typeof currentStepIndex === 'number' && currentStepIndex >= 1
      ? currentStepIndex
      : getNextUncompletedStepNumber(task, nodes, pointers, traversalOutput, searchResult === 'found', deletePosition);
  return getTaskStep(task, stepIdx, nodes, pointers, deletePosition);
}

/**
 * Returns contextual instructions and recommended tools for PLAY mode based on currentStep.
 */
export function getContextualPlayAdvice(
  task: SLLTaskDef,
  nodes: SLLNode[],
  pointers: SLLPointerState,
  currentStep: number = 1,
  deletePosition: number = 2
): {
  primaryInstruction: string;
  recommendedAction: 'create_node' | 'connect_next' | 'set_head' | 'set_tail' | 'delete_node' | 'traverse' | 'search' | 'check_answer';
  targetAddress?: number | null;
  targetData?: number;
} {
  const step = getTaskStep(task, currentStep, nodes, pointers, deletePosition);
  if (!step) {
    return {
      primaryInstruction: 'All operations look complete! Click CHECK ANSWER to verify.',
      recommendedAction: 'check_answer',
    };
  }

  switch (step.actionType) {
    case 'create_node':
      return {
        primaryInstruction: `Create Node with DATA = ${step.createdNodeData?.data ?? step.targetData ?? 10}`,
        recommendedAction: 'create_node',
        targetAddress: step.createdNodeData?.address ?? step.targetAddress,
        targetData: step.createdNodeData?.data ?? step.targetData,
      };
    case 'connect_next':
      return {
        primaryInstruction: `Connect Node ${step.targetAddress}'s NEXT to ${step.nextAddress !== null ? `Node ${step.nextAddress}` : 'NULL'}`,
        recommendedAction: 'connect_next',
        targetAddress: step.targetAddress,
      };
    case 'set_head':
      return {
        primaryInstruction: step.targetAddress !== null ? `Click Node ${step.targetAddress} to make it HEAD` : 'Set HEAD to NULL',
        recommendedAction: 'set_head',
        targetAddress: step.targetAddress,
      };
    case 'set_tail':
      return {
        primaryInstruction: step.targetAddress !== null ? `Click Node ${step.targetAddress} to make it TAIL` : 'Set TAIL to NULL',
        recommendedAction: 'set_tail',
        targetAddress: step.targetAddress,
      };
    case 'delete_node':
      return {
        primaryInstruction: `Click Node ${step.targetAddress} and select Delete Node`,
        recommendedAction: 'delete_node',
        targetAddress: step.targetAddress,
      };
    case 'select_node':
    case 'highlight_target':
      return {
        primaryInstruction: step.what,
        recommendedAction: 'check_answer',
        targetAddress: step.targetAddress,
      };
    case 'verify_null':
      return {
        primaryInstruction: `Verify Node ${step.targetAddress} has NEXT = NULL and TAIL points to it`,
        recommendedAction: 'check_answer',
        targetAddress: step.targetAddress,
      };
    default:
      return {
        primaryInstruction: step.what,
        recommendedAction: 'check_answer',
      };
  }
}
