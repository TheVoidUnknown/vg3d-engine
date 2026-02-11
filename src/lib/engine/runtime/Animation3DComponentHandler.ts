import AnimationService, { type IAnimationParameters } from "../services/AnimationService";
import type Animation3DComponent from "../core/component/Animation3DComponent";
import Animation3DService from "../services/Animation3DService";
import type { RuntimeHandler } from "../services/RuntimeService";

const _scratchParams3D: IAnimationParameters = {};

const handleAnimation3DComponent: RuntimeHandler = (
  service,
  time,
  component: Animation3DComponent,
  target,
  level,
  theme
) => {
  // Check lifecycle
  if (time < component.spawnTime || time > component.spawnTime + component.lifetime) { return; }

  // Interpolate
  AnimationService.interpolateTracks(
    time, 
    component, 
    component.parentId ? component.parentSettings : undefined, 
    false, 
    _scratchParams3D
  );

  // Check if the component has these tracks, implying the scratchParams has data.
  const hasMove = component.tracks.Move !== undefined;
  const hasRot = component.tracks.Rotation !== undefined;
  const hasScale = component.tracks.Scale !== undefined;

  if ( // If we have Most Of The Things, we're good to push to the stack
    (hasMove || hasRot || hasScale)
    && component.tracks.Color
    && component.mesh 
  ) {
    const matrix = Animation3DService.getWorldMatrix(time, target, level, _scratchParams3D);
    const { color, shade } = Animation3DService.getColorsAt(time, component, theme);

    service.queueMesh(component.mesh, matrix, color, shade);
  }
};

export default handleAnimation3DComponent;