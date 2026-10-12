/**
 * BFS Adventure - Interactive Quiz Engine
 * Redesigned to strictly match Reference Image 2 UI with Reference Image 1 Scoring Rules
 * 
 * Scoring System (Reference Image 1):
 * - 10 Questions total, 20 maximum possible points
 * - Correct answer: +2 points
 * - Incorrect answer: -1 point
 * - Timeout: 0 points (no deduction)
 * - Time limit: 20 seconds countdown per question
 * - Final Score = (Correct * 2) - (Incorrect * 1) [Can be negative]
 */

class QuizEngine {
  constructor() {
    this.questions = (typeof QUIZ_QUESTIONS !== 'undefined' ? QUIZ_QUESTIONS : (typeof window !== 'undefined' ? window.QUIZ_QUESTIONS : [])) || [];
    this.currentIndex = 0;
    try {
      this.userAnswers = JSON.parse(localStorage.getItem("algolearn_quiz_answers") || "{}");
      this.score = parseInt(localStorage.getItem("algolearn_quiz_score") || "0", 10);
      this.isCompleted = localStorage.getItem("algolearn_quiz_completed") === "true";
    } catch (e) {
      this.userAnswers = {};
      this.score = 0;
      this.isCompleted = false;
    }
    this.pendingSelections = {};
    this.unansweredWarning = null;
    this.expandedQuestions = new Set([1]);
    this.container = null;
    this.initialized = false;

    // 20-second time limit per question (Reference Image 1 & 2)
    this.questionTimeLimit = 20;
    this.timeLeft = 20;
    this.timerInterval = null;

    // Quiz started state
    const hasExistingAnswers = Object.keys(this.userAnswers).length > 0;
    this.quizStarted = hasExistingAnswers || (localStorage.getItem("algolearn_quiz_started") === "true");
  }

  init(containerEl) {
    this.container = containerEl;
    if (!this.questions || this.questions.length === 0) {
      this.questions = (typeof QUIZ_QUESTIONS !== 'undefined' ? QUIZ_QUESTIONS : (typeof window !== 'undefined' ? window.QUIZ_QUESTIONS : [])) || [];
    }
    this.initialized = true;
    this.render();
  }

  startQuiz() {
    this.quizStarted = true;
    try {
      localStorage.setItem("algolearn_quiz_started", "true");
    } catch (e) {}
    this.timeLeft = this.questionTimeLimit;
    this.startQuestionTimer();
    this.render();
  }

  reset() {
    this.clearQuestionTimer();
    this.currentIndex = 0;
    this.score = 0;
    this.userAnswers = {};
    this.pendingSelections = {};
    this.isCompleted = false;
    this.quizStarted = false;
    this.timeLeft = this.questionTimeLimit;
    this.unansweredWarning = null;
    this.expandedQuestions = new Set([1]);
    try {
      localStorage.removeItem("algolearn_quiz_started");
      localStorage.removeItem("algolearn_quiz_answers");
      localStorage.removeItem("algolearn_quiz_score");
      localStorage.removeItem("algolearn_quiz_completed");
    } catch (e) {}
    if (typeof app !== 'undefined' && typeof app.updateProgressStats === 'function') {
      app.updateProgressStats();
    }
    if (typeof app !== 'undefined' && typeof app.updatePointsUI === 'function') {
      app.updatePointsUI();
    }
    this.render();
  }

  getQuestionDifficulty(quest, idx) {
    if (quest && quest.difficulty) {
      const d = quest.difficulty.toUpperCase();
      if (d.includes("BASIC")) return { text: "BASIC LEVEL", slug: "basic" };
      if (d.includes("INTERMEDIATE")) return { text: "INTERMEDIATE LEVEL", slug: "intermediate" };
      if (d.includes("ADVANCED") || d.includes("HARD")) return { text: "ADVANCED LEVEL", slug: "advanced" };
      return { text: d, slug: "basic" };
    }
    if (idx < 3) return { text: "BASIC LEVEL", slug: "basic" };
    if (idx < 7) return { text: "INTERMEDIATE LEVEL", slug: "intermediate" };
    return { text: "ADVANCED LEVEL", slug: "advanced" };
  }

  getUnansweredIndices() {
    const list = [];
    this.questions.forEach((q, idx) => {
      if (this.userAnswers[q.id] === undefined) {
        list.push(idx);
      }
    });
    return list;
  }

  clearUnansweredWarning() {
    this.unansweredWarning = null;
    this.render();
  }

  startQuestionTimer() {
    this.clearQuestionTimer();
    const q = this.questions[this.currentIndex];
    if (!q) return;

    // If question is already answered or quiz completed, do not run timer
    if (this.userAnswers[q.id] !== undefined || this.isCompleted) {
      return;
    }

    // If on first question and quiz has not explicitly started yet, wait for start
    if (!this.quizStarted && this.currentIndex === 0) {
      this.timeLeft = this.questionTimeLimit;
      this.updateTimerDisplay();
      return;
    }

    this.timeLeft = this.questionTimeLimit;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();

      if (this.timeLeft <= 0) {
        this.clearQuestionTimer();
        this.handleTimeout();
      }
    }, 1000);
  }

  clearQuestionTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const timerVal = document.getElementById("quiz-question-timer-val");
    if (timerVal) {
      timerVal.textContent = `${this.timeLeft}s`;
    }
    const timerPill = document.getElementById("quiz-question-timer");
    if (timerPill) {
      const q = this.questions[this.currentIndex];
      const isAnswered = q && this.userAnswers[q.id] !== undefined;
      if (this.timeLeft <= 5 && !isAnswered) {
        timerPill.classList.add("is-warning");
      } else {
        timerPill.classList.remove("is-warning");
      }
    }
  }

  handleTimeout() {
    const q = this.questions[this.currentIndex];
    if (!q || this.userAnswers[q.id] !== undefined) return;

    // Timed out: award zero points (0 pts), never deduct
    this.userAnswers[q.id] = {
      optionId: null,
      isCorrect: false,
      timedOut: true,
      explanation: q.explanation || "Time limit of 20 seconds expired before an answer was chosen. 0 points awarded."
    };

    const stats = this.calculateScore();
    this.score = stats.rawScore;

    if (typeof soundManager !== 'undefined' && soundManager.playError) {
      soundManager.playError();
    }

    try {
      localStorage.setItem("algolearn_quiz_answers", JSON.stringify(this.userAnswers));
      localStorage.setItem("algolearn_quiz_score", String(this.score));
    } catch (e) {}

    if (typeof app !== 'undefined') {
      if (typeof app.updateProgressStats === 'function') app.updateProgressStats();
      if (typeof app.updatePointsUI === 'function') app.updatePointsUI();
      if (typeof app.showToast === 'function') {
        app.showToast(`Time expired on Question ${this.currentIndex + 1}! 0 points awarded.`);
      }
    }

    this.render();
  }

  goToQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.clearQuestionTimer();
      this.currentIndex = index;
      if (index !== 0) {
        this.quizStarted = true;
      }
      if (this.unansweredWarning && this.unansweredWarning.unansweredIndices.includes(index)) {
        this.unansweredWarning.targetQuestionNum = index + 1;
      }
      this.render();
      if (typeof soundManager !== 'undefined' && soundManager.playPop) {
        soundManager.playPop();
      }
      setTimeout(() => {
        const card = document.getElementById('assessment-question-card');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  }

  selectOption(questionId, optionId) {
    // If this question is already answered, do not allow changing
    if (this.userAnswers[questionId] !== undefined) return;

    if (!this.quizStarted) {
      this.quizStarted = true;
      try {
        localStorage.setItem("algolearn_quiz_started", "true");
      } catch (e) {}
      this.startQuestionTimer();
    }

    this.pendingSelections[questionId] = optionId;
    if (typeof soundManager !== 'undefined' && soundManager.playPop) {
      soundManager.playPop();
    }
    this.render();
  }

  confirmAnswer() {
    const q = this.questions[this.currentIndex];
    if (!q) return;

    const pending = this.pendingSelections[q.id];
    if (!pending) return; // No selection yet
    if (this.userAnswers[q.id] !== undefined) return; // Already scored - prevent duplicate scoring

    this.clearQuestionTimer();

    const chosen = q.options.find(o => o.id === pending);
    const isCorrect = Boolean(chosen && chosen.correct);

    this.userAnswers[q.id] = {
      optionId: pending,
      isCorrect,
      timedOut: false,
      explanation: q.explanation
    };

    const stats = this.calculateScore();
    this.score = stats.rawScore;

    if (isCorrect) {
      if (typeof soundManager !== 'undefined' && soundManager.playSuccess) {
        soundManager.playSuccess();
      }
    } else {
      if (typeof soundManager !== 'undefined' && soundManager.playError) {
        soundManager.playError();
      }
    }

    // Refresh or clear unanswered warning if active
    const remaining = this.getUnansweredIndices();
    if (remaining.length === 0) {
      this.unansweredWarning = null;
    } else if (this.unansweredWarning) {
      this.unansweredWarning.remainingCount = remaining.length;
      this.unansweredWarning.unansweredIndices = remaining;
      const nextTarget = remaining.find(idx => idx > this.currentIndex) ?? remaining[0];
      this.unansweredWarning.targetQuestionNum = nextTarget + 1;
    }

    // Persist answers and score to localStorage
    try {
      localStorage.setItem("algolearn_quiz_answers", JSON.stringify(this.userAnswers));
      localStorage.setItem("algolearn_quiz_score", String(this.score));
    } catch (e) {}

    // Update app progress & dashboard immediately
    if (typeof app !== 'undefined') {
      if (typeof app.updateProgressStats === 'function') app.updateProgressStats();
      if (typeof app.updatePointsUI === 'function') app.updatePointsUI();
      if (typeof app.showToast === 'function') {
        app.showToast(isCorrect ? `Correct answer! +2 points earned.` : `Incorrect answer! -1 point deducted.`);
      }
    }

    this.render();
  }

  calculateScore() {
    let correct = 0;
    let incorrect = 0;
    let timedOut = 0;
    const totalQ = this.questions ? this.questions.length : 10;
    if (this.userAnswers) {
      Object.values(this.userAnswers).forEach(ans => {
        if (!ans) return;
        if (ans.timedOut) {
          timedOut++;
        } else if (ans.isCorrect === true) {
          correct++;
        } else if (ans.isCorrect === false) {
          incorrect++;
        }
      });
    }
    const answeredTotal = correct + incorrect + timedOut;
    const unanswered = Math.max(0, totalQ - answeredTotal);
    // Scoring Rules (Image 1):
    // Correct: +2 pts
    // Incorrect: -1 pt
    // Timeout: 0 pts
    // Score can become negative if penalties exceed correct answers
    const rawScore = (correct * 2) - (incorrect * 1);
    const maxScore = totalQ * 2;
    return {
      correct,
      incorrect,
      timedOut,
      unanswered,
      answeredTotal,
      rawScore,
      maxScore,
      totalQ
    };
  }

  nextQuestion() {
    const totalQ = this.questions.length;
    if (this.currentIndex < totalQ - 1) {
      this.clearQuestionTimer();
      this.currentIndex++;
      this.render();
      if (typeof soundManager !== 'undefined' && soundManager.playPop) {
        soundManager.playPop();
      }
    } else {
      this.completeQuiz();
    }
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.clearQuestionTimer();
      this.currentIndex--;
      this.render();
      if (typeof soundManager !== 'undefined' && soundManager.playPop) {
        soundManager.playPop();
      }
    }
  }

  completeQuiz() {
    this.clearQuestionTimer();
    const unanswered = this.getUnansweredIndices();
    if (unanswered.length > 0) {
      // Direct user to first unanswered question
      const nextTarget = unanswered.find(idx => idx > this.currentIndex) ?? unanswered[0];
      this.currentIndex = nextTarget;
      this.unansweredWarning = {
        remainingCount: unanswered.length,
        unansweredIndices: unanswered,
        targetQuestionNum: nextTarget + 1
      };
      this.render();
      if (typeof soundManager !== 'undefined' && soundManager.playPop) {
        soundManager.playPop();
      }
      setTimeout(() => {
        const banner = document.getElementById('quiz-unanswered-banner') || document.getElementById('assessment-question-card');
        if (banner) {
          banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    // All questions answered/completed: finish quiz
    this.unansweredWarning = null;
    this.isCompleted = true;
    try {
      localStorage.setItem("algolearn_quiz_completed", "true");
    } catch (e) {}

    // Notify app of completion
    if (typeof app !== 'undefined') {
      if (Object.keys(this.userAnswers).length === this.questions.length) {
        app.completedActivities.add("FN-10");
        try {
          localStorage.setItem("algolearn_completed_activities", JSON.stringify([...app.completedActivities]));
        } catch (e) {}
      }
      if (typeof app.updateProgressStats === 'function') {
        app.updateProgressStats();
      }
      if (typeof app.renderProgressModules === 'function') {
        app.renderProgressModules();
      }
    }

    this.render();
    if (typeof soundManager !== 'undefined' && soundManager.playSuccess) {
      soundManager.playSuccess();
    }
    if (this.container) {
      this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  render() {
    if (!this.container) return;

    if (this.isCompleted) {
      this.clearQuestionTimer();
      this.renderSummary();
      return;
    }

    const totalQ = this.questions.length || 10;
    const stats = this.calculateScore();
    const completedCount = stats.answeredTotal;
    const progressPercent = totalQ > 0 ? Math.round((completedCount / totalQ) * 100) : 0;

    const q = this.questions[this.currentIndex] || {
      id: 1,
      question: "Which fundamental data structure governs standard BFS traversal?",
      options: [],
      explanation: ""
    };
    const answer = this.userAnswers[q.id];
    const pending = this.pendingSelections[q.id];

    const isFirstQuestion = this.currentIndex === 0;
    const hasAnswer = answer !== undefined;
    const showStartBtn = !this.quizStarted && isFirstQuestion && !hasAnswer;

    const diff = this.getQuestionDifficulty(q, this.currentIndex);

    this.container.innerHTML = `
      <div class="quiz-assessment-container">

        <!-- 1. QUIZ HEADER CARD (Matching Reference Image 2) -->
        <header class="quiz-header-card" id="quiz-header-card">
          <div class="quiz-header-left">
            <div class="quiz-header-icon-box" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div class="quiz-header-text">
              <h1 class="quiz-header-title">Quiz Assessment</h1>
              <p class="quiz-header-desc">Validate your algorithmic Queue reasoning and earn mastery points (Basic to Hard).</p>
            </div>
          </div>
          <div class="quiz-header-right">
            <div class="quiz-counter-badge" id="quiz-counter-badge">
              Question ${this.currentIndex + 1} of ${totalQ}
            </div>
          </div>
        </header>

        <!-- 2. SCORING INFORMATION BAR (Matching Image 4 with timeout & time limit removed) -->
        <div class="quiz-scoring-info-bar" role="region" aria-label="Scoring Rules">
          <span class="quiz-rule-item"><strong>Correct answer:</strong> <span class="rule-pos">+2 points</span></span>
          <span class="quiz-rule-sep">|</span>
          <span class="quiz-rule-item"><strong>Incorrect answer:</strong> <span class="rule-neg">&minus;1 point</span></span>
        </div>

        <!-- 3. PROGRESS BAR & QUESTION NAVIGATION (Matching Reference Image 2) -->
        <div class="quiz-nav-section">
          <!-- Horizontal Blue Progress Bar -->
          <div class="quiz-progress-track" role="progressbar" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100" title="Progress: ${completedCount} of ${totalQ} completed (${progressPercent}%)">
            <div class="quiz-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>

          <!-- Question Buttons Row Q1..Q10 (Q1 active is solid blue, others light grey or answered status) -->
          <div class="quiz-qnav-row" role="navigation" aria-label="Question Navigation">
            ${this.questions.map((quest, idx) => {
              const isCurrent = idx === this.currentIndex;
              const ans = this.userAnswers[quest.id];
              const isAnswered = ans !== undefined;
              
              let btnClass = "quiz-qbtn";
              let statusMark = "";

              if (isCurrent) {
                btnClass += " is-active";
              }
              
              if (isAnswered) {
                if (ans.timedOut) {
                  btnClass += " is-timeout";
                  statusMark = `<span class="qbtn-mark mark-timeout">⏱</span>`;
                } else if (ans.isCorrect) {
                  btnClass += " is-correct";
                  statusMark = `<span class="qbtn-mark mark-correct">✓</span>`;
                } else {
                  btnClass += " is-incorrect";
                  statusMark = `<span class="qbtn-mark mark-incorrect">✕</span>`;
                }
              } else {
                btnClass += " is-unanswered";
                if (this.unansweredWarning && this.unansweredWarning.unansweredIndices.includes(idx)) {
                  btnClass += " needs-attention";
                }
              }

              return `
                <button type="button" 
                        class="${btnClass}" 
                        onclick="quizEngine.goToQuestion(${idx})" 
                        aria-label="Question ${idx + 1}${isAnswered ? (ans.timedOut ? ' (Timed out)' : (ans.isCorrect ? ' (Correct)' : ' (Incorrect)')) : ''}" 
                        ${isCurrent ? 'aria-current="step"' : ''}>
                  <span class="qbtn-label">Q${idx + 1}</span>
                  ${statusMark}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- UNANSWERED WARNING ALERT BANNER -->
        ${this.unansweredWarning ? `
          <div class="quiz-unanswered-banner" id="quiz-unanswered-banner" role="alert" aria-live="polite">
            <div class="unanswered-banner-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Assessment Incomplete: <strong>${this.unansweredWarning.remainingCount} question${this.unansweredWarning.remainingCount > 1 ? 's' : ''}</strong> remaining before submission. Directed to Question ${this.currentIndex + 1}.</span>
            </div>
            <button type="button" class="btn-dismiss-unanswered" onclick="quizEngine.clearUnansweredWarning()" aria-label="Dismiss notice">✕</button>
          </div>
        ` : ''}

        <!-- 4. MAIN QUESTION CARD (Matching Reference Image 2) -->
        <div class="quiz-main-question-card ${answer ? (answer.timedOut ? 'card-timeout' : (answer.isCorrect ? 'card-correct' : 'card-incorrect')) : ''}" id="assessment-question-card">
          
          <!-- Top Badges & Timer Row -->
          <div class="quiz-card-top-row">
            <div class="quiz-card-badges">
              <span class="quiz-badge-difficulty badge-${diff.slug}">★ ${diff.text}</span>
              <span class="quiz-badge-type">MULTIPLE CHOICE</span>
            </div>
            <div class="quiz-card-timer-wrap">
              <div id="quiz-question-timer" class="quiz-timer-pill ${this.timeLeft <= 5 && !answer ? 'is-warning' : ''}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span id="quiz-question-timer-val">${this.timeLeft}s</span>
              </div>
            </div>
          </div>

          <!-- Question Prompt -->
          <h2 class="quiz-question-title">${q.question}</h2>

          <!-- Full-Width Answer Options (Matching Reference Image 2) -->
          <div class="quiz-options-container" role="radiogroup" aria-label="Answer options">
            ${q.options.map(opt => {
              let optClass = "quiz-option-row";
              let markHTML = "";

              if (answer) {
                // Confirmed results
                if (opt.correct) {
                  optClass += " is-answer-correct";
                  markHTML = `
                    <span class="opt-result-mark mark-correct" aria-label="Correct answer">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  `;
                } else if (answer.optionId === opt.id) {
                  optClass += " is-answer-incorrect";
                  markHTML = `
                    <span class="opt-result-mark mark-incorrect" aria-label="Your incorrect answer">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                  `;
                } else {
                  optClass += " is-answer-muted";
                }
              } else {
                // In progress
                if (pending === opt.id) {
                  optClass += " is-selected";
                }
              }

              return `
                <button type="button" 
                        class="${optClass}" 
                        onclick="quizEngine.selectOption(${q.id}, '${opt.id}')"
                        ${answer ? 'disabled' : ''}
                        role="radio"
                        aria-checked="${Boolean(answer ? answer.optionId === opt.id : pending === opt.id)}">
                  <span class="opt-text">${opt.text}</span>
                  ${markHTML}
                </button>
              `;
            }).join('')}
          </div>

          <!-- Navigation and Submission Controls -->
          <div class="quiz-card-footer">
            <div class="quiz-footer-left">
              <button type="button" class="quiz-btn-nav quiz-btn-prev" onclick="quizEngine.prevQuestion()" ${this.currentIndex === 0 ? 'disabled' : ''}>
                &larr; Previous Question
              </button>
            </div>
            <div class="quiz-footer-right">
              ${showStartBtn ? `
                <button type="button" class="quiz-btn-action quiz-btn-start" onclick="quizEngine.startQuiz()">
                  ▶ Start Quiz
                </button>
              ` : ''}

              ${!answer ? `
                <button type="button" class="quiz-btn-action quiz-btn-submit" onclick="quizEngine.confirmAnswer()" ${!pending ? 'disabled' : ''}>
                  Submit Answer
                </button>
              ` : (this.currentIndex === totalQ - 1 || completedCount === totalQ ? `
                <button type="button" class="quiz-btn-action quiz-btn-finish" onclick="quizEngine.completeQuiz()">
                  Finish Quiz &amp; Results &rarr;
                </button>
              ` : `
                <button type="button" class="quiz-btn-action quiz-btn-next" onclick="quizEngine.nextQuestion()">
                  Next Question &rarr;
                </button>
              `)}
            </div>
          </div>

          <!-- Technical Explanation Feedback Panel -->
          ${answer ? `
            <div class="quiz-explanation-box">
              <div class="quiz-expl-header">
                <div class="quiz-expl-badge ${answer.timedOut ? 'badge-timeout' : (answer.isCorrect ? 'badge-correct' : 'badge-incorrect')}">
                  ${answer.timedOut ? '⏱ Timed Out (0 pts)' : (answer.isCorrect ? '✓ Correct (+2 pts)' : '✕ Incorrect (-1 pt)')}
                </div>
                <span class="quiz-expl-title">Technical Explanation:</span>
              </div>
              <p class="quiz-expl-body">${answer.explanation}</p>
              <div class="quiz-expl-actions">
                <button type="button" class="quiz-expl-link" onclick="if(window.app && app.switchTab) app.switchTab('theory')">
                  Review in Theory Guide &rarr;
                </button>
                <button type="button" class="quiz-expl-link" onclick="if(window.app && app.switchTab) app.switchTab('visualize')">
                  Interactive Visualizer &rarr;
                </button>
              </div>
            </div>
          ` : ''}

        </div>
      </div>
    `;

    // Manage timer for question
    if (!answer && (this.quizStarted || this.currentIndex > 0)) {
      this.startQuestionTimer();
    } else {
      this.clearQuestionTimer();
    }
  }

  toggleExplanation(id) {
    if (!this.expandedQuestions) {
      this.expandedQuestions = new Set();
    }
    const detailsEl = document.getElementById(`q-expl-details-${id}`);
    const btnEl = document.getElementById(`q-expl-btn-${id}`);
    
    if (this.expandedQuestions.has(id)) {
      this.expandedQuestions.delete(id);
      if (detailsEl) detailsEl.classList.add('hidden');
      if (btnEl) btnEl.textContent = 'Show Explanation';
    } else {
      this.expandedQuestions.add(id);
      if (detailsEl) detailsEl.classList.remove('hidden');
      if (btnEl) btnEl.textContent = 'Hide Explanation';
    }
  }

  renderSummary() {
    const stats = this.calculateScore();
    const totalQ = stats.totalQ;
    const correctCount = stats.correct;
    const incorrectCount = stats.incorrect;
    const timedOutCount = stats.timedOut || 0;
    const rawScore = stats.rawScore;
    const completionPct = totalQ > 0 ? Math.round((stats.answeredTotal / totalQ) * 100) : 0;

    let gradeText = "★ PRACTICE RECOMMENDED ★";
    if (rawScore >= 16) {
      gradeText = "★ OUTSTANDING MASTERY (GRADE A+) ★";
    } else if (rawScore >= 10) {
      gradeText = "★ PROFICIENT (GRADE B) ★";
    }

    this.container.innerHTML = `
      <div class="quiz-assessment-container">

        <!-- 1. Header Card in Same Clean Style -->
        <header class="quiz-header-card">
          <div class="quiz-header-left">
            <div class="quiz-header-icon-box" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div class="quiz-header-text">
              <h1 class="quiz-header-title">Quiz Assessment Results</h1>
              <p class="quiz-header-desc">Review your final mastery score, answer details, and question explanations.</p>
            </div>
          </div>
          <div class="quiz-header-right">
            <div class="quiz-counter-badge" style="background:#ecfdf5; color:#059669; border-color:#a7f3d0;">
              Completed &bull; ${stats.answeredTotal} of ${totalQ} Evaluated
            </div>
          </div>
        </header>

        <!-- 2. Pale-Yellow Scoring Information Bar -->
        <div class="quiz-scoring-info-bar" role="region" aria-label="Scoring Rules Reference">
          <span class="quiz-rule-item"><strong>Correct answer:</strong> <span class="rule-pos">+2 points</span></span>
          <span class="quiz-rule-sep">|</span>
          <span class="quiz-rule-item"><strong>Incorrect answer:</strong> <span class="rule-neg">&minus;1 point</span></span>
        </div>

        <!-- 3. Results Summary Hero Card -->
        <div class="quiz-results-hero-card">
          <div class="results-hero-top">
            <div class="results-trophy-squircle">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
            </div>
            <div class="results-grade-pill">${gradeText}</div>
            <h2 class="results-score-heading">
              FINAL SCORE: <span class="results-score-val">${rawScore} / 20</span>
            </h2>
            <p class="results-score-subtitle">
              Calculated via (+${correctCount * 2} from correct) &minus; (${incorrectCount * 1} penalty) + (0 timeout)
            </p>
          </div>

          <!-- 4 Breakdown Metrics Cards -->
          <div class="results-metrics-grid">
            <div class="metric-card metric-correct">
              <div class="metric-label">CORRECT (+2 pts)</div>
              <div class="metric-val">+${correctCount * 2} pts</div>
              <div class="metric-desc">${correctCount} of ${totalQ} correct</div>
            </div>
            <div class="metric-card metric-incorrect">
              <div class="metric-label">INCORRECT (-1 pt)</div>
              <div class="metric-val">-${incorrectCount * 1} pts</div>
              <div class="metric-desc">${incorrectCount} wrong answers</div>
            </div>
            <div class="metric-card metric-timeout">
              <div class="metric-label">TIMEOUT (0 pts)</div>
              <div class="metric-val">0 pts</div>
              <div class="metric-desc">${timedOutCount} timed out</div>
            </div>
            <div class="metric-card metric-completion">
              <div class="metric-label">COMPLETION</div>
              <div class="metric-val">${completionPct}%</div>
              <div class="metric-desc">${stats.answeredTotal} of ${totalQ} answered</div>
            </div>
          </div>

          <!-- Actions: Retry Quiz & Return to Dashboard -->
          <div class="results-actions-row">
            <button type="button" class="btn-quiz-retry" onclick="quizEngine.reset()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Retry Quiz
            </button>
            <button type="button" class="btn-quiz-dashboard" onclick="if(window.app && app.switchTab){ app.switchTab('overview'); } else { window.location.reload(); }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Return to Dashboard
            </button>
          </div>
        </div>

        <!-- Question-by-Question Review Header -->
        <div class="quiz-review-header">
          <h3 class="review-heading">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            Question-by-Question Review
          </h3>
          <span class="review-stat-pill">${correctCount} of ${totalQ} Correct</span>
        </div>

        <!-- Question Review Cards List -->
        <div class="quiz-review-cards-list">
          ${this.questions.map((quest, idx) => {
            const ans = this.userAnswers[quest.id];
            const isCorrect = Boolean(ans && ans.isCorrect);
            const isTimedOut = Boolean(ans && ans.timedOut);
            const userOpt = ans ? quest.options.find(o => o.id === ans.optionId) : null;
            const userOptText = isTimedOut ? 'Timed out (0 pts awarded)' : (userOpt ? userOpt.text : 'No answer submitted');
            const correctOpt = quest.options.find(o => o.correct);
            const correctOptText = correctOpt ? correctOpt.text : '';
            const diff = this.getQuestionDifficulty(quest, idx);

            return `
              <div class="quiz-review-card ${isCorrect ? 'rev-correct' : (isTimedOut ? 'rev-timeout' : 'rev-incorrect')}">
                <div class="rev-card-top">
                  <div class="rev-card-meta">
                    <span class="rev-qnum">Question ${idx + 1} of ${totalQ}</span>
                    <span class="quiz-badge-difficulty badge-${diff.slug}">★ ${diff.text}</span>
                  </div>
                  <div>
                    ${isTimedOut ? `
                      <span class="rev-status-badge status-timeout">⏱ Timed Out (0 pts)</span>
                    ` : (isCorrect ? `
                      <span class="rev-status-badge status-correct">✓ Correct (+2 pts)</span>
                    ` : `
                      <span class="rev-status-badge status-incorrect">✕ Incorrect (-1 pt)</span>
                    `)}
                  </div>
                </div>

                <h4 class="rev-qtitle">${quest.question}</h4>

                <div class="rev-answers-grid">
                  <div class="rev-answer-box ${isCorrect ? 'ans-user-correct' : 'ans-user-incorrect'}">
                    <span class="ans-box-label">YOUR SUBMISSION:</span>
                    <span class="ans-box-text">${userOptText}</span>
                  </div>
                  <div class="rev-answer-box ans-correct-target">
                    <span class="ans-box-label">CORRECT ANSWER:</span>
                    <span class="ans-box-text">${correctOptText}</span>
                  </div>
                </div>

                <div class="rev-expl-box">
                  <div class="rev-expl-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    Technical Explanation:
                  </div>
                  <p class="rev-expl-content">${quest.explanation}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }
}

const quizEngine = new QuizEngine();
if (typeof window !== 'undefined') {
  window.quizEngine = quizEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuizEngine, quizEngine };
}
