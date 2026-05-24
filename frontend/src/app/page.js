"use client";

import { useState, useRef, useCallback } from "react";

import {
  uploadImages,
  startGeneration,
  pollStatus,
  getResults,
  unlockImages,
} from "../lib/api";

const STYLES = [
  { id: "corporate", label: "Corporate" },
  { id: "startup", label: "Startup / Tech" },
  { id: "executive", label: "Executive" },
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

  const fileInputRef = useRef(null);

  const pollRef = useRef(null);

  // ============================================================
  // FILE SELECT
  // ============================================================

  const handleFileChange = useCallback((e) => {
    const selected = Array.from(e.target.files || []);

    setFiles(selected);

    const urls = selected.map((f) => URL.createObjectURL(f));

    setPreviews(urls);

    setErrorMsg("");
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();

    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );

    setFiles(dropped);

    setPreviews(dropped.map((f) => URL.createObjectURL(f)));

    setErrorMsg("");
  }, []);

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

      // UPLOAD

      const uploadResult = await uploadImages(files);

      setSessionId(uploadResult.sessionId);

      setStatusMsg("Starting AI generation…");

      // GENERATE

      await startGeneration(uploadResult.sessionId, style);

      setStatusMsg("AI is generating your headshots...");

      // POLLING

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
              `Generating headshots… ${
                status.generatedCount || 0
              } ready so far`,
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
    <main style={styles.main}>
      <div style={styles.container}>
        {/* HEADER */}

        <header style={styles.header}>
          <h1 style={styles.title}>AI Headshot Generator</h1>

          <p style={styles.subtitle}>
            Upload 5–10 photos and generate professional LinkedIn headshots.
          </p>
        </header>

        {/* UPLOAD STEP */}

        {step === "upload" && (
          <div>
            <div
              style={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
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
                <div>
                  <p style={styles.dropText}>📸 Drop photos here or click</p>

                  <p style={styles.dropHint}>5–10 images</p>
                </div>
              ) : (
                <div style={styles.previewGrid}>
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt="" style={styles.previewThumb} />
                  ))}
                </div>
              )}
            </div>

            {/* STYLE */}

            <div style={styles.section}>
              <label style={styles.label}>Headshot Style</label>

              <div style={styles.styleRow}>
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    style={{
                      ...styles.styleBtn,

                      ...(style === s.id ? styles.styleBtnActive : {}),
                    }}
                    onClick={() => setStyle(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && <p style={styles.error}>{errorMsg}</p>}

            <button style={styles.primaryBtn} onClick={handleSubmit}>
              Generate Headshots
            </button>
          </div>
        )}

        {/* GENERATING */}

        {step === "generating" && (
          <div style={styles.center}>
            <div style={styles.spinner} />

            <p style={styles.statusMsg}>{statusMsg}</p>

            <p style={styles.hint}>{generatedCount} generated so far</p>
          </div>
        )}

        {/* DONE */}

        {step === "done" && (
          <div>
            <div style={styles.successBanner}>
              🎉 {generatedImages.length} headshots ready
            </div>

            {!unlocked && (
              <button style={styles.unlockBtn} onClick={handleUnlock}>
                🔓 Unlock HD Images
              </button>
            )}

            <div style={styles.gallery}>
              {generatedImages.map((img, i) => (
                <div key={i} style={styles.galleryCard}>
                  <img
                    src={unlocked ? img.unlockedUrl : img.previewUrl}
                    alt=""
                    style={styles.galleryImg}
                  />

                  <div style={styles.galleryMeta}>
                    <span style={styles.modelBadge}>{img.model}</span>

                    <button
                      style={styles.downloadBtn}
                      onClick={() =>
                        unlocked
                          ? downloadImage(img.unlockedUrl, i)
                          : alert("Unlock images first")
                      }
                    >
                      ⬇ Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button style={styles.secondaryBtn} onClick={reset}>
              ← Generate New Headshots
            </button>
          </div>
        )}

        {/* ERROR */}

        {step === "error" && (
          <div style={styles.center}>
            <p style={styles.error}>❌ {errorMsg}</p>

            <button style={styles.primaryBtn} onClick={reset}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#0f0f10",
    color: "#fff",
    padding: 40,
    fontFamily: "sans-serif",
  },

  container: {
    maxWidth: 900,
    margin: "0 auto",
  },

  header: {
    textAlign: "center",
    marginBottom: 40,
  },

  title: {
    fontSize: 34,
    fontWeight: 700,
  },

  subtitle: {
    color: "#777",
    marginTop: 10,
  },

  dropzone: {
    border: "2px dashed #333",
    borderRadius: 12,
    padding: 40,
    textAlign: "center",
    background: "#161618",
    cursor: "pointer",
  },

  dropText: {
    fontSize: 18,
  },

  dropHint: {
    color: "#666",
    marginTop: 8,
  },

  previewGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },

  previewThumb: {
    width: 80,
    height: 80,
    objectFit: "cover",
    borderRadius: 8,
  },

  section: {
    marginTop: 30,
  },

  label: {
    marginBottom: 10,
    display: "block",
  },

  styleRow: {
    display: "flex",
    gap: 10,
  },

  styleBtn: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#1f1f22",
    color: "#aaa",
    cursor: "pointer",
  },

  styleBtnActive: {
    background: "#2563eb",
    color: "#fff",
  },

  primaryBtn: {
    width: "100%",
    marginTop: 30,
    padding: 14,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
  },

  unlockBtn: {
    width: "100%",
    marginBottom: 24,
    padding: 14,
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
  },

  secondaryBtn: {
    marginTop: 30,
    padding: "12px 18px",
    borderRadius: 10,
    background: "transparent",
    color: "#888",
    border: "1px solid #333",
    cursor: "pointer",
  },

  error: {
    color: "#f87171",
    marginTop: 16,
  },

  center: {
    textAlign: "center",
    padding: 60,
  },

  spinner: {
    width: 50,
    height: 50,
    border: "4px solid #333",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    margin: "0 auto 20px",
    animation: "spin 1s linear infinite",
  },

  statusMsg: {
    fontSize: 16,
  },

  hint: {
    color: "#666",
    marginTop: 10,
  },

  successBanner: {
    background: "#14532d",
    color: "#86efac",
    padding: 14,
    borderRadius: 10,
    marginBottom: 24,
    textAlign: "center",
  },

  gallery: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 20,
  },

  galleryCard: {
    background: "#161618",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #222",
  },

  galleryImg: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
  },

  galleryMeta: {
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modelBadge: {
    color: "#666",
    fontSize: 12,
  },

  downloadBtn: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "none",
    background: "#1e3a5f",
    color: "#60a5fa",
    cursor: "pointer",
  },
};
