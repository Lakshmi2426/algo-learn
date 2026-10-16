// Mapping for the 11 Integrated DSA Mini-Website Modules

export interface ModuleRouteConfig {
  moduleId: string;
  folderName: string;
  title: string;
  routeHash: string;
}

export const INTEGRATED_MODULES: Record<string, ModuleRouteConfig> = {
  hashing: {
    moduleId: 'hashing',
    folderName: 'hashing and collision resolution techniques',
    title: 'Hashing & Collision Resolution',
    routeHash: '#/topics/Hashing',
  },
  'linear-search': {
    moduleId: 'linear-search',
    folderName: 'linearsearchf-main',
    title: 'Linear Search',
    routeHash: '#/topics/Linear-search',
  },
  cll: {
    moduleId: 'cll',
    folderName: 'Circular Linked List (CLL)',
    title: 'Circular Linked List (CLL)',
    routeHash: '#/topics/CLL',
  },
  dll: {
    moduleId: 'dll',
    folderName: 'Doubly Linked List (DLL)',
    title: 'Doubly Linked List (DLL)',
    routeHash: '#/topics/DLL',
  },
  trees: {
    moduleId: 'trees',
    folderName: 'Trees',
    title: 'Trees',
    routeHash: '#/topics/Trees',
  },
  bst: {
    moduleId: 'bst',
    folderName: 'Binary Search Tree',
    title: 'Binary Search Tree (BST)',
    routeHash: '#/topics/BST',
  },
  'dsa-types': {
    moduleId: 'dsa-types',
    folderName: 'Data Structure and Types',
    title: 'Data Structure and Types',
    routeHash: '#/topics/dsa-types',
  },
  sorting: {
    moduleId: 'sorting',
    folderName: 'Sorting',
    title: 'Sorting',
    routeHash: '#/topics/Sorting',
  },
  bfs: {
    moduleId: 'bfs',
    folderName: 'BFS',
    title: 'Breadth-First Search (BFS)',
    routeHash: '#/topics/BFS',
  },
  queue: {
    moduleId: 'queue',
    folderName: 'Queues',
    title: 'Queues',
    routeHash: '#/topics/Queue',
  },
  sll: {
    moduleId: 'sll',
    folderName: 'Singly Linked List (SLL)',
    title: 'Singly Linked List (SLL)',
    routeHash: '#/topics/SLL',
  },
  stack: {
    moduleId: 'stack',
    folderName: 'Stack',
    title: 'Stack',
    routeHash: '#/topics/Stack',
  },
  'binary-search': {
    moduleId: 'binary-search',
    folderName: 'Binary Search',
    title: 'Binary Search',
    routeHash: '#/topics/Binary-Search',
  },
};

/**
 * Maps a topic ID or Title to an integrated module configuration if present.
 */
export function getIntegratedModuleForTopic(
  topicIdOrTitle: string
): ModuleRouteConfig | null {
  if (!topicIdOrTitle) return null;
  const norm = topicIdOrTitle.toLowerCase().trim();

  if (norm === 'stack' || norm.includes('stack')) {
    return INTEGRATED_MODULES.stack;
  }
  if (
    norm === 'binary-search' ||
    norm === 'binary search' ||
    (norm.includes('binary') && norm.includes('search') && !norm.includes('tree'))
  ) {
    return INTEGRATED_MODULES['binary-search'];
  }
  if (norm === 'hashing' || norm.includes('hashing') || norm.includes('collision') || norm === 'hashing-and-collision-resolution') {
    return INTEGRATED_MODULES.hashing;
  }
  if (norm === 'linear-search' || norm === 'linear search' || norm.includes('linear search')) {
    return INTEGRATED_MODULES['linear-search'];
  }
  if (norm === 'cll' || norm === 'circular-linked-list' || norm.includes('circular linked')) {
    return INTEGRATED_MODULES.cll;
  }
  if (norm === 'dll' || norm === 'doubly-linked-list' || norm.includes('doubly linked')) {
    return INTEGRATED_MODULES.dll;
  }
  if (norm === 'bst' || norm === 'binary-search-tree' || norm === 'binary search tree' || (norm.includes('binary') && norm.includes('tree'))) {
    return INTEGRATED_MODULES.bst;
  }
  if (norm === 'trees' || norm === 'tree' || norm.includes('tree')) {
    return INTEGRATED_MODULES.trees;
  }
  if (
    norm === 'dsa-types' ||
    norm === 'dsa types' ||
    norm === 'data-structures-and-types' ||
    norm.includes('data structure')
  ) {
    return INTEGRATED_MODULES['dsa-types'];
  }
  if (norm === 'sorting' || norm === 'sort' || norm.includes('sorting')) {
    return INTEGRATED_MODULES.sorting;
  }
  if (norm === 'bfs' || norm === 'breadth-first-search' || norm.includes('breadth')) {
    return INTEGRATED_MODULES.bfs;
  }
  if (norm === 'queue' || norm === 'queues' || norm.includes('queue')) {
    return INTEGRATED_MODULES.queue;
  }
  if (norm === 'sll' || norm === 'singly-linked-list' || norm.includes('singly linked')) {
    return INTEGRATED_MODULES.sll;
  }

  return null;
}

/**
 * Resolves an active module config from window.location.hash.
 * Supports /#/topics/BFS, #topics/BFS, #/topics/BFS, etc.
 */
export function getModuleFromHash(hash: string): ModuleRouteConfig | null {
  if (!hash) return null;
  let cleanHash = hash.replace(/^[\/#]+/, '').trim();
  if (!cleanHash.toLowerCase().startsWith('topics/')) return null;

  const topicSlug = cleanHash.slice('topics/'.length).trim().toLowerCase();

  if (topicSlug === 'stack') return INTEGRATED_MODULES.stack;
  if (topicSlug === 'binary-search' || topicSlug === 'binary search' || topicSlug === 'binary-search') return INTEGRATED_MODULES['binary-search'];
  if (topicSlug === 'hashing' || topicSlug === 'hashing-and-collision-resolution') return INTEGRATED_MODULES.hashing;
  if (topicSlug === 'linear-search' || topicSlug === 'linear search') return INTEGRATED_MODULES['linear-search'];
  if (topicSlug === 'cll' || topicSlug === 'circular-linked-list') return INTEGRATED_MODULES.cll;
  if (topicSlug === 'dll' || topicSlug === 'doubly-linked-list') return INTEGRATED_MODULES.dll;
  if (topicSlug === 'bst' || topicSlug === 'binary-search-tree') return INTEGRATED_MODULES.bst;
  if (topicSlug === 'trees' || topicSlug === 'tree') return INTEGRATED_MODULES.trees;
  if (
    topicSlug === 'dsa-types' ||
    topicSlug === 'dsa types' ||
    topicSlug === 'data-structures-and-types'
  ) {
    return INTEGRATED_MODULES['dsa-types'];
  }
  if (topicSlug === 'sorting') return INTEGRATED_MODULES.sorting;
  if (topicSlug === 'bfs' || topicSlug === 'breadth-first-search') return INTEGRATED_MODULES.bfs;
  if (topicSlug === 'queue' || topicSlug === 'queues') return INTEGRATED_MODULES.queue;
  if (topicSlug === 'sll' || topicSlug === 'singly-linked-list') return INTEGRATED_MODULES.sll;

  return null;
}
