// Built-in routines: [exercise, sets, reps]
const PLANS = [
  { name: 'Push', exercises: [['Bench press', 3, 8], ['Overhead press', 3, 8], ['Incline dumbbell press', 3, 10], ['Triceps pushdown', 3, 12]] },
  { name: 'Pull', exercises: [['Deadlift', 3, 5], ['Pull-up', 3, 8], ['Barbell row', 3, 8], ['Biceps curl', 3, 12]] },
  { name: 'Legs', exercises: [['Squat', 3, 8], ['Romanian deadlift', 3, 10], ['Leg press', 3, 12], ['Calf raise', 3, 15]] },
  { name: 'Full body (beginner)', exercises: [['Goblet squat', 3, 10], ['Push-up', 3, 10], ['Dumbbell row', 3, 10], ['Plank (seconds)', 3, 30]] },
];

// All data lives in this browser's localStorage.
const store = {
  load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  },
  save(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
};

let workouts = store.load('workouts'); // [{ id, date, exercises: [{ name, sets, reps, weight }] }]
let weights = store.load('weights');   // [{ date, kg }]
const charts = {};

const $ = id => document.getElementById(id);
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const byDate = (a, b) => a.date.localeCompare(b.date);

// ---------- Tabs ----------
document.querySelectorAll('nav button').forEach(btn =>
  btn.addEventListener('click', () => showTab(btn.dataset.tab)));

function showTab(id) {
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  document.querySelectorAll('.tab').forEach(s => s.classList.toggle('active', s.id === id));
  // Charts are drawn when their tab becomes visible so they size correctly.
  if (id === 'weight') renderWeight();
  if (id === 'progress') renderProgress();
}

// ---------- Plans ----------
function renderPlans() {
  $('plan-list').innerHTML = PLANS.map((plan, i) => `
    <div class="card">
      <h3>${plan.name}</h3>
      <ul>${plan.exercises.map(([name, sets, reps]) => `<li>${name}: ${sets} × ${reps}</li>`).join('')}</ul>
      <button data-plan="${i}">Start this workout</button>
    </div>`).join('');
}

$('plan-list').addEventListener('click', e => {
  const i = e.target.dataset.plan;
  if (i === undefined) return;
  startWorkout(PLANS[i].exercises.map(([name, sets, reps]) => ({ name, sets, reps })));
  showTab('log');
});

// ---------- Workout log ----------
function addRow(ex = {}) {
  const row = $('exercise-row-template').content.firstElementChild.cloneNode(true);
  row.querySelector('.ex-name').value = ex.name ?? '';
  row.querySelector('.ex-sets').value = ex.sets ?? '';
  row.querySelector('.ex-reps').value = ex.reps ?? '';
  row.querySelector('.ex-weight').value = ex.weight ?? '';
  row.querySelector('.remove').addEventListener('click', () => row.remove());
  $('exercise-rows').append(row);
}

function startWorkout(exercises) {
  $('exercise-rows').innerHTML = '';
  exercises.forEach(addRow);
  $('workout-date').value = today();
}

$('add-exercise').addEventListener('click', () => addRow());

$('workout-form').addEventListener('submit', e => {
  e.preventDefault();
  const exercises = [...$('exercise-rows').children].map(row => ({
    name: row.querySelector('.ex-name').value.trim(),
    sets: Number(row.querySelector('.ex-sets').value),
    reps: Number(row.querySelector('.ex-reps').value),
    weight: Number(row.querySelector('.ex-weight').value) || 0,
  }));
  if (!exercises.length) return alert('Add at least one exercise.');
  workouts.push({ id: Date.now(), date: $('workout-date').value, exercises });
  store.save('workouts', workouts);
  startWorkout([{}]);
  renderHistory();
});

function renderHistory() {
  $('workout-history').innerHTML = [...workouts].sort(byDate).reverse().map(w => `
    <li>
      <div>
        <strong>${w.date}</strong>
        <div class="muted">${w.exercises.map(ex =>
          `${esc(ex.name)} ${ex.sets}×${ex.reps}${ex.weight ? ` @ ${ex.weight} kg` : ''}`).join('<br>')}</div>
      </div>
      <button class="delete" data-id="${w.id}" aria-label="Delete workout">Delete</button>
    </li>`).join('') || '<p class="muted">No workouts yet.</p>';
}

$('workout-history').addEventListener('click', e => {
  const id = Number(e.target.dataset.id);
  if (!id || !confirm('Delete this workout?')) return;
  workouts = workouts.filter(w => w.id !== id);
  store.save('workouts', workouts);
  renderHistory();
});

// ---------- Body weight ----------
$('weight-form').addEventListener('submit', e => {
  e.preventDefault();
  const date = $('weight-date').value;
  // One entry per day: a new entry replaces that day's old one.
  weights = weights.filter(w => w.date !== date);
  weights.push({ date, kg: Number($('weight-value').value) });
  weights.sort(byDate);
  store.save('weights', weights);
  $('weight-value').value = '';
  renderWeight();
});

$('weight-history').addEventListener('click', e => {
  const date = e.target.dataset.date;
  if (!date) return;
  weights = weights.filter(w => w.date !== date);
  store.save('weights', weights);
  renderWeight();
});

function renderWeight() {
  drawChart('weight-chart', 'line', weights.map(w => w.date), weights.map(w => w.kg), 'kg');
  $('weight-history').innerHTML = [...weights].reverse().map(w => `
    <li><span><strong>${w.date}</strong>: ${w.kg} kg</span>
    <button class="delete" data-date="${w.date}" aria-label="Delete entry">Delete</button></li>`).join('');
}

// ---------- Progress ----------
function weekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00');
  d.setDate(d.getDate() - (d.getDay() + 6) % 7); // back to Monday
  return d.toLocaleDateString('en-CA');
}

function renderProgress() {
  const perWeek = {};
  workouts.forEach(w => { const wk = weekStart(w.date); perWeek[wk] = (perWeek[wk] || 0) + 1; });
  const weeks = Object.keys(perWeek).sort();
  drawChart('weekly-chart', 'bar', weeks.map(w => `Week of ${w}`), weeks.map(w => perWeek[w]), 'Workouts');

  const names = [...new Set(workouts.flatMap(w => w.exercises.map(ex => ex.name)))].sort();
  const select = $('exercise-select');
  const current = select.value;
  select.innerHTML = names.map(n => `<option>${esc(n)}</option>`).join('');
  if (names.includes(current)) select.value = current;
  renderExerciseChart();
}

function renderExerciseChart() {
  const name = $('exercise-select').value;
  const best = {};
  workouts.forEach(w => w.exercises.forEach(ex => {
    if (ex.name === name) best[w.date] = Math.max(best[w.date] || 0, ex.weight);
  }));
  const dates = Object.keys(best).sort();
  drawChart('exercise-chart', 'line', dates, dates.map(d => best[d]), 'kg');
}

$('exercise-select').addEventListener('change', renderExerciseChart);

function drawChart(id, type, labels, data, label) {
  charts[id]?.destroy();
  charts[id] = new Chart($(id), {
    type,
    data: { labels, datasets: [{ label, data, borderColor: '#2563eb', backgroundColor: '#93c5fd', tension: 0.2 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: type === 'bar' } } },
  });
}

// ---------- Start ----------
$('weight-date').value = today();
startWorkout([{}]);
renderPlans();
renderHistory();
