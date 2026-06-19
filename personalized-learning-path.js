/* =========================================================
   PERSONALIZED LEARNING PATH — ENHANCED JS
   ========================================================= */

"use strict";

// ── Loading screen ──────────────────────────────────────────
window.addEventListener("load", () => {
  const loader = document.getElementById("loading-screen");
  if (loader) loader.style.display = "none";
});

// ── Constants ───────────────────────────────────────────────
const LS_PREFIX = "plp_v2_";

// ── Rich Topic Data ─────────────────────────────────────────
const PATHS = {
  beginner: [
    {
      name: "Programming Fundamentals",
      icon: "💻",
      difficulty: "easy",
      hours: 8,
      link: "index.html#topics",
      desc: "Variables, control flow, functions, recursion basics"
    },
    {
      name: "Arrays & Strings",
      icon: "📦",
      difficulty: "easy",
      hours: 10,
      link: "array-learning.html",
      desc: "Traversal, two-pointer, sliding window, sorting"
    },
    {
      name: "Linked Lists",
      icon: "🔗",
      difficulty: "easy",
      hours: 8,
      link: "linkedlist-learning.html",
      desc: "Singly, doubly, circular; reversal & cycle detection"
    },
    {
      name: "Stacks & Queues",
      icon: "📚",
      difficulty: "easy",
      hours: 6,
      link: "stack-learning.html",
      desc: "Monotonic stack, priority queue, BFS/DFS intro"
    },
    {
      name: "Trees & Binary Search Trees",
      icon: "🌳",
      difficulty: "medium",
      hours: 10,
      link: "trees-learning.html",
      desc: "Traversals, height, balance, BST operations"
    },
    {
      name: "Recursion & Backtracking",
      icon: "🔄",
      difficulty: "medium",
      hours: 10,
      link: "recursion-learning.html",
      desc: "Base cases, call stacks, permutations, N-Queens"
    },
    {
      name: "Sorting Algorithms",
      icon: "🔃",
      difficulty: "easy",
      hours: 6,
      link: "sorting-visualizer.html",
      desc: "Merge, quick, heap sort — time & space tradeoffs"
    },
    {
      name: "Dynamic Programming Basics",
      icon: "⚡",
      difficulty: "hard",
      hours: 14,
      link: "dp-learning.html",
      desc: "Memoisation, tabulation, knapsack, LCS, LIS"
    },
    {
      name: "System Design Basics",
      icon: "🏗️",
      difficulty: "medium",
      hours: 8,
      link: "system-design.html",
      desc: "Scalability, caching, load balancing fundamentals"
    }
  ],
  placement: [
    {
      name: "Aptitude & Reasoning",
      icon: "🧠",
      difficulty: "easy",
      hours: 10,
      link: "index.html#quiz",
      desc: "Quantitative aptitude, logical reasoning, verbal ability"
    },
    {
      name: "OOP Concepts",
      icon: "🧩",
      difficulty: "medium",
      hours: 8,
      link: "oop-learning.html",
      desc: "Inheritance, polymorphism, encapsulation, abstraction"
    },
    {
      name: "DBMS & SQL",
      icon: "🗄️",
      difficulty: "medium",
      hours: 10,
      link: "dbms-learning.html",
      desc: "Normalisation, joins, indexing, transactions"
    },
    {
      name: "Operating Systems",
      icon: "🖥️",
      difficulty: "medium",
      hours: 10,
      link: "os-learning.html",
      desc: "Scheduling, memory management, deadlocks, semaphores"
    },
    {
      name: "Computer Networks",
      icon: "🌐",
      difficulty: "medium",
      hours: 8,
      link: "index.html#topics",
      desc: "OSI model, TCP/IP, HTTP, DNS, sockets"
    },
    {
      name: "Data Structures Practice",
      icon: "📊",
      difficulty: "hard",
      hours: 20,
      link: "array-learning.html",
      desc: "Arrays, trees, graphs, heaps — 50+ practice problems"
    },
    {
      name: "Behavioural Interview Prep",
      icon: "🎤",
      difficulty: "easy",
      hours: 6,
      link: "behavioral-questions.html",
      desc: "STAR method, common HR questions, storytelling"
    },
    {
      name: "Mock Interviews & Tests",
      icon: "📝",
      difficulty: "hard",
      hours: 12,
      link: "quiz-system.html",
      desc: "Timed problem sets, mock coding rounds, review"
    }
  ],
  faang: [
    {
      name: "Advanced Array Techniques",
      icon: "🔬",
      difficulty: "hard",
      hours: 10,
      link: "array-learning.html",
      desc: "Kadane's, Dutch flag, sliding window, two-pointer"
    },
    {
      name: "Graph Algorithms",
      icon: "🕸️",
      difficulty: "hard",
      hours: 16,
      link: "graph-learning.html",
      desc: "DFS/BFS, Dijkstra, Bellman-Ford, union-find, topological sort"
    },
    {
      name: "Dynamic Programming (Advanced)",
      icon: "⚡",
      difficulty: "hard",
      hours: 20,
      link: "dp-learning.html",
      desc: "Bitmask DP, digit DP, interval DP, SOS DP"
    },
    {
      name: "Bit Manipulation",
      icon: "⚙️",
      difficulty: "hard",
      hours: 8,
      link: "bit-manipulation-learning.html",
      desc: "Bitmask tricks, XOR patterns, power-of-2 checks"
    },
    {
      name: "Trees & Segment Trees",
      icon: "🌲",
      difficulty: "hard",
      hours: 14,
      link: "segment-tree-learning.html",
      desc: "AVL, red-black, segment trees, Fenwick trees"
    },
    {
      name: "System Design (Advanced)",
      icon: "🏗️",
      difficulty: "hard",
      hours: 20,
      link: "system-design.html",
      desc: "Distributed systems, sharding, CAP theorem, real cases"
    },
    {
      name: "Behavioural Interviews",
      icon: "🎯",
      difficulty: "medium",
      hours: 8,
      link: "behavioral-questions.html",
      desc: "Leadership principles, conflict resolution, impact stories"
    },
    {
      name: "Competitive Programming Patterns",
      icon: "🏆",
      difficulty: "hard",
      hours: 18,
      link: "cp-patterns-learning.html",
      desc: "Greedy, two-pointer, divide & conquer, string algorithms"
    },
    {
      name: "Mock Coding Rounds",
      icon: "🕐",
      difficulty: "hard",
      hours: 16,
      link: "quiz-system.html",
      desc: "Timed FAANG-style contests, whiteboard problems, review"
    }
  ]
};

// ── Storage Helpers ──────────────────────────────────────────
function getChecked(goal) {
  try {
    return JSON.parse(localStorage.getItem(LS_PREFIX + goal)) || [];
  } catch { return []; }
}

function setChecked(goal, arr) {
  localStorage.setItem(LS_PREFIX + goal, JSON.stringify(arr));
}

function getDailyGoal() {
  return parseFloat(localStorage.getItem(LS_PREFIX + "daily") || "2");
}

function setDailyGoal(val) {
  localStorage.setItem(LS_PREFIX + "daily", String(val));
}

function getStreak() {
  const today = new Date().toDateString();
  const last = localStorage.getItem(LS_PREFIX + "streak_last");
  let count = parseInt(localStorage.getItem(LS_PREFIX + "streak_count") || "0");
  if (!last) return 0;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (last === today) return count;
  if (last === yesterday.toDateString()) return count;
  return 0;
}

function markStreakToday() {
  const today = new Date().toDateString();
  const last = localStorage.getItem(LS_PREFIX + "streak_last");
  let count = parseInt(localStorage.getItem(LS_PREFIX + "streak_count") || "0");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (last === today) return;
  if (last === yesterday.toDateString()) {
    count += 1;
  } else {
    count = 1;
  }
  localStorage.setItem(LS_PREFIX + "streak_last", today);
  localStorage.setItem(LS_PREFIX + "streak_count", String(count));
}

// ── Toast ────────────────────────────────────────────────────
function showToast(message, icon = "✅", type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-out");
    setTimeout(() => toast.remove(), 350);
  }, 3800);
}

// ── Progress Ring ────────────────────────────────────────────
function updateRing(pct) {
  const fill = document.querySelector(".progress-ring-fill");
  const label = document.querySelector(".progress-ring-pct");
  if (!fill || !label) return;

  const circumference = 352; // 2 * π * r (r=56)
  const offset = circumference - (pct / 100) * circumference;
  fill.style.strokeDashoffset = offset;
  label.textContent = `${Math.round(pct)}%`;
}

// ── ETA Calculator ───────────────────────────────────────────
function calcETA(goal, checkedArr, dailyHours) {
  const topics = PATHS[goal] || [];
  const remaining = topics
    .filter((_, i) => !checkedArr.includes(i))
    .reduce((sum, t) => sum + t.hours, 0);

  if (remaining === 0) return "Complete! 🎉";
  if (!dailyHours || dailyHours <= 0) return "—";

  const daysLeft = Math.ceil(remaining / dailyHours);
  const eta = new Date();
  eta.setDate(eta.getDate() + daysLeft);
  const opts = { month: "short", day: "numeric", year: "numeric" };
  return eta.toLocaleDateString(undefined, opts);
}

// ── Milestone Tracking ───────────────────────────────────────
const MILESTONES = [25, 50, 75, 100];
let lastMilestone = 0;

function checkMilestone(pct) {
  for (const m of MILESTONES) {
    if (pct >= m && lastMilestone < m) {
      lastMilestone = m;
      const icons = { 25: "🌟", 50: "🔥", 75: "💎", 100: "🏆" };
      const msgs = {
        25: "25% done — great start!",
        50: "Halfway there — keep going!",
        75: "75% complete — almost there!",
        100: "Path complete! You're a champion! 🎉"
      };
      showToast(msgs[m], icons[m], "milestone");

      // Glow the ring
      const ring = document.querySelector(".progress-ring-wrap");
      if (ring) {
        ring.classList.add("milestone-glow");
        setTimeout(() => ring.classList.remove("milestone-glow"), 2200);
      }
    }
  }
}

// ── Build Roadmap ────────────────────────────────────────────
function buildRoadmap(goal) {
  const container = document.getElementById("roadmapTimeline");
  if (!container) return;

  const topics = PATHS[goal] || [];
  const checked = getChecked(goal);

  container.innerHTML = "";
  lastMilestone = Math.floor(
    checked.length > 0 ? (checked.length / topics.length) * 100 / 25 : 0
  ) * 25;

  topics.forEach((topic, i) => {
    const isDone = checked.includes(i);
    const isActive = !isDone && checked.length === i;

    const step = document.createElement("div");
    step.className = `roadmap-step${isDone ? " completed" : ""}${isActive ? " active" : ""}`;
    step.setAttribute("data-index", i);

    step.innerHTML = `
      <div class="step-dot">${isDone ? "✓" : topic.icon}</div>
      <div class="step-card">
        <input type="checkbox" class="step-checkbox" id="step-${i}" ${isDone ? "checked" : ""} aria-label="${topic.name}">
        <div class="step-info">
          <div class="step-name ${isDone ? "done" : ""}">
            ${topic.name}
            <span class="diff-badge ${topic.difficulty}">${topic.difficulty}</span>
            <span class="hours-badge">⏱ ${topic.hours}h</span>
          </div>
          <div class="step-desc">${topic.desc}</div>
        </div>
        <div class="step-actions">
          <a href="${topic.link}" class="step-link" target="_blank" rel="noopener">
            <i class="fas fa-arrow-right"></i>
            <span>Learn</span>
          </a>
        </div>
      </div>
    `;

    container.appendChild(step);
  });

  updateProgress(goal);
  attachCheckboxListeners(goal);
}

// ── Update Progress ──────────────────────────────────────────
function updateProgress(goal) {
  const topics = PATHS[goal] || [];
  const checked = getChecked(goal);
  const total = topics.length;
  const done = checked.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const dailyHours = getDailyGoal();

  // Ring
  updateRing(pct);

  // Stats
  const elDone = document.getElementById("statDone");
  const elTotal = document.getElementById("statTotal");
  const elRemaining = document.getElementById("statRemaining");
  const elEta = document.getElementById("statEta");

  if (elDone) elDone.textContent = done;
  if (elTotal) elTotal.textContent = total;
  if (elRemaining) elRemaining.textContent = total - done;
  if (elEta) elEta.textContent = calcETA(goal, checked, dailyHours);

  // Streak
  const elStreak = document.getElementById("streakCount");
  if (elStreak) elStreak.textContent = getStreak();

  checkMilestone(pct);
}

// ── Checkbox Listeners ───────────────────────────────────────
function attachCheckboxListeners(goal) {
  document.querySelectorAll(".step-checkbox").forEach((cb) => {
    cb.addEventListener("change", () => {
      const step = cb.closest(".roadmap-step");
      const index = parseInt(step.getAttribute("data-index"), 10);
      let checked = getChecked(goal);

      if (cb.checked) {
        if (!checked.includes(index)) {
          checked.push(index);
          markStreakToday();
        }
        step.classList.add("completed");
        step.classList.remove("active");
        const dot = step.querySelector(".step-dot");
        if (dot) dot.textContent = "✓";
        const nameEl = step.querySelector(".step-name");
        if (nameEl) nameEl.classList.add("done");
        showToast(`"${PATHS[goal][index].name}" marked complete!`, "✅");
      } else {
        checked = checked.filter((i) => i !== index);
        step.classList.remove("completed");
        const dot = step.querySelector(".step-dot");
        if (dot) dot.textContent = PATHS[goal][index].icon;
        const nameEl = step.querySelector(".step-name");
        if (nameEl) nameEl.classList.remove("done");
      }

      setChecked(goal, checked);
      updateProgress(goal);

      // Re-activate "active" class for next uncompleted step
      document.querySelectorAll(".roadmap-step").forEach((s, i) => {
        const isChecked = getChecked(goal).includes(i);
        s.classList.toggle("active", !isChecked && getChecked(goal).length === i);
      });
    });
  });
}

// ── Main DOMContentLoaded ────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  let activeGoal = null;
  let dailyGoal = getDailyGoal();

  // Goal card selection
  document.querySelectorAll(".goal-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".goal-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      activeGoal = card.getAttribute("data-goal");
    });
  });

  // Daily hours input
  const dailyInput = document.getElementById("dailyHoursInput");
  if (dailyInput) {
    dailyInput.value = dailyGoal;
    dailyInput.addEventListener("change", () => {
      dailyGoal = parseFloat(dailyInput.value) || 2;
      setDailyGoal(dailyGoal);
      if (activeGoal) updateProgress(activeGoal);
    });
  }

  // Generate button
  const generateBtn = document.getElementById("generateBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      if (!activeGoal) {
        showToast("Please select a learning goal first!", "⚠️", "success");
        return;
      }
      buildRoadmap(activeGoal);

      // Scroll to roadmap
      document.getElementById("roadmapSection")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Reset button
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!activeGoal) return;
      if (!confirm(`Reset all progress for the ${activeGoal} path? This cannot be undone.`)) return;
      setChecked(activeGoal, []);
      lastMilestone = 0;
      buildRoadmap(activeGoal);
      showToast("Progress reset successfully.", "🔄");
    });
  }

  // Print/export button
  const printBtn = document.getElementById("printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // Navbar scroll effect
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    }, { passive: true });
  }

  // Scroll-to-top button
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      scrollTopBtn.classList.toggle("visible", window.scrollY > 300);
    }, { passive: true });
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Mark streak on load
  markStreakToday();

  // Update streak display immediately
  const elStreak = document.getElementById("streakCount");
  if (elStreak) elStreak.textContent = getStreak();
});
