import { SLLNode, SLLPointerState, SLLTaskDef, SLLFeedback } from '../types/sllGame';

export interface SLLValidationResult {
  isValid: boolean;
  feedback: SLLFeedback;
  orderedData: number[];
  visitedAddresses: number[];
  orphanedNodes: SLLNode[];
  hasCycle: boolean;
}

export function analyzeLinkedList(
  nodes: SLLNode[],
  pointers: SLLPointerState
): {
  orderedNodes: SLLNode[];
  orderedData: number[];
  visitedAddresses: number[];
  orphanedNodes: SLLNode[];
  hasCycle: boolean;
  lastVisitedAddress: number | null;
} {
  const orderedNodes: SLLNode[] = [];
  const orderedData: number[] = [];
  const visitedAddresses: number[] = [];
  const visitedSet = new Set<number>();
  let hasCycle = false;
  let lastVisitedAddress: number | null = null;

  let currentAddr = pointers.headAddress;

  while (currentAddr !== null) {
    if (visitedSet.has(currentAddr)) {
      hasCycle = true;
      break;
    }

    visitedSet.add(currentAddr);
    visitedAddresses.push(currentAddr);
    lastVisitedAddress = currentAddr;

    const node = nodes.find((n) => n.address === currentAddr);
    if (!node) {
      // Pointer points to a non-existent memory address!
      break;
    }

    orderedNodes.push(node);
    orderedData.push(node.data);
    currentAddr = node.nextAddress;
  }

  const orphanedNodes = nodes.filter((n) => !visitedSet.has(n.address));

  return {
    orderedNodes,
    orderedData,
    visitedAddresses,
    orphanedNodes,
    hasCycle,
    lastVisitedAddress,
  };
}

export function validateTaskAnswer(
  task: SLLTaskDef,
  nodes: SLLNode[],
  pointers: SLLPointerState,
  traversalOutput: number[] = [],
  searchCompleted: boolean = false,
  customDeletePosition?: number
): SLLValidationResult {
  const analysis = analyzeLinkedList(nodes, pointers);
  const { orderedNodes, orderedData, visitedAddresses, orphanedNodes, hasCycle, lastVisitedAddress } = analysis;

  // 1. Check for infinite loops / cycles
  if (hasCycle) {
    return {
      isValid: false,
      feedback: {
        type: 'error',
        title: 'Cycle Detected in Singly Linked List!',
        message: 'A node points back to an earlier node in the chain, creating an infinite loop.',
        explanation: 'In a Standard Singly Linked List, the last node MUST have NEXT = NULL. Circular links are only valid in Circular Linked Lists.',
      },
      ...analysis,
    };
  }

  // 2. Custom Validators for specific task scenarios
  if (task.targetCondition.customValidator === 'L1_T1_NODE_CREATED') {
    const node10 = nodes.find((n) => n.data === 10 || n.address === 1001);
    const node20 = nodes.find((n) => n.data === 20 || n.address === 1002);
    const headCorrect = pointers.headAddress === 1001;
    const connected = node10 && node10.nextAddress === 1002;

    if (!node10) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'First Node Not Created Yet',
          message: 'Click "+ Create Node" to allocate your first node (DATA: 10, ADDR: 1001) in RAM.',
          explanation: 'Every node in a linked list must be allocated before pointers can reference it.',
        },
        ...analysis,
      };
    }

    if (!headCorrect) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'HEAD Not Set',
          message: 'Make Node 10 (1001) the HEAD of your list.',
          explanation: 'HEAD must point to the first node to access the list.',
        },
        ...analysis,
      };
    }

    if (!node20) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Second Node Not Created',
          message: 'Create the second node with DATA: 20 at Address 1002.',
          explanation: 'Allocate the next node in memory before connecting it.',
        },
        ...analysis,
      };
    }

    if (!connected) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Nodes Not Connected',
          message: "Connect Node 10's NEXT pointer to Node 20 (Address 1002).",
          explanation: 'The NEXT field holds the memory address of the following node.',
        },
        ...analysis,
      };
    }

    return {
      isValid: true,
      feedback: {
        type: 'success',
        title: 'Linked List Built Successfully! 🎉',
        message: 'You have created, initialized, and linked your first Singly Linked List: [ 10 → 20 → NULL ]!',
        explanation: 'HEAD points to 1001, Node 10 points to Node 20, and Node 20 terminates at NULL.',
      },
      ...analysis,
    };
  }

  if (task.targetCondition.customValidator === 'L1_T2_VALIDATOR') {
    // Check if node at 1002 with data 20 exists in nodes array
    const node20 = nodes.find((n) => n.address === 1002);
    if (!node20) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Node Not Allocated',
          message: 'The new node at Address 1002 has not been created in memory yet.',
          explanation: 'Click "+ Create Node" and enter DATA = 20, Address = 1002, and NEXT = NULL.',
        },
        ...analysis,
      };
    }
    if (node20.data !== 20) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Incorrect Node Data',
          message: `Node at 1002 contains DATA = ${node20.data}, but expected DATA = 20.`,
        },
        ...analysis,
      };
    }
    return {
      isValid: true,
      feedback: {
        type: 'success',
        title: 'Node Allocated Successfully!',
        message: 'New node [ DATA: 20 | Addr: 1002 ] is allocated in Heap RAM as an isolated node.',
        explanation: 'Notice that HEAD and TAIL are unchanged. In the next task, we will link Node 10 to Node 20.',
      },
      ...analysis,
    };
  }

  if (task.targetCondition.customValidator === 'L2_T1_UNDERFLOW') {
    if (pointers.headAddress === null && nodes.length === 0) {
      return {
        isValid: true,
        feedback: {
          type: 'success',
          title: 'Underflow Handled Correctly!',
          message: 'You verified that deleting from an empty list triggers the underflow safety guard.',
          explanation: 'In code, always check `if (head == NULL)` before attempting to dereference `head->next`.',
        },
        ...analysis,
      };
    }
  }

  if (task.targetCondition.customValidator === 'L3_TRAVERSAL_COMPLETE') {
    const expected = [10, 20, 30, 40];
    const isMatched =
      traversalOutput.length === expected.length &&
      expected.every((v, i) => traversalOutput[i] === v);

    if (isMatched) {
      return {
        isValid: true,
        feedback: {
          type: 'success',
          title: 'Traversal Completed Perfectly!',
          message: 'All 4 nodes were visited sequentially in exact order (10 → 20 → 30 → 40 → NULL).',
          explanation: 'Linear traversal successfully outputted all node elements in O(N) time without random access.',
        },
        ...analysis,
      };
    } else {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Incomplete Traversal',
          message: `Currently traversed: [${traversalOutput.join(', ')}]. Expected: [10, 20, 30, 40].`,
          explanation: 'Follow the CURRENT pointer through each NEXT address until reaching NULL.',
        },
        ...analysis,
      };
    }
  }

  if (task.targetCondition.customValidator === 'L4_SEARCH_COMPLETE' || task.targetCondition.customValidator === 'L5_SEARCH_25' || task.targetCondition.customValidator === 'L5_SEARCH_15') {
    if (searchCompleted) {
      return {
        isValid: true,
        feedback: {
          type: 'success',
          title: 'Target Value Located!',
          message: 'You evaluated node values sequentially and halted immediately upon matching the target.',
          explanation: 'Linear search ran in O(k) steps where k is the index of the target node.',
        },
        ...analysis,
      };
    } else {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Search Not Finished',
          message: 'Please complete the sequential search steps to find the target element.',
        },
        ...analysis,
      };
    }
  }

  if (task.targetCondition.customValidator === 'L5_FINAL_TRAVERSAL_5') {
    const expected = [5, 10, 15, 20, 40];
    const isMatched =
      traversalOutput.length === expected.length &&
      expected.every((v, i) => traversalOutput[i] === v);

    if (isMatched) {
      return {
        isValid: true,
        feedback: {
          type: 'success',
          title: 'Master Certification Traversal Complete! 🏆',
          message: 'All 5 nodes (5 → 10 → 15 → 20 → 40 → NULL) were visited and streamed in exact order.',
          explanation: 'You have mastered all pointer manipulations and traversals in Singly Linked Lists!',
        },
        ...analysis,
      };
    } else {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Incomplete Certification Traversal',
          message: `Currently traversed: [${traversalOutput.join(', ')}]. Expected: [5, 10, 15, 20, 40].`,
          explanation: 'Traverse through each node starting at HEAD (5000) until reaching NULL.',
        },
        ...analysis,
      };
    }
  }

  if (task.targetCondition.customValidator === 'L5_M1_VALIDATOR') {
    const isCountMatch = nodes.length === 5;
    const isOrderMatch =
      orderedData.length === 5 &&
      [10, 20, 30, 40, 50].every((v, i) => orderedData[i] === v);

    if (!isCountMatch || !isOrderMatch) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'List Structure Mismatch',
          message: `Current list: [${orderedData.join(' → ')}]. Expected: [10 → 20 → 30 → 40 → 50].`,
          explanation: 'Create 5 nodes and link them consecutively with the last node NEXT = NULL.',
        },
        ...analysis,
      };
    }
    if (pointers.headAddress === null || pointers.tailAddress === null) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'HEAD or TAIL Missing',
          message: 'Both HEAD and TAIL pointers must be set.',
          explanation: 'Set HEAD to the first node address and TAIL to the last node address.',
        },
        ...analysis,
      };
    }
  }

  // L4_T1: Insert at Any Position dynamic validation
  if (task.id === 'L4_T1' || task.targetCondition.customValidator === 'L4_T1_INSERT_ANY') {
    const initialOrdered = task.initialNodes && task.initialPointers
      ? analyzeLinkedList(task.initialNodes, task.initialPointers).orderedData
      : [10, 20, 30, 40, 50];
    const initialList = initialOrdered.length > 0 ? initialOrdered : [10, 20, 30, 40, 50];
    const n = initialList.length;

    let pos = customDeletePosition;
    if (pos === undefined) {
      // Auto-detect position from inserted node if not explicitly passed
      for (let i = 0; i < orderedData.length; i++) {
        const withoutI = orderedData.filter((_, idx) => idx !== i);
        if (
          withoutI.length === initialList.length &&
          initialList.every((val, idx) => withoutI[idx] === val)
        ) {
          pos = i + 1;
          break;
        }
      }
      if (pos === undefined) {
        pos = 3;
      }
    }

    // 1. Validate position boundaries (1 to n + 1)
    if (pos < 1 || pos > n + 1) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Invalid Insertion Position',
          message: `Position ${pos} is invalid. Valid positions for a ${n}-node list are 1 through ${n + 1}.`,
          explanation: `In 1-based indexing, valid positions range from 1 (Beginning) to ${n + 1} (End).`,
        },
        ...analysis,
      };
    }

    // 2. Check for orphaned / unlinked nodes in RAM
    if (orphanedNodes.length > 0) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Unlinked Node Detected',
          message: `Node(s) at address [${orphanedNodes.map((node) => node.address).join(', ')}] are not connected to the linked list.`,
          explanation: 'All allocated nodes must either be linked into the list reachable from HEAD or freed from memory.',
        },
        ...analysis,
      };
    }

    // 3. Check total node count (must increase by exactly one)
    if (orderedData.length !== n + 1) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Incorrect Node Count',
          message: `Linked list contains ${orderedData.length} nodes, but expected ${n + 1} nodes after a single insertion.`,
          explanation: `Inserting a new node must increase the total linked-list node count by exactly one (from ${n} to ${n + 1}).`,
        },
        ...analysis,
      };
    }

    // 4. Identify the inserted node and verify that original nodes remain intact in relative order
    const insertedVal = orderedData[pos - 1];
    const listWithoutInserted = orderedData.filter((_, idx) => idx !== pos - 1);
    const isOriginalIntact =
      listWithoutInserted.length === initialList.length &&
      initialList.every((val, idx) => listWithoutInserted[idx] === val);

    if (!isOriginalIntact) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'List Sequence Disrupted',
          message: `The original nodes were modified or reordered incorrectly. Current list: [${orderedData.join(' → ')}].`,
          explanation: `Inserting a node at Position ${pos} should preserve the relative order of all original nodes: [${initialList.join(' → ')}].`,
        },
        ...analysis,
      };
    }

    // 5. Check HEAD pointer
    const expectedHeadAddr = orderedNodes[0]?.address ?? null;
    if (pointers.headAddress !== expectedHeadAddr) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'HEAD Pointer Mismatch',
          message: `HEAD points to ${pointers.headAddress !== null ? pointers.headAddress : 'NULL'}, but should point to the first node (Address ${expectedHeadAddr}).`,
          explanation: pos === 1
            ? 'When inserting at Position 1 (Beginning), HEAD must be updated to the new node.'
            : 'HEAD must always point to the first node in the list.',
        },
        ...analysis,
      };
    }

    // 6. Check TAIL pointer
    const expectedTailAddr = orderedNodes[orderedNodes.length - 1]?.address ?? null;
    if (pointers.tailAddress !== expectedTailAddr) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'TAIL Pointer Mismatch',
          message: `TAIL points to ${pointers.tailAddress !== null ? pointers.tailAddress : 'NULL'}, but should point to the last node (Address ${expectedTailAddr}).`,
          explanation: pos === n + 1
            ? 'When inserting at Position ' + (n + 1) + ' (End), TAIL must be updated to the new node.'
            : 'TAIL must point to the last node in the list.',
        },
        ...analysis,
      };
    }

    // 7. Check last node's NEXT is NULL
    if (orderedNodes[orderedNodes.length - 1]?.nextAddress !== null) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Last Node NEXT is Not NULL',
          message: `The last node (Address ${expectedTailAddr}) does not point to NULL.`,
          explanation: 'In a singly linked list, the final node must terminate with NEXT = NULL.',
        },
        ...analysis,
      };
    }

    // 8. Success!
    const desc = pos === 1 ? 'Beginning' : pos === n + 1 ? 'End' : 'Middle';
    return {
      isValid: true,
      feedback: {
        type: 'success',
        title: 'Position Insertion Complete! 🎉',
        message: `Node [${insertedVal}] successfully inserted at Position ${pos} (${desc} Insertion). Full list: [${orderedData.join(' → ')} → NULL].`,
        explanation: 'All pointer connections, HEAD, TAIL, and list length verified successfully!',
      },
      ...analysis,
    };
  }

  // L4_T2: Delete at Any Position dynamic validation
  if (task.id === 'L4_T2' || task.targetCondition.customValidator === 'L4_T2_DELETE_ANY') {
    const pos = customDeletePosition ?? 2;
    const initialList = [10, 20, 30, 40, 50];
    const targetIdx = Math.max(0, Math.min(initialList.length - 1, pos - 1));
    const targetVal = initialList[targetIdx];
    const expectedOrder = initialList.filter((_, idx) => idx !== targetIdx);

    if (orphanedNodes.length > 0) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Orphaned Node Detected',
          message: `Node(s) at address [${orphanedNodes.map((n) => n.address).join(', ')}] are not reachable from HEAD.`,
          explanation: `Ensure the detached node is completely deleted from RAM and predecessor is linked to successor.`,
        },
        ...analysis,
      };
    }

    const isOrderMatch =
      orderedData.length === expectedOrder.length &&
      expectedOrder.every((val, idx) => orderedData[idx] === val);

    if (isOrderMatch) {
      return {
        isValid: true,
        feedback: {
          type: 'success',
          title: 'Position Deletion Complete! 🎉',
          message: `Node [${targetVal}] at Position ${pos} was successfully removed. Remaining list: [${orderedData.join(' → ')} → NULL].`,
          explanation: 'You successfully bridged adjacent pointers and freed the target node in O(N) traversal time!',
        },
        ...analysis,
      };
    } else {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'List Sequence Mismatch',
          message: `Current list: [${orderedData.join(' → ')}]. Expected after deleting Position ${pos} (Node [${targetVal}]): [${expectedOrder.join(' → ')}].`,
          explanation: `Locate the node at Position ${pos}, bridge previous->next = target->next, and delete the target node.`,
        },
        ...analysis,
      };
    }
  }

  // 3. General Validation: Target Order
  if (task.targetCondition.expectedOrder) {
    const expected = task.targetCondition.expectedOrder;
    const isOrderMatch =
      orderedData.length === expected.length &&
      expected.every((val, idx) => orderedData[idx] === val);

    if (!isOrderMatch) {
      // Check common student mistakes:
      if (orderedData.length < expected.length) {
        if (orphanedNodes.length > 0) {
          return {
            isValid: false,
            feedback: {
              type: 'error',
              title: 'Orphaned / Unlinked Nodes Detected',
              message: `Nodes at address(es) [${orphanedNodes.map((n) => n.address).join(', ')}] are not reachable from HEAD.`,
              explanation: 'Check your NEXT pointers. Every node in the list must be pointed to by its predecessor.',
            },
            ...analysis,
          };
        }
        return {
          isValid: false,
          feedback: {
            type: 'error',
            title: 'List Sequence Too Short',
            message: `Your list has ${orderedData.length} reachable elements [${orderedData.join(' → ')}], but ${expected.length} were expected [${expected.join(' → ')}].`,
            explanation: 'Make sure all required nodes are created and connected via NEXT pointers.',
          },
          ...analysis,
        };
      } else {
        return {
          isValid: false,
          feedback: {
            type: 'error',
            title: 'Incorrect Node Sequence',
            message: `Your list is currently [${orderedData.join(' → ')}], but the expected sequence is [${expected.join(' → ')}].`,
            explanation: 'Double-check the order of NEXT pointers connecting each node.',
          },
          ...analysis,
        };
      }
    }
  }

  // 4. Validate HEAD Pointer
  if (task.targetCondition.expectedHead !== undefined) {
    if (pointers.headAddress !== task.targetCondition.expectedHead) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Incorrect HEAD Pointer',
          message: `HEAD is currently pointing to ${pointers.headAddress !== null ? pointers.headAddress : 'NULL'}, but should point to ${task.targetCondition.expectedHead !== null ? task.targetCondition.expectedHead : 'NULL'}.`,
          explanation: 'HEAD must always point directly to the very first node of the list.',
        },
        ...analysis,
      };
    }
  }

  // 5. Validate TAIL Pointer
  if (task.targetCondition.expectedTail !== undefined) {
    if (pointers.tailAddress !== task.targetCondition.expectedTail) {
      return {
        isValid: false,
        feedback: {
          type: 'error',
          title: 'Incorrect TAIL Pointer',
          message: `TAIL is currently pointing to ${pointers.tailAddress !== null ? pointers.tailAddress : 'NULL'}, but should point to ${task.targetCondition.expectedTail !== null ? task.targetCondition.expectedTail : 'NULL'}.`,
          explanation: 'TAIL must always point directly to the last node whose NEXT is NULL.',
        },
        ...analysis,
      };
    }
  }

  // 6. Validate Specific NEXT Pointers
  if (task.targetCondition.expectedNodeNext) {
    for (const [addrStr, expNext] of Object.entries(task.targetCondition.expectedNodeNext)) {
      const addr = Number(addrStr);
      const node = nodes.find((n) => n.address === addr);
      if (!node) {
        return {
          isValid: false,
          feedback: {
            type: 'error',
            title: 'Missing Node',
            message: `Node at address ${addr} was not found in memory.`,
          },
          ...analysis,
        };
      }
      if (node.nextAddress !== expNext) {
        // Did student enter data value instead of address?
        const matchingDataNode = nodes.find((n) => n.data === node.nextAddress);
        if (matchingDataNode) {
          return {
            isValid: false,
            feedback: {
              type: 'error',
              title: 'Data Value Used Instead of Address',
              message: `Node at ${addr} has NEXT = ${node.nextAddress}. It looks like you entered DATA (${node.nextAddress}) instead of the node's memory ADDRESS (${matchingDataNode.address})!`,
              explanation: 'NEXT pointers always store memory addresses, never the numerical data value.',
            },
            ...analysis,
          };
        }

        return {
          isValid: false,
          feedback: {
            type: 'error',
            title: 'Incorrect NEXT Pointer',
            message: `Node at Address ${addr} has NEXT = ${node.nextAddress !== null ? node.nextAddress : 'NULL'}, but expected ${expNext !== null ? expNext : 'NULL'}.`,
            explanation: 'Update this node\'s NEXT pointer using the "Change NEXT" tool.',
          },
          ...analysis,
        };
      }
    }
  }

  // 7. Check for orphaned / detached nodes if not expected
  if (orphanedNodes.length > 0 && (!task.targetCondition.expectedNodesCount || task.targetCondition.expectedNodesCount < nodes.length)) {
    return {
      isValid: false,
      feedback: {
        type: 'warning',
        title: 'Unlinked Memory (Memory Leak Warning)',
        message: `There are ${orphanedNodes.length} detached node(s) at Address [${orphanedNodes.map((n) => n.address).join(', ')}] not connected to the list.`,
        explanation: 'In C/C++, detached nodes that are not freed cause memory leaks. Either link them or delete them.',
      },
      ...analysis,
    };
  }

  // 8. Passed all checks!
  return {
    isValid: true,
    feedback: {
      type: 'success',
      title: 'Task Completed Successfully! 🎉',
      message: 'Your linked list pointers and memory addresses are 100% correct.',
      explanation: task.conceptExplanation,
    },
    ...analysis,
  };
}
