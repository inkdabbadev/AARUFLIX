"use client";

import { useEffect, useRef, useState } from "react";
import { PUZZLES, COLORS, STORE_KEY } from "@/lib/puzzles";

const VISIBLE_PUZZLE_INDEXES = PUZZLES.map((p, index) => (p.type === "connections" ? index : null)).filter(
  (index) => index !== null
);
const VISIBLE_PUZZLES = VISIBLE_PUZZLE_INDEXES.map((index) => ({ ...PUZZLES[index], originalIndex: index }));
const PUBLIC_UNLOCKED_PROGRESS = Object.fromEntries(VISIBLE_PUZZLE_INDEXES.slice(0, 4).map((index) => [index, true]));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Dots({ count, used, hint }) {
  return (
    <span className="dots-inline">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={"dot" + (hint ? " hint" : "") + (i < used ? " used" : "")} />
      ))}
    </span>
  );
}

function EpisodeCard({ puzzle, unlocked, onOpen }) {
  const num = puzzle.label.split(" ")[1] || "01";
  return (
    <div
      className={"card" + (unlocked ? " unlocked" : "")}
      onClick={onOpen}
    >
      <div className="art">{num}</div>
      <div className="lock-badge">{unlocked ? "▶" : "\u{1F512}"}</div>
      <div className="type-badge">CONNECTIONS</div>
      <div className="info">
        <span className="t">{puzzle.label}</span>
        <span className="code">{unlocked ? puzzle.passcode : "Locked"}</span>
      </div>
      <div className="hover-strip">
        {unlocked ? "Tap to watch" : "Tap to solve the puzzle"}
      </div>
    </div>
  );
}

function ConnectionsModal({ puzzle, onClose, onWin, onLose }) {
  const [curWords, setCurWords] = useState(() => shuffle(puzzle.groups.flatMap((g) => g.words)));
  const [selected, setSelected] = useState([]);
  const [solvedCats, setSolvedCats] = useState([]);
  const [mistakesLeft, setMistakesLeft] = useState(3);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintCursor, setHintCursor] = useState(0);
  const [toast, setToast] = useState("");
  const [hintNode, setHintNode] = useState(null);

  function wordCategory(word) {
    return puzzle.groups.find((g) => g.words.includes(word));
  }

  function toggleSelect(word) {
    setSelected((sel) =>
      sel.includes(word) ? sel.filter((w) => w !== word) : sel.length < 4 ? [...sel, word] : sel
    );
  }

  function handleSubmit() {
    if (selected.length !== 4) return;
    const cats = selected.map(wordCategory);
    const allSame = cats.every((c) => c === cats[0]);

    if (allSame) {
      const newSolved = [...solvedCats, cats[0]];
      setSolvedCats(newSolved);
      setCurWords((cw) => cw.filter((w) => !selected.includes(w)));
      setSelected([]);
      setToast("");
      if (newSolved.length === puzzle.groups.length) {
        setTimeout(() => onWin(), 350);
      }
      return;
    }

    const counts = {};
    cats.forEach((c) => {
      const key = puzzle.groups.indexOf(c);
      counts[key] = (counts[key] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(counts));
    const newMistakes = mistakesLeft - 1;
    setMistakesLeft(newMistakes);
    setSelected([]);

    if (newMistakes <= 0) {
      setToast("");
      const remaining = puzzle.groups.filter((g) => !solvedCats.includes(g));
      setTimeout(() => onLose(remaining, solvedCats.length), 200);
    } else if (maxCount === 3) {
      setToast("One away!");
    } else {
      setToast("Not quite — try again.");
    }
  }

  function giveHint() {
    if (hintsUsed >= 3) return;
    const unsolved = puzzle.groups.filter((g) => !solvedCats.includes(g));
    const next = hintsUsed + 1;
    setHintsUsed(next);

    if (unsolved.length === 0) {
      setHintNode("You've already cracked every group — go hit Submit!");
    } else if (next >= 3) {
      setHintNode(
        <>
          Out of hints — here's the rest:
          {unsolved.map((g) => (
            <div key={g.cat}>
              <strong>{g.cat}:</strong> {g.words.join(", ")}
            </div>
          ))}
        </>
      );
    } else {
      const g = unsolved[hintCursor % unsolved.length];
      setHintCursor((c) => c + 1);
      setHintNode(`Hint: one group is "${g.cat}"`);
    }
  }

  return (
    <div
      className="overlay show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="panel">
        <div className="puzzle-header">
          <span className="close-btn" onClick={onClose}>
            &#8592;
          </span>
          <div className="icons">
            <span className={"icon-hint" + (hintsUsed >= 3 ? " disabled" : "")} onClick={giveHint} title="Help me">
              &#128161;
            </span>
            <span>&#128202;</span>
            <span>&#10067;</span>
          </div>
          <span className="puzzle-pill">{puzzle.label}</span>
        </div>
        <p className="puzzle-prompt">Create four groups of four!</p>

        <div className="solved-rows">
          {solvedCats.map((g, i) => (
            <div key={g.cat} className="solved-row" style={{ background: COLORS[i], color: "#20200f" }}>
              <div className="cat">{g.cat}</div>
              <div className="words">{g.words.join(", ")}</div>
            </div>
          ))}
        </div>

        <div className="tiles-grid">
          {curWords.map((word) => (
            <div
              key={word}
              className={"word-tile" + (selected.includes(word) ? " selected" : "")}
              onClick={() => toggleSelect(word)}
            >
              {word}
            </div>
          ))}
        </div>

        <div className="mistakes-row">
          Mistakes Remaining: <Dots count={3} used={3 - mistakesLeft} />
        </div>
        <div className="mistakes-row">
          Hints Remaining: <Dots count={3} used={hintsUsed} hint />
        </div>
        <div className="toast">{toast}</div>
        <div className="hint-text">{hintNode}</div>

        <div className="actions-row">
          <button className="pbtn" onClick={() => setCurWords((w) => shuffle(w))}>
            Shuffle
          </button>
          <button className="pbtn" onClick={() => setSelected([])}>
            Deselect All
          </button>
          <button className="pbtn hint" disabled={hintsUsed >= 3} onClick={giveHint}>
            &#128161; Help Me
          </button>
          <button className="pbtn primary" disabled={selected.length !== 4} onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultOverlay({ result, puzzle, onWatch, onRetry, onClose }) {
  return (
    <div
      className="overlay show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="result-panel">
        {result.kind === "win" && (
          <>
            <h2>Solved!</h2>
            <p>{puzzle.label} is unlocked.</p>
            <div className="passcode-box">{puzzle.passcode}</div>
            <button className="pbtn primary" onClick={onWatch}>
              Watch now
            </button>
          </>
        )}
        {result.kind === "lose-connections" && (
          <>
            <h2>Out of guesses</h2>
            <p>Here's the full answer — give it another go anytime.</p>
            {result.remainingGroups.map((g, i) => (
              <div
                key={g.cat}
                className="solved-row"
                style={{ background: COLORS[result.solvedCount + i], color: "#20200f" }}
              >
                <div className="cat">{g.cat}</div>
                <div className="words">{g.words.join(", ")}</div>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <button className="pbtn primary" onClick={onRetry}>
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function driveEmbedSrc(url) {
  const match = url.match(/\/d\/([^/]+)/);
  const fileId = match ? match[1] : null;
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
}

function PlayerModal({ index, puzzle, onClose }) {
  const videoRef = useRef(null);
  const fileNum = String(index + 1).padStart(2, "0");
  const candidates = ["mp4", "webm", "mov"].map((ext) => `/videos/memory-${fileNum}.${ext}`);
  const [candIdx, setCandIdx] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  const embedSrc = puzzle.videoUrl ? driveEmbedSrc(puzzle.videoUrl) : null;

  function handleError() {
    if (candIdx + 1 < candidates.length) setCandIdx((c) => c + 1);
    else setShowFallback(true);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setShowFallback(false);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }

  return (
    <div
      className="overlay show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="player-panel">
        <div className="player-top">
          <strong>{puzzle.label}</strong>
          <span className="close-btn" style={{ color: "#fff" }} onClick={onClose}>
            &#10005;
          </span>
        </div>
        {embedSrc && (
          <iframe
            className="drive-frame"
            src={embedSrc}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        )}
        {!embedSrc && !showFallback && (
          <video ref={videoRef} controls autoPlay src={candidates[candIdx]} onError={handleError} />
        )}
        {!embedSrc && showFallback && (
          <div className="fallback">
            No video file found at <code>public/videos/memory-{fileNum}.mp4</code>.<br />
            Drop your video in that folder, or pick one for this session:
            <br />
            <input type="file" accept="video/*" onChange={handleFile} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  const [progress, setProgress] = useState(PUBLIC_UNLOCKED_PROGRESS);
  const [hydrated, setHydrated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setProgress({ ...JSON.parse(raw), ...PUBLIC_UNLOCKED_PROGRESS });
    } catch (e) {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORE_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

  function handleWin() {
    const i = activeIndex;
    setProgress((p) => ({ ...p, [i]: true }));
    setActiveIndex(null);
    setResult({ kind: "win", index: i });
  }
  function handleLoseConnections(remainingGroups, solvedCount) {
    const i = activeIndex;
    setActiveIndex(null);
    setResult({ kind: "lose-connections", index: i, remainingGroups, solvedCount });
  }

  function watchNow() {
    const i = result.index;
    setResult(null);
    setPlayerIndex(i);
  }
  function tryAgain() {
    const i = result.index;
    setResult(null);
    setActiveIndex(i);
  }

  const activePuzzle = activeIndex != null ? PUZZLES[activeIndex] : null;
  const unlockedCount = VISIBLE_PUZZLE_INDEXES.filter((index) => progress[index]).length;

  return (
    <>
      <header className="topbar">
        <div className="nav-left">
          <div className="logo">AARUFLIX</div>
        </div>
        <div className="nav-right">
          <span className="icon-btn">&#128269;</span>
          <span className="progress-pill">
            {unlockedCount} / {VISIBLE_PUZZLES.length} unlocked
          </span>
          <span className="icon-btn">&#128276;</span>
          <div className="avatar">A</div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-tag">An AaruFlix Original</div>
          <h1 className="hero-title">The Rookie Marathon</h1>
          <p className="hero-desc">
            Nine tapes. Crack each Connections grid to get the passcode and unlock the clip.
          </p>
          <div className="hero-actions">
            <button
              className="hbtn play"
              onClick={() => document.getElementById("episode-row").scrollIntoView({ behavior: "smooth" })}
            >
              &#9654; Start Unlocking
            </button>
          </div>
        </div>
      </section>

      <main>
        <div className="row-block" id="episode-row">
          <div className="row-scroll">
            {VISIBLE_PUZZLES.map((p) => (
              <EpisodeCard
                key={p.originalIndex}
                puzzle={p}
                unlocked={!!progress[p.originalIndex]}
                onOpen={() =>
                  progress[p.originalIndex] ? setPlayerIndex(p.originalIndex) : setActiveIndex(p.originalIndex)
                }
              />
            ))}
          </div>
        </div>
      </main>

      {activePuzzle && activePuzzle.type === "connections" && (
        <ConnectionsModal
          key={activeIndex}
          puzzle={activePuzzle}
          onClose={() => setActiveIndex(null)}
          onWin={handleWin}
          onLose={handleLoseConnections}
        />
      )}
      {result && (
        <ResultOverlay
          result={result}
          puzzle={PUZZLES[result.index]}
          onWatch={watchNow}
          onRetry={tryAgain}
          onClose={() => setResult(null)}
        />
      )}

      {playerIndex != null && (
        <PlayerModal index={playerIndex} puzzle={PUZZLES[playerIndex]} onClose={() => setPlayerIndex(null)} />
      )}
    </>
  );
}
