import { ExportRegistry } from "../core/exportRegistry/ExportRegistry";

import { Animation2DComponent } from "../components/Animation2D/Animation2DComponent";
import { exportAnimation2DComponent } from "../components/Animation2D/Exporter";

import { Animation3DComponent } from "../components/Animation3D/Animation3DComponent";
import { exportAnimation3DComponent } from "../components/Animation3D/Exporter";

export const EXPORT_HANDLERS = [
  { id: Animation2DComponent.TYPE, callback: exportAnimation2DComponent },
  { id: Animation3DComponent.TYPE, callback: exportAnimation3DComponent }
] as const;

export type ComponentExporterType = (typeof EXPORT_HANDLERS)[number]['id'];

export function registerExportHandlers() {
  ExportRegistry.init();
  for (const entry of EXPORT_HANDLERS) {
    const { id, callback } = entry;
    ExportRegistry.register(id, callback);
  }
}