"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DZO_TO_ENG_API = "https://chimegd-dotu-api.hf.space";
const ENG_TO_DZO_API = "https://chimegd-nmt-api.hf.space";
const REPO_URL = "https://github.com/CGD595/dotu-website";

// ── Data ──────────────────────────────────────────────────────────────────────
const ABOUT_SECTIONS = [
  { key: "overview",  label: "Overview"  },
  { key: "research",  label: "Research"  },
  { key: "results",   label: "Results"   },
  { key: "team",      label: "Team"      },
];

const team = [
  { name: "Ugyen Dendup",          id: "12220095", initials: "UD", role: "NLP Engineer" },
  { name: "Tshering Gyeltshen",    id: "12220091", initials: "TG", role: "ML Researcher" },
  { name: "Chime Gyeltshen Dorji", id: "12220028", initials: "CG", role: "Full-stack & Infra" },
];

const researchFacts = [
  { value: "3,882", label: "raw pairs collected"   },
  { value: "3,813", label: "final cleaned pairs"   },
  { value: "2,669", label: "training pairs"        },
  { value: "572",   label: "validation pairs"      },
  { value: "572",   label: "test pairs"            },
  { value: "5",     label: "model families tested" },
];

const resultRows = [
  { model: "MarianMT en-mul",      direction: "English → Dzonglish", bleu: 5.24, meteor: 21.29, featured: true  },
  { model: "MarianMT mul-en",      direction: "Dzonglish → English", bleu: 3.59, meteor: 17.21, featured: true  },
  { model: "Seq2Seq + Attention",  direction: "Dzonglish → English", bleu: 1.14, meteor: 12.63, featured: false },
  { model: "Seq2Seq + Attention",  direction: "English → Dzonglish", bleu: 0,    meteor: 9.58,  featured: false },
  { model: "Transformer",          direction: "English → Dzonglish", bleu: 0,    meteor: 3.95,  featured: false },
];

// ── Session ID & MongoDB logging ──────────────────────────────────────────────
function getSessionId() {
  if (typeof window === "undefined") return null;
  const KEY = "dotu-session-id";
  let id = localStorage.getItem(KEY);
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

function logTranslation(item) {
  const sessionId = getSessionId();
  if (!sessionId) return;
  fetch("/api/log-translation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, direction: item.direction, input: item.input, output: item.output }),
  }).catch(() => {});
}

// ── Custom cursor ─────────────────────────────────────────────────────────────
function Cursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return;
    let dotX = 0, dotY = 0, ringX = 0, ringY = 0, frame = 0;

    const move = (e) => {
      dotX = e.clientX; dotY = e.clientY;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${dotX}px,${dotY}px,0)`;
    };
    const tick = () => {
      ringX += (dotX - ringX) * 0.14;
      ringY += (dotY - ringY) * 0.14;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ringX}px,${ringY}px,0)`;
      frame = requestAnimationFrame(tick);
    };
    const enter = () => ringRef.current?.classList.add("is-hovering");
    const leave = () => ringRef.current?.classList.remove("is-hovering");
    const bind  = () => {
      document.querySelectorAll("a,button,textarea,[role='button']").forEach(n => {
        n.addEventListener("mouseenter", enter);
        n.addEventListener("mouseleave", leave);
      });
    };
    bind(); setTimeout(bind, 900);
    tick(); window.addEventListener("mousemove", move);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("mousemove", move); };
  }, []);

  return (<><div ref={dotRef} className="cursor-dot" /><div ref={ringRef} className="cursor-ring" /></>);
}

// ── Three.js wave mesh ────────────────────────────────────────────────────────
const vertexShader = `
  uniform float uTime; uniform vec2 uPointer;
  varying float vElevation; varying vec2 vUv;
  void main() {
    vUv = uv; vec3 pos = position;
    float ridge   = sin(pos.x * 1.25 + uTime * 0.58) * 0.26;
    float valley  = sin(pos.y * 1.85 - uTime * 0.36) * 0.19;
    float current = sin((pos.x + pos.y) * 0.68 + uPointer.x * 2.0) * 0.16;
    float pulse   = sin(length(pos.xy) * 0.95 - uTime * 0.9) * 0.12;
    float lift = ridge + valley + current + pulse;
    pos.z += lift;
    pos.x += uPointer.x * 0.22 * (1.0 - uv.y);
    pos.y += uPointer.y * 0.14 * uv.x;
    vElevation = lift;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
const fragmentShader = `
  varying float vElevation; varying vec2 vUv;
  void main() {
    vec3 deep   = vec3(0.26,0.26,0.28);
    vec3 silver = vec3(0.78,0.78,0.82);
    vec3 white  = vec3(1.0,1.0,1.0);
    float depth = smoothstep(-0.44, 0.44, vElevation);
    vec3 color = mix(deep, silver, depth);
    color = mix(color, white, smoothstep(0.0, 0.22, vUv.y) * 0.18);
    float edge  = smoothstep(0.02, 0.24, vUv.y) * smoothstep(1.0, 0.66, vUv.y);
    float alpha = (0.05 + depth * 0.055) * edge;
    gl_FragColor = vec4(color, alpha);
  }
`;

function NeuralField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cleanup = () => {}, cancelled = false;

    async function boot() {
      const mark = () => canvasRef.current?.classList.add("is-unavailable");
      let THREE;
      try { THREE = await import("three"); } catch { mark(); return; }
      if (cancelled || !canvasRef.current) return;

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 1.9, 6.4); camera.lookAt(0, -0.4, 0);

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch { mark(); return; }
      canvasRef.current.classList.remove("is-unavailable");
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const geo = new THREE.PlaneGeometry(17, 10, 144, 88);
      const mat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uPointer: { value: new THREE.Vector2(0, 0) } }, vertexShader, fragmentShader, wireframe: true, transparent: true, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI * 0.34; mesh.position.set(0, -1.9, 0); scene.add(mesh);

      const pg   = new THREE.BufferGeometry();
      const count = 280, pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) { pos[i*3] = (Math.random()-.5)*12; pos[i*3+1] = (Math.random()-.5)*7; pos[i*3+2] = (Math.random()-.5)*4; }
      pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pm       = new THREE.PointsMaterial({ size: 0.014, color: 0xffffff, transparent: true, opacity: 0.42 });
      const particles = new THREE.Points(pg, pm);
      scene.add(particles);

      let frame = 0, px = 0, py = 0;
      const clock   = new THREE.Clock();
      const resize  = () => { camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
      const pointer = (e) => { px = e.clientX/window.innerWidth-.5; py = e.clientY/window.innerHeight-.5; };
      const render  = () => {
        const t = clock.getElapsedTime();
        mat.uniforms.uTime.value = t;
        mat.uniforms.uPointer.value.x += (px  - mat.uniforms.uPointer.value.x) * 0.04;
        mat.uniforms.uPointer.value.y += (-py - mat.uniforms.uPointer.value.y) * 0.04;
        mesh.rotation.z    = Math.sin(t * 0.16) * 0.03;
        particles.rotation.y = t * 0.018;
        particles.rotation.x = Math.sin(t * 0.09) * 0.03;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", pointer);
      render();

      cleanup = () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", pointer); geo.dispose(); mat.dispose(); pg.dispose(); pm.dispose(); renderer.dispose(); };
    }
    boot();
    return () => { cancelled = true; cleanup(); };
  }, []);

  return <canvas className="neural-canvas" ref={canvasRef} aria-hidden="true" />;
}

function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="light-field light-field-a" />
      <div className="light-field light-field-b" />
      <div className="light-sweep" />
      <div className="woven-pattern" />
    </div>
  );
}

async function initGsap() {
  if (typeof window === "undefined") return;
  const { gsap } = await import("gsap");
  gsap.utils.toArray(".magnetic").forEach(node => {
    if (node.dataset.bound === "true") return;
    node.dataset.bound = "true";
    const s = Number(node.dataset.magnetic || 0.2);
    node.addEventListener("mousemove",  (e) => { const b = node.getBoundingClientRect(); gsap.to(node, { x: (e.clientX-b.left-b.width/2)*s, y: (e.clientY-b.top-b.height/2)*s, duration: 0.4, ease: "power3.out" }); });
    node.addEventListener("mouseleave", ()  => gsap.to(node, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.42)" }));
  });
}

// ── Theme toggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const saved = window.localStorage.getItem("dotu-theme");
    const next  = saved === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);
  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("dotu-theme", next);
  };
  return (
    <button className="theme-toggle magnetic" data-magnetic="0.12" type="button" onClick={toggle} aria-label="Toggle theme">
      {theme === "light" ? "Dark" : "White"}
    </button>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ onAbout }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <a className="brand" href="/" aria-label="Dotu home">
        <span className="brand-mark">D</span>
        <span>Dotu</span>
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        <button className="nav-link-btn" type="button" onClick={onAbout}>
          About
        </button>
      </nav>
      <div className="nav-actions">
        <ThemeToggle />
      </div>
    </header>
  );
}

// ── Translator ────────────────────────────────────────────────────────────────
function ProductDemo({ onTranslate }) {
  const [text,      setText]      = useState("Tashi will come.");
  const [output,    setOutput]    = useState("tashi wong");
  const [direction, setDirection] = useState("eng_to_dzo");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [copied,    setCopied]    = useState(false);
  const isEnglish = direction === "eng_to_dzo";

  const translate = useCallback(async () => {
    if (!text.trim() || loading) return;
    setLoading(true); setError("");
    try {
      let res, data, translated;
      if (isEnglish) {
        res        = await fetch(`${ENG_TO_DZO_API}/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.trim(), target: "dzonglish" }) });
        if (!res.ok) throw new Error(`${res.status}`);
        data       = await res.json();
        translated = data.translation || "";
      } else {
        res        = await fetch(`${DZO_TO_ENG_API}/translate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.trim(), direction }) });
        if (!res.ok) throw new Error(`${res.status}`);
        data       = await res.json();
        translated = data.output || "";
      }
      setOutput(translated);
      onTranslate({ input: text.trim(), output: translated, direction, time: new Date() });
    } catch {
      setError("The live model is hosted on a free endpoint and may be waking up. Try again shortly.");
    } finally { setLoading(false); }
  }, [direction, isEnglish, loading, onTranslate, text]);

  const swap = () => {
    setDirection(d => d === "eng_to_dzo" ? "dzo_to_eng" : "eng_to_dzo");
    setText(output || ""); setOutput(text || ""); setError("");
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="demo-shell">
      <aside className="demo-rail">
        <div className="rail-brand">
          <span className="brand-mark">D</span>
          <div><strong>Dotu Lab</strong><small>live neural workspace</small></div>
        </div>
        <button className="rail-item active" type="button">
          <span />Translate
        </button>
      </aside>

      <div className="chat-console">
        <div className="chat-header">
          <div>
            <span>Bidirectional session</span>
            <h3>{isEnglish ? "English to Dzonglish" : "Dzonglish to English"}</h3>
          </div>
          <button className="swap-button magnetic" data-magnetic="0.18" onClick={swap} type="button">
            Swap direction
          </button>
        </div>

        <div className="chat-stream">
          <div className="message-row source-message">
            <span>{isEnglish ? "English source" : "Dzonglish source"}</span>
            <textarea value={text} onChange={e => setText(e.target.value)} maxLength={512} spellCheck={false} />
          </div>
          <div className="message-row target-message">
            <span>{isEnglish ? "Dzonglish output" : "English output"}</span>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div className="typing-loader" key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <span /><span /><span />
                </motion.div>
              ) : (
                <motion.p key={output || "empty"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {output || "Translation will appear here."}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="composer-bar">
          <div className="quality-chip"><span>transfer layer</span><strong>MarianMT</strong></div>
          {error ? <span className="demo-error">{error}</span> : null}
          <button type="button" className="copy-output" onClick={copy} disabled={!output}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" className="button button-primary magnetic" data-magnetic="0.18" onClick={translate} disabled={loading || !text.trim()}>
            {loading ? "Translating" : "Run model"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session history ───────────────────────────────────────────────────────────
function History({ items }) {
  if (!items.length) return null;
  return (
    <div className="history-panel" style={{ marginTop: 14 }}>
      <div className="history-head">
        <span>Session memory</span>
        <strong>{items.length} translations</strong>
      </div>
      <div className="history-list">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.div className="history-row" key={`${item.time.getTime()}-${i}`}
              initial={{ opacity: 0, y: 12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              layout
            >
              <span>{item.direction === "eng_to_dzo" ? "EN → DZ" : "DZ → EN"}</span>
              <p>{item.input}</p>
              <strong>{item.output}</strong>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── About overlay — section content ──────────────────────────────────────────
function OverviewContent() {
  return (
    <div className="ao-section-content">
      <div className="ao-hero-block">
        <p className="ao-eyebrow">Undergraduate Research · CST, Bhutan · 2024</p>
        <h1 className="ao-hero-title">The first bidirectional<br />neural translation system<br />for Dzonglish.</h1>
        <p className="ao-hero-sub">
          Dzonglish is the everyday mixed-code language of Bhutan — a fluid blend of Dzongkha
          and English spoken by millions, yet completely absent from NLP research. Dotu is the
          first machine-translation system ever built for it, in both directions.
        </p>
      </div>

      <div className="ao-card-row">
        <div className="ao-info-card">
          <span className="ao-card-label">Problem</span>
          <p>No translation system existed for Dzonglish. The language's code-switching patterns, agglutinative morphology, and extremely limited digital corpus made it a uniquely hard low-resource NLP challenge.</p>
        </div>
        <div className="ao-info-card">
          <span className="ao-card-label">Approach</span>
          <p>We collected, cleaned, and aligned 3,813 sentence pairs, then fine-tuned MarianMT multilingual models in both directions — shipping two live inference APIs on Hugging Face Spaces.</p>
        </div>
        <div className="ao-info-card">
          <span className="ao-card-label">Impact</span>
          <p>Live translation available 24/7 at this site. Open-source dataset and model weights. Foundation for future Bhutanese NLP work — keyboard apps, government services, education tools.</p>
        </div>
      </div>

      <div className="ao-tech-block">
        <p className="ao-block-label">Technology stack</p>
        <div className="ao-tech-grid">
          {[
            { name: "MarianMT", desc: "Helsinki-NLP multilingual seq2seq transformer" },
            { name: "Hugging Face",  desc: "Model hosting & Spaces inference API" },
            { name: "PyTorch",  desc: "Training framework, CUDA acceleration" },
            { name: "Next.js 14",    desc: "App Router, server components, API routes" },
            { name: "MongoDB Atlas", desc: "Serverless translation logging" },
            { name: "Vercel",        desc: "Edge deployment, CI/CD on push" },
          ].map(t => (
            <div className="ao-tech-pill" key={t.name}>
              <strong>{t.name}</strong>
              <span>{t.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ao-links-block">
        <p className="ao-block-label">Resources</p>
        <div className="ao-links-grid">
          <a className="ao-link-card" href={REPO_URL} target="_blank" rel="noreferrer">
            <span className="ao-link-icon">⌥</span>
            <div>
              <strong>GitHub Repository</strong>
              <span>Source code, dataset, training scripts</span>
            </div>
            <span className="ao-link-arrow">↗</span>
          </a>
          <a className="ao-link-card" href="https://huggingface.co/chimegd" target="_blank" rel="noreferrer">
            <span className="ao-link-icon">◈</span>
            <div>
              <strong>Hugging Face Models</strong>
              <span>Fine-tuned MarianMT weights &amp; Spaces</span>
            </div>
            <span className="ao-link-arrow">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function ResearchContent() {
  const methods = [
    {
      title: "Data Collection",
      body: "We gathered 3,882 English–Dzonglish sentence pairs from Bhutanese social media, conversational transcripts, and curated bilingual sources. After deduplication and quality filtering, 3,813 pairs were retained.",
    },
    {
      title: "Preprocessing Pipeline",
      body: "Tokenisation was handled with a custom Dzonglish-aware tokeniser preserving code-switch boundaries. Pairs were split 70 / 15 / 15 into train / validation / test sets with stratified sampling.",
    },
    {
      title: "Model Selection",
      body: "We benchmarked 5 architectures: Seq2Seq with attention, vanilla Transformer, mBART-50, NLLB-200-distilled, and MarianMT (Helsinki-NLP). MarianMT gave the best BLEU/METEOR trade-off on our small corpus.",
    },
    {
      title: "Fine-tuning",
      body: "MarianMT en-mul (English → Dzonglish) and mul-en (Dzonglish → English) were fine-tuned for 20 epochs each on a single NVIDIA T4 GPU. Learning rate 5e-5, batch size 16, early stopping on validation loss.",
    },
    {
      title: "Evaluation",
      body: "Primary metrics: BLEU-4 and METEOR. We also performed human evaluation on 50 randomly sampled outputs, scoring for fluency (1–5) and adequacy (1–5), revealing that METEOR better correlates with human judgement for code-mixed text.",
    },
  ];

  return (
    <div className="ao-section-content">
      <p className="ao-eyebrow">Methodology</p>
      <h2 className="ao-section-title">How we built it</h2>
      <p className="ao-section-body">
        A low-resource NLP project demands rigorous methodology. Here is the full pipeline
        from raw data to a live production API.
      </p>

      <div className="ao-stats-grid">
        {researchFacts.map(f => (
          <div className="ao-stat" key={f.label}>
            <strong>{f.value}</strong>
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      <div className="ao-method-list">
        {methods.map((m, i) => (
          <div className="ao-method-card" key={m.title}>
            <span className="ao-method-num">0{i + 1}</span>
            <div>
              <strong>{m.title}</strong>
              <p>{m.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsContent() {
  const maxMeteor = Math.max(...resultRows.map(r => r.meteor));
  return (
    <div className="ao-section-content">
      <p className="ao-eyebrow">Benchmarks</p>
      <h2 className="ao-section-title">Model performance</h2>
      <p className="ao-section-body">
        All models were evaluated on a held-out test set of 572 pairs. Featured rows are the
        models powering the live translator above.
      </p>

      <div className="ao-results-table">
        <div className="ao-results-header">
          <span>Model</span>
          <span>Direction</span>
          <span>BLEU-4</span>
          <span>METEOR</span>
          <span className="ao-bar-col">Score</span>
        </div>
        {resultRows.map((r, i) => (
          <div className={`ao-result-row ${r.featured ? "featured" : ""}`} key={i}>
            <strong>{r.model}</strong>
            <span className="ao-direction-tag">{r.direction}</span>
            <span className="ao-score">{r.bleu.toFixed(2)}</span>
            <span className="ao-score">{r.meteor.toFixed(2)}</span>
            <div className="ao-bar-wrap">
              <div className="ao-bar-fill" style={{ width: `${(r.meteor / maxMeteor) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="ao-callout">
        <strong>Key finding</strong>
        <p>
          MarianMT significantly outperforms custom Seq2Seq and Transformer baselines on our
          low-resource corpus. METEOR scores indicate the model captures semantic similarity
          even when exact token overlap (BLEU) is limited — consistent with findings in other
          low-resource code-switching studies.
        </p>
      </div>
    </div>
  );
}

function TeamContent() {
  return (
    <div className="ao-section-content">
      <p className="ao-eyebrow">People</p>
      <h2 className="ao-section-title">Built by students,<br />for Bhutan.</h2>
      <p className="ao-section-body">
        Dotu is a final-year undergraduate research project at the College of Science and
        Technology (CST), Royal University of Bhutan.
      </p>

      <div className="ao-team-grid">
        {team.map(m => (
          <div className="ao-team-card" key={m.id}>
            <div className="ao-avatar">{m.initials}</div>
            <strong>{m.name}</strong>
            <span className="ao-team-role">{m.role}</span>
            <span className="ao-team-id">ID {m.id}</span>
          </div>
        ))}
      </div>

      <div className="ao-supervisor-card">
        <span className="ao-card-label">Supervised by</span>
        <strong>Faculty Supervisor</strong>
        <p>Department of Information Technology, CST · Royal University of Bhutan</p>
      </div>

      <div className="ao-institution-row">
        <div className="ao-institution-badge">
          <strong>CST</strong>
          <span>College of Science &amp; Technology</span>
        </div>
        <div className="ao-institution-badge">
          <strong>RUB</strong>
          <span>Royal University of Bhutan</span>
        </div>
        <div className="ao-institution-badge">
          <strong>2024</strong>
          <span>Academic year</span>
        </div>
      </div>
    </div>
  );
}

// ── About overlay ─────────────────────────────────────────────────────────────
function AboutOverlay({ onClose }) {
  const [activeSection, setActiveSection] = useState("overview");
  const bodyRef = useRef(null);

  // Scroll content to top when switching sections
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [activeSection]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sectionMap = {
    overview: <OverviewContent />,
    research: <ResearchContent />,
    results:  <ResultsContent />,
    team:     <TeamContent />,
  };

  return (
    <motion.div
      className="ao-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* Overlay navbar */}
      <nav className="ao-nav">
        <button className="ao-back" type="button" onClick={onClose} aria-label="Back to translator">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        <div className="ao-nav-brand">
          <span className="ao-nav-mark">D</span>
          <span>Dotu</span>
        </div>

        <div className="ao-nav-tabs">
          {ABOUT_SECTIONS.map(s => (
            <button
              key={s.key}
              type="button"
              className={`ao-nav-tab ${activeSection === s.key ? "active" : ""}`}
              onClick={() => setActiveSection(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Scrollable body */}
      <div className="ao-body" ref={bodyRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {sectionMap[activeSection]}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [showAbout, setShowAbout] = useState(false);
  const [history,   setHistory]   = useState([]);

  const addHistory = useCallback((item) => {
    setHistory(current => [item, ...current].slice(0, 5));
    logTranslation(item);
  }, []);

  useEffect(() => { initGsap(); }, []);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "SoftwareApplication",
        name: "Dotu", applicationCategory: "AI Translation System", operatingSystem: "Web",
        description: "The first bidirectional English-Dzonglish neural translation system.",
      }) }} />

      <Cursor />
      <Ambient />
      <NeuralField />
      <Navbar onAbout={() => setShowAbout(true)} />

      <main className="app-main">
        <div className="app-stage">
          <div className="stage-label">
            <span className="eyebrow">Bidirectional Neural Translation · Bhutan</span>
          </div>
          <ProductDemo onTranslate={addHistory} />
          <History items={history} />
        </div>
      </main>

      <AnimatePresence>
        {showAbout && <AboutOverlay onClose={() => setShowAbout(false)} />}
      </AnimatePresence>
    </>
  );
}
