// Forum — UI prototype. Everything below is placeholder data; swap for a real backend later.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const AVATAR_COLORS = ['#004aad', '#ff5757', '#0f1a33', '#3d7bd9', '#d94343'];
const avatarColor = (handle) => AVATAR_COLORS[handle.charCodeAt(1) % AVATAR_COLORS.length];
const avatar = (handle) => `<span class="avatar" style="background:${avatarColor(handle)}">${esc(handle[1].toUpperCase())}</span>`;

/* ---------------- Account (prototype: only the username is kept, in this browser) ---------------- */
const USER_KEY = 'forum.user';
const getUser = () => localStorage.getItem(USER_KEY);
const me = () => `@${getUser() || 'you'}`;

/* ---------------- Placeholder data ---------------- */
const TOPICS = ['Economy', 'Elections', 'Climate', 'Tech', 'Education', 'Housing'];

const chapters = [
  { at: 0, title: 'Top story headline', topic: 'Topic' },
  { at: 35, title: 'Second story headline', topic: 'Topic' },
  { at: 65, title: 'Third story headline', topic: 'Topic' },
  { at: 95, title: 'One thing to watch today', topic: 'Look ahead' },
];

const clips = [
  { handle: '@creator_one', topic: 'Economy', likes: 1240, comments: 86, hue: 215 },
  { handle: '@creator_two', topic: 'Climate', likes: 932, comments: 140, hue: 170 },
  { handle: '@creator_three', topic: 'Tech', likes: 4410, comments: 312, hue: 265 },
  { handle: '@creator_four', topic: 'Education', likes: 508, comments: 47, hue: 5 },
  { handle: '@creator_five', topic: 'Housing', likes: 2075, comments: 198, hue: 35 },
];

const liveDebates = [
  { statement: 'Congress should have term limits', a: '@avery', b: '@jordan', viewers: 1284, split: 54 },
  { statement: 'Nuclear power is essential to the climate transition', a: '@sam', b: '@riley', viewers: 642, split: 61 },
  { statement: 'Rent control does more harm than good', a: '@casey', b: '@morgan', viewers: 311, split: 47 },
];

const stances = [
  { handle: '@devon', topic: 'Elections', statement: 'The voting age should be lowered to 16', challengers: 4, minutes: 10 },
  { handle: '@quinn', topic: 'Tech', statement: 'Social media should require age verification', challengers: 7, minutes: 15 },
  { handle: '@harper', topic: 'Education', statement: 'Colleges should drop standardized test requirements', challengers: 2, minutes: 10 },
  { handle: '@blake', topic: 'Economy', statement: 'A four-day work week should be the legal standard', challengers: 0, minutes: 5 },
];

const pastDebates = [
  { statement: 'Debate topic goes here', detail: 'vs @opponent · Won with 58% of votes' },
  { statement: 'Debate topic goes here', detail: 'vs @opponent · Lost with 44% of votes' },
  { statement: 'Debate topic goes here', detail: 'vs @opponent · Won with 63% of votes' },
];

/* ---------------- Routing: every page has a URL, so links and the back button work ---------------- */
const PAGES = ['brief', 'feed', 'create', 'debates', 'profile'];
const AUTH_PAGES = ['signup', 'login'];

function go(name) {
  if (location.hash !== `#${name}`) history.pushState(null, '', `#${name}`);
  route();
}

function route() {
  const name = location.hash.slice(1);
  $('#room').hidden = true;
  closeSheet();

  if (AUTH_PAGES.includes(name)) return showAuth(name);
  if (!getUser()) {
    history.replaceState(null, '', '#signup');
    return showAuth('signup');
  }

  const page = PAGES.includes(name) ? name : 'brief';
  $('#auth').hidden = true;
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === page));
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === page));
  if (page !== 'brief') setPlaying(false);
  if (page === 'profile') renderProfile();
}

$$('.tab').forEach((tab) => tab.addEventListener('click', () => go(tab.dataset.tab)));
window.addEventListener('popstate', route);

/* ---------------- Toast ---------------- */
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('#toast').hidden = true), 2600);
}

/* ---------------- Sign up / log in ---------------- */
$('#authTopics').innerHTML = TOPICS.map((t) => `<button type="button" class="chip">${t}</button>`).join('');
$('#authTopics').addEventListener('click', (e) => e.target.matches('.chip') && e.target.classList.toggle('active'));

function showAuth(mode) {
  const signup = mode === 'signup';
  $('#authTitle').textContent = signup ? 'Create your account' : 'Welcome back';
  $('#authSubmit').textContent = signup ? 'Sign up' : 'Log in';
  $('#authSwitchText').textContent = signup ? 'Already have an account?' : 'New to Forum?';
  $('#authSwitch').textContent = signup ? 'Log in' : 'Sign up';
  $('#authSwitch').dataset.to = signup ? 'login' : 'signup';
  $('#authPass').autocomplete = signup ? 'new-password' : 'current-password';
  $$('.signup-only').forEach((el) => {
    el.hidden = !signup;
    $$('input', el).forEach((input) => (input.disabled = !signup)); // skipped by validation when hidden
  });
  $('#auth').hidden = false;
}

$('#authSwitch').addEventListener('click', (e) => go(e.target.dataset.to));

$('#authForm').addEventListener('submit', (e) => {
  e.preventDefault();
  // No backend yet: nothing is sent anywhere and the password is discarded.
  const username = $('#authUser').disabled ? getUser() || $('#authEmail').value.split('@')[0].replace(/\W/g, '_') : $('#authUser').value;
  localStorage.setItem(USER_KEY, username);
  e.target.reset();
  go('brief');
});

$('#logoutBtn').addEventListener('click', () => {
  localStorage.removeItem(USER_KEY);
  go('login');
});

/* ---------------- Brief ---------------- */
const DURATION = 120;
let elapsed = 0;
let timer = null;

const yesterday = new Date(Date.now() - 864e5);
$('#briefDate').textContent = yesterday.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

$('#chapters').innerHTML = chapters
  .map((c) => `<li data-at="${c.at}"><span class="stamp">${fmt(c.at)}</span><div><b>${c.title}</b><div class="topic">${c.topic}</div></div></li>`)
  .join('');

$('#pastBriefs').innerHTML = [2, 3, 4, 5, 6]
  .map((n) => {
    const d = new Date(Date.now() - n * 864e5);
    return `<div class="past"><div class="thumb"><svg viewBox="0 0 24 24"><path d="M9 7v10l8-5z"/></svg></div><p>${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p></div>`;
  })
  .join('');

function renderProgress() {
  $('#fill').style.width = `${(elapsed / DURATION) * 100}%`;
  $('#timeNow').textContent = fmt(elapsed);
  const current = chapters.filter((c) => c.at <= elapsed).length - 1;
  $$('#chapters li').forEach((li, i) => li.classList.toggle('current', i === current));
}

function setPlaying(on) {
  clearInterval(timer);
  timer = null;
  $('#player').classList.toggle('playing', on);
  if (!on) return;
  if (elapsed >= DURATION) elapsed = 0;
  timer = setInterval(() => {
    elapsed = Math.min(DURATION, elapsed + 0.25);
    renderProgress();
    if (elapsed >= DURATION) setPlaying(false);
  }, 250);
}

$('#playBtn').addEventListener('click', () => setPlaying(!timer));
$('#track').addEventListener('click', (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  elapsed = ((e.clientX - r.left) / r.width) * DURATION;
  renderProgress();
});
$('#chapters').addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  elapsed = Number(li.dataset.at);
  renderProgress();
  setPlaying(true);
});
renderProgress();

/* ---------------- Feed ---------------- */
$('#feedScroll').innerHTML = clips
  .map(
    (c, i) => `
  <article class="clip" style="background:linear-gradient(165deg,hsl(${c.hue} 55% 34%),hsl(${c.hue + 20} 50% 12%))">
    <span class="placeholder-note">User video goes here</span>
    <div class="clip-info">
      <p class="handle">${c.handle}</p>
      <p class="caption">Caption for a short video about a current issue goes here.</p>
      <span class="tag">${c.topic}</span>
    </div>
    <div class="rail">
      ${avatar(c.handle)}
      <button class="like" data-i="${i}" aria-label="Like"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/></svg><span>${compact(c.likes)}</span></button>
      <button aria-label="Comments"><svg viewBox="0 0 24 24"><path d="M5 5h14v11H10l-5 4z"/></svg><span>${compact(c.comments)}</span></button>
      <button aria-label="Share"><svg viewBox="0 0 24 24"><path d="M5 12l14-7-5 15-3-6z"/></svg><span>Share</span></button>
      <button class="debate-it" aria-label="Debate this"><svg viewBox="0 0 24 24"><path d="M4 5h10v7H8l-4 3zM20 10v9l-3-2h-6v-2"/></svg><span>Debate</span></button>
    </div>
  </article>`
  )
  .join('');

$('#feedScroll').addEventListener('click', (e) => {
  const like = e.target.closest('.like');
  if (like) {
    const on = like.classList.toggle('liked');
    $('span', like).textContent = compact(clips[like.dataset.i].likes + (on ? 1 : 0));
  }
  if (e.target.closest('.debate-it')) openPostSheet();
});

$$('.feed-tabs button').forEach((b) =>
  b.addEventListener('click', () => $$('.feed-tabs button').forEach((x) => x.classList.toggle('active', x === b)))
);

/* ---------------- Create (upload) ---------------- */
$('#videoTopic').innerHTML = TOPICS.map((t) => `<option>${t}</option>`).join('');
$('#dropzone').addEventListener('click', () => $('#fileInput').click());

function setChosenFile(file) {
  $('#dropzone').classList.toggle('has-file', !!file);
  $('#dropTitle').textContent = file ? file.name : 'Select a video';
  $('#dropHint').textContent = file ? 'Tap to choose a different video' : 'MP4 or MOV, up to 60 seconds';
}
$('#fileInput').addEventListener('change', (e) => setChosenFile(e.target.files[0]));

$('#createForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!$('#fileInput').files.length) return toast('Choose a video first');
  e.target.reset();
  $('#fileInput').value = '';
  setChosenFile(null);
  go('profile');
  toast('Prototype only — nothing was uploaded');
});

/* ---------------- Debates ---------------- */
let topicFilter = 'All';

$('#liveList').innerHTML = liveDebates
  .map(
    (d, i) => `
  <button class="live-card" data-i="${i}">
    <div class="top"><span class="live-badge">LIVE</span><span>${compact(d.viewers)} watching</span></div>
    <p class="statement">“${d.statement}”</p>
    <div class="versus">${avatar(d.a)}<span>${d.a}</span><span class="vs">VS</span>${avatar(d.b)}<span>${d.b}</span></div>
  </button>`
  )
  .join('');

function renderChips() {
  $('#topicChips').innerHTML = ['All', ...TOPICS].map((t) => `<button class="chip ${t === topicFilter ? 'active' : ''}">${t}</button>`).join('');
}

const stanceCard = (s) => `
  <article class="stance">
    <div class="by">${avatar(s.mine ? me() : s.handle)}<div><b>${esc(s.mine ? me() : s.handle)}</b><span>will defend</span></div><span class="tag">${s.topic}</span></div>
    <blockquote>“${esc(s.statement)}”</blockquote>
    <div class="foot">
      <span>${s.challengers} challenger${s.challengers === 1 ? '' : 's'} · ${s.minutes} min</span>
      ${
        s.mine
          ? '<span class="pill">Your stance</span>'
          : `<button class="btn challenge ${s.sent ? 'sent' : ''}" data-i="${stances.indexOf(s)}">${s.sent ? 'Challenge sent' : 'Challenge'}</button>`
      }
    </div>
  </article>`;

function renderStances() {
  const list = stances.filter((s) => topicFilter === 'All' || s.topic === topicFilter);
  $('#stanceList').innerHTML = list.length ? list.map(stanceCard).join('') : '<p class="empty">No open stances on this topic yet.</p>';
}

$('#topicChips').addEventListener('click', (e) => {
  if (!e.target.matches('.chip')) return;
  topicFilter = e.target.textContent;
  renderChips();
  renderStances();
});

$('#stanceList').addEventListener('click', (e) => {
  const btn = e.target.closest('.challenge');
  if (btn && !btn.classList.contains('sent')) openChallengeSheet(stances[btn.dataset.i]);
});

$('#postBtn').addEventListener('click', openPostSheet);
renderChips();
renderStances();

/* ---------------- Debate room ---------------- */
let room = null;

function renderVote() {
  $('#voteA').style.width = `${room.split}%`;
  $('#pctA').textContent = `${room.split}%`;
  $('#pctB').textContent = `${100 - room.split}%`;
}

$('#liveList').addEventListener('click', (e) => {
  const card = e.target.closest('.live-card');
  if (!card) return;
  room = { ...liveDebates[card.dataset.i], base: liveDebates[card.dataset.i].split };
  $('#roomStatement').textContent = `“${room.statement}”`;
  $('#roomA').textContent = room.a;
  $('#roomB').textContent = room.b;
  $('#roomViewers').textContent = `${compact(room.viewers)} watching`;
  $$('.vote-btn').forEach((b) => b.classList.remove('picked'));
  renderVote();
  $('#room').hidden = false;
});

$('#roomBack').addEventListener('click', () => ($('#room').hidden = true));

$$('.vote-btn').forEach((btn) =>
  btn.addEventListener('click', () => {
    $$('.vote-btn').forEach((b) => b.classList.toggle('picked', b === btn));
    room.split = room.base + (btn.dataset.side === 'a' ? 1 : -1);
    renderVote();
  })
);

/* ---------------- Profile ---------------- */
let profileView = 'videos';

function renderProfile() {
  $('#profileHandle').textContent = me();
  $('#profileAvatar').textContent = me()[1].toUpperCase();
  $('#profileAvatar').style.background = avatarColor(me());
  $$('#profileTabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === profileView));

  const mine = stances.filter((s) => s.mine);
  const views = {
    videos: () => `<div class="video-grid">${[1.2, 3.4, 0.9, 5.1, 2.2, 0.6, 1.8, 4.3, 0.7].map((v) => `<div>▶ ${v}k</div>`).join('')}</div>`,
    debates: () => `<div class="history">${pastDebates.map((d) => `<article><b>“${d.statement}”</b><span>${d.detail}</span></article>`).join('')}</div>`,
    stances: () =>
      mine.length
        ? `<div class="stances">${mine.map(stanceCard).join('')}</div>`
        : '<div class="empty"><p>You haven\'t posted a stance yet.</p><button class="btn" id="profilePost">Post a stance</button></div>',
  };
  $('#profileBody').innerHTML = views[profileView]();
}

$('#profileTabs').addEventListener('click', (e) => {
  if (!e.target.dataset.view) return;
  profileView = e.target.dataset.view;
  renderProfile();
});
$('#profileBody').addEventListener('click', (e) => e.target.id === 'profilePost' && openPostSheet());

/* ---------------- Bottom sheets ---------------- */
function openSheet(html) {
  $('#sheet').innerHTML = html;
  $('#sheetWrap').hidden = false;
}
function closeSheet() {
  $('#sheetWrap').hidden = true;
}
$('#backdrop').addEventListener('click', closeSheet);
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeSheet());

function openPostSheet() {
  openSheet(`
    <h3>Post a stance</h3>
    <p>State an opinion you're willing to defend live. Others can challenge you to a debate.</p>
    <div class="field">
      <label for="stanceText">Your stance</label>
      <textarea id="stanceText" rows="3" maxlength="120" placeholder="e.g. Cities should make public transit free"></textarea>
      <div class="count"><span id="stanceCount">0</span>/120</div>
    </div>
    <div class="row">
      <div class="field"><label for="stanceTopic">Topic</label>
        <select id="stanceTopic">${TOPICS.map((t) => `<option>${t}</option>`).join('')}</select></div>
      <div class="field"><label for="stanceLen">Length</label>
        <select id="stanceLen"><option value="5">5 min</option><option value="10" selected>10 min</option><option value="15">15 min</option></select></div>
    </div>
    <button class="btn block" id="stanceSubmit">Post stance</button>`);
  const text = $('#stanceText');
  text.focus();
  text.addEventListener('input', () => ($('#stanceCount').textContent = text.value.length));
  $('#stanceSubmit').addEventListener('click', () => {
    const statement = text.value.trim();
    if (!statement) return text.focus();
    stances.unshift({ topic: $('#stanceTopic').value, statement, challengers: 0, minutes: Number($('#stanceLen').value), mine: true });
    topicFilter = 'All';
    renderChips();
    renderStances();
    go('debates');
    $('#debates').scrollTo({ top: $('#stanceList').offsetTop - 80, behavior: 'smooth' });
  });
}

function openChallengeSheet(stance) {
  openSheet(`
    <h3>Challenge ${esc(stance.handle)}?</h3>
    <p class="quote">“${esc(stance.statement)}”</p>
    <p>You'll argue against this stance in a ${stance.minutes}-minute live debate. ${esc(stance.handle)} picks from their challengers and you'll be notified if you're chosen.</p>
    <div class="row">
      <button class="btn ghost block" id="challengeCancel">Cancel</button>
      <button class="btn block" id="challengeSend">Send challenge</button>
    </div>`);
  $('#challengeCancel').addEventListener('click', closeSheet);
  $('#challengeSend').addEventListener('click', () => {
    stance.sent = true;
    stance.challengers += 1;
    renderStances();
    closeSheet();
  });
}

route();
