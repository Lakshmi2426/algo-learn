import React, { useState, useEffect } from 'react';
import { SLLTopicSelectMenu } from './SLLTopicSelectMenu';
import { SLLTopicScreen } from './SLLTopicScreen';
import { SLLOperationGameScreen } from './SLLOperationGameScreen';
import { SLLTopicCompleteModal } from './SLLTopicCompleteModal';
import { ErrorBoundary } from '../ErrorBoundary';
import { SLLTopicId, SLL_TOPICS } from '../../data/sllTopics';
import { progressManager } from '../../utils/progressManager';

interface SingleLinkedListGameProps {
  currentLevelId?: number;
  onSelectLevel?: (lvlId: number) => void;
  onOpenLab?: () => void;
  onOpenTheory?: () => void;
  onOpenQuiz?: () => void;
  onOpenProgress?: () => void;
}

export const SingleLinkedListGame: React.FC<SingleLinkedListGameProps> = ({
  currentLevelId,
  onSelectLevel,
  onOpenLab,
  onOpenTheory,
  onOpenQuiz,
  onOpenProgress,
}) => {
  // Navigation State: null = main 3 cards, or a selected SLLTopicId
  const [selectedTopicId, setSelectedTopicId] = useState<SLLTopicId | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Completed tasks tracking
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sll_completed_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [totalScore, setTotalScore] = useState<number>(() => progressManager.getTotalPoints());
  const [showTopicCompleteModal, setShowTopicCompleteModal] = useState<boolean>(false);
  const [completedTopicId, setCompletedTopicId] = useState<SLLTopicId | null>(null);

  // Subscribe to progressManager for real-time live updates
  useEffect(() => {
    const unsub = progressManager.subscribe((state) => {
      setTotalScore(state.totalPoints);
    });
    return () => unsub();
  }, []);

  // Save completed tasks to local storage
  useEffect(() => {
    try {
      localStorage.setItem('sll_completed_tasks', JSON.stringify(completedTasks));
    } catch (e) {
      console.error(e);
    }
  }, [completedTasks]);

  // Handle task completion
  const handleCompleteTask = (taskId: string, nextTaskId?: string) => {
    const updatedCompleted = completedTasks.includes(taskId)
      ? completedTasks
      : [...completedTasks, taskId];

    setCompletedTasks(updatedCompleted);
    setTotalScore(progressManager.getState().totalScore);

    // If a topic is selected, check if this was the last task or if all tasks in topic are done
    if (selectedTopicId) {
      const currentTopic = SLL_TOPICS[selectedTopicId];
      const allTopicDone = currentTopic.tasks.every((t) => updatedCompleted.includes(t.id));
      const wasAllTopicDoneBefore = currentTopic.tasks.every((t) => completedTasks.includes(t.id));

      if (allTopicDone && !wasAllTopicDoneBefore) {
        setCompletedTopicId(selectedTopicId);
        setShowTopicCompleteModal(true);
      }

      // Sync progressManager levels so overall mastery stats stay accurate
      if (selectedTopicId === 'insertion') {
        progressManager.markLevelCompleted(1, 100, true);
      } else if (selectedTopicId === 'deletion') {
        progressManager.markLevelCompleted(2, 100, true);
      } else if (selectedTopicId === 'traversal') {
        progressManager.markLevelCompleted(3, 100, true);
      }

      // Determine next task within the topic
      const currentIndex = currentTopic.tasks.findIndex((t) => t.id === taskId);
      if (currentIndex >= 0 && currentIndex < currentTopic.tasks.length - 1) {
        const nextInTopic = currentTopic.tasks[currentIndex + 1].id;
        setActiveTaskId(nextInTopic);
      } else {
        // Topic tasks finished
        setActiveTaskId(null);
      }
    } else {
      if (nextTaskId) {
        setActiveTaskId(nextTaskId);
      } else {
        setActiveTaskId(null);
      }
    }
  };

  const selectedTopic = selectedTopicId ? SLL_TOPICS[selectedTopicId] : null;
  const currentTopicTask = selectedTopic && activeTaskId
    ? selectedTopic.tasks.find((t) => t.id === activeTaskId)
    : null;

  const topicOrder: SLLTopicId[] = ['insertion', 'deletion', 'traversal'];
  const nextTopicId: SLLTopicId | null = completedTopicId
    ? topicOrder[topicOrder.indexOf(completedTopicId) + 1] || null
    : null;

  return (
    <div className="w-full">
      {/* View 1: Main 3 Topic Cards */}
      {!selectedTopicId && (
        <SLLTopicSelectMenu
          onSelectTopic={(topicId) => {
            setSelectedTopicId(topicId);
            setActiveTaskId(null);
          }}
          completedTasks={completedTasks}
          totalScore={totalScore}
        />
      )}

      {/* View 2: Topic Tasks Screen */}
      {selectedTopicId && !activeTaskId && (
        <ErrorBoundary
          fallbackTitle={`Unable to Load Topic: ${selectedTopic?.title || selectedTopicId}`}
          onReset={() => setSelectedTopicId(null)}
          resetButtonText="Return to Topics"
        >
          <SLLTopicScreen
            topicId={selectedTopicId}
            onBackToTopics={() => setSelectedTopicId(null)}
            onSelectTask={(taskId) => setActiveTaskId(taskId)}
            completedTasks={completedTasks}
          />
        </ErrorBoundary>
      )}

      {/* View 3: Interactive Operation Game Screen */}
      {selectedTopicId && activeTaskId && (
        <ErrorBoundary
          fallbackTitle={`Unable to Load Task: ${currentTopicTask?.title || activeTaskId}`}
          onReset={() => setActiveTaskId(null)}
          resetButtonText="Return to Tasks"
        >
          <SLLOperationGameScreen
            taskId={activeTaskId}
            onBackToMenu={() => setActiveTaskId(null)}
            onCompleteTask={handleCompleteTask}
            onSelectLevel={onSelectLevel}
            onSelectTask={(id) => setActiveTaskId(id)}
            totalScore={totalScore}
            topicTitle={selectedTopic?.title}
            topicId={selectedTopicId}
            taskTitleOverride={currentTopicTask?.title}
            taskNumberOverride={currentTopicTask?.taskNumber}
          />
        </ErrorBoundary>
      )}

      {/* Topic Completion Celebration Modal */}
      {showTopicCompleteModal && completedTopicId && (
        <SLLTopicCompleteModal
          topicTitle={SLL_TOPICS[completedTopicId].title}
          scoreAwarded={progressManager.getGameTopicEarnedScore(completedTopicId)}
          hasNextTopic={Boolean(nextTopicId)}
          onNextTopic={() => {
            setShowTopicCompleteModal(false);
            if (nextTopicId) {
              setSelectedTopicId(nextTopicId);
              setActiveTaskId(null);
            } else {
              setSelectedTopicId(null);
              setActiveTaskId(null);
            }
          }}
          onBackToTopics={() => {
            setShowTopicCompleteModal(false);
            setSelectedTopicId(null);
            setActiveTaskId(null);
          }}
          onReplayTopic={() => {
            setShowTopicCompleteModal(false);
            setActiveTaskId(null);
          }}
        />
      )}
    </div>
  );
};
