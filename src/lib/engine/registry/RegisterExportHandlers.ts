import exportAnimation2DComponent from "../export/ExportAnimation2DComponent";
import Animation2DComponent from "../core/component/Animation2DComponent";
import ExportRegistry from "../core/exportRegistry/ExportRegistry";

export const HANDLERS = [
  { id: Animation2DComponent.TYPE, callback: exportAnimation2DComponent }
] as const;

export type ComponentExporterType = (typeof HANDLERS)[number]['id'];

export default function registerExportHandlers() {
  ExportRegistry.init();
  for (const entry of HANDLERS) {
    const { id, callback } = entry;
    ExportRegistry.register(id, callback);
  }
}