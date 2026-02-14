import ExportRegistry from "../core/exportRegistry/ExportRegistry";

import Animation2DComponent from "../components/Animation2D/Animation2DComponent";
import exportAnimation2DComponent from "../components/Animation2D/Exporter";

export const EXPORT_HANDLERS = [
  { id: Animation2DComponent.TYPE, callback: exportAnimation2DComponent }
] as const;

export type ComponentExporterType = (typeof EXPORT_HANDLERS)[number]['id'];

export default function registerExportHandlers() {
  ExportRegistry.init();
  for (const entry of EXPORT_HANDLERS) {
    const { id, callback } = entry;
    ExportRegistry.register(id, callback);
  }
}