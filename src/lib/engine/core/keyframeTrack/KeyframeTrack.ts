import Keyframe from "../keyframe/Keyframe";
import type { IKeyframe } from "../keyframe/Keyframe.types";
import type { IKeyframeTrack, KeyframePair } from "./KeyframeTrack.types";

// TODO: Rewrite to just use flat arrays for keyframe data, this has so much overhead
export default class KeyframeTrack extends Array<Keyframe> implements IKeyframeTrack {
  public randomSeed!: number;

  private isDirty: boolean;

  constructor(
    initial?: IKeyframe[]
  ) {
    super();
    this.refreshRandomSeed()
    this.isDirty = true;

    if (initial) {
      initial.forEach((v, i) => this[i] = Keyframe.from(v));
    }

  }

  public static from(keyframes: IKeyframe[]): KeyframeTrack {
    return new KeyframeTrack(keyframes);
  }

  public serialize(): IKeyframeTrack {
    const keyframes: IKeyframe[] = [];
    for (const kf of this) { keyframes.push(kf.serialize()); }

    return keyframes as IKeyframeTrack;
  }

  public refreshRandomSeed() {
    this.randomSeed = Math.floor(Math.random() * 999999);
    for (const kf of this) { kf.refreshRandomSeed(); }
  }

  public sortByTime(): this {
    this.sort((a, b) => a.time - b.time);  
    this.isDirty = false;  
    return this; 
  }

  public addKeyframe(data: Partial<IKeyframe>): this {
    this.push(Keyframe.from(data));
    this.isDirty = true;
    return this;
  }

  public deleteKeyframe(index: number): this {
    if (this[index]) { this.splice(index, 1); }
    this.isDirty = true;
    return this;
  }

  public keyframesAt(
    timestamp: number
  ): KeyframePair {
    // If there are no keyframes, return a default static state
    if (this.length === 0) {
      return { prev: new Keyframe(), next: new Keyframe() };
    }

    // If there is only one keyframe, it's always the current and next
    if (this.length === 1) { return { prev: this[0], next: this[0] }; }

    // Sort keyframes
    if (this.isDirty) { this.sortByTime(); }
    const firstTimestamp = this[0].time;
    const lastTimestamp = this[this.length - 1].time;

    // Handle out-of-bounds timestamps
    if (timestamp >= lastTimestamp) {
      // If timestamp is > last keyframe time, hold the last state
      const lastFrame = this[this.length - 1];
      return { prev: lastFrame, next: lastFrame };
    }

    if (timestamp < firstTimestamp) {
      // If timestamp is before first keyframe, it should start with the first keyframe
      return { prev: this[0], next: this[1] };
    }

    // Perform binary search
    let low = 0;
    let high = this.length - 1;
    let currentIndex = 0;

    while (low <= high) {
      const mid = Math.floor(low + (high - low) / 2);
      const midTimestamp = (this[mid].time || 0);

      if (midTimestamp <= timestamp) {
        currentIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // If 'current' is the last keyframe, 'next' is the same as 'current'.
    // This should not happen due to our OOB check, but it's a safe fallback
    const prev = this[currentIndex];
    const next = this[currentIndex + 1] || prev;

    return { prev, next };
  }
}