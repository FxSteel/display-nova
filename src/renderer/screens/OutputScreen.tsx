import { useEffect, useState } from "react";
import type { SlideData, DisplayMode, SongBackground } from "@shared/display";

function resolveTypography(slide: SlideData) {
  const t = slide.songTypography ?? {};
  return {
    fontSize:      t.fontSize      ?? slide.fontSize      ?? 100,
    lineHeight:    t.lineHeight    ?? slide.lineHeight    ?? 1.2,
    letterSpacing: t.letterSpacing ?? slide.letterSpacing ?? 0,
    fontWeight:    t.fontWeight    ?? slide.fontWeight    ?? 500,
    textAlign:     slide.textAlign ?? "center"
  };
}

export default function OutputScreen() {
  const [slide, setSlide] = useState<SlideData | null>(null);
  const [mode, setMode] = useState<DisplayMode>({ mode: "slide" });
  const [background, setBackground] = useState<SongBackground | null>(null);

  useEffect(() => {
    window.nova.onSlide((data) => {
      setSlide(data);
      setMode({ mode: "slide" });
    });
    window.nova.onDisplayMode((m) => setMode(m));
    window.nova.onSongBackground((bg) => setBackground(bg));
  }, []);

  // Capas de fondo (persisten entre modos)
  const hasBg = background && background.backgroundType !== "none" && background.backgroundUrl;

  const bgLayer = hasBg ? (
    background.backgroundType === "video" ? (
      <video
        key={background.backgroundUrl!}
        className="bg-layer"
        src={background.backgroundUrl!}
        autoPlay
        loop
        muted
        playsInline
      />
    ) : (
      <img key={background.backgroundUrl!} className="bg-layer" src={background.backgroundUrl!} alt="" />
    )
  ) : null;

  if (mode.mode === "clear") {
    return <main className="output-screen" />;
  }

  if (mode.mode === "logo") {
    return (
      <main className="output-screen output-media">
        <img src={mode.logoUrl} alt="" draggable={false} />
      </main>
    );
  }

  if (mode.mode === "announcement") {
    return (
      <main className="output-screen output-media">
        <img src={mode.announcementUrl} alt="" draggable={false} />
      </main>
    );
  }

  // mode === "slide"
  if (!slide) {
    return (
      <main className="output-screen">
        {bgLayer}
        {hasBg && <div className="bg-overlay" />}
      </main>
    );
  }

  const typo = resolveTypography(slide);
  const fontSizeVw = (typo.fontSize / 100) * 5;

  return (
    <main className="output-screen output-slide">
      {bgLayer}
      {hasBg && <div className="bg-overlay" />}

      <div className="slide-content" style={{ textAlign: typo.textAlign as React.CSSProperties["textAlign"] }}>
        {slide.reference && (
          <p className="slide-reference">{slide.reference}</p>
        )}
        <p
          className="slide-text"
          style={{
            fontSize:      `${fontSizeVw}vw`,
            lineHeight:    typo.lineHeight,
            letterSpacing: `${typo.letterSpacing}px`,
            fontWeight:    typo.fontWeight
          }}
        >
          {slide.content}
        </p>
      </div>
    </main>
  );
}
