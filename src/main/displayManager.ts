import { screen } from "electron";
import type { DisplayInfo } from "../shared/display";

export function getDisplays(): DisplayInfo[] {
  const all = screen.getAllDisplays();
  const primaryId = screen.getPrimaryDisplay().id;

  return all.map((display) => ({
    id: display.id,
    bounds: display.bounds,
    size: {
      width: display.size.width,
      height: display.size.height
    },
    scaleFactor: display.scaleFactor,
    isPrimary: display.id === primaryId
  }));
}
