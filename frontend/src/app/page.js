"use client";

import { useState, useRef, useCallback } from "react";

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
    icon: "👔",
    desc: "Luxury & authority",
  },
];

const POLL_INTERVAL_MS = 4000;

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

  // ============================================================
  // FILE SELECT
  // ============================================================
  const handleFileChange = useCallback((e) => {
    const selected = Array.from(e.target.files || []);

    // User pressed cancel
    if (selected.length === 0) {
      return;
    }

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

  // ============================================================
  // SUBMIT
  // ============================================================
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

  // ============================================================
  // UNLOCK
  // ============================================================
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

  // ============================================================
  // RESET
  // ============================================================
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

  // ============================================================
  // DOWNLOAD
  // ============================================================
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

  // ============================================================
  // UI
  // ============================================================
  return (
    <main className="hs-main">
      {/* AMBIENT BG ORBS */}
      <div className="hs-orb hs-orb-1" />
      <div className="hs-orb hs-orb-2" />
      <div className="hs-orb hs-orb-3" />

      <div className="hs-container">
        {/* HEADER */}
        <header className="hs-header">
          <div className="hs-badge">✦ AI-Powered</div>
          <h1 className="hs-title">
            Professional Headshots
            <span className="hs-title-accent"> in Minutes</span>
          </h1>
          <p className="hs-subtitle">
            Upload 5–10 photos · Choose your style · Get LinkedIn-ready
            portraits
          </p>
        </header>

        {/* UPLOAD STEP */}
        {step === "upload" && (
          <div className="hs-upload-wrapper hs-fadein">
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
                      width="40"
                      height="40"
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
                        <img src={src} alt="" className="hs-preview-thumb" />

                        <div className="hs-preview-check">
                          <svg
                            width="13"
                            height="13"
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
                      Change Photos
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STYLE SELECTOR */}
            <div className="hs-style-section">
              <label className="hs-style-label">Choose your style</label>

              <div className="hs-style-grid">
                <button
                  className={`hs-style-card ${
                    style === "corporate" ? "hs-style-card-active" : ""
                  }`}
                  onClick={() => setStyle("corporate")}
                >
                  <div className="hs-style-icon">🏢</div>

                  <div>
                    <div className="hs-style-title">Corporate</div>

                    <div className="hs-style-desc">Formal & polished</div>
                  </div>
                </button>

                <button
                  className={`hs-style-card ${
                    style === "startup" ? "hs-style-card-active" : ""
                  }`}
                  onClick={() => setStyle("startup")}
                >
                  <div className="hs-style-icon">🚀</div>

                  <div>
                    <div className="hs-style-title">Startup / Tech</div>

                    <div className="hs-style-desc">Modern & casual</div>
                  </div>
                </button>

                <button
                  className={`hs-style-card ${
                    style === "executive" ? "hs-style-card-active" : ""
                  }`}
                  onClick={() => setStyle("executive")}
                >
                  <div className="hs-style-icon">📊</div>

                  <div>
                    <div className="hs-style-title">Executive</div>

                    <div className="hs-style-desc">Luxury & authority</div>
                  </div>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="hs-error-box">
                <svg
                  width="16"
                  height="16"
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
              <span>Generate My Headshots</span>
              <svg
                width="18"
                height="18"
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
        )}

        {/* GENERATING */}
        {step === "generating" && (
          <div className="hs-generating hs-fadein">
            <div className="hs-gen-top">
              <div className="hs-gen-badge">AI GENERATION IN PROGRESS</div>

              <h2 className="hs-gen-title">
                Creating your professional headshots
              </h2>

              <p className="hs-gen-msg">{statusMsg}</p>
            </div>

            {/* LOADER */}
            <div className="hs-loader-wrap">
              <div className="hs-loader-ring"></div>

              <div className="hs-loader-core">✨</div>
            </div>

            {/* PROGRESS */}
            <div className="-section">
              <div className="hs-progress-head">
                <span>Generation Progress</span>

                <span>{generatedCount}/6</span>
              </div>

              <div className="hs-progress-bar">
                <div
                  className="hs-progress-fill"
                  style={{
                    width: `${(generatedCount / 6) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* LOADING CARDS */}
            <div className="hs-loading-grid">
              {Array.from({
                length: TOTAL_GENERATIONS,
              }).map((_, i) => (
                <div
                  key={i}
                  className={`hs-loading-card ${
                    i < generatedCount ? "hs-loading-card-done" : ""
                  }`}
                >
                  {i < generatedCount ? (
                    <div className="hs-card-done">✓ Ready</div>
                  ) : (
                    <>
                      <div className="hs-shimmer" />

                      <div className="hs-loading-lines">
                        <div className="hs-line"></div>

                        <div className="hs-line short"></div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <p className="hs-gen-hint">Average generation time: 2–4 minutes</p>
          </div>
        )}

        {/* DONE */}
        {step === "done" && (
          <div className="hs-done hs-fadein">
            {/* HEADER */}
            <div className="hs-result-header">
              <div className="hs-result-icon">✓</div>

              <h2 className="hs-result-title">Your headshots are ready</h2>

              <p className="hs-result-sub">
                {generatedImages.length} professional AI-generated portraits
                created
              </p>
            </div>

            {/* UNLOCK PANEL */}
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
                  Unlock Now
                </button>
              </div>
            )}

            {/* SUCCESS */}
            {unlocked && (
              <div className="hs-unlocked-banner">
                ✨ HD images unlocked successfully
              </div>
            )}

            {/* GALLERY */}
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
                      Download Image
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* RESET */}
            <button className="hs-secondary-btn" onClick={reset}>
              Generate More Headshots
            </button>
          </div>
        )}

        {/* ERROR */}
        {step === "error" && (
          <div className="hs-error-state hs-fadein">
            <div className="hs-error-icon">
              <svg
                width="32"
                height="32"
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
            <button className="hs-cta-btn" onClick={reset}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
