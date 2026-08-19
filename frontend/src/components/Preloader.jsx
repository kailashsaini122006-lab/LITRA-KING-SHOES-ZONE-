import React, { useState, useEffect } from "react";
import lkLogo from "../assets/lk_logo.jpg";

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const increment = prev < 60 ? Math.random() * 8 + 3 : Math.random() * 4 + 1;
        return Math.min(prev + increment, 100);
      });
    }, 80);
    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => setPhase("welcome"), 200);
      setTimeout(() => setPhase("fadeout"), 1800);
      setTimeout(() => onComplete(), 2400);
    }
  }, [progress, onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #09090b 0%, #0f0a04 50%, #09090b 100%)",
        transition: phase === "fadeout" ? "opacity 0.6s ease, transform 0.6s ease" : "none",
        opacity: phase === "fadeout" ? 0 : 1,
        transform: phase === "fadeout" ? "scale(1.03)" : "scale(1)",
        pointerEvents: phase === "fadeout" ? "none" : "all",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          animation: "preloader-pulse 2.5s ease-in-out infinite",
        }} />
        <div style={{ position: "absolute", top: "20px", left: "20px", width: "80px", height: "80px", borderTop: "2px solid rgba(245,158,11,0.4)", borderLeft: "2px solid rgba(245,158,11,0.4)", borderRadius: "4px 0 0 0" }} />
        <div style={{ position: "absolute", top: "20px", right: "20px", width: "80px", height: "80px", borderTop: "2px solid rgba(245,158,11,0.4)", borderRight: "2px solid rgba(245,158,11,0.4)", borderRadius: "0 4px 0 0" }} />
        <div style={{ position: "absolute", bottom: "20px", left: "20px", width: "80px", height: "80px", borderBottom: "2px solid rgba(245,158,11,0.4)", borderLeft: "2px solid rgba(245,158,11,0.4)", borderRadius: "0 0 0 4px" }} />
        <div style={{ position: "absolute", bottom: "20px", right: "20px", width: "80px", height: "80px", borderBottom: "2px solid rgba(245,158,11,0.4)", borderRight: "2px solid rgba(245,158,11,0.4)", borderRadius: "0 0 4px 0" }} />
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: `${3 + (i % 3)}px`, height: `${3 + (i % 3)}px`,
            borderRadius: "50%",
            background: i % 2 === 0 ? "rgba(245,158,11,0.6)" : "rgba(239,68,68,0.5)",
            left: `${10 + i * 11}%`, top: `${20 + (i % 3) * 20}%`,
            animation: `preloader-float ${2 + i * 0.4}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px", position: "relative", zIndex: 1, padding: "40px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", animation: "preloader-slideUp 0.8s ease forwards" }}>
          <div style={{
            width: "90px", height: "90px",
            background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))",
            border: "1px solid rgba(245,158,11,0.4)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(245,158,11,0.2), inset 0 0 20px rgba(245,158,11,0.05)",
            animation: "preloader-logoGlow 3s ease-in-out infinite",
          }}>
            <img
              src={lkLogo}
              alt="Litra King Logo"
              style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "12px" }}
            />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{
              fontFamily: "'Outfit', sans-serif", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800,
              letterSpacing: "0.1em", margin: 0,
              background: "linear-gradient(135deg, #fff 0%, #fbbf24 50%, #d97706 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              textTransform: "uppercase",
            }}>LITRA KING</h1>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(11px, 2vw, 14px)", fontWeight: 400, letterSpacing: "0.4em", color: "rgba(245,158,11,0.7)", margin: "6px 0 0 0", textTransform: "uppercase" }}>SHOES ZONE</p>
          </div>
        </div>

        <div style={{
          textAlign: "center", transition: "all 0.6s ease",
          opacity: phase === "welcome" || phase === "fadeout" ? 1 : 0,
          transform: phase === "welcome" || phase === "fadeout" ? "translateY(0)" : "translateY(10px)",
          minHeight: "60px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
        }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(18px, 3.5vw, 28px)", fontWeight: 600, color: "#f3f4f6", margin: 0, letterSpacing: "0.05em" }}>
            🙏 Aapka Swagat Hai!
          </p>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(12px, 2vw, 15px)", color: "rgba(245,158,11,0.8)", margin: 0, letterSpacing: "0.1em", fontWeight: 400 }}>
            WELCOME TO LITRA KING SHOES ZONE
          </p>
        </div>

        <div style={{ width: "clamp(240px, 40vw, 360px)", transition: "all 0.5s ease", opacity: phase === "loading" ? 1 : 0, transform: phase === "loading" ? "translateY(0)" : "translateY(5px)" }}>
          <div style={{ width: "100%", height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden", marginBottom: "12px" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)", borderRadius: "2px", transition: "width 0.1s ease", boxShadow: "0 0 10px rgba(245,158,11,0.6)", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "preloader-shimmer 1.2s ease infinite" }} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Loading...</span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "13px", color: "rgba(245,158,11,0.9)", fontWeight: 600 }}>{Math.round(progress)}%</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", opacity: phase === "loading" ? 0.6 : 0, transition: "opacity 0.3s ease" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b", animation: "preloader-dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes preloader-slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes preloader-pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; } 50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; } }
        @keyframes preloader-float { from { transform: translateY(0px) scale(1); opacity: 0.4; } to { transform: translateY(-20px) scale(1.2); opacity: 0.8; } }
        @keyframes preloader-logoGlow { 0%, 100% { box-shadow: 0 0 40px rgba(245,158,11,0.2); } 50% { box-shadow: 0 0 60px rgba(245,158,11,0.5); } }
        @keyframes preloader-dot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1.2); opacity: 1; } }
        @keyframes preloader-shimmer { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
      `}</style>
    </div>
  );
}
