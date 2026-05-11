const escape = s => String(s||"").replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ─── tabs ───
document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  document.getElementById("tab-"+b.dataset.tab).classList.add("active");
});

// ─── chat ───
let sessionId = null;
const log = document.getElementById("chatLog");
const stateEl = document.getElementById("chatState");

function addBubble(text, who) {
  const div = document.createElement("div");
  div.className = `bubble ${who}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

function addBookBubble(text, book, alts) {
  const meta = [];
  if (book.tone) meta.push(`tone <strong>${escape(book.tone)}</strong>`);
  if (book.intensity != null) meta.push(`intensity <strong>${book.intensity}</strong>`);
  if (book.emotion_tags && book.emotion_tags.length)
    meta.push(`<strong>${(book.emotion_tags||[]).slice(0,3).map(escape).join(", ")}</strong>`);

  const altsHtml = (alts||[]).length
    ? `<div class="alt-list">
         <h4>Other picks you might like</h4>
         ${alts.map(a => `<div class="alt"><strong>${escape(a.title)}</strong> — ${escape(a.author||"")}</div>`).join("")}
       </div>`
    : "";

  const div = document.createElement("div");
  div.className = "bubble bot with-card";
  div.innerHTML = `
    <div class="text">${escape(text)}</div>
    <div class="book-card">
      <div class="bc-title">${escape(book.title)}</div>
      <div class="bc-author">${escape(book.author||"")}</div>
      <div class="bc-desc">${escape(book.description||"")}</div>
      <div class="bc-meta">${meta.map(m=>`<span>${m}</span>`).join("")}</div>
    </div>
    ${altsHtml}
  `;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function renderState(d) {
  stateEl.innerHTML = "";
  const chips = [];
  if (d.detected_emotion && d.detected_emotion !== "unknown")
    chips.push(`<span class="chip emo">feeling: ${escape(d.detected_emotion)}</span>`);
  if (d.intent && d.intent !== "unknown")
    chips.push(`<span class="chip intent">intent: ${escape(d.intent)}</span>`);
  if (d.target_emotion && d.target_emotion !== d.detected_emotion)
    chips.push(`<span class="chip emo">target: ${escape(d.target_emotion)}</span>`);
  (d.themes||[]).forEach(t => chips.push(`<span class="chip theme">${escape(t)}</span>`));
  stateEl.innerHTML = chips.join("");
}

async function sendChat(msg) {
  addBubble(msg, "user");
  const typing = addBubble("…thinking", "bot"); typing.classList.add("typing");
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({session_id: sessionId, message: msg}),
    });
    const d = await r.json();
    sessionId = d.session_id;
    typing.remove();
    if (d.book) {
      addBookBubble(d.reply, d.book, d.alternatives);
    } else {
      addBubble(d.reply, "bot");
    }
    renderState(d);
  } catch (e) {
    typing.textContent = "(error: " + e.message + ")";
  }
}

document.getElementById("chatForm").addEventListener("submit", e => {
  e.preventDefault();
  const inp = document.getElementById("chatMsg");
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = "";
  sendChat(msg);
});

document.getElementById("chatReset").onclick = async () => {
  await fetch("/api/chat/reset", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({session_id: sessionId, message: ""}),
  });
  sessionId = null;
  log.innerHTML = '<div class="bubble bot">Fresh start. How are you feeling now?</div>';
  stateEl.innerHTML = "";
};

// ─── browse tab ───
const STYLE_LABELS = ["Metaphor density","Sentence complexity","Narrative rhythm","Lexical richness","Emotional intensity"];

async function search(q="") {
  const list = document.getElementById("bookList");
  list.innerHTML = '<li class="loading">loading…</li>';
  const res = await fetch("/api/books?q=" + encodeURIComponent(q));
  const books = await res.json();
  list.innerHTML = "";
  if (!books.length) { list.innerHTML = '<li class="loading">no matches</li>'; return; }
  for (const b of books) {
    const li = document.createElement("li");
    li.dataset.id = b.id;
    li.innerHTML = `<div class="book-title">${escape(b.title)}</div>
                    <div class="book-author">${escape(b.author||"")}</div>`;
    li.onclick = () => select(b.id, li);
    list.appendChild(li);
  }
}

async function select(id, li) {
  document.querySelectorAll("#bookList li").forEach(x => x.classList.remove("active"));
  li && li.classList.add("active");
  const detail = document.getElementById("detail");
  detail.innerHTML = '<div class="loading">loading…</div>';
  const [book, recs] = await Promise.all([
    fetch("/api/book/" + encodeURIComponent(id)).then(r=>r.json()),
    fetch("/api/recommend/" + encodeURIComponent(id) + "?k=5").then(r=>r.json()),
  ]);
  renderDetail(book, recs.recommendations);
}

function renderDetail(book, recs) {
  const styleBars = (book.style_vec||[]).map((v,i)=>`
    <div class="row">
      <div class="label">${STYLE_LABELS[i]}</div>
      <div class="bar"><div class="fill" style="width:${(v*100).toFixed(0)}%"></div></div>
      <div class="val">${v.toFixed(2)}</div>
    </div>`).join("");
  const themes = (book.themes||[]).map(t=>`<span class="tag">${escape(t)}</span>`).join("");
  const motifs = (book.motifs||[]).map(t=>`<span class="tag motif">${escape(t)}</span>`).join("");
  const recHtml = recs.map(r=>`
    <div class="rec">
      <div class="rec-title">${escape(r.title)}</div>
      <div class="rec-author">${escape(r.author||"")}</div>
      <div>${escape((r.description||"").slice(0,160))}…</div>
      <div class="rec-scores">
        <span>style <strong>${r.stylistic_similarity}</strong></span>
        <span>semantic <strong>${r.semantic_similarity}</strong></span>
        <span>graph <strong>${r.graph_overlap}</strong></span>
        <span>total <strong>${r.score}</strong></span>
      </div>
    </div>`).join("");
  document.getElementById("detail").innerHTML = `
    <div class="detail-head">
      <h3>${escape(book.title)}</h3>
      <div class="meta">${escape(book.author||"")}
        ${book.era?` · era: ${escape(book.era)}`:""}
        ${book.region?` · region: ${escape(book.region)}`:""}</div>
    </div>
    <div class="detail-desc">${escape(book.description||"")}</div>
    <div class="tags"><strong>Themes:</strong> ${themes||"<em>none</em>"}</div>
    <div class="tags"><strong>Motifs:</strong> ${motifs||"<em>none</em>"}</div>
    <div class="style-bars"><strong>Stylistic fingerprint</strong>${styleBars}</div>
    <div class="recs"><h2 style="margin-top:18px">Similar books</h2>${recHtml||"<em>none</em>"}</div>`;
}

document.getElementById("searchBtn").onclick = () => search(document.getElementById("q").value);
document.getElementById("q").addEventListener("keydown", e => { if(e.key==="Enter") search(e.target.value); });
search();
