import RuntimeService from "../services/RuntimeService";

import Animation2DComponent from "../components/Animation2D/Animation2DComponent";
import handleAnimation2DComponent from "../components/Animation2D/Handler";

import Animation3DComponent from "../components/Animation3D/Animation3DComponent";
import handleAnimation3DComponent from "../components/Animation3D/Handler";

export const COMPONENT_HANDLERS = [
  { id: Animation3DComponent.TYPE, callback: handleAnimation3DComponent },
  { id: Animation2DComponent.TYPE, callback: handleAnimation2DComponent }
] as const;

export type ComponentHandlerType = (typeof COMPONENT_HANDLERS)[number]['id'];

export default function registerComponentHandlers() {
  RuntimeService.init();
  for (const entry of COMPONENT_HANDLERS) {
    const { id, callback } = entry;
    RuntimeService.register(id, callback);
  }
}