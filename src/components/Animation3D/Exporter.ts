import type Animatable from "../../core/animatable/Animatable";
import type { ExportHandler } from "../../core/exportRegistry";

import type Animation3DComponent from "./Animation3DComponent";

const exportAnimation3DComponent: ExportHandler = (
  component: Animation3DComponent,
  target: Animatable
) => {
  return [];
}

export default exportAnimation3DComponent;