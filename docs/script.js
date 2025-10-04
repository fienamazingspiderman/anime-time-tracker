// Anime Time Tracker - Full Working Script
const mascots = [
  { name: "Erwin Smith", image: "p1.webp", color: "#7c3aed", quotes: ["Leadership is about taking action.", "Plan. Execute. Repeat.", "Forward, for humanity!"] },
  { name: "Makima", image: "p2.jpg", color: "#f43f5e", quotes: ["Control your destiny.", "Focus grows power.", "A world of order."] },
  { name: "Muzan Kibutsuji", image: "p3.jpeg", color: "#8b5cf6", quotes: ["Power comes at a price.", "Ambition eats comfort.", "Surpass your limits."] },
  { name: "Yor Forger", image: "p4.jpg", color: "#ec4899", quotes: ["Stealth and precision wins.", "Quiet work, loud results.", "Duty. Family. Success."] }
];

// Storage keys
const STORAGE_KEY = "anime-time-data-v3";
const SETTINGS_KEY = "anime-tracker-settings-v2";

// Global variables
const notifDiv = document.getElementById("notifications");
let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
settings.dailyGoal = settings.dailyGoal || 8;
settings.theme = settings.theme || "dark";
let timerInterval = null;
let currentTab = "work";

// Theme functionality
function setTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  settings.theme = mode;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  document.getElementById("themeToggle").innerText = mode === "dark" ? "🌙" : "🌞";
}

// Initialize theme
setTheme(settings.theme);

// Tab navigation
document.getElementById("workPageBtn").onclick = () => { 
  currentTab = "work"; 
  render(); 
  setActiveTab("work"); 
};

document.getElementById("summaryPageBtn").onclick = () => { 
  currentTab = "summary"; 
  render(); 
  setActiveTab("summary"); 
};

document.getElementById("themeToggle").onclick = () => {
  const newTheme = settings.theme === "light" ? "dark" : "light";
  setTheme(newTheme);
};

function setActiveTab(tabName) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  if (tabName === "work") {
    document.getElementById("workPageBtn").classList.add("active");
  } else {
    document.getElementById("summaryPageBtn").classList.add("active");
  }
}

// Notification system
function notify(msg, ms = 2000) {
  notifDiv.innerText = msg;
  notifDiv.style.display = "block";
  setTimeout(() => { 
    notifDiv.style.display = "none"; 
  }, ms);
}

// Date and time utilities
function todayKey(offset = 0) {
  const d = new Date(); 
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function formatTime(timestamp) { 
  if (!timestamp) return "—"; 
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); 
}

function durationMs(start, end) { 
  return (!start || !end) ? 0 : (new Date(end) - new Date(start)); 
}

function msToHMS(ms) {
  if (!ms && ms !== 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

// Get today's data entry
function getTodayData() {
  let todayData = data.find(x => x.date === todayKey());
  if (!todayData) {
    todayData = { 
      date: todayKey(), 
      checkIn: null, 
      checkOut: null, 
      breaks: [], 
      goal: settings.dailyGoal 
    };
    data.push(todayData);
    saveData();
  }
  return todayData;
}

// Calculate day totals with live updates
function getDayTotals(dayData) {
  let totalBreakMs = 0;
  
  if (dayData.breaks && dayData.breaks.length) {
    for (const breakPeriod of dayData.breaks) {
      if (breakPeriod.end) {
        totalBreakMs += breakPeriod.durationMs || durationMs(breakPeriod.start, breakPeriod.end);
      } else {
        // Active break - calculate live time
        totalBreakMs += durationMs(breakPeriod.start, new Date());
      }
    }
  }
  
  let workedMs = 0;
  if (dayData.checkIn && dayData.checkOut) {
    workedMs = durationMs(dayData.checkIn, dayData.checkOut);
  } else if (dayData.checkIn) {
    // Currently working - calculate live time
    workedMs = Date.now() - new Date(dayData.checkIn);
  }
  
  const netMs = Math.max(0, workedMs - totalBreakMs);
  return { totalBreakMs, workedMs, netMs };
}

// Save data to localStorage
function saveData() { 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); 
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); 
}

// Calculate streak
function calcStreak() {
  let streak = 0;
  let dayOffset = 0;
  let checkDate = todayKey();
  
  while (data.find(d => d.date === checkDate && d.checkIn)) {
    streak++;
    dayOffset++;
    checkDate = todayKey(-dayOffset);
  }
  return streak;
}

// Mascot card generator
function generateMascotCard() {
  const mascot = mascots[Math.floor(Math.random() * mascots.length)];
  const quote = mascot.quotes[Math.floor(Math.random() * mascot.quotes.length)];
  
  return `
    <div class="mascot-card">
      <img class="mascot-img" src="${mascot.image}" alt="${mascot.name}" style="border-color:${mascot.color}" />
      <div class="mascot-info">
        <div class="mascot-quote">"${quote}"</div>
        <div class="mascot-name">— ${mascot.name}</div>
      </div>
    </div>
  `;
}

// Work page renderer
function renderWorkPage() {
  const todayData = getTodayData();
  const isCheckedIn = !!todayData.checkIn && !todayData.checkOut;
  const hasActiveBreak = todayData.breaks.length > 0 && !todayData.breaks[todayData.breaks.length - 1].end;
  const { totalBreakMs, workedMs, netMs } = getDayTotals(todayData);
  const progressPercent = Math.min(100, Math.round(netMs / (todayData.goal * 60 * 60 * 1000) * 100));
  
  return `
    ${generateMascotCard()}
    
    <div class="card" style="text-align:center;">
      <div style="margin-bottom: 12px;">
        <b>Daily Goal:</b>
        <input type="number" min="1" max="16" id="goalInput" value="${todayData.goal || settings.dailyGoal}" style="width:60px; font-size:1rem;"> hours
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${progressPercent}%;" id="progressFill"></div>
      </div>
      <b id="progressLabel">Progress: ${progressPercent}%</b>
    </div>
    
    <div class="grid">
      <div class="card"><b>Check In</b><div>${formatTime(todayData.checkIn)}</div></div>
      <div class="card"><b>Break Time</b><div id="liveBreakTime">${msToHMS(totalBreakMs)}</div></div>
      <div class="card"><b>Check Out</b><div>${formatTime(todayData.checkOut)}</div></div>
      <div class="card"><b>Net Worked</b><div id="liveWorkTime">${msToHMS(netMs)}</div></div>
    </div>
    
    <div class="card" style="text-align:center">
      <button class="btn" id="checkinBtn" ${todayData.checkIn ? "disabled" : ""}>⏰ Check In</button>
      <button class="btn" id="breakBtn" ${(hasActiveBreak || !isCheckedIn) ? "disabled" : ""}>☕ Start Break</button>
      <button class="btn" id="endBreakBtn" ${!hasActiveBreak ? "disabled" : ""}>🍵 End Break</button>
      <button class="btn" id="checkoutBtn" ${!isCheckedIn ? "disabled" : ""}>🚪 Check Out</button>
    </div>
    
    <div class="card streak" style="text-align:center;">
      🔥 Streak: <b>${calcStreak()}</b> days
    </div>
    
    <div style="text-align:center;">
      <button class="btn" id="exportBtn">⬇ Export CSV</button>
    </div>
  `;
}

// Summary page renderer
function renderSummaryPage() {
  const rows = data.map(dayData => {
    const totals = getDayTotals(dayData);
    return `
      <tr>
        <td>${dayData.date}</td>
        <td>${formatTime(dayData.checkIn)}</td>
        <td>${formatTime(dayData.checkOut)}</td>
        <td>${msToHMS(totals.totalBreakMs)}</td>
        <td>${msToHMS(totals.netMs)}</td>
        <td><button class="btn danger" onclick="deleteDay('${dayData.date}')">Delete</button></td>
      </tr>
    `;
  }).join("");
  
  return `
    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Break Time</th>
            <th>Net Worked</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// Main render function
function render() {
  clearInterval(timerInterval);
  const content = currentTab === "work" ? renderWorkPage() : renderSummaryPage();
  document.getElementById("pageContent").innerHTML = content;
  
  if (currentTab === "work") {
    setupWorkPageListeners();
    startLiveTimer();
  }
}

// Setup event listeners for work page
function setupWorkPageListeners() {
  document.getElementById("checkinBtn").onclick = checkIn;
  document.getElementById("breakBtn").onclick = startBreak;
  document.getElementById("endBreakBtn").onclick = endBreak;
  document.getElementById("checkoutBtn").onclick = checkOut;
  document.getElementById("exportBtn").onclick = exportCSV;
  document.getElementById("goalInput").onchange = function() {
    const value = Math.max(1, Math.min(16, Number(this.value)));
    setDailyGoal(value);
  };
}

// Live timer for work page
function startLiveTimer() {
  timerInterval = setInterval(updateLiveTime, 1000);
}

function updateLiveTime() {
  if (currentTab !== "work") return;
  
  const todayData = getTodayData();
  const { totalBreakMs, netMs } = getDayTotals(todayData);
  
  // Update live displays
  const breakTimeEl = document.getElementById("liveBreakTime");
  const workTimeEl = document.getElementById("liveWorkTime");
  const progressFill = document.getElementById("progressFill");
  const progressLabel = document.getElementById("progressLabel");
  
  if (breakTimeEl) breakTimeEl.innerText = msToHMS(totalBreakMs);
  if (workTimeEl) workTimeEl.innerText = msToHMS(netMs);
  
  if (progressFill && progressLabel) {
    const progressPercent = Math.min(100, Math.round(netMs / (todayData.goal * 60 * 60 * 1000) * 100));
    progressFill.style.width = progressPercent + "%";
    progressLabel.innerText = `Progress: ${progressPercent}%`;
  }
}

// Action functions
function checkIn() {
  const todayData = getTodayData();
  if (!todayData.checkIn) {
    todayData.checkIn = new Date().toISOString();
    saveData();
    notify("✅ Checked in! Time to work!");
    render();
  }
}

function startBreak() {
  const todayData = getTodayData();
  if (!todayData || !todayData.checkIn || todayData.checkOut) return;
  
  const hasActiveBreak = todayData.breaks.length > 0 && !todayData.breaks[todayData.breaks.length - 1].end;
  if (hasActiveBreak) return;
  
  todayData.breaks.push({ 
    start: new Date().toISOString(), 
    end: null, 
    durationMs: null 
  });
  saveData();
  notify("☕ Break started!");
  render();
}

function endBreak() {
  const todayData = getTodayData();
  if (!todayData || !todayData.breaks.length) return;
  
  const lastBreak = todayData.breaks[todayData.breaks.length - 1];
  if (!lastBreak || lastBreak.end) return;
  
  lastBreak.end = new Date().toISOString();
  lastBreak.durationMs = durationMs(lastBreak.start, lastBreak.end);
  saveData();
  notify("🍵 Break ended! Back to work!");
  render();
}

function checkOut() {
  const todayData = getTodayData();
  if (!todayData || !todayData.checkIn || todayData.checkOut) return;
  
  // End any active break
  if (todayData.breaks.length > 0) {
    const lastBreak = todayData.breaks[todayData.breaks.length - 1];
    if (lastBreak && !lastBreak.end) {
      lastBreak.end = new Date().toISOString();
      lastBreak.durationMs = durationMs(lastBreak.start, lastBreak.end);
    }
  }
  
  todayData.checkOut = new Date().toISOString();
  saveData();
  notify("🚪 Checked out! Great work today!");
  render();
}

function setDailyGoal(goalHours) {
  const todayData = getTodayData();
  todayData.goal = goalHours;
  settings.dailyGoal = goalHours;
  saveData();
  notify(`🎯 Goal updated to ${goalHours} hours!`);
  render();
}

function exportCSV() {
  const csvRows = [["Date", "Check In", "Check Out", "Break Time (seconds)", "Net Worked (seconds)"]];
  
  data.forEach(dayData => {
    const { totalBreakMs, netMs } = getDayTotals(dayData);
    csvRows.push([
      dayData.date,
      dayData.checkIn || "",
      dayData.checkOut || "",
      Math.round(totalBreakMs / 1000),
      Math.round(netMs / 1000)
    ]);
  });
  
  const csvContent = csvRows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `anime-time-tracker-${todayKey()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  
  notify("📄 CSV exported successfully!");
}

function deleteDay(dateKey) {
  if (confirm(`Delete data for ${dateKey}?`)) {
    data = data.filter(d => d.date !== dateKey);
    saveData();
    notify("🗑️ Day deleted!");
    render();
  }
}

// Initialize the app
render();
