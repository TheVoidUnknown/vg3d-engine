import ComponentRegistry from "../core/componentRegistry/ComponentRegistry";

import Animation2DComponent from "../components/Animation2D/Animation2DComponent";
import Animation3DComponent from "../components/Animation3D/Animation3DComponent";

export const COMPONENTS = [
  Animation3DComponent,
  Animation2DComponent
] as const;

export type ComponentNameType = (typeof COMPONENTS)[number]['TYPE'];

export default function registerComponents() {
  ComponentRegistry.init();
  for (const entry of COMPONENTS) {
    ComponentRegistry.register(entry.TYPE, entry);
  }
}