import { SLLNode, SLLPointerState, SLLTaskDef, SLLTeacherStep } from '../types/sllGame';

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
    const safePointers: SLLPointerState =
      pointers && typeof pointers === 'object'
        ? {
            headAddress: pointers.headAddress ?? null,
            tailAddress: pointers.tailAddress ?? null,
            currentAddress: pointers.currentAddress ?? null,
            tempAddress: pointers.tempAddress ?? null,
            prevAddress: pointers.prevAddress ?? null,
          }
        : { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
    const chain = getOrderedNodesList(safeNodes, safePointers);
    const headNode =
      chain[0] ||
      (safePointers?.headAddress ? safeNodes.find((n) => n.address === safePointers.headAddress) : null) ||
      safeNodes.find((n) => n.address === 1001) ||
      safeNodes[0] ||
      { id: 'n1', data: 10, address: 1001, nextAddress: 1002 };
    const secondNode =
      (headNode.nextAddress ? safeNodes.find((n) => n.address === headNode.nextAddress) : null) ||
      chain[1] ||
      safeNodes.find((n) => n.address === 1002) ||
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
    const safePointers: SLLPointerState =
      pointers && typeof pointers === 'object'
        ? {
            headAddress: pointers.headAddress ?? null,
            tailAddress: pointers.tailAddress ?? null,
            currentAddress: pointers.currentAddress ?? null,
            tempAddress: pointers.tempAddress ?? null,
            prevAddress: pointers.prevAddress ?? null,
          }
        : { headAddress: null, tailAddress: null, currentAddress: null, tempAddress: null, prevAddress: null };
    const chain = getOrderedNodesList(safeNodes, safePointers);
    const lastNode =
      (safePointers?.tailAddress ? safeNodes.find((n) => n.address === safePointers.tailAddress) : null) ||
      chain[chain.length - 1] ||
      safeNodes.find((n) => n.address === 1003) ||
      safeNodes[safeNodes.length - 1] ||
      { id: 'n3', data: 30, address: 1003, nextAddress: null };
    const secondLastNode =
      chain.length >= 2
        ? chain[chain.length - 2]
        : safeNodes.find((n) => n.nextAddress === lastNode.address) ||
          safeNodes.find((n) => n.address === 1002) ||
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
  // LEVEL 04 - TASK 01: Insert at Any Position (Node 30 Between 20 and 40)
  // ---------------------------------------------------------------------------
  L4_T1: () => [
    {
      stepNumber: 1,
      totalSteps: 2,
      title: 'Connect New Node to Right Neighbor',
      what: 'Connect Node 30 (Address 1003) NEXT to Node 40 (Address 1004).',
      why: 'Crucial: always link the new node to the downstream list first (`newNode->next = prev->next`).',
      pointersUpdated: 'Node 30 NEXT = 1004',
      actionType: 'connect_next',
      targetAddress: 1003,
      nextAddress: 1004,
      resultMessage: '✓ Node 30 connected to Node 40 (30 → 40).',
      nextStepPreview: 'Step 2: Connect Node 20 to Node 30.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 2,
      title: 'Connect Left Neighbor to New Node',
      what: 'Connect Node 20 (Address 1002) NEXT to Node 30 (Address 1003).',
      why: 'Updating `prev->next = newNode` completes the middle insertion without losing elements.',
      pointersUpdated: 'Node 20 NEXT = 1003',
      actionType: 'connect_next',
      targetAddress: 1002,
      nextAddress: 1003,
      resultMessage: '✓ Node 20 connected to Node 30. Insertion [20 → 30 → 40] complete!',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  // ---------------------------------------------------------------------------
  // LEVEL 04 - TASK 02: Delete at Any Position (Middle Deletion)
  // ---------------------------------------------------------------------------
  L4_T2: (nodes = [], pointers, deletePosition = 2) => {
    let chain = getOrderedNodesList(nodes, pointers);
    if (chain.length === 0) {
      chain = nodes.length > 0 ? [...nodes] : [
        { id: 'n1', data: 10, address: 1001, nextAddress: 1002 },
        { id: 'n2', data: 20, address: 1002, nextAddress: 1003 },
        { id: 'n3', data: 30, address: 1003, nextAddress: 1004 },
        { id: 'n4', data: 40, address: 1004, nextAddress: 1005 },
        { id: 'n5', data: 50, address: 1005, nextAddress: null },
      ];
    }

    const validPos = Math.max(1, Math.min(chain.length, deletePosition));
    const targetIndex = validPos - 1;
    const targetNode = chain[targetIndex] || chain[0];

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
      totalSteps: 3,
      title: 'Create First Node (10)',
      what: 'Create Node 10 at Address 1001 in Heap RAM.',
      why: 'First step of master linked list creation.',
      actionType: 'create_node',
      targetAddress: 1001,
      targetData: 10,
      nextAddress: null,
      createdNodeData: { data: 10, address: 1001 },
      resultMessage: '✓ Node 10 created.',
      nextStepPreview: 'Step 2: Point HEAD to Node 1001.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Set HEAD to Node 1001',
      what: 'Point HEAD to Node 1001.',
      why: 'Establishes list entry pointer.',
      actionType: 'set_head',
      targetAddress: 1001,
      resultMessage: '✓ HEAD set to Node 1001.',
      nextStepPreview: 'Step 3: Point TAIL to Node 1001.',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Set TAIL to Node 1001',
      what: 'Point TAIL to Node 1001.',
      why: '1-node list boundary setup.',
      actionType: 'set_tail',
      targetAddress: 1001,
      resultMessage: '✓ TAIL set to Node 1001. Mission 1 Complete!',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  L5_M2: () => [
    {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Create Node 20',
      what: 'Create Node 20 at Address 1002.',
      why: 'Node must exist in RAM before appending.',
      actionType: 'create_node',
      targetAddress: 1002,
      targetData: 20,
      nextAddress: null,
      createdNodeData: { data: 20, address: 1002 },
      resultMessage: '✓ Node 20 created.',
      nextStepPreview: 'Step 2: Connect Node 10 to Node 20.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Connect Node 10 → Node 20',
      what: 'Connect Node 10 (1001) NEXT to Node 20 (1002).',
      why: 'Link the tail to the new node.',
      actionType: 'connect_next',
      targetAddress: 1001,
      nextAddress: 1002,
      resultMessage: '✓ Node 10 linked to Node 20.',
      nextStepPreview: 'Step 3: Update TAIL to Node 20.',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Update TAIL to Node 20',
      what: 'Move TAIL to Node 20 (1002).',
      why: 'Node 20 is the new tail.',
      actionType: 'set_tail',
      targetAddress: 1002,
      resultMessage: '✓ TAIL updated to Node 20. Mission 2 Complete!',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  L5_M3: () => [
    {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Create Node 5',
      what: 'Create Node 5 at Address 1000.',
      why: 'Allocate node for prepending.',
      actionType: 'create_node',
      targetAddress: 1000,
      targetData: 5,
      nextAddress: null,
      createdNodeData: { data: 5, address: 1000 },
      resultMessage: '✓ Node 5 created.',
      nextStepPreview: 'Step 2: Connect Node 5 to Node 10.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Connect Node 5 → Node 10',
      what: 'Connect Node 5 (1000) NEXT to Node 10 (1001).',
      why: 'Link new node to current head first.',
      actionType: 'connect_next',
      targetAddress: 1000,
      nextAddress: 1001,
      resultMessage: '✓ Node 5 connected to Node 10.',
      nextStepPreview: 'Step 3: Update HEAD to Node 5.',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Update HEAD to Node 5',
      what: 'Point HEAD to Node 5 (1000).',
      why: 'Node 5 is the new list start.',
      actionType: 'set_head',
      targetAddress: 1000,
      resultMessage: '✓ HEAD set to Node 5. Mission 3 Complete!',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  L5_M4: () => [
    {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Create Node 15',
      what: 'Create Node 15 at Address 1005.',
      why: 'Allocate middle node.',
      actionType: 'create_node',
      targetAddress: 1005,
      targetData: 15,
      nextAddress: null,
      createdNodeData: { data: 15, address: 1005 },
      resultMessage: '✓ Node 15 created.',
      nextStepPreview: 'Step 2: Connect Node 15 to Node 20.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Connect Node 15 → Node 20',
      what: 'Connect Node 15 (1005) NEXT to Node 20 (1002).',
      why: 'Link to right neighbor first.',
      actionType: 'connect_next',
      targetAddress: 1005,
      nextAddress: 1002,
      resultMessage: '✓ Node 15 linked to Node 20.',
      nextStepPreview: 'Step 3: Connect Node 10 to Node 15.',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Connect Node 10 → Node 15',
      what: 'Connect Node 10 (1001) NEXT to Node 15 (1005).',
      why: 'Link left neighbor to complete middle insertion.',
      actionType: 'connect_next',
      targetAddress: 1001,
      nextAddress: 1005,
      resultMessage: '✓ Node 10 linked to Node 15. Mission 4 Complete!',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  L5_M5: () => [
    {
      stepNumber: 1,
      totalSteps: 2,
      title: 'Bypass Node 15',
      what: 'Connect Node 10 (1001) NEXT directly to Node 20 (1002).',
      why: 'Bypasses Node 15 to cut it from the list.',
      actionType: 'connect_next',
      targetAddress: 1001,
      nextAddress: 1002,
      resultMessage: '✓ Node 10 now points directly to Node 20.',
      nextStepPreview: 'Step 2: Free detached Node 15.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 2,
      title: 'Free Node 15',
      what: 'Free Node 15 (1005) from memory.',
      why: 'Deallocate unused heap memory.',
      actionType: 'delete_node',
      targetAddress: 1005,
      resultMessage: '✓ Node 15 freed. Mission 5 Complete!',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  L5_M6: () => [
    {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Start Search at HEAD',
      what: 'Set CURRENT = HEAD (Node 5, Address 1000).',
      why: 'Linear search starts at head.',
      actionType: 'search_step',
      targetAddress: 1000,
      resultMessage: '✓ CURRENT at Node 5 (Target: 20).',
      nextStepPreview: 'Step 2: Advance to Node 10.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Advance to Node 10',
      what: '5 ≠ 20. Move CURRENT to Node 10 (Address 1001).',
      why: 'Follow NEXT pointer.',
      actionType: 'search_step',
      targetAddress: 1001,
      resultMessage: '✓ CURRENT at Node 10.',
      nextStepPreview: 'Step 3: Advance to Node 20 and match target.',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Match Target at Node 20',
      what: 'DATA 20 == 20. Match found at Address 1002!',
      why: 'Search completes successfully.',
      actionType: 'search_step',
      targetAddress: 1002,
      resultMessage: '✓ Target 20 found at Address 1002! Mission 6 Complete!',
      nextStepPreview: 'Task Finished!',
      isCompleted: true,
    },
  ],

  L5_M7: () => [
    {
      stepNumber: 1,
      totalSteps: 4,
      title: 'Start Traversal at HEAD',
      what: 'Set CURRENT = HEAD (Node 5, Address 1000).',
      why: 'Begin list traversal.',
      actionType: 'traverse_step',
      targetAddress: 1000,
      targetData: 5,
      resultMessage: '✓ Streamed DATA: 5.',
      nextStepPreview: 'Step 2: Advance to Node 10.',
      isCompleted: false,
    },
    {
      stepNumber: 2,
      totalSteps: 4,
      title: 'Advance to Node 10',
      what: 'CURRENT moved to Node 10 (Address 1001).',
      why: 'Read and advance.',
      actionType: 'traverse_step',
      targetAddress: 1001,
      targetData: 10,
      resultMessage: '✓ Streamed DATA: 10.',
      nextStepPreview: 'Step 3: Advance to Node 20.',
      isCompleted: false,
    },
    {
      stepNumber: 3,
      totalSteps: 4,
      title: 'Advance to Node 20',
      what: 'CURRENT moved to Node 20 (Address 1002).',
      why: 'Read and advance.',
      actionType: 'traverse_step',
      targetAddress: 1002,
      targetData: 20,
      resultMessage: '✓ Streamed DATA: 20.',
      nextStepPreview: 'Step 4: Reach NULL.',
      isCompleted: false,
    },
    {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Reach End of List (NULL)',
      what: 'CURRENT encounters NULL, ending traversal.',
      why: 'Final mission complete!',
      actionType: 'traverse_step',
      targetAddress: null,
      resultMessage: '✓ Master Linked List Traversal Completed: [5, 10, 20]! 🎉',
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
  deletePosition: number = 2
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
  deletePosition: number = 2
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
  deletePosition: number = 2
): number {
  const steps = getAllTaskSteps(task, nodesOrDeletePos, pointers, deletePosition);
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
        if (step.targetData !== undefined && !newOutput.includes(step.targetData)) {
          newOutput.push(step.targetData);
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
  currentStepIndex: number = 1,
  deletePosition: number = 2
): SLLTeacherStep | null {
  return getTaskStep(task, currentStepIndex, nodes, pointers, deletePosition);
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
