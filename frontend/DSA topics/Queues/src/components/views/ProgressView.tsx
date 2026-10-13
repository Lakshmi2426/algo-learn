import React from 'react';
import { BookOpen, FlaskConical, Gamepad2, HelpCircle, Sparkles, Star, Trophy, TrendingUp } from 'lucide-react';
import { UserProgress } from '../../types';
import { soundEffects } from '../../services/sound';
import { getQueueScoreBreakdown, QUEUE_SCORING } from '../../services/queueScoring';

interface ProgressViewProps {
	progress: UserProgress;
	onResetProgress: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ progress, onResetProgress }) => {
	const score = getQueueScoreBreakdown(progress);
	const completedLearn = new Set((progress.completedTheoryChapters || []).filter((id) => id >= 1 && id <= QUEUE_SCORING.learn.moduleCount)).size;
	const completedVisualize = new Set((progress.completedLabs || []).filter((id) => id >= 1 && id <= QUEUE_SCORING.visualize.activityCount)).size;
	const completedGame = new Set((progress.completedGameLevels || []).filter((id) => id >= 1 && id <= QUEUE_SCORING.game.levelCount)).size;
	const completedQuiz = progress.quizCompleted ? 1 : 0;
	const totalModules = QUEUE_SCORING.learn.moduleCount + QUEUE_SCORING.visualize.activityCount + QUEUE_SCORING.game.levelCount + 1;
	const completedModules = Math.min(totalModules, completedLearn + completedVisualize + completedGame + completedQuiz);
	const completionPercentage = Math.round((completedModules / totalModules) * 100);
	const activities = [
		{ label: 'Visualize', earned: score.visualize, total: QUEUE_SCORING.visualize.total, description: 'Complete visualizations & videos', icon: <FlaskConical className="h-5 w-5" />, iconClass: 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-600/20 dark:text-violet-300 dark:border-violet-400/30', barClass: 'bg-violet-600 dark:bg-violet-400' },
		{ label: 'Game', earned: score.game, total: QUEUE_SCORING.game.total, description: 'Complete game levels', icon: <Gamepad2 className="h-5 w-5" />, iconClass: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-400/30', barClass: 'bg-blue-600 dark:bg-blue-400' },
		{ label: 'Quiz', earned: score.quiz, total: QUEUE_SCORING.quiz.total, description: 'Answer quiz questions', icon: <HelpCircle className="h-5 w-5" />, iconClass: 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-600/20 dark:text-violet-300 dark:border-violet-400/30', barClass: 'bg-violet-600 dark:bg-violet-400' },
	];

	return (
		<div className="mx-auto w-full max-w-6xl space-y-5 pb-12 text-slate-900 dark:text-slate-100">
			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)] dark:border-[#263044] dark:bg-[#101722] dark:shadow-[0_12px_35px_rgba(0,0,0,0.16)] sm:p-6">
				<div className="flex items-start justify-between gap-4">
					<div className="flex min-w-0 items-start gap-3">
						<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 text-white shadow-[0_0_24px_rgba(37,99,235,0.45)]"><TrendingUp className="h-7 w-7 stroke-[2.4]" /></div>
						<div className="min-w-0"><h1 className="text-2xl font-black tracking-tight sm:text-3xl">Queue <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">Learning Progress</span></h1><p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-[#aebbd0] sm:text-sm">Track your journey through Queue concepts, algorithms, problem solving, complexity, and practical applications.</p></div>
					</div>
				</div>
				<div className="my-5 border-t border-slate-200 dark:border-[#263044]" />
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-[#d6e2f5]">Overall Completion</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-[#1a273a] dark:text-[#aebbd0]">{completedModules} of {totalModules} Modules</span></div><p className="mt-2 text-xs text-slate-600 dark:text-[#aebbd0] sm:text-sm">Complete all learning activities to master Queue and earn 100 points.</p></div><span className="font-mono text-4xl font-black leading-none text-blue-600 dark:text-blue-500 sm:text-5xl">{completionPercentage}%</span></div>
				<div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-[#202c3e]"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500" style={{ width: `${completionPercentage}%` }} /></div>
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)] dark:border-[#263044] dark:bg-[#101722] dark:shadow-[0_12px_35px_rgba(0,0,0,0.16)] sm:p-6">
				<div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-[#263044] sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 text-white shadow-[0_0_24px_rgba(37,99,235,0.45)]"><Trophy className="h-7 w-7" /></div><div><h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Queue Topic Score</h2><p className="mt-1 text-xs text-slate-600 dark:text-[#aebbd0]">Earned points are calculated from completed, persisted activities.</p></div></div>
					<div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-[#303d52] dark:bg-[#111a28] sm:gap-5 sm:px-4 sm:py-3"><div className="flex h-16 w-16 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 shadow-[0_0_30px_rgba(251,191,36,0.3)] dark:border-amber-400/30 dark:bg-amber-300/10"><Star className="h-11 w-11 fill-amber-300 text-amber-300" /></div><div><div className="font-mono text-3xl font-black italic text-blue-600 dark:text-blue-500">{score.overall} <span className="text-blue-600 dark:text-blue-500">/ {QUEUE_SCORING.total}</span></div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-[#9aa9bf]">Total Points</div></div></div>
				</div>
				<div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{activities.map((activity) => { const percentage = activity.total > 0 ? Math.round((activity.earned / activity.total) * 100) : 0; return <article key={activity.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)] dark:border-[#2b3749] dark:bg-[#182131] dark:shadow-[0_6px_18px_rgba(0,0,0,0.12)]"><div className="flex items-center justify-between gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${activity.iconClass}`}>{activity.icon}</div><span className="font-mono text-base font-black tracking-tight text-blue-700 dark:text-blue-300">{activity.earned} / {activity.total}</span></div><h3 className="mt-4 text-sm font-black text-slate-900 dark:text-white">{activity.label}</h3><div className="mt-2 flex items-center gap-3"><div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-[#273449]"><div className={`h-full rounded-full transition-all duration-500 ${activity.barClass}`} style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} /></div><span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400">{percentage}%</span></div><p className="mt-3 text-xs text-slate-600 dark:text-[#aebbd0]">{activity.description}</p></article>; })}</div>
			</section>
		</div>
	);
};
