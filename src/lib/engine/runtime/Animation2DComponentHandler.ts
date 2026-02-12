import AnimationService, { type IAnimationParameters } from "../services/AnimationService";
import type Animation2DComponent from "../core/component/Animation2DComponent";
import Animation2DService from "../services/Animation2DService";
import type { RuntimeHandler } from "../services/RuntimeService";
import type { RawRgb } from "../services/ColorService";

const _scratchParams2D: IAnimationParameters = {};
let _scratchColor: RawRgb = [ 1.0, 1.0, 1.0, 1.0 ];

const handleAnimation2DComponent: RuntimeHandler = (
  service,
  time,
  component: Animation2DComponent,
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
    _scratchParams2D,
    component.parentId ? component.parentSettings : undefined, 
    true
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
    const matrix = Animation2DService.getWorldMatrix(time, target, level, _scratchParams2D);
    _scratchColor = Animation2DService.getColorAt(time, component, theme);

    service.queueMesh(component.mesh, matrix, _scratchColor, _scratchColor);
  }
};

export default handleAnimation2DComponent;