import { ComponentRegistry } from "../core/componentRegistry/ComponentRegistry";

import { Animation2DComponent } from "../components/Animation2D/Animation2DComponent";
import { Animation3DComponent } from "../components/Animation3D/Animation3DComponent";

export const COMPONENTS = [
  Animation3DComponent,
  Animation2DComponent
] as const;

export function registerComponents() {
  ComponentRegistry.init();
}