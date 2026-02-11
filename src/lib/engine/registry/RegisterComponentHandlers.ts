import Animation2DComponent from "../core/component/Animation2DComponent";
import Animation3DComponent from "../core/component/Animation3DComponent";
import handleAnimation2DComponent from "../runtime/Animation2DComponentHandler";
import handleAnimation3DComponent from "../runtime/Animation3DComponentHandler";
import RuntimeService from "../services/RuntimeService";

export const HANDLERS = [
  { id: Animation3DComponent.TYPE, callback: handleAnimation3DComponent },
  { id: Animation2DComponent.TYPE, callback: handleAnimation2DComponent }
] as const;

export type ComponentHandlerType = (typeof HANDLERS)[number]['id'];

export default function registerComponentHandlers() {
  RuntimeService.init();
  for (const entry of HANDLERS) {
    const { id, callback } = entry;
    RuntimeService.register(id, callback);
  }
}