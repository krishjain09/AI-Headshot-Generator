"use client";

import { useState, useRef, useCallback, useEffect } from "react";

import {
  uploadImages,
  startGeneration,
  pollStatus,
  getResults,
  unlockImages,
} from "../lib/api";

const TOTAL_GENERATIONS = 6;

const STYLES = [
  {
    id: "corporate",
    label: "Corporate",
    icon: "🏢",
    desc: "Formal & polished",
  },
  {
    id: "startup",
    label: "Startup / Tech",
    icon: "🚀",
    desc: "Modern & casual",
  },
  {
    id: "executive",
    label: "Executive",
    icon: "📊",
    desc: "Luxury & authority",
  },
];

const POLL_INTERVAL_MS = 4000;

// ── SCAN-LINE HERO CARD ─────────────────────────────────
function AIScanCard() {
  const [phase, setPhase] = useState("idle"); // idle | scanning | done | resetting
  const [scanX, setScanX] = useState(0);
  const animRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let startTime = null;
    const SCAN_DURATION = 1800; // ms for scan line to cross
    const HOLD_DURATION = 2200; // ms to hold AI result
    const RESET_DELAY = 400; // ms before restarting

    function runCycle() {
      // Phase 1: scan forward
      setPhase("scanning");
      setScanX(0);
      startTime = null;

      function animateScan(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / SCAN_DURATION, 1);
        // Ease in-out cubic
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        setScanX(eased * 100);

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animateScan);
        } else {
          // Scan done — hold the AI result
          setScanX(100);
          setPhase("done");
          timeoutRef.current = setTimeout(() => {
            // Phase 2: reset to original
            setPhase("resetting");
            setScanX(0);
            timeoutRef.current = setTimeout(runCycle, RESET_DELAY);
          }, HOLD_DURATION);
        }
      }

      animRef.current = requestAnimationFrame(animateScan);
    }

    // Initial delay before first scan
    timeoutRef.current = setTimeout(runCycle, 800);

    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const isScanning = phase === "scanning" || phase === "done";

  return (
    <div className="hs-showcase-wrap">
      {/* Floating stat */}
      <div className="hs-floating-stat">
        <div className="hs-floating-stat-label">Headshots generated</div>
        <div className="hs-floating-stat-val">1.2M+</div>
        <div className="hs-floating-stat-sub">this month alone</div>
      </div>

      <div className="hs-scan-card">
        {/* Soft glow behind card */}
        <div className="hs-scan-glow" />

        {/* Base: original image */}
        <img
          src="/original.jpg"
          alt="Original photo"
          className="hs-scan-img hs-scan-img-base"
          draggable={false}
        />

        {/* AI result — revealed via clip-path */}
        <img
          src="/eg3.png"
          alt="AI-enhanced headshot"
          className="hs-scan-img hs-scan-img-ai"
          style={{
            clipPath: `inset(0 ${100 - scanX}% 0 0)`,
          }}
          draggable={false}
        />

        {/* Scan line */}
        {phase === "scanning" && (
          <div
            className="hs-scan-line"
            style={{ left: `calc(${scanX}% - 2px)` }}
          >
            <div className="hs-scan-line-glow" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="hs-showcase-overlay">
          <div className="hs-showcase-label">
            {isScanning ? "AI Enhanced" : "Original Photo"}
          </div>
          <div className="hs-showcase-name">
            {isScanning ? "Corporate Portrait" : "Before"}
          </div>
        </div>

        {/* Glass badge */}
        <div
          className={`hs-showcase-badge${phase === "done" ? " hs-badge-active" : ""}`}
        >
          ✦ AI Enhanced
        </div>
      </div>
    </div>
  );
}

// ── SMOOTH SCROLL HELPER ────────────────────────────────
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── EXAMPLES SECTION ────────────────────────────────────
const EXAMPLE_SHOTS = [
  {
    label: "Corporate",
    style: "Business formal, blue suit",
    img: "/eg1.png",
    tag: "Corporate",
  },
  {
    label: "LinkedIn",
    style: "Friendly & approachable",
    img: "/eg6.png",
    tag: "LinkedIn",
  },
  {
    label: "Executive",
    style: "Authoritative presence",
    img: "/eg5.png",
    tag: "Executive",
  },
  {
    label: "Startup",
    style: "Modern & tech-forward",
    img: "/eg2.png",
    tag: "Startup",
  },
  {
    label: "Creative",
    style: "Bold & distinctive",
    img: "/eg3.png",
    tag: "Creative",
  },
  {
    label: "Tech",
    style: "Modern & innovation-focused",
    img: "/eg7.png",
    tag: "Tech",
  },
];

function ExamplesSection() {
  return (
    <section id="examples" className="hs-landing-section">
      <div className="hs-section-container">
        <div className="hs-section-header">
          <div className="hs-eyebrow-pill">Gallery</div>
          <h2 className="hs-section-display-title">
            Headshots that open <em>doors</em>
          </h2>
          <p className="hs-section-display-sub">
            Our AI crafts polished, professional portraits for every industry,
            role, and platform — no studio required.
          </p>
        </div>

        <div className="hs-examples-grid">
          {EXAMPLE_SHOTS.map((shot, i) => (
            <div
              className="hs-example-card"
              key={i}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="hs-example-img-wrap">
                <img
                  src={shot.img}
                  alt={shot.label}
                  className="hs-example-img"
                />
                <div className="hs-example-overlay">
                  <span className="hs-example-tag">{shot.tag}</span>
                </div>
                <div className="hs-example-shine" />
              </div>
              <div className="hs-example-footer">
                <div className="hs-example-title">{shot.label}</div>
                <div className="hs-example-style">{shot.style}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Before / After strip */}
        <div className="hs-ba-strip">
          <div className="hs-ba-left">
            <div className="hs-ba-label before">Before</div>
            <img src="/original.jpg" alt="Before" className="hs-ba-img" />
          </div>
          <div className="hs-ba-arrow">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
          <div className="hs-ba-right">
            <div className="hs-ba-label after">AI Enhanced</div>
            <img src="/demo-headshot.jpg" alt="After" className="hs-ba-img" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── HOW IT WORKS SECTION ────────────────────────────────
const STEPS = [
  {
    num: "01",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    title: "Upload your photos",
    desc: "Drop 5–10 clear, front-facing selfies. Our system handles cropping, lighting, and quality checks automatically.",
    detail: "JPG, PNG, HEIC · up to 20 MB each",
  },
  {
    num: "02",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    title: "AI generates your headshots",
    desc: "Our fine-tuned model trains on your face and generates studio-quality portraits in your chosen style — corporate, startup, executive, and more.",
    detail: "Average time: 2–4 minutes",
  },
  {
    num: "03",
    icon: (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    title: "Download & use everywhere",
    desc: "Get full-resolution, watermark-free portraits ready for LinkedIn, resumes, email signatures, websites, and more.",
    detail: "4K resolution · no watermark",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="hs-landing-section hs-hiw-section">
      <div className="hs-section-container">
        <div className="hs-section-header">
          <div className="hs-eyebrow-pill">Process</div>
          <h2 className="hs-section-display-title">
            Studio headshots in <em>three steps</em>
          </h2>
          <p className="hs-section-display-sub">
            From selfie to professional portrait in under five minutes. No
            appointment, no awkward poses, no expensive photographer.
          </p>
        </div>

        <div className="hs-hiw-grid">
          {STEPS.map((step, i) => (
            <div
              className="hs-hiw-card"
              key={i}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="hs-hiw-num">{step.num}</div>
              <div className="hs-hiw-icon-wrap">{step.icon}</div>
              <h3 className="hs-hiw-title">{step.title}</h3>
              <p className="hs-hiw-desc">{step.desc}</p>
              <div className="hs-hiw-detail">{step.detail}</div>
              {i < STEPS.length - 1 && (
                <div className="hs-hiw-connector" aria-hidden="true">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PRICING SECTION ─────────────────────────────────────
const PLANS = [
  {
    name: "Starter",
    price: "19",
    period: "one-time",
    desc: "Perfect for trying out the service",
    features: [
      "20 AI headshots",
      "2 style options",
      "HD resolution (1080p)",
      "48-hour delivery",
      "Email support",
    ],
    cta: "Get started",
    popular: false,
    highlight: false,
  },
  {
    name: "Professional",
    price: "49",
    period: "one-time",
    desc: "The full studio experience",
    features: [
      "100 AI headshots",
      "All 6 styles",
      "4K ultra-resolution",
      "Under 5 min delivery",
      "Background removal",
      "LinkedIn optimization",
      "Priority support",
    ],
    cta: "Get started",
    popular: true,
    highlight: true,
  },
  {
    name: "Team",
    price: "199",
    period: "per month",
    desc: "For companies and growing teams",
    features: [
      "Unlimited headshots",
      "All styles + custom",
      "4K ultra-resolution",
      "Under 5 min delivery",
      "Team management portal",
      "Brand kit integration",
      "Dedicated account manager",
    ],
    cta: "Contact sales",
    popular: false,
    highlight: false,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="hs-landing-section hs-pricing-section">
      <div className="hs-section-container">
        <div className="hs-section-header">
          <div className="hs-eyebrow-pill">Pricing</div>
          <h2 className="hs-section-display-title">
            Simple, transparent <em>pricing</em>
          </h2>
          <p className="hs-section-display-sub">
            No subscriptions, no hidden fees. Pay once, get professional
            headshots that last a lifetime.
          </p>
        </div>

        <div className="hs-pricing-grid">
          {PLANS.map((plan, i) => (
            <div
              key={i}
              className={`hs-pricing-card${plan.highlight ? " hs-pricing-card-featured" : ""}`}
            >
              {plan.popular && (
                <div className="hs-pricing-popular-badge">Most Popular</div>
              )}
              <div className="hs-pricing-header">
                <div className="hs-pricing-name">{plan.name}</div>
                <div className="hs-pricing-desc">{plan.desc}</div>
              </div>
              <div className="hs-pricing-price-row">
                <span className="hs-pricing-currency">$</span>
                <span className="hs-pricing-price">{plan.price}</span>
                <span className="hs-pricing-period">/{plan.period}</span>
              </div>
              <ul className="hs-pricing-features">
                {plan.features.map((feat, j) => (
                  <li key={j} className="hs-pricing-feat">
                    <span className="hs-pricing-check">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
              <button
                className={`hs-pricing-btn${plan.highlight ? " hs-pricing-btn-featured" : ""}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="hs-pricing-footnote">
          All plans include a 100% satisfaction guarantee. Not happy with your
          results? We'll regenerate them free of charge.
        </p>
      </div>
    </section>
  );
}

// ── MAIN PAGE COMPONENT ─────────────────────────────────
export default function Home() {
  const [step, setStep] = useState("upload");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [style, setStyle] = useState("corporate");
  const [sessionId, setSessionId] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedCount, setGeneratedCount] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  // ── FILE SELECT ─────────────────────────────────────
  const handleFileChange = useCallback((e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setFiles(selected);
    const urls = selected.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    setErrorMsg("");
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles(dropped);
    setPreviews(dropped.map((f) => URL.createObjectURL(f)));
    setErrorMsg("");
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  // ── SUBMIT ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (files.length < 5) {
      setErrorMsg("Please select at least 5 photos.");
      return;
    }
    if (files.length > 10) {
      setErrorMsg("Maximum 10 photos allowed.");
      return;
    }

    try {
      setStep("generating");
      setStatusMsg("Uploading your photos…");

      const uploadResult = await uploadImages(files);
      setSessionId(uploadResult.sessionId);
      setStatusMsg("Starting AI generation…");

      await startGeneration(uploadResult.sessionId, style);
      setStatusMsg("AI is generating your headshots...");

      pollRef.current = setInterval(async () => {
        try {
          const status = await pollStatus(uploadResult.sessionId);
          setGeneratedCount(status.generatedCount || 0);

          if (status.status === "completed") {
            clearInterval(pollRef.current);
            const results = await getResults(uploadResult.sessionId);
            setGeneratedImages(results.generatedImages || []);
            setStep("done");
          } else if (status.status === "failed") {
            clearInterval(pollRef.current);
            setErrorMsg(status.error || "Generation failed. Please try again.");
            setStep("error");
          } else {
            setStatusMsg(
              `Generating headshots… ${status.generatedCount || 0} ready so far`,
            );
          }
        } catch {}
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setStep("error");
    }
  };

  // ── UNLOCK ──────────────────────────────────────────
  const handleUnlock = async () => {
    try {
      const result = await unlockImages(sessionId);
      setGeneratedImages((prev) =>
        prev.map((img, index) => ({
          ...img,
          unlockedUrl: result.images[index].originalUrl,
        })),
      );
      setUnlocked(true);
    } catch {
      alert("Failed to unlock images");
    }
  };

  // ── RESET ───────────────────────────────────────────
  const reset = () => {
    clearInterval(pollRef.current);
    setStep("upload");
    setFiles([]);
    setPreviews([]);
    setGeneratedImages([]);
    setSessionId(null);
    setErrorMsg("");
    setStatusMsg("");
    setGeneratedCount(0);
    setUnlocked(false);
  };

  // ── DOWNLOAD ────────────────────────────────────────
  const downloadImage = async (url, index) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `headshot-${index + 1}.jpg`;
      a.click();
    } catch {
      window.open(url, "_blank");
    }
  };

  const scrollToTool = () => {
    document.getElementById("hs-tool")?.scrollIntoView({ behavior: "smooth" });
  };

  // ── RENDER ──────────────────────────────────────────
  return (
    <>
      {/* ── NAVBAR ──────────────────────────────────── */}
      <nav className="hs-nav">
        <a href="/" className="hs-nav-logo">
          <span className="hs-nav-logo-mark">✦</span>
          PortraitAI
        </a>

        <ul className="hs-nav-links">
          <li>
            <a
              href="#examples"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("examples");
              }}
            >
              Examples
            </a>
          </li>
          <li>
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("pricing");
              }}
            >
              Pricing
            </a>
          </li>
          <li>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("how-it-works");
              }}
            >
              How it works
            </a>
          </li>
        </ul>

        <div className="hs-nav-cta">
          <button className="hs-nav-login">Sign in</button>
          <button className="hs-nav-btn" onClick={scrollToTool}>
            Get started
          </button>
        </div>
      </nav>

      <main className="hs-main">
        {/* ── HERO SECTION ────────────────────────── */}
        <section className="hs-hero-section">
          <div className="hs-hero-bg">
            <div className="hs-hero-blob-1" />
            <div className="hs-hero-blob-2" />
          </div>

          <div className="hs-hero-inner">
            {/* LEFT */}
            <div className="hs-hero-left">
              <div className="hs-badge">
                <span className="hs-badge-dot" />
                Trusted by 50,000+ professionals
              </div>

              <h1 className="hs-title">
                Studio-quality{" "}
                <span className="hs-title-accent">headshots,</span>
                <br />
                no photographer needed
              </h1>

              <p className="hs-subtitle">
                Upload a few selfies and our AI generates polished LinkedIn,
                resume, and portfolio portraits — in under 5 minutes.
              </p>

              <div className="hs-hero-actions">
                <button className="hs-primary-btn" onClick={scrollToTool}>
                  Generate my headshots
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <button
                  className="hs-secondary-outline"
                  onClick={() => scrollTo("examples")}
                >
                  See examples
                </button>
              </div>

              <div className="hs-trust-points">
                {[
                  "4K resolution output",
                  "Ready in 5 minutes",
                  "LinkedIn optimized",
                ].map((point) => (
                  <div className="hs-trust-item" key={point}>
                    <span className="hs-check-circle">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {point}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — AI scan animation card */}
            <div className="hs-hero-right">
              <AIScanCard />
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF BAR ────────────────────── */}
        <div className="hs-proof-bar">
          <div className="hs-proof-inner">
            {[
              { num: "50K+", label: "Professionals" },
              null,
              { num: "1.2M+", label: "Headshots created" },
              null,
              { num: "4.9★", label: "Average rating" },
              null,
              { num: "< 3 min", label: "Average delivery" },
            ].map((item, i) =>
              item === null ? (
                <div className="hs-proof-divider" key={i} />
              ) : (
                <div className="hs-proof-item" key={i}>
                  <span className="hs-proof-num">{item.num}</span>
                  <span>{item.label}</span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* ── HOW IT WORKS ────────────────────────── */}
        <HowItWorksSection />

        {/* ── EXAMPLES ────────────────────────────── */}
        <ExamplesSection />

        {/* ── PRICING ─────────────────────────────── */}
        <PricingSection />

        {/* ── TOOL SECTION ────────────────────────── */}
        <div className="hs-container" id="hs-tool">
          {/* ── UPLOAD STEP ─────────────────────── */}
          {step === "upload" && (
            <>
              <div className="hs-tool-section hs-fadein">
                <div className="hs-tool-header">
                  <div className="hs-section-eyebrow">Get started</div>
                  <h2 className="hs-section-title">Upload your photos</h2>
                  <p className="hs-tool-subtitle">
                    Upload 5–10 clear, front-facing photos of yourself. Our AI
                    handles the rest.
                  </p>
                </div>

                <div className="hs-upload-wrapper">
                  {/* DROPZONE */}
                  <div
                    className={`hs-dropzone${isDragging ? " hs-dropzone-active" : ""}${previews.length > 0 ? " hs-dropzone-filled" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />

                    {previews.length === 0 ? (
                      <div className="hs-dropzone-empty">
                        <div className="hs-drop-icon">
                          <svg
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                        <p className="hs-drop-title">Drop your photos here</p>
                        <p className="hs-drop-sub">
                          or <span className="hs-drop-link">browse files</span>
                        </p>
                        <div className="hs-drop-pills">
                          <span className="hs-pill">JPG</span>
                          <span className="hs-pill">PNG</span>
                          <span className="hs-pill">HEIC</span>
                          <span className="hs-pill">5–10 photos</span>
                        </div>
                      </div>
                    ) : (
                      <div className="hs-preview-area">
                        <div className="hs-preview-grid">
                          {previews.map((src, i) => (
                            <div key={i} className="hs-preview-card">
                              <img
                                src={src}
                                alt=""
                                className="hs-preview-thumb"
                              />
                              <div className="hs-preview-check">
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="hs-selected-info">
                          <div className="hs-selected-badge">
                            ✓ {files.length} photos selected
                          </div>
                          <button
                            type="button"
                            className="hs-change-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                          >
                            Change photos
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STYLE SELECTOR */}
                  <div className="hs-style-section">
                    <label className="hs-style-label">Choose your style</label>
                    <div className="hs-style-grid">
                      {STYLES.map((s) => (
                        <button
                          key={s.id}
                          className={`hs-style-card${style === s.id ? " hs-style-card-active" : ""}`}
                          onClick={() => setStyle(s.id)}
                        >
                          <div className="hs-style-icon">{s.icon}</div>
                          <div>
                            <div className="hs-style-title">{s.label}</div>
                            <div className="hs-style-desc">{s.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="hs-error-box">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {errorMsg}
                    </div>
                  )}

                  <button className="hs-cta-btn" onClick={handleSubmit}>
                    <span>Generate Professional Headshots</span>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>

                  <p className="hs-trust-line">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Photos are processed securely and never shared
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── GENERATING ──────────────────────── */}
          {step === "generating" && (
            <div className="hs-generating hs-fadein">
              <div className="hs-gen-top">
                <div className="hs-gen-badge">AI Generation in progress</div>
                <h2 className="hs-gen-title">
                  Creating your professional headshots
                </h2>
                <p className="hs-gen-msg">{statusMsg}</p>
              </div>

              <div className="hs-loader-wrap">
                <div className="hs-loader-ring" />
                <div className="hs-loader-core">✨</div>
              </div>

              <div className="-section">
                <div className="hs-progress-head">
                  <span>Generation progress</span>
                  <span>
                    {generatedCount}/{TOTAL_GENERATIONS}
                  </span>
                </div>
                <div className="hs-progress-bar">
                  <div
                    className="hs-progress-fill"
                    style={{
                      width: `${(generatedCount / TOTAL_GENERATIONS) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="hs-loading-grid">
                {Array.from({ length: TOTAL_GENERATIONS }).map((_, i) => (
                  <div
                    key={i}
                    className={`hs-loading-card${i < generatedCount ? " hs-loading-card-done" : ""}`}
                  >
                    {i < generatedCount ? (
                      <div className="hs-card-done">✓ Ready</div>
                    ) : (
                      <>
                        <div className="hs-shimmer" />
                        <div className="hs-loading-lines">
                          <div className="hs-line" />
                          <div className="hs-line short" />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <p className="hs-gen-hint">
                Average generation time: 2–4 minutes
              </p>
            </div>
          )}

          {/* ── DONE ────────────────────────────── */}
          {step === "done" && (
            <div className="hs-done hs-fadein">
              <div className="hs-result-header">
                <div className="hs-result-icon">✓</div>
                <h2 className="hs-result-title">Your headshots are ready</h2>
                <p className="hs-result-sub">
                  {generatedImages.length} professional AI-generated portraits
                  created
                </p>
              </div>

              {!unlocked && (
                <div className="hs-unlock-panel">
                  <div className="hs-unlock-left">
                    <div className="hs-lock-circle">🔒</div>
                    <div>
                      <div className="hs-unlock-title">Unlock HD Images</div>
                      <div className="hs-unlock-desc">
                        Remove watermark and download full-resolution portraits
                      </div>
                    </div>
                  </div>
                  <button className="hs-unlock-btn" onClick={handleUnlock}>
                    Unlock now
                  </button>
                </div>
              )}

              {unlocked && (
                <div className="hs-unlocked-banner">
                  ✨ HD images unlocked — download below
                </div>
              )}

              <div className="hs-gallery">
                {generatedImages.map((img, i) => (
                  <div key={i} className="hs-gallery-card">
                    <div className="hs-gallery-img-wrap">
                      <img
                        src={unlocked ? img.unlockedUrl : img.previewUrl}
                        alt={`Headshot ${i + 1}`}
                        className="hs-gallery-img"
                      />
                      {!unlocked && (
                        <div className="hs-gallery-lock">🔒 Preview</div>
                      )}
                    </div>
                    <div className="hs-gallery-content">
                      <div className="hs-gallery-top">
                        <span className="hs-model-pill">{img.model}</span>
                        <span className="hs-image-number">#{i + 1}</span>
                      </div>
                      <button
                        className="hs-download-btn"
                        onClick={() =>
                          unlocked
                            ? downloadImage(img.unlockedUrl, i)
                            : alert("Unlock images first")
                        }
                      >
                        Download image
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="hs-secondary-btn" onClick={reset}>
                Generate more headshots
              </button>
            </div>
          )}

          {/* ── ERROR ───────────────────────────── */}
          {step === "error" && (
            <div className="hs-error-state hs-fadein">
              <div className="hs-error-icon">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h2 className="hs-error-title">Something went wrong</h2>
              <p className="hs-error-msg">{errorMsg}</p>
              <button
                className="hs-cta-btn"
                onClick={reset}
                style={{ maxWidth: 320, margin: "0 auto" }}
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
