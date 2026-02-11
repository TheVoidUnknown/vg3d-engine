import type Keyframe from "../keyframe/Keyframe";

export interface KeyframePair {
  prev: Keyframe;
  next: Keyframe;
}

export type IKeyframeTrack = Keyframe[];