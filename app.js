const countryLifeExpectancy = {
  "Россия": 72.8,
  "США": 77.5,
  "Япония": 84.5,
  "Германия": 81.1,
  "Франция": 82.4,
  "Индия": 67.2,
  "Бразилия": 75.9,
  "Казахстан": 71.4,
  "Украина": 71.6,
  "Канада": 82.3
};

const storageKey = "breatheline-profile";
const ringCircumference = 2 * Math.PI * 48;

const el = {
  profileForm: document.getElementById("profileForm"),
  birthDate: document.getElementById("birthDate"),
  gender: document.getElementById("gender"),
  heartRate: document.getElementById("heartRate"),
  breathRate: document.getElementById("breathRate"),
  country: document.getElementById("country"),
  scenarioYears: document.getElementById("scenarioYears"),
  tabButtons: [...document.querySelectorAll(".tab-btn")],
  tabPanels: [...document.querySelectorAll(".tab-panel")],
  liveClock: document.getElementById("liveClock"),
  daysLived: document.getElementById("daysLived"),
  hoursLived: document.getElementById("hoursLived"),
  heartBeats: document.getElementById("heartBeats"),
  breaths: document.getElementById("breaths"),
  lifePercent: document.getElementById("lifePercent"),
  lifeLine: document.getElementById("lifeLine"),
  countryLifeExpectancy: document.getElementById("countryLifeExpectancy"),
  yearsLeft: document.getElementById("yearsLeft"),
  ringValue: document.getElementById("ringValue"),
  comparisonText: document.getElementById("comparisonText"),
  heartChart: document.getElementById("heartChart"),
  breathChart: document.getElementById("breathChart")
};

let profile = {
  birthDate: "",
  gender: "",
  heartRate: 70,
  breathRate: 16,
  country: "Россия"
};

function fillCountryOptions() {
  Object.keys(countryLifeExpectancy).forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    el.country.appendChild(option);
  });
}

function loadProfile() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    profile = { ...profile, ...JSON.parse(saved) };
  }
  el.birthDate.value = profile.birthDate;
  el.gender.value = profile.gender;
  el.heartRate.value = profile.heartRate;
  el.breathRate.value = profile.breathRate;
  el.country.value = profile.country;
}

function saveProfile() {
  profile = {
    birthDate: el.birthDate.value,
    gender: el.gender.value,
    heartRate: Number(el.heartRate.value) || 70,
    breathRate: Number(el.breathRate.value) || 16,
    country: el.country.value
  };
  localStorage.setItem(storageKey, JSON.stringify(profile));
}

function getLifeExpectancyYears() {
  return countryLifeExpectancy[profile.country] || 75;
}

function formatNum(num) {
  return new Intl.NumberFormat("ru-RU").format(Math.floor(num));
}

function computeStats() {
  if (!profile.birthDate) {
    return null;
  }
  const now = new Date();
  const birth = new Date(profile.birthDate);

  if (Number.isNaN(birth.getTime()) || birth > now) {
    return null;
  }

  const msLived = now - birth;
  const secLived = msLived / 1000;
  const minLived = secLived / 60;
  const hoursLived = minLived / 60;
  const daysLived = hoursLived / 24;

  const heartBeats = minLived * profile.heartRate;
  const breaths = minLived * profile.breathRate;

  const lifeExpectancyDays = getLifeExpectancyYears() * 365.25;
  const lifePercent = Math.min(100, (daysLived / lifeExpectancyDays) * 100);

  return { secLived, minLived, hoursLived, daysLived, heartBeats, breaths, lifePercent };
}

function updateDashboard(stats) {
  const totalSeconds = Math.floor(stats.secLived);
  const hh = String(Math.floor((totalSeconds / 3600) % 24)).padStart(2, "0");
  const mm = String(Math.floor((totalSeconds / 60) % 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");

  el.liveClock.textContent = `${hh}:${mm}:${ss}`;
  el.daysLived.textContent = formatNum(stats.daysLived);
  el.hoursLived.textContent = formatNum(stats.hoursLived);
  el.heartBeats.textContent = formatNum(stats.heartBeats);
  el.breaths.textContent = formatNum(stats.breaths);
  el.lifePercent.textContent = `${stats.lifePercent.toFixed(2)}%`;
  el.lifeLine.style.width = `${stats.lifePercent}%`;
}

function updateProgress(stats) {
  const expectancy = getLifeExpectancyYears();
  el.countryLifeExpectancy.textContent = `Средняя продолжительность жизни в стране: ${expectancy.toFixed(1)} лет`;

  const scenario = Number(el.scenarioYears.value);
  const yearsLived = stats.daysLived / 365.25;
  const yearsLeft = Math.max(0, scenario - yearsLived);
  el.yearsLeft.textContent = yearsLeft.toFixed(1);

  const progress = Math.min(100, (yearsLived / scenario) * 100);
  const offset = ringCircumference - (ringCircumference * progress) / 100;
  el.ringValue.style.strokeDasharray = ringCircumference;
  el.ringValue.style.strokeDashoffset = offset;
}

function drawLineChart(canvas, points, color) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const padding = 14;
  const max = Math.max(...points, 1);

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = padding + ((h - padding * 2) * i) / 3;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  points.forEach((val, idx) => {
    const x = padding + ((w - padding * 2) * idx) / (points.length - 1 || 1);
    const y = h - padding - ((h - padding * 2) * val) / max;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function updateBio(stats) {
  const millions = (stats.heartBeats / 1_000_000).toFixed(2);
  el.comparisonText.textContent = `Ваше сердце билось уже ${millions} млн раз.`;

  const years = Math.max(1, Math.floor(stats.daysLived / 365.25));
  const perYearMinutes = 365.25 * 24 * 60;

  const heartSeries = [];
  const breathSeries = [];
  for (let year = 1; year <= years; year += 1) {
    heartSeries.push(perYearMinutes * profile.heartRate * year);
    breathSeries.push(perYearMinutes * profile.breathRate * year);
  }

  drawLineChart(el.heartChart, heartSeries, "#59e8ff");
  drawLineChart(el.breathChart, breathSeries, "#4aa4ff");
}

function render() {
  const stats = computeStats();
  if (!stats) {
    el.liveClock.textContent = "Введите данные профиля";
    return;
  }
  updateDashboard(stats);
  updateProgress(stats);
  updateBio(stats);
}

function setTabs() {
  el.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      el.tabButtons.forEach((b) => b.classList.remove("active"));
      el.tabPanels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

el.profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveProfile();
  render();
});

el.scenarioYears.addEventListener("change", render);

fillCountryOptions();
loadProfile();
setTabs();
render();
setInterval(render, 1000);
