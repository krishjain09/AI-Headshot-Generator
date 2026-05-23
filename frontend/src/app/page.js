"use client";
import { useState, useRef, useCallback } from "react";
import { uploadImages, startGeneration, pollStatus, getResults } from "../lib/api";

const STYLES = [
  { id: "corporate", label: "Corporate" },
  { id: "startup", label: "Startup / Tech" },
  { id: "executive", label: "Executive" },
];

const POLL_INTERVAL_MS = 4000;

export default function Home() {
  const [step, setStep] = useState("upload"); // upload | generating | done | error
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [style, setStyle] = useState("corporate");
  const [sessionId, setSessionId] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedCount, setGeneratedCount] = useState(0);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  // ─── File selection ───────────────────────────────────────────────────────
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
      f.type.startsWith("image/")
    );
    setFiles(dropped);
    setPreviews(dropped.map((f) => URL.createObjectURL(f)));
    setErrorMsg("");
  }, []);

  // ─── Start flow ───────────────────────────────────────────────────────────
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

      // 1. Upload
      const uploadResult = await uploadImages(files);
      setSessionId(uploadResult.sessionId);
      setStatusMsg("Starting AI generation…");

      // 2. Generate
      await startGeneration(uploadResult.sessionId, style);
      setStatusMsg("AI is generating your headshots (this takes ~60s)…");

      // 3. Poll
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
              `Generating headshots… ${status.generatedCount || 0} ready so far`
            );
          }
        } catch {
          // polling errors are transient, keep going
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setStep("error");
    }
  };

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
  };

  const downloadImage = async (url, index) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `headshot-${index + 1}.webp`;
      a.click();
    } catch {
      window.open(url, "_blank");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.title}>AI Headshot Generator</h1>
          <p style={styles.subtitle}>
            Upload 5–10 photos and get professional LinkedIn-quality headshots in
            minutes.
          </p>
        </header>

        {/* ── UPLOAD STEP ── */}
        {step === "upload" && (
          <div>
            {/* Drop zone */}
            <div
              style={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              {previews.length === 0 ? (
                <div>
                  <p style={styles.dropText}>📸 Drop photos here or click to browse</p>
                  <p style={styles.dropHint}>5–10 photos · JPEG, PNG, WebP · Max 10MB each</p>
                </div>
              ) : (
                <div style={styles.previewGrid}>
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt="" style={styles.previewThumb} />
                  ))}
                </div>
              )}
            </div>

            {/* Style picker */}
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

            <button
              style={{
                ...styles.primaryBtn,
                opacity: files.length < 5 ? 0.5 : 1,
                cursor: files.length < 5 ? "not-allowed" : "pointer",
              }}
              onClick={handleSubmit}
              disabled={files.length < 5}
            >
              Generate Headshots ({files.length} photo{files.length !== 1 ? "s" : ""} selected)
            </button>
          </div>
        )}

        {/* ── GENERATING STEP ── */}
        {step === "generating" && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={styles.statusMsg}>{statusMsg}</p>
            {generatedCount > 0 && (
              <p style={styles.hint}>✅ {generatedCount} headshot{generatedCount > 1 ? "s" : ""} ready so far…</p>
            )}
            <p style={styles.hint}>
              The AI is working on your photos. This usually takes 60–90 seconds.
            </p>
          </div>
        )}

        {/* ── DONE STEP ── */}
        {step === "done" && (
          <div>
            <div style={styles.successBanner}>
              🎉 {generatedImages.length} headshot{generatedImages.length > 1 ? "s" : ""} ready!
            </div>

            <div style={styles.gallery}>
              {generatedImages.map((img, i) => (
                <div key={img.publicId || i} style={styles.galleryCard}>
                  <img
                    src={img.url}
                    alt={`Headshot ${i + 1}`}
                    style={styles.galleryImg}
                  />
                  <div style={styles.galleryMeta}>
                    <span style={styles.modelBadge}>{img.model}</span>
                    <button
                      style={styles.downloadBtn}
                      onClick={() => downloadImage(img.url, i)}
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

        {/* ── ERROR STEP ── */}
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

// ─── Inline styles (minimal, functional) ─────────────────────────────────────
const styles = {
  main: {
    minHeight: "100vh",
    background: "#0f0f10",
    color: "#e8e8e8",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "40px 16px",
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: 0,
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#888",
    marginTop: 8,
    fontSize: 15,
  },
  dropzone: {
    border: "2px dashed #333",
    borderRadius: 12,
    padding: 40,
    textAlign: "center",
    cursor: "pointer",
    background: "#161618",
    transition: "border-color 0.2s",
    minHeight: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropText: {
    fontSize: 18,
    color: "#aaa",
    margin: 0,
  },
  dropHint: {
    fontSize: 13,
    color: "#555",
    marginTop: 6,
  },
  previewGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  previewThumb: {
    width: 80,
    height: 80,
    objectFit: "cover",
    borderRadius: 8,
    border: "2px solid #222",
  },
  section: {
    marginTop: 28,
  },
  label: {
    display: "block",
    fontSize: 13,
    color: "#777",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  styleRow: {
    display: "flex",
    gap: 10,
  },
  styleBtn: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#1a1a1c",
    color: "#888",
    cursor: "pointer",
    fontSize: 14,
    transition: "all 0.15s",
  },
  styleBtnActive: {
    background: "#2563eb",
    color: "#fff",
    border: "1px solid #2563eb",
  },
  primaryBtn: {
    marginTop: 28,
    width: "100%",
    padding: "14px 24px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    marginTop: 28,
    padding: "10px 20px",
    background: "transparent",
    color: "#888",
    border: "1px solid #333",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
  },
  error: {
    color: "#f87171",
    fontSize: 14,
    marginTop: 12,
  },
  center: {
    textAlign: "center",
    padding: "60px 20px",
  },
  spinner: {
    width: 48,
    height: 48,
    border: "4px solid #222",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite",
    margin: "0 auto 24px",
  },
  statusMsg: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: "#555",
    marginTop: 8,
  },
  successBanner: {
    background: "#14532d",
    color: "#86efac",
    padding: "12px 20px",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 28,
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
    display: "block",
  },
  galleryMeta: {
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modelBadge: {
    fontSize: 11,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  downloadBtn: {
    padding: "5px 12px",
    background: "#1e3a5f",
    color: "#60a5fa",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
  },
};
