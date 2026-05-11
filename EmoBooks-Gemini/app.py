"""SSKG-SL demo web app.

Endpoints:
  GET /                       - search/browse UI
  GET /api/books?q=           - search by title/author
  GET /api/recommend/{id}     - hybrid recommendations
  GET /api/graph/{id}         - neighborhood for visualization
"""
import os, math, json, uuid, urllib.parse
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from neo4j import GraphDatabase
from google import genai
from google.genai import types
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PWD = os.getenv("NEO4J_PASSWORD", "emobooks123")

driver = GraphDatabase.driver(URI, auth=(USER, PWD))
gem = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
GEM_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
SESSIONS: Dict[str, Dict[str, Any]] = {}  # {sid: {"history": [...], "recommended": [book_ids]}}

app = FastAPI(title="EmoBooks-Gemini SSKG-SL")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")
templates = Jinja2Templates(directory=str(ROOT / "templates"))


# ---------- math ----------
def cosine(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0


# ---------- queries ----------
SEARCH_Q = """
MATCH (b:Book)
WHERE toLower(b.title) CONTAINS toLower($q)
   OR toLower(b.author) CONTAINS toLower($q)
RETURN b.id AS id, b.title AS title, b.author AS author,
       b.description AS description
LIMIT 30
"""

GET_BOOK = """
MATCH (b:Book {id: $id})
OPTIONAL MATCH (b)-[:HAS_THEME]->(t:Theme)
OPTIONAL MATCH (b)-[:HAS_MOTIF]->(m:Motif)
OPTIONAL MATCH (b)-[:SET_IN]->(e:Era)
OPTIONAL MATCH (b)-[:FROM_REGION]->(r:Region)
RETURN b.id AS id, b.title AS title, b.author AS author,
       b.description AS description, b.tone AS tone, b.pacing AS pacing,
       b.style_vec AS style_vec, b.embedding AS embedding,
       collect(DISTINCT t.name) AS themes,
       collect(DISTINCT m.name) AS motifs,
       head(collect(DISTINCT e.name)) AS era,
       head(collect(DISTINCT r.name)) AS region
"""

CANDIDATES_Q = """
MATCH (b:Book {id: $id})
MATCH (b)-[:HAS_THEME|HAS_MOTIF|SET_IN|FROM_REGION]->(x)<-[:HAS_THEME|HAS_MOTIF|SET_IN|FROM_REGION]-(c:Book)
WHERE c.id <> $id
WITH c, count(DISTINCT x) AS overlap
RETURN c.id AS id, c.title AS title, c.author AS author,
       c.description AS description,
       c.style_vec AS style_vec, c.embedding AS embedding,
       overlap
ORDER BY overlap DESC
LIMIT 100
"""

GRAPH_Q = """
MATCH (b:Book {id: $id})-[r]->(n)
RETURN b.id AS bid, b.title AS btitle, type(r) AS rel,
       labels(n)[0] AS ntype, coalesce(n.name, n.title) AS nname
LIMIT 50
"""


def fetch_book(s, bid: str) -> Dict[str, Any]:
    rec = s.run(GET_BOOK, id=bid).single()
    if not rec:
        raise HTTPException(404, f"book not found: {bid}")
    return dict(rec)


# ---------- routes ----------
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/api/books")
def search(q: str = ""):
    if not q.strip():
        with driver.session() as s:
            res = s.run("MATCH (b:Book) RETURN b.id AS id, b.title AS title, "
                        "b.author AS author, b.description AS description LIMIT 30")
            return [dict(r) for r in res]
    with driver.session() as s:
        res = s.run(SEARCH_Q, q=q)
        return [dict(r) for r in res]


@app.get("/api/book/{bid:path}")
def get_book(bid: str):
    bid = urllib.parse.unquote(bid)
    with driver.session() as s:
        b = fetch_book(s, bid)
    b.pop("embedding", None)  # don't ship 768 floats
    return b


@app.get("/api/recommend/{bid:path}")
def recommend(bid: str, k: int = 5):
    bid = urllib.parse.unquote(bid)
    with driver.session() as s:
        src = fetch_book(s, bid)
        cands = [dict(r) for r in s.run(CANDIDATES_Q, id=bid)]

    sv, ev = src.get("style_vec") or [], src.get("embedding") or []
    max_overlap = max((c["overlap"] for c in cands), default=1) or 1

    scored = []
    for c in cands:
        sty = cosine(sv, c.get("style_vec") or [])
        sem = cosine(ev, c.get("embedding") or [])
        graph = c["overlap"] / max_overlap
        score = 0.4 * sty + 0.4 * sem + 0.2 * graph
        scored.append({
            "id": c["id"], "title": c["title"], "author": c["author"],
            "description": c["description"],
            "stylistic_similarity": round(sty, 3),
            "semantic_similarity": round(sem, 3),
            "graph_overlap": round(graph, 3),
            "score": round(score, 3),
        })
    scored.sort(key=lambda x: x["score"], reverse=True)
    src.pop("embedding", None)
    return {"source": src, "recommendations": scored[:k]}


# ───────────── chat: emotion-aware recommendation ─────────────

EMOTIONS = ["joy", "sadness", "love", "calm", "lonely", "anger"]

# Map broader feelings to the canonical tags actually present in the catalog.
EMOTION_ALIAS = {
    "hope": "joy", "happiness": "joy", "excitement": "joy", "delight": "joy",
    "melancholy": "sadness", "grief": "sadness", "sorrow": "sadness",
    "nostalgia": "sadness", "wistful": "sadness", "lonely": "lonely",
    "loneliness": "lonely", "isolation": "lonely",
    "peace": "calm", "calmness": "calm", "reflective": "calm",
    "anxious": "calm", "fear": "calm", "stressed": "calm",
    "romance": "love", "affection": "love", "compassion": "love",
    "rage": "anger", "frustration": "anger",
}


def canonical_emotion(e: str) -> str:
    if not e:
        return ""
    e = e.strip().lower()
    if e in EMOTIONS:
        return e
    return EMOTION_ALIAS.get(e, e)

CHAT_SCHEMA = {
    "type": "object",
    "properties": {
        "reply": {"type": "string"},
        "detected_emotion": {"type": "string"},
        "intent": {"type": "string"},          # maintain | switch | amplify | unknown
        "target_emotion": {"type": "string"},
        "target_intensity": {"type": "number"}, # 0..1
        "themes_of_interest": {"type": "array", "items": {"type": "string"}},
        "ready_to_recommend": {"type": "boolean"},
    },
    "required": ["reply", "detected_emotion", "intent", "target_emotion",
                 "target_intensity", "themes_of_interest", "ready_to_recommend"],
}

CHAT_SYSTEM = """You are a warm librarian helping a reader discover Sinhala
literature from a Sri Lankan online bookstore.

LANGUAGE: Reply in the SAME language the user just used. If the user wrote
in English, you reply in English. If the user wrote in Sinhala, reply in
Sinhala. Never assume Sinhala by default.

Your job across 2-4 short turns:
1. Greet briefly and ask how the reader is feeling right now.
2. Detect their CURRENT emotion.
3. Find out their INTENT:
   - "maintain": keep feeling the same emotion
   - "switch":   move to a different emotion (e.g. sad → joy)
   - "amplify":  intensify the same emotion (e.g. melancholic → more bittersweet)
4. Optionally ask one clarifier about preferred theme (love, family,
   adventure, village life, history) — only if helpful.
5. Once you have enough, set ready_to_recommend=true and pick a TARGET
   emotion + target_intensity (0..1).

CRITICAL RULES:
- target_emotion MUST be one of: """ + ", ".join(EMOTIONS) + """.
  Map broader feelings to the closest canonical one (e.g. hope→joy,
  melancholy→sadness, peace→calm).
- Reply in the same language the user is writing in (English ↔ Sinhala).
  Default to English when unclear.
- Keep replies under 2 sentences. Friendly, never therapy-like.
- Do not mention any specific book in your reply — the system picks books
  after you set ready_to_recommend=true.
- Use intent='unknown' and ready_to_recommend=false until you are confident.

POST-RECOMMENDATION BEHAVIOUR (very important):
- After a book has already been recommended, you'll see [SYSTEM: a book
  was already recommended] in the conversation. From that point on:
    • If the user just thanks you, says bye, or makes small talk →
      reply warmly in 1 sentence and set ready_to_recommend=FALSE.
    • If the user asks for "another / different / something else" →
      set ready_to_recommend=TRUE and KEEP the same target_emotion
      (the system will pick a different book).
    • If the user describes a NEW feeling → re-detect emotion and set
      ready_to_recommend=TRUE only when you have intent + target.

- Always return valid JSON matching the schema."""


def chat_turn(history: List[Dict[str, str]], user_msg: str,
              already_recommended: bool) -> Dict[str, Any]:
    user_text = user_msg
    if already_recommended:
        user_text = "[SYSTEM: a book was already recommended this session]\n" + user_msg
    history.append({"role": "user", "parts": [user_text]})
    contents = [{"role": h["role"], "parts": [{"text": p} for p in h["parts"]]}
                for h in history]
    resp = gem.models.generate_content(
        model=GEM_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=CHAT_SYSTEM,
            response_mime_type="application/json",
            response_schema=CHAT_SCHEMA,
            temperature=0.6,
        ),
    )
    parsed = json.loads(resp.text)
    history.append({"role": "model", "parts": [parsed["reply"]]})
    return parsed


EMOTION_QUERY = """
MATCH (b:Book)
WHERE any(t IN b.emotion_tags WHERE toLower(t) = toLower($emotion))
   OR toLower(coalesce(b.tone,'')) CONTAINS toLower($emotion)
RETURN b.id AS id, b.title AS title, b.author AS author,
       b.description AS description, b.tone AS tone,
       b.emotion_tags AS emotion_tags,
       b.emotional_intensity AS intensity,
       b.style_vec AS style_vec,
       b.embedding AS embedding,
       [(b)-[:HAS_THEME]->(t:Theme) | t.name] AS themes,
       [(b)-[:HAS_MOTIF]->(m:Motif) | m.name] AS motifs
LIMIT 200
"""


def find_books_by_emotion(emotion: str, target_intensity: float,
                          themes: List[str], exclude_ids: List[str] = None,
                          k: int = 5) -> List[Dict[str, Any]]:
    with driver.session() as s:
        cands = [dict(r) for r in s.run(EMOTION_QUERY, emotion=emotion)]
    skip = set(exclude_ids or [])
    cands = [c for c in cands if c["id"] not in skip]
    if not cands:
        return []
    wanted_themes = {t.lower() for t in (themes or [])}
    scored = []
    for c in cands:
        intensity = c.get("intensity") or 0.0
        intensity_fit = 1 - abs(intensity - target_intensity)
        theme_overlap = 0.0
        if wanted_themes:
            book_themes = {(t or "").lower() for t in (c.get("themes") or [])
                           + (c.get("motifs") or [])}
            if book_themes:
                theme_overlap = len(wanted_themes & book_themes) / len(wanted_themes)
        score = 0.7 * intensity_fit + 0.3 * theme_overlap
        scored.append({**c, "score": round(score, 3),
                       "intensity_fit": round(intensity_fit, 3),
                       "theme_overlap": round(theme_overlap, 3)})
    scored.sort(key=lambda x: x["score"], reverse=True)
    out = []
    for c in scored[:k]:
        out.append({
            "id": c["id"], "title": c["title"], "author": c["author"],
            "description": c["description"], "tone": c.get("tone"),
            "emotion_tags": c.get("emotion_tags") or [],
            "intensity": round(c.get("intensity") or 0, 2),
            "themes": c.get("themes") or [],
            "score": c["score"],
        })
    return out


class ChatIn(BaseModel):
    session_id: str | None = None
    message: str


@app.post("/api/chat")
def chat(body: ChatIn):
    sid = body.session_id or str(uuid.uuid4())
    sess = SESSIONS.setdefault(sid, {"history": [], "recommended": []})
    history = sess["history"]
    already = bool(sess["recommended"])
    try:
        state = chat_turn(history, body.message, already)
    except Exception as e:
        raise HTTPException(500, f"gemini error: {e}")

    out = {
        "session_id": sid,
        "reply": state["reply"],
        "detected_emotion": state.get("detected_emotion"),
        "intent": state.get("intent"),
        "target_emotion": state.get("target_emotion"),
        "themes": state.get("themes_of_interest", []),
        "ready": bool(state.get("ready_to_recommend")),
        "recommendations": [],
    }
    if out["ready"] and out["target_emotion"]:
        canonical = canonical_emotion(out["target_emotion"])
        out["target_emotion"] = canonical
        candidates = find_books_by_emotion(
            emotion=canonical,
            target_intensity=float(state.get("target_intensity") or 0.5),
            themes=out["themes"],
            exclude_ids=sess["recommended"],
            k=5,
        )
        if candidates:
            pick = pick_and_recommend(history, out, candidates)
            out["reply"] = pick["message"]
            if history and history[-1]["role"] == "model":
                history[-1]["parts"] = [pick["message"]]
            out["book"] = pick["book"]
            out["alternatives"] = [c for c in candidates
                                    if c["id"] != pick["book"]["id"]][:3]
            sess["recommended"].append(pick["book"]["id"])
        out["recommendations"] = candidates
    return out


PICK_SCHEMA = {
    "type": "object",
    "properties": {
        "chosen_id": {"type": "string"},
        "message": {"type": "string"},
    },
    "required": ["chosen_id", "message"],
}


def pick_and_recommend(history: List[Dict[str, str]], state: Dict[str, Any],
                       candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Second Gemini call: pick one book and write a conversational pitch."""
    user_lang_hint = ""
    last_user = next((h for h in reversed(history) if h["role"] == "user"), None)
    if last_user:
        user_lang_hint = f"The user's last message was: '{last_user['parts'][0]}'."

    cand_lines = []
    for i, c in enumerate(candidates, 1):
        themes = ", ".join((c.get("themes") or [])[:4])
        cand_lines.append(
            f"{i}. id={c['id']}\n"
            f"   title: {c['title']} by {c['author']}\n"
            f"   tone: {c.get('tone','')} · intensity: {c.get('intensity',0)}\n"
            f"   themes: {themes}\n"
            f"   blurb: {(c.get('description') or '')[:220]}"
        )

    prompt = f"""The reader feels '{state.get('detected_emotion')}' and wants
to {state.get('intent')} (target emotion: {state.get('target_emotion')}).
{user_lang_hint}

Candidate books from our Sinhala literature catalog:
{chr(10).join(cand_lines)}

Pick the SINGLE best book for this reader. Then write a 2-3 sentence
recommendation message that:
- mentions the book by title and author
- explains briefly *why* it matches their emotional need
- ends with a warm, inviting line
- is in the SAME language the reader used (English ↔ Sinhala)

Return JSON only with chosen_id (must match exactly one of the ids above)
and message."""

    resp = gem.models.generate_content(
        model=GEM_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=PICK_SCHEMA,
            temperature=0.7,
        ),
    )
    parsed = json.loads(resp.text)
    chosen = next((c for c in candidates if c["id"] == parsed["chosen_id"]), candidates[0])
    return {"book": chosen, "message": parsed["message"]}


@app.post("/api/chat/reset")
def chat_reset(body: ChatIn):
    SESSIONS.pop(body.session_id or "", None)
    return {"ok": True}


@app.get("/api/graph/{bid:path}")
def neighborhood(bid: str):
    bid = urllib.parse.unquote(bid)
    nodes, links = {bid: {"id": bid, "type": "Book", "label": bid.split("::")[0]}}, []
    with driver.session() as s:
        for r in s.run(GRAPH_Q, id=bid):
            nid = f"{r['ntype']}::{r['nname']}"
            nodes[nid] = {"id": nid, "type": r["ntype"], "label": r["nname"]}
            links.append({"source": bid, "target": nid, "rel": r["rel"]})
    return {"nodes": list(nodes.values()), "links": links}
