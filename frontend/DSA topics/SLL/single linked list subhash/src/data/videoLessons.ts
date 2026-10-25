import lesson01Video from '../videos/video1.mp4';
import lesson02Video from '../videos/video2.mp4';

export interface LessonItem {
  id: 'lesson-01' | 'lesson-02';
  lessonNumber: string;
  title: string;
  nowPlayingTitle: string;
  description: string;
  topics: string[];
  videoSrc: string;
  filename: string;
}

export const VIDEO_LESSONS: LessonItem[] = [
  {
    id: 'lesson-01',
    lessonNumber: 'LESSON 01',
    title: 'Introduction to Singly Linked List',
    nowPlayingTitle: 'Introduction to Singly Linked List',
    description: 'Learn the foundational concepts of Singly Linked Lists, node structure, head and tail pointers, and how linked nodes differ from arrays.',
    topics: [
      'Node Structure & Pointers',
      'Head & Tail References',
      'Dynamic Memory Allocation',
      'Sequential Traversal',
    ],
    videoSrc: lesson01Video,
    filename: 'video1.mp4',
  },
  {
    id: 'lesson-02',
    lessonNumber: 'LESSON 02',
    title: 'Singly Linked List Operations',
    nowPlayingTitle: 'Singly Linked List Operations',
    description: 'Master essential Singly Linked List operations including insertion at beginning/end, deletion, searching, and pointer updates.',
    topics: [
      'Insert at Head & Tail',
      'Node Deletion Workflow',
      'Linear Search Technique',
      'Pointer Reassignment',
    ],
    videoSrc: lesson02Video,
    filename: 'video2.mp4',
  },
];
