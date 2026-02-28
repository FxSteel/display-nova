import { useEffect, useMemo, useState } from "react";
import type { DisplayInfo } from "@shared/display";

export default function SetupScreen() {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("Cargando pantallas...");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const list = await window.nova.getDisplays();
        if (!mounted) return;
        setDisplays(list);
        setSelectedId((prev) => prev ?? list[0]?.id ?? null);
        setStatus(list.length ? "Selecciona un monitor" : "No se detectaron monitores");
      } catch (error) {
        console.error(error);
        if (!mounted) return;
        setStatus("Error al cargar los monitores");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedDisplay = useMemo(() => displays.find((display) => display.id === selectedId), [displays, selectedId]);

  const handleOpenOutput = async () => {
    if (!selectedDisplay) return;
    setStatus("Abriendo ventana de Output...");
    try {
      await window.nova.openOutput(selectedDisplay.id);
      setStatus("Output abierto en el monitor seleccionado");
    } catch (error) {
      console.error(error);
      setStatus("No se pudo abrir la ventana de Output");
    }
  };

  return (
    <main className="setup-screen">
      <section className="setup-card">
        <header>
          <h1>NOVA Display — Setup</h1>
          <p>Selecciona el monitor que mostrará la salida en modo kiosk.</p>
        </header>

        <ul className="display-list">
          {displays.map((display) => (
            <li key={display.id} className={display.id === selectedId ? "active" : ""}>
              <label>
                <input
                  type="radio"
                  name="display"
                  value={display.id}
                  checked={display.id === selectedId}
                  onChange={() => setSelectedId(display.id)}
                />
                <div>
                  <strong>
                    Monitor {display.id} {display.isPrimary ? "(Primary)" : ""}
                  </strong>
                  <p>
                    Resolución: {display.size.width} × {display.size.height}
                  </p>
                  <p>ID: {display.id}</p>
                </div>
              </label>
            </li>
          ))}
        </ul>

        <div className="actions">
          <button className="primary" onClick={handleOpenOutput} disabled={!selectedDisplay}>
            Abrir Output (Kiosk)
          </button>
          <p className="status">{status}</p>
        </div>
      </section>
    </main>
  );
}
