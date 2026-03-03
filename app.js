const STORAGE_KEY = 'breatheline-profile-v1';

const defaults = {
  birthDate: '',
  gender: '',
  heartRate: 70,
  breathingRate: 16,
  country: '',
  lifeExpectancyYears: 90,
};

const countryLifeExpectancy = {
  japan: 84,
  switzerland: 84,
  spain: 83,
  italy: 83,
  france: 82,
  germany: 81,
  usa: 77,
  russia: 72,
  india: 70,
  brazil: 75,
  china: 78,
};

const setupCard = document.getElementById('setupCard');
const dashboard = document.getElementById('dashboard');
const setupForm = document.getElementById('setupForm');
const editProfileBtn = document.getElementById('editProfileBtn');

const daysEl = document.getElementById('daysLived');
const hoursEl = document.getElementById('hoursLived');
const durationEl = document.getElementById('liveDuration');
const heartbeatsEl = document.getElementById('heartbeats');
const breathsEl = document.getElementById('breaths');
const lifePercentEl = document.getElementById('lifePercent');
const progressBarEl = document.getElementById('progressBar');

const chartCanvas = document.getElementById('bioChart');
const chartCtx = chartCanvas.getContext('2d');

let profile = loadProfile();
let timer = null;

function formatBig(value) {
  return new Intl.NumberFormat('ru-RU').format(Math.floor(value));
}

function loadProfile() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaults };

  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      heartRate: Number(parsed.heartRate) || defaults.heartRate,
      breathingRate: Number(parsed.breathingRate) || defaults.breathingRate,
      lifeExpectancyYears: Number(parsed.lifeExpectancyYears) || defaults.lifeExpectancyYears,
    };
  } catch {
    return { ...defaults };
  }
}

function saveProfile(nextProfile) {
  profile = { ...nextProfile };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function getLifeExpectancyYears() {
  const countryKey = (profile.country || '').trim().toLowerCase();
  const countryBase = countryLifeExpectancy[countryKey];
  const customScenario = Number(profile.lifeExpectancyYears) || defaults.lifeExpectancyYears;
  return Math.max(customScenario, countryBase || 0);
}

function calculateMetrics(now = new Date()) {
  const birth = new Date(profile.birthDate);
  const diffMs = Math.max(0, now.getTime() - birth.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = totalSeconds / 60;
  const totalHours = totalMinutes / 60;
  const totalDays = totalHours / 24;

  const days = Math.floor(totalDays);
  const hours = Math.floor(totalHours);

  const remHours = Math.floor((totalSeconds % 86400) / 3600);
  const remMinutes = Math.floor((totalSeconds % 3600) / 60);
  const remSeconds = totalSeconds % 60;

  const heartbeats = totalMinutes * profile.heartRate;
  const breaths = totalMinutes * profile.breathingRate;

  const lifeDaysTotal = getLifeExpectancyYears() * 365.25;
  const lifePercent = (totalDays / lifeDaysTotal) * 100;

  return {
    days,
    hours,
    remHours,
    remMinutes,
    remSeconds,
    heartbeats,
    breaths,
    lifePercent,
    totalDays,
  };
}

function drawChart(totalDays, heartbeats, breaths) {
  const ctx = chartCtx;
  const w = chartCanvas.width;
  const h = chartCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 24, right: 16, bottom: 34, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  ctx.strokeStyle = '#26344f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (chartH / 4) * i;
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
  }
  ctx.stroke();

  const xMax = Math.max(totalDays, 1);
  const yMax = Math.max(heartbeats, breaths, 1);

  const points = 60;

  function buildSeries(totalValue) {
    return Array.from({ length: points }, (_, i) => {
      const ratio = i / (points - 1);
      return {
        x: ratio * xMax,
        y: ratio * totalValue,
      };
    });
  }

  function drawSeries(series, color) {
    ctx.beginPath();
    series.forEach((p, idx) => {
      const x = pad.left + (p.x / xMax) * chartW;
      const y = pad.top + chartH - (p.y / yMax) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawSeries(buildSeries(heartbeats), '#b58dff');
  drawSeries(buildSeries(breaths), '#63ffc8');

  ctx.fillStyle = '#9fb0d1';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText('0', 30, h - 12);
  ctx.fillText(`${Math.floor(totalDays)} дн`, w - 72, h - 12);
  ctx.fillText(formatBig(yMax), 8, pad.top + 4);
}

function render() {
  if (!profile.birthDate) return;

  const m = calculateMetrics();
  daysEl.textContent = formatBig(m.days);
  hoursEl.textContent = formatBig(m.hours);
  durationEl.textContent = `${formatBig(m.days)}д ${String(m.remHours).padStart(2, '0')}ч ${String(
    m.remMinutes
  ).padStart(2, '0')}м ${String(m.remSeconds).padStart(2, '0')}с`;

  heartbeatsEl.textContent = formatBig(m.heartbeats);
  breathsEl.textContent = formatBig(m.breaths);

  const shownPercent = Math.max(0, m.lifePercent);
  lifePercentEl.textContent = `${shownPercent.toFixed(2)}%`;
  progressBarEl.style.width = `${Math.min(100, shownPercent)}%`;

  drawChart(m.totalDays, m.heartbeats, m.breaths);
}

function fillForm(current) {
  setupForm.elements.birthDate.value = current.birthDate || '';
  setupForm.elements.gender.value = current.gender || '';
  setupForm.elements.heartRate.value = current.heartRate || defaults.heartRate;
  setupForm.elements.breathingRate.value = current.breathingRate || defaults.breathingRate;
  setupForm.elements.country.value = current.country || '';
  setupForm.elements.lifeExpectancyYears.value = current.lifeExpectancyYears || defaults.lifeExpectancyYears;

  document.querySelectorAll('.scenario-btn').forEach((btn) => {
    btn.classList.toggle(
      'active',
      Number(btn.dataset.years) === Number(setupForm.elements.lifeExpectancyYears.value)
    );
  });
}

function showDashboard() {
  setupCard.classList.add('hidden');
  dashboard.classList.remove('hidden');

  render();
  clearInterval(timer);
  timer = setInterval(render, 1000);
}

function showSetup() {
  clearInterval(timer);
  timer = null;
  fillForm(profile);
  setupCard.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

setupForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const next = {
    birthDate: setupForm.elements.birthDate.value,
    gender: setupForm.elements.gender.value.trim(),
    heartRate: Number(setupForm.elements.heartRate.value),
    breathingRate: Number(setupForm.elements.breathingRate.value),
    country: setupForm.elements.country.value.trim(),
    lifeExpectancyYears: Number(setupForm.elements.lifeExpectancyYears.value),
  };

  if (!next.birthDate || !next.country) {
    return;
  }

  saveProfile(next);
  showDashboard();
});

editProfileBtn.addEventListener('click', () => {
  showSetup();
});

document.querySelectorAll('.scenario-btn').forEach((button) => {
  button.addEventListener('click', () => {
    setupForm.elements.lifeExpectancyYears.value = button.dataset.years;
    document.querySelectorAll('.scenario-btn').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
  });
});

if (profile.birthDate && profile.country) {
  showDashboard();
} else {
  showSetup();
}
