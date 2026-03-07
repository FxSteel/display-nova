import { useEffect, useState } from "react";
import type { SlideData, DisplayMode } from "@shared/display";

function resolveTypography(slide: SlideData) {
  // songTypography tiene prioridad si existe
  const t = slide.songTypography ?? {};
  return {
    fontSize:      t.fontSize      ?? slide.fontSize      ?? 100,
    lineHeight:    t.lineHeight    ?? slide.lineHeight    ?? 1.2,
    letterSpacing: t.letterSpacing ?? slide.letterSpacing ?? 0,
    fontWeight:    t.fontWeight    ?? slide.fontWeight    ?? 500
  };
}

export default function OutputScreen() {
  const [slide, setSlide] = useState<SlideData | null>(null);
  const [mode, setMode] = useState<DisplayMode>({ mode: "slide" });

  useEffect(() => {
    window.nova.onSlide((data) => {
      setSlide(data);
      setMode({ mode: "slide" });
    });
    window.nova.onDisplayMode((m) => setMode(m));
  }, []);

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
    return <main className="output-screen" />;
  }

  const typo = resolveTypography(slide);
  // fontSize relativo: 100 = 5vw
  const fontSizeVw = (typo.fontSize / 100) * 5;

  return (
    <main className="output-screen output-slide">
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
    </main>
  );
}
