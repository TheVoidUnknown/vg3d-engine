import Animation2DComponent from "../core/component/Animation2DComponent";
import Animation3DComponent from "../core/component/Animation3DComponent";
import ComponentRegistry from "../core/componentRegistry/ComponentRegistry";

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