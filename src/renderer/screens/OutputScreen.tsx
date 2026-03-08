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

function BibleVerseSlide({ slide }: { slide: SlideData }) {
  if (!slide.verseText) return null;

  const fontSizeVw = ((slide.fontSize ?? 80) / 100) * 5;
  const refSizeVw = fontSizeVw * 0.4;
  const align = (slide.textAlign ?? "center") as React.CSSProperties["textAlign"];

  return (
    <div className="slide-content" style={{ textAlign: align }}>
      <p
        className="slide-text"
        style={{
          fontSize: `${fontSizeVw}vw`,
          lineHeight: 1.4
        }}
      >
        {slide.verseText}
      </p>
      <p
        className="bible-reference"
        style={{ fontSize: `${refSizeVw}vw` }}
      >
        {slide.displayReference}
        {slide.bibleVersionName && (
          <span className="bible-version"> ({slide.bibleVersionName})</span>
        )}
      </p>
    </div>
  );
}

function SongSlide({ slide }: { slide: SlideData }) {
  const typo = resolveTypography(slide);
  const fontSizeVw = (typo.fontSize / 100) * 5;

  return (
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
  );
}

export default function OutputScreen() {
  const [slide, setSlide] = useState<SlideData | null>(null);
  const [mode, setMode] = useState<DisplayMode>({ mode: "slide" });
  const [background, setBackground] = useState<SongBackground | null>(null);

  useEffect(() => {
    window.nova.onSlide((data) => {
      // Ignorar bible_verse con verseText vacío (primera entrega)
      if (data.type === "bible_verse" && !data.verseText) return;
      setSlide(data);
      setMode({ mode: "slide" });
    });
    window.nova.onDisplayMode((m) => setMode(m));
    window.nova.onSongBackground((bg) => setBackground(bg));
  }, []);

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

  if (!slide) {
    return (
      <main className="output-screen">
        {bgLayer}
        {hasBg && <div className="bg-overlay" />}
      </main>
    );
  }

  return (
    <main className="output-screen output-slide">
      {slide.type !== "bible_verse" && bgLayer}
      {slide.type !== "bible_verse" && hasBg && <div className="bg-overlay" />}

      {slide.type === "bible_verse"
        ? <BibleVerseSlide slide={slide} />
        : <SongSlide slide={slide} />
      }
    </main>
  );
}
