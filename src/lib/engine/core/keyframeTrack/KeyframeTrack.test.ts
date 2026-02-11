/* 
  FULL DISCLOSURE:

  This test file was generated with the help of a 
  Large Language Model (LLM) to save me lots of time 
  otherwise spent writing the engine itself. Whether
  or not you personally detest the use of these tools,
  it has objectively made the process of making this
  free & open source project significantly faster.

  All code created by said tool was personally checked 
  by me before being pushed to production.
*/

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import KeyframeTrack from './KeyframeTrack';
import type { IKeyframe } from '../keyframe/Keyframe.types';

// Simple mock for Keyframe to keep tests focused on Track logic
vi.mock('../keyframe/Keyframe', () => {
  return {
    default: class MockKeyframe {
      time: number = 0;
      data: number[] = [];
      
      constructor(data?: Partial<IKeyframe>) {
        if (data) Object.assign(this, data);
      }

      static from(data: Partial<IKeyframe>) {
        return new MockKeyframe(data);
      }

      serialize(): IKeyframe {
        return {
          time: this.time,
          data: [...this.data], // Clone array to prevent pollution
        };
      }
    },
  };
});

describe('KeyframeTrack', () => {
  // Sample data for repeatability tests
  const sampleJSON: IKeyframe[] = [
    { time: 10, data: [1, 1, 1] },
    { time: 0, data: [0, 0, 0] }, // Out of order to test auto-sort
    { time: 20, data: [2, 2, 2] },
  ];

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // Deterministic random seed
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Symmetry and Serialization', () => {
    it('should be deeply equal when converting JSON1 -> Class -> JSON2', () => {
      // Arrange
      const json1: IKeyframe[] = [
        { time: 0, data: [0] },
        { time: 10, data: [10] }
      ];

      // Act
      const track = KeyframeTrack.from(json1);
      const json2 = track.serialize();

      // Assert
      expect(json2).toEqual(json1);
    });

    it('should produce identical classes from the same data', () => {
      const track1 = KeyframeTrack.from(sampleJSON);
      const track2 = KeyframeTrack.from(track1.serialize());

      // We compare serialized output to ensure data integrity matches exactly
      expect(track1.serialize()).toEqual(track2.serialize());
      expect(track1.randomSeed).toBe(track2.randomSeed);
    });
  });

  describe('Isolation and Reference Pollution', () => {
    it('should not be affected by mutations to the source input array', () => {
      // Arrange
      const input = [{ time: 0, data: [1] }];
      const track = KeyframeTrack.from(input);

      // Act
      input[0].time = 999;
      input.push({ time: 10, data: [2] });

      // Assert
      const serialized = track.serialize();
      expect(serialized[0].time).toBe(0);
      expect(serialized.length).toBe(1);
    });

    it('should ensure serialized data contains new array references', () => {
      const track = KeyframeTrack.from([{ time: 0, data: [1, 2, 3] }]);
      const json1 = track.serialize();
      
      // Mutate the serialized object
      json1[0].data[0] = 999;

      const json2 = track.serialize();
      // The second serialization should be untouched
      expect(json2[0].data[0]).toBe(1);
    });
  });

  describe('Function of Time (keyframesAt)', () => {
    it('should return default keyframes when empty', () => {
      const track = new KeyframeTrack();
      const { prev, next } = track.keyframesAt(5);
      
      expect(prev.time).toBe(0);
      expect(next.time).toBe(0);
    });

    it('should return the same keyframe for both prev/next if only one exists', () => {
      const track = KeyframeTrack.from([{ time: 10, data: [1] }]);
      const { prev, next } = track.keyframesAt(5);

      expect(prev.time).toBe(10);
      expect(next.time).toBe(10);
    });

    it('should clamp to the last keyframe when timestamp is out of bounds (high)', () => {
      const track = KeyframeTrack.from(sampleJSON); // 0, 10, 20
      const { prev, next } = track.keyframesAt(100);

      expect(prev.time).toBe(20);
      expect(next.time).toBe(20);
    });

    it('should return the first pair when timestamp is out of bounds (low)', () => {
      const track = KeyframeTrack.from(sampleJSON); // 0, 10, 20
      const { prev, next } = track.keyframesAt(-5);

      expect(prev.time).toBe(0);
      expect(next.time).toBe(10);
    });

    it('should find the correct surrounding keyframes using binary search', () => {
      const track = KeyframeTrack.from(sampleJSON); // 0, 10, 20
      
      const mid = track.keyframesAt(15);
      expect(mid.prev.time).toBe(10);
      expect(mid.next.time).toBe(20);

      const exact = track.keyframesAt(10);
      expect(exact.prev.time).toBe(10);
      expect(exact.next.time).toBe(20);
    });
  });

  describe('State Management', () => {
    it('should automatically sort by time when keyframesAt is called on dirty data', () => {
      const track = new KeyframeTrack();
      track.addKeyframe({ time: 20 });
      track.addKeyframe({ time: 5 });
      
      // Before calling keyframesAt, internal order is unsorted
      // (Testing the implementation detail here to verify the 'isDirty' logic)
      expect(track[0].time).toBe(20);

      track.keyframesAt(10);

      // After calling keyframesAt, it should be sorted
      expect(track[0].time).toBe(5);
      expect(track[1].time).toBe(20);
    });

    it('should generate a new random seed on request', () => {
      const track = new KeyframeTrack();
      const seed1 = track.randomSeed;
      
      vi.spyOn(Math, 'random').mockReturnValue(0.1);
      track.refreshRandomSeed();
      
      expect(track.randomSeed).not.toBe(seed1);
    });
  });
});