/* ================================================================
   drill-app.js  —  现场代码刷题系统交互逻辑
   依赖：drill-data.js (MODULES/QUESTIONS/STUDY/CHEAT)
         drill-story.js (STORY)
   ================================================================ */

// ─── 状态 ───────────────────────────────────────────────────────
const ST = {
  done: JSON.parse(localStorage.getItem('dd_done') || '{}'),
  wrong: JSON.parse(localStorage.getItem('dd_wrong') || '{}'),
  save() {
    localStorage.setItem('dd_done', JSON.stringify(this.done));
    localStorage.setItem('dd_wrong', JSON.stringify(this.wrong));
  }
};

// ─── 工具 ───────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }
function showToast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1600);
}
function switchTab(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(i => i.classList.remove('active'));
  $('page-' + tab).classList.add('active');
  const navItem = document.querySelector(`[data-tab="${tab}"]`);
  if (navItem) navItem.classList.add('active');
  if (tab === 'home') renderHome();
  if (tab === 'study') renderStudy();
  if (tab === 'cheat') renderCheat();
  if (tab === 'wrong') renderWrong();
  if (tab === 'story') renderStoryList();
}

// ─── 统计 ────────────────────────────────────────────────────────
function calcStats() {
  const total = QUESTIONS.length;
  const done = Object.keys(ST.done).length;
  const correct = Object.values(ST.done).filter(v => v === 'ok').length;
  const wrong = Object.keys(ST.wrong).length;
  const rate = done ? Math.round(correct / done * 100) : 0;
  return { total, done, correct, wrong, rate };
}

// ─── 首页 ────────────────────────────────────────────────────────
function renderHome() {
  const s = calcStats();
  $('s-total').textContent = s.total;
  $('s-done').textContent = s.done;
  $('s-rate').textContent = s.rate + '%';
  $('s-wrong').textContent = s.wrong;

  const list = $('mod-list');
  list.innerHTML = MODULES.map(m => {
    const qs = QUESTIONS.filter(q => q.mod === m.key);
    const done = qs.filter(q => ST.done[q.id]).length;
    const pct = qs.length ? Math.round(done / qs.length * 100) : 0;
    const diffClass = ['', 'diff1', 'diff2', 'diff3'][m.diff] || 'diff1';
    const stars = m.diff === 1 ? '⭐' : m.diff === 2 ? '⭐⭐' : '⭐⭐⭐';
    return `<div class="mod-card" onclick="startMod('${m.key}')">
      <div class="mt">${m.icon} ${m.name}</div>
      <div class="md">${m.desc}</div>
      <div class="meta">
        <span class="pill ${diffClass}">${stars} 难度${m.diff}</span>
        <span class="pill">${done}/${qs.length} 完成</span>
      </div>
      <div class="pbar"><i style="width:${pct}%"></i></div>
    </div>`;
  }).join('');
}

// ─── 刷题模式入口 ────────────────────────────────────────────────
let quizQueue = [], quizIdx = 0;

function startMode(mode) {
  if (mode === 'all') quizQueue = [...QUESTIONS];
  else if (mode === 'wrong') quizQueue = QUESTIONS.filter(q => ST.wrong[q.id]);
  if (!quizQueue.length) { showToast('没有题目'); return; }
  quizIdx = 0;
  switchTab('quiz');
  renderQuiz();
}

function startMod(key) {
  quizQueue = QUESTIONS.filter(q => q.mod === key);
  if (!quizQueue.length) { showToast('该模块暂无题目'); return; }
  quizIdx = 0;
  switchTab('quiz');
  renderQuiz();
}

// ─── 题目渲染 ────────────────────────────────────────────────────
function renderQuiz() {
  const container = $('quiz-content');
  if (quizIdx >= quizQueue.length) {
    container.innerHTML = `<div style="padding:30px 16px">
      <div class="back-btn" onclick="switchTab('home')">← 返回</div>
      <div class="q-card" style="text-align:center;padding:40px 16px">
        <div style="font-size:48px;margin-bottom:16px">🎉</div>
        <div style="font-size:20px;font-weight:700;margin-bottom:8px">本轮刷完啦！</div>
        <div style="color:#999;margin-bottom:24px">共 ${quizQueue.length} 题</div>
        <button class="btn btn-primary" onclick="startMode('wrong')">只刷错题</button>
      </div></div>`;
    return;
  }
  const q = quizQueue[quizIdx];
  const pct = Math.round(quizIdx / quizQueue.length * 100);
  const mod = MODULES.find(m => m.key === q.mod);
  const lvlColor = q.level === 'L1' ? '#07c160' : q.level === 'L2' ? '#ed6a0c' : '#e64340';

  let body = '';
  if (q.type === 'fill' || q.type === 'write') {
    const codeBlock = q.code ? `<pre class="code">${highlightCode(q.code)}</pre>` : '';
    body = `${codeBlock}
    <div class="hint-row"><span></span><span class="hint-toggle" onclick="toggleHint(${q.id})">💡 提示</span></div>
    <div id="hint-${q.id}" style="display:none" class="mem">${q.memory}</div>
    <textarea class="ans-input" id="ans-${q.id}" placeholder="${q.type === 'write' ? '从零默写...' : '填入答案...'}" rows="${q.type === 'write' ? 6 : 2}"></textarea>`;
  } else if (q.type === 'choice') {
    body = q.options.map((o, i) => {
      const lbl = String.fromCharCode(65 + i);
      return `<li class="opt-item" id="opt-${q.id}-${lbl}" onclick="selectOpt(${q.id},'${lbl}')">
        <span class="opt-label">${lbl}</span>
        <span class="opt-text">${o}</span></li>`;
    }).join('');
    body = `<ul class="opt-list">${body}</ul>`;
  } else if (q.type === 'judge') {
    body = `<ul class="opt-list">
      <li class="opt-item" id="opt-${q.id}-对" onclick="selectOpt(${q.id},'对')"><span class="opt-label">✓</span><span class="opt-text">对</span></li>
      <li class="opt-item" id="opt-${q.id}-错" onclick="selectOpt(${q.id},'错')"><span class="opt-label">✗</span><span class="opt-text">错</span></li>
    </ul>`;
  }

  container.innerHTML = `
    <div style="padding:14px">
      <div class="back-btn" onclick="switchTab('home')">← 返回</div>
      <div class="q-top">
        <span>${quizIdx + 1}/${quizQueue.length}</span>
        <div class="bw"><div class="bf" style="width:${pct}%"></div></div>
        <span>${mod ? mod.icon : ''}</span>
      </div>
      <div class="q-card">
        <span class="q-lvl" style="background:${lvlColor}20;color:${lvlColor}">${q.level} ${q.level === 'L1' ? '填空' : q.level === 'L2' ? '改错' : '默写'}</span>
        <span class="q-mod">${mod ? mod.name : ''}</span>
        <div class="q-prompt">${q.prompt}</div>
        ${body}
        <div id="ans-box-${q.id}" class="ans-box"></div>
        <div class="btn-row" id="btn-row-${q.id}">
          ${(q.type === 'fill' || q.type === 'write')
            ? `<button class="btn btn-primary" onclick="checkAns(${q.id})">提交</button>`
            : ''}
        </div>
      </div>
    </div>`;
}

function toggleHint(id) {
  const h = $(`hint-${id}`);
  h.style.display = h.style.display === 'none' ? 'block' : 'none';
}

// ─── 选择/判断 ───────────────────────────────────────────────────
let selectedOpt = {};
function selectOpt(qid, lbl) {
  selectedOpt[qid] = lbl;
  const q = QUESTIONS.find(q => q.id === qid);
  // 高亮选中
  document.querySelectorAll(`[id^="opt-${qid}-"]`).forEach(el => {
    el.classList.remove('selected', 'correct', 'wrong');
  });
  const el = $(`opt-${qid}-${lbl}`);
  if (el) el.classList.add('selected');
  // 立刻判断
  setTimeout(() => revealOpt(qid, lbl), 300);
}

function revealOpt(qid, lbl) {
  const q = QUESTIONS.find(q => q.id === qid);
  const correct = lbl === q.answer;
  document.querySelectorAll(`[id^="opt-${qid}-"]`).forEach(el => {
    const elLbl = el.id.replace(`opt-${qid}-`, '');
    if (elLbl === q.answer) el.classList.add('correct');
    else if (elLbl === lbl && !correct) el.classList.add('wrong');
  });
  markResult(q, correct);
  showAnswerBox(qid, q, correct);
  $(`btn-row-${qid}`).innerHTML = nextBtn();
}

// ─── 填空/默写判定 ───────────────────────────────────────────────
function checkAns(qid) {
  const q = QUESTIONS.find(q => q.id === qid);
  const inp = $(`ans-${qid}`);
  if (!inp) return;
  const val = inp.value.trim();
  if (!val) { showToast('请先输入答案'); return; }

  // 宽松匹配：把答案按;分割，每段都在输入里出现则算对
  const tokens = q.answer.split(';').map(s => s.trim());
  const correct = tokens.every(t => val.includes(t));

  markResult(q, correct);
  showAnswerBox(qid, q, correct);
  inp.disabled = true;
  $(`btn-row-${qid}`).innerHTML = nextBtn();
}

function nextBtn() {
  return `<button class="btn btn-primary" onclick="nextQ()">下一题 →</button>`;
}

function nextQ() {
  quizIdx++;
  renderQuiz();
}

function markResult(q, correct) {
  ST.done[q.id] = correct ? 'ok' : 'fail';
  if (!correct) ST.wrong[q.id] = true;
  else delete ST.wrong[q.id];
  ST.save();
}

function showAnswerBox(qid, q, correct) {
  const box = $(`ans-box-${qid}`);
  if (!box) return;
  const params = q.params ? `<div class="lab">⚙️ 现场必改</div><div class="why">${q.params}</div>` : '';
  box.innerHTML = `
    <div class="ans-head ${correct ? 'ok' : 'no'}">${correct ? '✅ 正确！' : '❌ 错了，看看正确答案'}</div>
    <div class="ans-body">
      <div class="lab">正确答案</div>
      <pre class="code" style="font-size:12px">${q.answer}</pre>
      <div class="lab">记忆点</div>
      <div class="mem">${q.memory}</div>
      <div class="lab">为什么这么写</div>
      <div class="why">${q.why}</div>
      ${params}
    </div>`;
  box.classList.add('show');
}

// ─── 学习/STUDY ──────────────────────────────────────────────────
function renderStudy() {
  $('study-content').innerHTML = MODULES.map(m => `
    <div class="mod-card" onclick="showStudy('${m.key}')">
      <div class="mt">${m.icon} ${m.name}</div>
      <div class="md">${m.desc}</div>
    </div>`).join('');
}

function showStudy(key) {
  const m = MODULES.find(m => m.key === key);
  $('study-content').innerHTML = `
    <div class="back-btn" onclick="renderStudy()">← 返回</div>
    <div class="page-header">${m.icon} ${m.name}</div>
    ${STUDY[key] || '<p>暂无内容</p>'}
    <div style="margin-top:16px">
      <button class="btn btn-primary" onclick="startMod('${key}')">开始刷这个模块</button>
    </div>`;
}

// ─── 故事/STORY ──────────────────────────────────────────────────
function renderStoryList() {
  const c = $('story-content');
  if (!c) return;
  c.innerHTML = `<div class="page-header">📖 叙事讲解<div class="sub">读懂"在干嘛"才能记住怎么写</div></div>` +
    MODULES.map(m => `
      <div class="mod-card" style="border-left-color:#9c27b0" onclick="showStory('${m.key}')">
        <div class="mt">${m.icon} ${m.name}</div>
        <div class="md">${m.desc}</div>
        <div class="meta"><span class="pill" style="background:#f3e5f5;color:#9c27b0">五层叙事拆解</span></div>
      </div>`).join('');
}

function showStory(key) {
  const m = MODULES.find(m => m.key === key);
  const c = $('story-content');
  const storyContent = (typeof STORY !== 'undefined' && STORY[key]) ? STORY[key] : '<p style="color:#999">内容待补充</p>';
  c.innerHTML = `
    <div class="back-btn" onclick="renderStoryList()">← 返回</div>
    ${storyContent}
    <div style="margin-top:20px">
      <button class="btn btn-primary" onclick="startMod('${key}')">去刷题 →</button>
    </div>`;
}

// ─── 速查 ────────────────────────────────────────────────────────
function renderCheat() {
  $('cheat-content').innerHTML = CHEAT;
}

// ─── 错题 ────────────────────────────────────────────────────────
function renderWrong() {
  const wrongs = QUESTIONS.filter(q => ST.wrong[q.id]);
  const c = $('wrong-content');
  if (!wrongs.length) {
    c.innerHTML = `<div class="empty"><div class="ei">🎉</div>暂无错题，继续保持！</div>`;
    return;
  }
  c.innerHTML = `<div style="margin-bottom:12px;color:#999;font-size:13px">共 ${wrongs.length} 道错题</div>` +
    wrongs.map(q => {
      const m = MODULES.find(m => m.key === q.mod);
      return `<div class="q-card" style="cursor:pointer" onclick="drillWrong(${q.id})">
        <span class="lvl-badge lvl-${q.level}">${q.level}</span>
        <span style="font-size:12px;color:#999">${m ? m.name : ''}</span>
        <div style="font-size:13px;margin-top:6px">${q.prompt}</div>
      </div>`;
    }).join('');
}

function drillWrong(id) {
  quizQueue = QUESTIONS.filter(q => ST.wrong[q.id]);
  quizIdx = quizQueue.findIndex(q => q.id === id);
  if (quizIdx < 0) quizIdx = 0;
  switchTab('quiz');
  renderQuiz();
}

// ─── 代码高亮（极简） ────────────────────────────────────────────
function highlightCode(code) {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(#[^\n]*)/g, '<span class="cm">$1</span>')
    .replace(/\b(def|import|from|if|else|while|True|False|return|continue|break|for|in|not|and|or|class|None)\b/g, '<span class="kw">$1</span>')
    .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, s => `<span class="st">${s}</span>`)
    .replace(/\b(\d+)\b/g, '<span class="nm">$1</span>')
    .replace(/____+/g, '<span class="blank">____</span>');
}

// ─── 初始化 ──────────────────────────────────────────────────────
renderHome();
renderCheat();
