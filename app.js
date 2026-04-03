const API = 'http://localhost:5000/api';
let token = localStorage.getItem('journal_token') || '';
let currentUser = JSON.parse(localStorage.getItem('journal_user') || 'null');
let scoreChart = null, emotionChart = null, radarChart = null;

const EMOTION_COLORS = {
  joy: '#4a8a4a',
  sadness: '#4a5a8a',
  anger: '#8a4040',
  fear: '#6a4a8a',
  surprise: '#8a7030'
};

// ---- INIT ----
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (token && currentUser) {
    showApp();
  }
});

// ---- AUTH ----
function showAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((b, i) => {
    b.classList.toggle('active', ['login', 'register'][i] === tab);
  });
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.message; return; }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('journal_token', token);
    localStorage.setItem('journal_user', JSON.stringify(currentUser));
    showApp();
  } catch (e) {
    errEl.textContent = 'Cannot connect to server. Make sure the backend is running.';
  }
}

async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('register-error');
  errEl.textContent = '';

  if (!username || !email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }
  if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.message; return; }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('journal_token', token);
    localStorage.setItem('journal_user', JSON.stringify(currentUser));
    showApp();
  } catch (e) {
    errEl.textContent = 'Cannot connect to server. Make sure the backend is running.';
  }
}

function handleLogout() {
  token = '';
  currentUser = null;
  localStorage.removeItem('journal_token');
  localStorage.removeItem('journal_user');
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
  showAuthTab('login');
}

function showApp() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  document.getElementById('sidebar-username').textContent = currentUser?.username || 'User';
  switchPage('write');
}

// ---- NAVIGATION ----
function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.getElementById(`nav-${page}`).classList.add('active');

  if (page === 'entries') loadEntries();
  if (page === 'trends') loadTrends();
}

// ---- SAVE ENTRY ----
async function saveEntry() {
  const title = document.getElementById('entry-title').value.trim();
  const content = document.getElementById('entry-content').value.trim();

  if (!content || content.length < 5) {
    alert('Please write at least a sentence before saving!');
    return;
  }

  const btn = document.getElementById('save-btn-text');
  btn.textContent = 'Analyzing...';
  document.querySelector('.btn-save').disabled = true;

  try {
    const res = await fetch(`${API}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    renderAnalysis(data.analysis, data.entry.sentiment.label);

    document.getElementById('entry-title').value = '';
    document.getElementById('entry-content').value = '';
    btn.textContent = 'Saved! ✓';
    setTimeout(() => { btn.textContent = 'Save Entry'; }, 2500);
  } catch (e) {
    alert('Error saving entry: ' + e.message);
    btn.textContent = 'Save Entry';
  } finally {
    document.querySelector('.btn-save').disabled = false;
  }
}

function renderAnalysis(analysis, label) {
  const box = document.getElementById('analysis-result');
  box.style.display = 'block';

  // Badge
  const badge = document.getElementById('sentiment-badge');
  const badgeClass = label.toLowerCase().replace(' ', '-');
  badge.className = `sentiment-badge badge-${badgeClass}`;
  badge.textContent = label;

  // Emotion bars
  const barsEl = document.getElementById('emotion-bars');
  barsEl.innerHTML = Object.entries(analysis.emotions || {}).map(([emotion, pct]) => `
    <div class="emotion-row">
      <span class="emotion-label">${emotion}</span>
      <div class="emotion-track">
        <div class="emotion-fill" style="width:${pct}%;background:${EMOTION_COLORS[emotion]||'#7a7060'}"></div>
      </div>
      <span class="emotion-pct">${pct}%</span>
    </div>`).join('');

  // Word tags
  const wordsEl = document.getElementById('word-tags');
  const posWords = (analysis.positiveWords || []).slice(0, 5);
  const negWords = (analysis.negativeWords || []).slice(0, 5);
  wordsEl.innerHTML = [
    ...posWords.map(w => `<span class="word-tag pos">+${w}</span>`),
    ...negWords.map(w => `<span class="word-tag neg">-${w}</span>`)
  ].join('') || '<span style="font-size:0.8rem;color:var(--text3)">No key emotional words detected</span>';

  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---- ENTRIES ----
async function loadEntries() {
  const listEl = document.getElementById('entries-list');
  listEl.innerHTML = '<p style="color:var(--text3);font-style:italic;font-size:0.9rem">Loading entries...</p>';

  try {
    const res = await fetch(`${API}/entries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const entries = data.entries || [];

    document.getElementById('entry-count-label').textContent = `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`;

    if (!entries.length) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">✏️</div><p>No entries yet. Start writing!</p></div>';
      return;
    }

    listEl.innerHTML = entries.map(entry => {
      const d = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const label = entry.sentiment.label || 'Neutral';
      const badgeClass = label.toLowerCase().replace(' ', '-');
      const dominant = entry.sentiment.emotions ?
        Object.entries(entry.sentiment.emotions).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral' : 'neutral';
      return `
        <div class="entry-card">
          <div class="entry-card-header">
            <span class="entry-card-title">${entry.title || 'Untitled'}</span>
            <span class="entry-card-date">${d}</span>
          </div>
          <p class="entry-card-preview">${entry.content}</p>
          <div class="entry-card-footer">
            <span class="mood-pill badge-${badgeClass}" style="background:${getMoodBg(label)};color:${getMoodColor(label)}">${label} • ${dominant}</span>
            <button class="delete-btn" onclick="deleteEntry('${entry._id}', event)">Delete</button>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    listEl.innerHTML = '<p style="color:var(--negative);font-size:0.9rem">Error loading entries.</p>';
  }
}

async function deleteEntry(id, e) {
  e.stopPropagation();
  if (!confirm('Delete this entry?')) return;
  await fetch(`${API}/entries/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
  loadEntries();
}

function getMoodBg(label) {
  const map = { 'Very Positive': '#d4f0d4', 'Positive': '#e8f3e8', 'Neutral': '#f0ede8', 'Negative': '#f3e8e8', 'Very Negative': '#f0d4d4' };
  return map[label] || '#f0ede8';
}
function getMoodColor(label) {
  const map = { 'Very Positive': '#1a5a1a', 'Positive': '#2d6a2d', 'Neutral': '#5a4a3a', 'Negative': '#6a2d2d', 'Very Negative': '#5a1a1a' };
  return map[label] || '#5a4a3a';
}

// ---- TRENDS ----
async function loadTrends() {
  try {
    const res = await fetch(`${API}/entries/trends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const { trends, summary } = data;

    if (!trends || trends.length < 2) {
      document.getElementById('trends-empty').style.display = 'block';
      document.getElementById('trends-content').style.display = 'none';
      return;
    }

    document.getElementById('trends-empty').style.display = 'none';
    document.getElementById('trends-content').style.display = 'block';

    renderSummaryCards(summary);
    renderScoreChart(trends);
    renderEmotionChart(summary.avgEmotions);
    renderRadarChart(summary.avgEmotions);
  } catch (e) {
    console.error('Error loading trends:', e);
  }
}

function renderSummaryCards(summary) {
  const grid = document.getElementById('summary-grid');
  grid.innerHTML = `
    <div class="summary-card">
      <div class="summary-num">${summary.totalEntries}</div>
      <div class="summary-label">total entries</div>
    </div>
    <div class="summary-card">
      <div class="summary-num" style="font-size:1.3rem;padding-top:0.3rem">${summary.overallMood}</div>
      <div class="summary-label">overall mood</div>
    </div>
    <div class="summary-card">
      <div class="summary-num" style="font-size:1.3rem;padding-top:0.3rem;text-transform:capitalize">${summary.dominantEmotion}</div>
      <div class="summary-label">dominant emotion</div>
    </div>
    <div class="summary-card">
      <div class="summary-num">${summary.avgScore > 0 ? '+' : ''}${summary.avgScore}</div>
      <div class="summary-label">avg sentiment score</div>
    </div>`;
}

function renderScoreChart(trends) {
  if (scoreChart) scoreChart.destroy();
  const ctx = document.getElementById('scoreChart');
  const labels = trends.map(t => {
    const d = new Date(t.date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const scores = trends.map(t => t.avgScore);

  scoreChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Sentiment Score',
        data: scores,
        borderColor: '#c07b3a',
        backgroundColor: 'rgba(192,123,58,0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#c07b3a',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(100,80,60,0.08)' }, ticks: { font: { size: 11 }, color: '#9b8e84', maxRotation: 45, autoSkip: true } },
        y: { grid: { color: 'rgba(100,80,60,0.08)' }, ticks: { font: { size: 11 }, color: '#9b8e84' } }
      }
    }
  });
}

function renderEmotionChart(avgEmotions) {
  if (emotionChart) emotionChart.destroy();
  const ctx = document.getElementById('emotionChart');
  const labels = Object.keys(avgEmotions).map(e => e.charAt(0).toUpperCase() + e.slice(1));
  const values = Object.values(avgEmotions);
  const colors = Object.keys(avgEmotions).map(e => EMOTION_COLORS[e] || '#7a7060');

  emotionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Average %',
        data: values,
        backgroundColor: colors.map(c => c + 'bb'),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9b8e84' } },
        y: { min: 0, max: 100, grid: { color: 'rgba(100,80,60,0.08)' }, ticks: { font: { size: 11 }, color: '#9b8e84', callback: v => v + '%' } }
      }
    }
  });
}

function renderRadarChart(avgEmotions) {
  if (radarChart) radarChart.destroy();
  const ctx = document.getElementById('radarChart');
  const labels = Object.keys(avgEmotions).map(e => e.charAt(0).toUpperCase() + e.slice(1));
  const values = Object.values(avgEmotions);

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Emotion Profile',
        data: values,
        borderColor: '#c07b3a',
        backgroundColor: 'rgba(192,123,58,0.15)',
        borderWidth: 2,
        pointBackgroundColor: '#c07b3a',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { font: { size: 10 }, color: '#9b8e84', stepSize: 25, callback: v => v + '%' },
          grid: { color: 'rgba(100,80,60,0.12)' },
          pointLabels: { font: { size: 12 }, color: '#6b5e54' }
        }
      }
    }
  });
}
