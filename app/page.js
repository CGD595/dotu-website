"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

const DZO_TO_ENG_API = "https://chimegd-dotu-api.hf.space";   // dzonglish → english
const ENG_TO_DZO_API = "https://chimegd-nmt-api.hf.space";     // english → dzonglish
const REPO_URL = "https://github.com/aploslab/Dotu-dzonglish-nmt";

const navItems = [
  { label: "Problem", href: "#problem" },
  { label: "Research", href: "#research" },
  { label: "Demo", href: "#demo" },
  { label: "Architecture", href: "#architecture" },
  { label: "Results", href: "#results" },
  { label: "Vision", href: "#vision" },
  { label: "About", href: "#about" },
];

const problemPoints = [
  {
    title: "No standard spelling",
    copy: "Dzonglish is written phonetically in Roman characters, so the same Dzongkha word can appear in many valid digital forms.",
  },
  {
    title: "No prior translation system",
    copy: "The report identifies no existing machine translation system for English and Romanized Dzongkha before Dotu.",
  },
  {
    title: "True low-resource pressure",
    copy: "The model had to learn from a small crowdsourced corpus where every duplicate, typo, and short sentence matters.",
  },
];

const researchFacts = [
  { value: "3,882", label: "raw pairs collected" },
  { value: "3,813", label: "final cleaned pairs" },
  { value: "2,669", label: "training pairs" },
  { value: "572", label: "validation pairs" },
  { value: "572", label: "test pairs" },
  { value: "5", label: "model families" },
];

const researchCards = [
  {
    title: "Crowdsourced corpus",
    copy: "A custom web platform collected everyday conversational pairs across greetings, questions, family, weather, food, directions, and daily activities.",
    metric: "70/15/15 split",
  },
  {
    title: "From-scratch baselines",
    copy: "Seq2Seq GRU, teacher forcing, attention, and a compact Transformer were trained in both translation directions for comparison.",
    metric: "50 epochs",
  },
  {
    title: "Multilingual transfer",
    copy: "Two Helsinki-NLP MarianMT models were fine-tuned: opus-mt-en-mul for EN to DZ and opus-mt-mul-en for DZ to EN.",
    metric: "143M params",
  },
];

const architectureLayers = [
  "Input normalization",
  "Token vocabulary",
  "Encoder states",
  "Attention weights",
  "Decoder beam",
  "Human review",
];

const attentionSourceTokens = ["where", "are", "you", "going", "today"];
const attentionRows = [
  { token: "da ring", gloss: "today", weights: [0.08, 0.06, 0.08, 0.14, 0.92] },
  { token: "choe", gloss: "you", weights: [0.05, 0.08, 0.94, 0.1, 0.06] },
  { token: "ga", gloss: "where", weights: [0.95, 0.12, 0.06, 0.1, 0.05] },
  { token: "tey jo", gloss: "going", weights: [0.12, 0.2, 0.12, 0.9, 0.08] },
];

const resultRows = [
  {
    model: "MarianMT en-mul",
    direction: "English to Dzonglish",
    bleu: 5.24,
    meteor: 21.29,
    chrf: 29.82,
    rouge: 32.05,
    featured: true,
  },
  {
    model: "MarianMT mul-en",
    direction: "Dzonglish to English",
    bleu: 3.59,
    meteor: 17.21,
    chrf: 21.17,
    rouge: 27.11,
    featured: true,
  },
  {
    model: "Seq2Seq + Attention",
    direction: "Dzonglish to English",
    bleu: 1.14,
    meteor: 12.63,
    chrf: 10.12,
    rouge: 22.28,
  },
  {
    model: "Seq2Seq + Attention",
    direction: "English to Dzonglish",
    bleu: 0,
    meteor: 9.58,
    chrf: 12.2,
    rouge: 18.82,
  },
  {
    model: "Transformer",
    direction: "English to Dzonglish",
    bleu: 0,
    meteor: 3.95,
    chrf: 4.9,
    rouge: 3.08,
  },
];

const futureItems = [
  {
    title: "Speech translation",
    copy: "Extend text translation into voice workflows for education, public services, and assistive language access.",
  },
  {
    title: "Mobile-first Dotu",
    copy: "Bring bidirectional Dzonglish AI into the messaging contexts where Roman Dzongkha is already alive.",
  },
  {
    title: "15K+ sentence corpus",
    copy: "Scale crowdsourcing and human review to reduce the primary performance bottleneck identified by the report.",
  },
  {
    title: "Bhutanese NLP ecosystem",
    copy: "Expand toward multilingual Bhutan language tools, standardization support, and sovereign AI infrastructure.",
  },
];

const team = [
  "Ugyen Dendup",
  "Tshering Gyeltshen",
  "Chime Gyeltshen Dorji",
];

const reveal = {
  hidden: { opacity: 0, y: 34 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

function useTilt() {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 180,
    damping: 26,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), {
    stiffness: 180,
    damping: 26,
  });

  const onMouseMove = (event) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    x.set((event.clientX - bounds.left) / bounds.width - 0.5);
    y.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}

function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) return undefined;

    let dotX = 0;
    let dotY = 0;
    let ringX = 0;
    let ringY = 0;
    let frame = 0;

    const move = (event) => {
      dotX = event.clientX;
      dotY = event.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
      }
    };

    const tick = () => {
      ringX += (dotX - ringX) * 0.14;
      ringY += (dotY - ringY) * 0.14;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };

    const enter = () => ringRef.current?.classList.add("is-hovering");
    const leave = () => ringRef.current?.classList.remove("is-hovering");
    const bind = () => {
      document.querySelectorAll("a, button, textarea, [role='button']").forEach((node) => {
        node.addEventListener("mouseenter", enter);
        node.addEventListener("mouseleave", leave);
      });
    };

    bind();
    setTimeout(bind, 900);
    tick();
    window.addEventListener("mousemove", move);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", move);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

const vertexShader = `
  uniform float uTime;
  uniform vec2 uPointer;
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float ridge = sin(pos.x * 1.25 + uTime * 0.58) * 0.26;
    float valley = sin(pos.y * 1.85 - uTime * 0.36) * 0.19;
    float current = sin((pos.x + pos.y) * 0.68 + uPointer.x * 2.0) * 0.16;
    float pulse = sin(length(pos.xy) * 0.95 - uTime * 0.9) * 0.12;
    float lift = ridge + valley + current + pulse;
    pos.z += lift;
    pos.x += uPointer.x * 0.22 * (1.0 - uv.y);
    pos.y += uPointer.y * 0.14 * uv.x;
    vElevation = lift;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    vec3 deep = vec3(0.26, 0.26, 0.28);
    vec3 silver = vec3(0.78, 0.78, 0.82);
    vec3 white = vec3(1.0, 1.0, 1.0);
    float depth = smoothstep(-0.44, 0.44, vElevation);
    vec3 color = mix(deep, silver, depth);
    color = mix(color, white, smoothstep(0.0, 0.22, vUv.y) * 0.18);
    float edge = smoothstep(0.02, 0.24, vUv.y) * smoothstep(1.0, 0.66, vUv.y);
    float alpha = (0.05 + depth * 0.055) * edge;
    gl_FragColor = vec4(color, alpha);
  }
`;

function NeuralField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let cleanup = () => {};
    let cancelled = false;

    async function boot() {
      const markUnavailable = () => {
        canvasRef.current?.classList.add("is-unavailable");
      };

      let THREE;
      try {
        THREE = await import("three");
      } catch (error) {
        markUnavailable();
        return;
      }
      if (cancelled || !canvasRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 1.9, 6.4);
      camera.lookAt(0, -0.4, 0);

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
      } catch (error) {
        markUnavailable();
        return;
      }
      canvasRef.current.classList.remove("is-unavailable");
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const geometry = new THREE.PlaneGeometry(17, 10, 144, 88);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader,
        fragmentShader,
        wireframe: true,
        transparent: true,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI * 0.34;
      mesh.position.set(0, -1.9, 0);
      scene.add(mesh);

      const particlesGeometry = new THREE.BufferGeometry();
      const count = 280;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 12;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
      particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.014,
        color: 0xffffff,
        transparent: true,
        opacity: 0.42,
      });
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      let frame = 0;
      let pointerX = 0;
      let pointerY = 0;
      const clock = new THREE.Clock();

      const resize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      const pointer = (event) => {
        pointerX = event.clientX / window.innerWidth - 0.5;
        pointerY = event.clientY / window.innerHeight - 0.5;
      };

      const render = () => {
        const elapsed = clock.getElapsedTime();
        material.uniforms.uTime.value = elapsed;
        material.uniforms.uPointer.value.x += (pointerX - material.uniforms.uPointer.value.x) * 0.04;
        material.uniforms.uPointer.value.y += (-pointerY - material.uniforms.uPointer.value.y) * 0.04;
        mesh.rotation.z = Math.sin(elapsed * 0.16) * 0.03;
        particles.rotation.y = elapsed * 0.018;
        particles.rotation.x = Math.sin(elapsed * 0.09) * 0.03;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };

      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", pointer);
      render();

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", pointer);
        geometry.dispose();
        material.dispose();
        particlesGeometry.dispose();
        particlesMaterial.dispose();
        renderer.dispose();
      };
    }

    boot();

    return () => {
      cancelled = true;
      cleanup();
    };
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
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray(".magnetic").forEach((node) => {
    if (node.dataset.bound === "true") return;
    node.dataset.bound = "true";
    const strength = Number(node.dataset.magnetic || 0.2);
    const move = (event) => {
      const bounds = node.getBoundingClientRect();
      gsap.to(node, {
        x: (event.clientX - bounds.left - bounds.width / 2) * strength,
        y: (event.clientY - bounds.top - bounds.height / 2) * strength,
        duration: 0.4,
        ease: "power3.out",
      });
    };
    const leave = () => {
      gsap.to(node, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.42)" });
    };
    node.addEventListener("mousemove", move);
    node.addEventListener("mouseleave", leave);
  });

  gsap.utils.toArray(".gsap-rise").forEach((node) => {
    gsap.fromTo(
      node,
      { opacity: 0, y: 44 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power4.out",
        scrollTrigger: { trigger: node, start: "top 86%", once: true },
      }
    );
  });

  gsap.utils.toArray(".metric-bar-fill").forEach((node) => {
    gsap.fromTo(
      node,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: { trigger: node, start: "top 88%", once: true },
      }
    );
  });
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <a className="brand" href="#top" aria-label="Dotu home">
        <span className="brand-mark">D</span>
        <span>Dotu</span>
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <ThemeToggle />
        <a className="nav-cta magnetic" data-magnetic="0.18" href="#demo">
          Try demo
        </a>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("theme");
    const saved = window.localStorage.getItem("dotu-theme");
    const next = requested === "light" || saved === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("dotu-theme", next);
  };

  return (
    <button
      className="theme-toggle magnetic"
      data-magnetic="0.12"
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === "light"}
      aria-label={`Switch to ${theme === "light" ? "dark" : "white"} mode`}
    >
      {theme === "light" ? "Dark" : "White"}
    </button>
  );
}

function LanguageNode({ className, title, copy }) {
  return (
    <div className={`language-node ${className}`}>
      <span>{title}</span>
      <strong>{copy}</strong>
    </div>
  );
}

function HeroDemo() {
  const tilt = useTilt();

  return (
    <motion.div
      className="hero-demo glass-panel"
      ref={tilt.ref}
      style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <div className="demo-topbar">
        <div className="traffic">
          <span />
          <span />
          <span />
        </div>
        <strong>Dotu Neural Console</strong>
        <span className="live-pill">Live</span>
      </div>
      <div className="hero-translation">
        <div className="mini-chat source">
          <span>English</span>
          <p>Where are you going today?</p>
        </div>
        <div className="translation-beam" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="mini-chat target">
          <span>Dzonglish</span>
          <p>Da ring choe ga tey jo?</p>
        </div>
      </div>
      <div className="hero-demo-footer">
        <div>
          <span>Model</span>
          <strong>MarianMT</strong>
        </div>
        <div>
          <span>Corpus</span>
          <strong>3,813 pairs</strong>
        </div>
        <div>
          <span>Direction</span>
          <strong>EN {"<->"} DZ</strong>
        </div>
      </div>
    </motion.div>
  );
}

function Hero() {
  const { scrollYProgress } = useScroll();
  const visualY = useTransform(scrollYProgress, [0, 0.32], [0, -90]);
  const copyY = useTransform(scrollYProgress, [0, 0.28], [0, -60]);

  useEffect(() => {
    initGsap();
  }, []);

  return (
    <section className="hero-section" id="top">
      <motion.div className="hero-copy" style={{ y: copyY }}>
        <div className="eyebrow hero-eyebrow">
          Preserving language through AI
        </div>
        <h1>
          The Future of Dzongkha AI
        </h1>
        <p className="hero-subtitle">
          Bidirectional neural translation between English and Dzonglish powered by multilingual AI.
        </p>
        <div className="hero-actions">
          <a className="button button-primary magnetic" data-magnetic="0.26" href="#demo">
            Experience Dotu
          </a>
          <a className="button button-secondary magnetic" data-magnetic="0.18" href="#research">
            Read the research
          </a>
        </div>
      </motion.div>

      <motion.div className="hero-visual" style={{ y: visualY }}>
        <HeroDemo />
        <LanguageNode className="node-english" title="English" copy="source / target" />
        <LanguageNode className="node-dzonglish" title="Dzonglish" copy="Roman Dzongkha" />
      </motion.div>

      <div className="hero-bottom-line">
        <span>First bidirectional English {"<->"} Dzonglish neural translation baseline</span>
        <span>Bhutanese low-resource NLP</span>
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, copy, align = "left" }) {
  return (
    <motion.div
      className={`section-intro ${align === "center" ? "section-intro-center" : ""}`}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      <motion.div className="eyebrow" variants={reveal}>
        {eyebrow}
      </motion.div>
      <motion.h2 variants={reveal}>{title}</motion.h2>
      {copy ? <motion.p variants={reveal}>{copy}</motion.p> : null}
    </motion.div>
  );
}

function Problem() {
  return (
    <section className="section problem-section" id="problem">
      <div className="wrap">
        <SectionIntro
          eyebrow="The problem"
          title="A language used every day, but almost invisible to machine translation."
          copy="Dzonglish reflects how many Bhutanese people actually write online. That practical reality has outpaced available language technology."
          align="center"
        />
        <motion.div
          className="problem-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
        >
          {problemPoints.map((item, index) => (
            <motion.article className="problem-card glass-panel" key={item.title} variants={reveal}>
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </motion.article>
          ))}
        </motion.div>
        <div className="problem-statement gsap-rise">
          <span>No corpus</span>
          <i />
          <span>No standardization</span>
          <i />
          <span>No baseline</span>
          <strong>Dotu creates the first foundation.</strong>
        </div>
      </div>
    </section>
  );
}

function Research() {
  return (
    <section className="section research-section" id="research">
      <div className="wrap">
        <SectionIntro
          eyebrow="The research"
          title="Built from a custom corpus, evaluated like a serious NLP system."
          copy="The report combines dataset creation, preprocessing, five model families, and multilingual transfer learning into the first English-Dzonglish NMT baseline."
        />
        <div className="research-layout">
          <motion.div
            className="research-cards"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {researchCards.map((item) => (
              <motion.article className="research-card glass-panel" key={item.title} variants={reveal}>
                <strong>{item.metric}</strong>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </motion.article>
            ))}
          </motion.div>
          <div className="dataset-panel glass-panel gsap-rise">
            <div className="panel-heading">
              <span>Corpus pipeline</span>
              <strong>3,813 final pairs</strong>
            </div>
            <div className="dataset-flow">
              {researchFacts.map((fact) => (
                <div className="dataset-cell" key={fact.label}>
                  <strong>{fact.value}</strong>
                  <span>{fact.label}</span>
                </div>
              ))}
            </div>
            <div className="preprocess-line">
              <span>normalize</span>
              <span>filter</span>
              <span>deduplicate</span>
              <span>split</span>
              <span>evaluate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductDemo({ onTranslate }) {
  const [text, setText] = useState("Tashi will come.");
  const [output, setOutput] = useState("tashi wong");
  const [direction, setDirection] = useState("eng_to_dzo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const isEnglish = direction === "eng_to_dzo";

  const translate = useCallback(async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      let res, data, translated;

      if (isEnglish) {
        // English → Dzonglish: new NMT API
        res = await fetch(`${ENG_TO_DZO_API}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), target: "dzonglish" }),
        });
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        data = await res.json();
        translated = data.translation || "";
      } else {
        // Dzonglish → English: original API
        res = await fetch(`${DZO_TO_ENG_API}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), direction }),
        });
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        data = await res.json();
        translated = data.output || "";
      }

      setOutput(translated);
      onTranslate({ input: text.trim(), output: translated, direction, time: new Date() });
    } catch (err) {
      setError("The live model is hosted on a free endpoint and may be waking up. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }, [direction, isEnglish, loading, onTranslate, text]);

  const swap = () => {
    setDirection((current) => (current === "eng_to_dzo" ? "dzo_to_eng" : "eng_to_dzo"));
    setText(output || "");
    setOutput(text || "");
    setError("");
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="section demo-section" id="demo">
      <div className="wrap">
        <SectionIntro
          eyebrow="Interactive AI demo"
          title="A futuristic chat interface for real-time bidirectional translation."
          copy="The demo keeps research complexity behind a precise product surface: choose a direction, translate, review the output, and see session memory form below."
          align="center"
        />
        <div className="demo-shell gsap-rise">
          <aside className="demo-rail">
            <div className="rail-brand">
              <span className="brand-mark">D</span>
              <div>
                <strong>Dotu Lab</strong>
                <small>live neural workspace</small>
              </div>
            </div>
            {["Translate", "Attention", "Corpus", "Metrics"].map((item, index) => (
              <button className={index === 0 ? "rail-item active" : "rail-item"} key={item} type="button">
                <span />
                {item}
              </button>
            ))}
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
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={512}
                  spellCheck={false}
                />
              </div>
              <div className="message-row target-message">
                <span>{isEnglish ? "Dzonglish output" : "English output"}</span>
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      className="typing-loader"
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <span />
                      <span />
                      <span />
                    </motion.div>
                  ) : (
                    <motion.p
                      key={output || "empty-output"}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {output || "Translation will appear here."}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="composer-bar">
              <div className="quality-chip">
                <span>transfer layer</span>
                <strong>MarianMT</strong>
              </div>
              {error ? <span className="demo-error">{error}</span> : null}
              <button type="button" className="copy-output" onClick={copy} disabled={!output}>
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                className="button button-primary magnetic"
                data-magnetic="0.18"
                onClick={translate}
                disabled={loading || !text.trim()}
              >
                {loading ? "Translating" : "Run model"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function History({ items }) {
  if (!items.length) return null;

  return (
    <section className="history-section">
      <div className="wrap">
        <div className="history-panel">
          <div className="history-head">
            <span>Session memory</span>
            <strong>{items.length} translations</strong>
          </div>
          <div className="history-list">
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <motion.div
                  className="history-row"
                  key={`${item.time.getTime()}-${index}`}
                  initial={{ opacity: 0, y: 12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -12, height: 0 }}
                  layout
                >
                  <span>{item.direction === "eng_to_dzo" ? "EN -> DZ" : "DZ -> EN"}</span>
                  <p>{item.input}</p>
                  <strong>{item.output}</strong>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section className="section architecture-section" id="architecture">
      <div className="wrap">
        <SectionIntro
          eyebrow="Architecture visualization"
          title="A transformer-inspired language engine with attention at the center."
          copy="The architecture tells the story of two directions, one transfer layer, and a review loop designed for low-resource improvement."
        />
        <div className="architecture-stage gsap-rise">
          <div className="architecture-flow">
            <div className="flow-node">
              <span>EN</span>
              <strong>English</strong>
            </div>
            <div className="transformer-stack">
              {architectureLayers.map((layer, index) => (
                <div className="stack-layer" key={layer} style={{ "--i": index }}>
                  <span>{layer}</span>
                </div>
              ))}
            </div>
            <div className="flow-node saffron-node">
              <span>DZ</span>
              <strong>Dzonglish</strong>
            </div>
          </div>

          <div className="attention-panel">
            <div className="panel-heading">
              <span>attention mechanism</span>
              <strong>source-to-output alignment</strong>
            </div>
            <div
              className="attention-map"
              role="img"
              aria-label="Attention matrix showing which English source tokens influence each Dzonglish output token"
            >
              <div className="attention-corner">DZ / EN</div>
              {attentionSourceTokens.map((token) => (
                <div className="attention-source" key={token}>
                  {token}
                </div>
              ))}
              {attentionRows.map((row) => (
                <div className="attention-row" key={row.token}>
                  <div className="attention-target">
                    <strong>{row.token}</strong>
                    <span>{row.gloss}</span>
                  </div>
                  {row.weights.map((weight, index) => (
                    <div
                      className={weight > 0.72 ? "attention-cell strong" : "attention-cell"}
                      key={`${row.token}-${attentionSourceTokens[index]}`}
                      style={{ "--weight": weight }}
                      title={`${row.token} attends to ${attentionSourceTokens[index]}: ${Math.round(weight * 100)}%`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <p className="attention-note">
              Each row is a Dzonglish output token. Brighter cells show which English source
              token the decoder is focusing on while generating that word.
            </p>
            <div className="attention-legend" aria-hidden="true">
              <span>low attention</span>
              <i />
              <span>high attention</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyItMatters() {
  return (
    <section className="section matters-section" id="matters">
      <div className="wrap">
        <SectionIntro
          eyebrow="Why it matters"
          title="This is not only translation. It is cultural infrastructure."
          copy="Dotu gives digital form to the way people already communicate, while creating a foundation for low-resource AI research in Bhutan."
          align="center"
        />
        <div className="matters-grid">
          <article className="matter-panel glass-panel gsap-rise">
            <span>01</span>
            <h3>Preserve language digitally</h3>
            <p>Romanized Dzongkha carries daily expression across phones, chats, and social platforms. Dotu treats that lived language as worthy of world-class tools.</p>
          </article>
          <article className="matter-panel glass-panel gsap-rise">
            <span>02</span>
            <h3>Advance low-resource NLP</h3>
            <p>The project establishes a released baseline, dataset, and evaluation path where none existed for English-Dzonglish translation.</p>
          </article>
          <article className="matter-panel glass-panel gsap-rise">
            <span>03</span>
            <h3>Build Bhutanese AI capacity</h3>
            <p>Future language technology can grow from this corpus, this evaluation protocol, and a product experience people can actually use.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

function Results() {
  const maxBleu = 5.24;

  return (
    <section className="section results-section" id="results">
      <div className="wrap">
        <SectionIntro
          eyebrow="Results"
          title="MarianMT transfer is the breakthrough signal."
          copy="The from-scratch models struggled on the small corpus, while multilingual transfer produced the strongest results in both translation directions."
        />
        <div className="results-layout">
          <div className="hero-metrics glass-panel gsap-rise">
            <div className="metric-hero">
              <span>{"Best EN -> DZ BLEU"}</span>
              <strong>5.24</strong>
              <p>MarianMT opus-mt-en-mul</p>
            </div>
            <div className="metric-hero saffron">
              <span>{"Best DZ -> EN BLEU"}</span>
              <strong>3.59</strong>
              <p>MarianMT opus-mt-mul-en</p>
            </div>
          </div>
          <div className="model-results">
            {resultRows.map((row) => (
              <article className={`result-row ${row.featured ? "featured" : ""}`} key={`${row.model}-${row.direction}`}>
                <div className="result-copy">
                  <span>{row.direction}</span>
                  <strong>{row.model}</strong>
                </div>
                <div className="result-metrics">
                  <div>
                    <span>BLEU</span>
                    <strong>{row.bleu.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>METEOR</span>
                    <strong>{row.meteor.toFixed(2)}</strong>
                  </div>
                  <div className="metric-bar">
                    <span className="metric-bar-fill" style={{ "--scale": Math.max(row.bleu / maxBleu, 0.04) }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FutureVision() {
  return (
    <section className="section vision-section" id="vision">
      <div className="wrap">
        <SectionIntro
          eyebrow="Future vision"
          title="From first baseline to a Bhutanese AI ecosystem."
          copy="The next stage is larger, more human, and more native to the way people speak, write, and learn."
          align="center"
        />
        <motion.div
          className="vision-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-110px" }}
        >
          {futureItems.map((item, index) => (
            <motion.article className="vision-card glass-panel" variants={reveal} key={item.title}>
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function AboutUs() {
  return (
    <section className="section about-section" id="about">
      <div className="wrap about-layout">
        <div className="about-copy gsap-rise">
          <div className="eyebrow">About us</div>
          <h2>Built by a Bhutanese AI research team for a language people use every day.</h2>
          <p>
            Dotu was developed as a CSA402 Natural Language Processing project at
            Gyalpozhing College of Information Technology, Royal University of Bhutan.
            The team created the first English-Dzonglish parallel corpus, trained
            multiple neural architectures, and released a baseline for future Bhutanese
            low-resource NLP work.
          </p>
          <p>
            The project is guided by Ms. Tawmo and grounded in one simple belief:
            preserving language through AI should feel as rigorous, beautiful, and
            accessible as any world-class technology platform.
          </p>
        </div>

        <div className="about-panel glass-panel gsap-rise">
          <div className="panel-heading">
            <span>Research artifact</span>
            <strong>Open repository</strong>
          </div>
          <a
            className="repo-card"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open aploslab/Dotu-dzonglish-nmt on GitHub"
          >
            <span>GitHub</span>
            <strong>aploslab/Dotu-dzonglish-nmt</strong>
            <p>Dataset, model code, evaluation scripts, and pretrained checkpoints for the Dotu research system.</p>
          </a>
          <div className="team-list">
            {team.map((member) => (
              <div className="team-row" key={member}>
                <span>{member.split(" ").map((part) => part[0]).join("")}</span>
                <strong>{member}</strong>
              </div>
            ))}
          </div>
          <div className="supervisor-row">
            <span>Supervisor</span>
            <strong>Ms. Tawmo</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="cta-light" aria-hidden="true" />
      <motion.div
        className="final-cta-inner"
        initial={{ opacity: 0, y: 42 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-140px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <span>Help Build the Future of Bhutanese AI</span>
        <h2>Preserve language through systems people can love and trust.</h2>
        <p>
          Dotu is a beginning: a research baseline, a working demo, and a vision for
          language technology shaped by the people who use it every day.
        </p>
        <div className="final-actions">
          <a className="button button-primary magnetic" data-magnetic="0.24" href="#demo">
            Try Dotu
          </a>
          <a
            className="button button-secondary magnetic"
            data-magnetic="0.18"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            View research code
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <a className="brand" href="#top" aria-label="Dotu home">
            <span className="brand-mark">D</span>
            <span>Dotu</span>
          </a>
          <p>
            The first bidirectional English-Dzonglish neural translation system.
            Built at Gyalpozhing College of Information Technology, Royal University of Bhutan.
          </p>
        </div>
        <div>
          <span>Research team</span>
          {team.map((member) => (
            <a href="#about" key={member}>
              {member}
            </a>
          ))}
        </div>
        <div>
          <span>Explore</span>
          <a href="https://huggingface.co/chimegd/dotu-model" target="_blank" rel="noopener noreferrer">
            Hugging Face model
          </a>
          <a href={`${ENG_TO_DZO_API}/docs`} target="_blank" rel="noopener noreferrer">
            EN→DZ API docs
          </a>
          <a href={`${DZO_TO_ENG_API}/docs`} target="_blank" rel="noopener noreferrer">
            DZ→EN API docs
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            GitHub repository
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>Guided by Ms. Tawmo</span>
        <span>Preserving language through AI</span>
      </div>
    </footer>
  );
}

// ── Session ID — generated once per browser, persisted in localStorage ────────
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

// ── Fire-and-forget — log to MongoDB via server API route ────────────────────
function logTranslation(item) {
  const sessionId = getSessionId();
  if (!sessionId) return;
  // fetch is intentionally not awaited — we don't block the UI on logging
  fetch("/api/log-translation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      direction: item.direction,
      input:     item.input,
      output:    item.output,
    }),
  }).catch(() => {
    // Silently ignore — logging failure must never break the translator
  });
}

export default function Home() {
  const [history, setHistory] = useState([]);
  const addHistory = useCallback((item) => {
    setHistory((current) => [item, ...current].slice(0, 5));
    logTranslation(item); // persist to MongoDB in the background
  }, []);

  const pageSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Dotu",
      applicationCategory: "AI Translation System",
      operatingSystem: "Web",
      description:
        "The first bidirectional English-Dzonglish neural translation system for Romanized Dzongkha.",
    }),
    []
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <Cursor />
      <Ambient />
      <NeuralField />
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Research />
        <ProductDemo onTranslate={addHistory} />
        <History items={history} />
        <Architecture />
        <WhyItMatters />
        <Results />
        <FutureVision />
        <AboutUs />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
