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

import { describe, it, expect } from 'vitest';
import AnimationComponent, { type IAnimationComponent } from './AnimationComponent';
import KeyframeTrack from '../keyframeTrack/KeyframeTrack';

/**
 * MOCK DATA
 */
const MOCK_TRACK_DATA = [
  { time: 0, value: 0 },
  { time: 10, value: 100 }
];

const MOCK_DATA: IAnimationComponent = {
  type: 'Animation',
  parentId: 'parent-123',
  spawnTime: 10,
  lifetime: 60,
  mesh: 'Box' as any,
  parentSettings: {
    Move: { enabled: true, offset: 5 }
  },
  tracks: {
    Move: MOCK_TRACK_DATA as unknown as KeyframeTrack
  }
};

describe('AnimationComponent', () => {
  describe('Constructor', () => {
    it('should construct with provided data', () => {
      const component = new AnimationComponent(MOCK_DATA);
      expect(component.parentId).toBe(MOCK_DATA.parentId);
      expect(component.spawnTime).toBe(MOCK_DATA.spawnTime);
      expect(component.lifetime).toBe(MOCK_DATA.lifetime);
      expect(component.mesh).toBe(MOCK_DATA.mesh);
      expect(component.parentSettings).toEqual(MOCK_DATA.parentSettings);
      expect(component.tracks.Move).toBeInstanceOf(KeyframeTrack);
    });

    it('should prevent input mutation', () => {
      const settings = { Move: { enabled: true, offset: 10 } };
      const data = { ...MOCK_DATA, parentSettings: settings };
      const component = new AnimationComponent(data);

      // Mutate source
      settings.Move.offset = 999;

      expect(component.parentSettings.Move?.offset).toBe(10);
      expect(component.parentSettings.Move?.offset).not.toBe(999);
    });

    it('should fallback to safe defaults', () => {
      const component = new AnimationComponent();
      expect(component.spawnTime).toBe(0);
      expect(component.lifetime).toBe(30);
      expect(component.tracks).toEqual({});
      expect(component.parentSettings).toEqual({});
      expect(component.parentId).toBeUndefined();
    });

    it('should not pollute defaults', () => {
      const alpha = new AnimationComponent();
      const beta = new AnimationComponent();

      alpha.spawnTime = 99;
      alpha.parentSettings.Move = { enabled: true, offset: 1 };

      expect(beta.spawnTime).toBe(0);
      expect(beta.parentSettings).toEqual({});
    });
  });

  describe('static from()', () => {
    it('should create instance from static data', () => {
      const instance = AnimationComponent.from(MOCK_DATA);
      expect(instance).toBeInstanceOf(AnimationComponent);
    });

    it('should map all properties correctly', () => {
      const instance = AnimationComponent.from(MOCK_DATA);
      expect(instance.parentId).toBe(MOCK_DATA.parentId);
      expect(instance.mesh).toBe(MOCK_DATA.mesh);
      expect(instance.spawnTime).toBe(MOCK_DATA.spawnTime);
    });

    it('should handle incomplete data', () => {
      const partialData = { parentId: 'test' } as IAnimationComponent;
      const instance = AnimationComponent.from(partialData);
      expect(instance.parentId).toBe('test');
      expect(instance.lifetime).toBe(30); // Default
    });
  });

  describe('serialize()', () => {
    it('should produce a plain JSON object', () => {
      const component = new AnimationComponent(MOCK_DATA);
      const output = component.serialize();
      expect(output.constructor.name).toBe('Object');
      expect(typeof output.type).toBe('string');
    });

    it('should match source data', () => {
      const component = new AnimationComponent(MOCK_DATA);
      const output = component.serialize();
      // We check properties specifically because KeyframeTrack serialization is internal
      expect(output.parentId).toBe(MOCK_DATA.parentId);
      expect(output.spawnTime).toBe(MOCK_DATA.spawnTime);
      expect(output.lifetime).toBe(MOCK_DATA.lifetime);
      expect(output.parentSettings).toEqual(MOCK_DATA.parentSettings);
    });

    it('should prevent reference pollution', () => {
      const component = new AnimationComponent(MOCK_DATA);
      const output = component.serialize();

      // Mutate output
      if (output.parentSettings.Move) {
        output.parentSettings.Move.offset = 12345;
      }

      expect(component.parentSettings.Move?.offset).toBe(5);
    });
  });

  describe('Round-Trip', () => {
    it('should be identical when created from same data', () => {
      const data = MOCK_DATA;
      const a = AnimationComponent.from(data).serialize();
      const b = AnimationComponent.from(data).serialize();
      expect(a).toEqual(b);
    });

    it('should satisfy the Serialization Cycle', () => {
      const initial = new AnimationComponent(MOCK_DATA);
      const serialized = initial.serialize();
      const restored = AnimationComponent.from(serialized);
      expect(restored.serialize()).toEqual(serialized);
    });
  });

  describe('methods', () => {
    it('should do nothing with update()', () => {
      const component = new AnimationComponent(MOCK_DATA);
      expect(component.update()).toBeUndefined();
    });

    it('should update properties with assign()', () => {
      const component = new AnimationComponent();
      component.assign({ spawnTime: 50, lifetime: 100 });
      expect(component.spawnTime).toBe(50);
      expect(component.lifetime).toBe(100);
    });

    it('should initialize track with createTrack()', () => {
      const component = new AnimationComponent();
      component.createTrack('Rotation' as any);
      expect(component.tracks.Rotation).toBeInstanceOf(KeyframeTrack);
    });

    it('should remove track with deleteTrack()', () => {
      const component = new AnimationComponent(MOCK_DATA);
      expect(component.tracks.Move).toBeDefined();
      component.deleteTrack('Move' as any);
      expect(component.tracks.Move).toBeUndefined();
    });

    it('should create track and add data with addKeyframe()', () => {
      const component = new AnimationComponent();
      const keyframe = { time: 5, data: [ 10 ] };
      component.addKeyframe('Scale' as any, keyframe);

      expect(component.tracks.Scale).toBeDefined();
      const serialized = component.serialize();
      expect(serialized.tracks.Scale?.[0]).toMatchObject(keyframe);
    });

    it('should update mesh with setMesh()', () => {
      const component = new AnimationComponent();
      component.setMesh('Sphere' as any);
      expect(component.mesh).toBe('Sphere');
    });

    it('should initialize and update parenting with setParenting()', () => {
      const component = new AnimationComponent();
      
      // Case 1: Initialize new
      component.setParenting('Move' as any, true);
      expect(component.parentSettings.Move).toEqual({ enabled: true, offset: 0 });

      // Case 2: Update existing
      component.setParenting('Move' as any, false);
      expect(component.parentSettings.Move?.enabled).toBe(false);
    });

    it('should initialize and update offset with setParentOffset()', () => {
      const component = new AnimationComponent();

      // Case 1: Initialize new
      component.setParentOffset('Rotation' as any, 45);
      expect(component.parentSettings.Rotation).toEqual({ enabled: true, offset: 45 });

      // Case 2: Update existing
      component.setParentOffset('Rotation' as any, 90);
      expect(component.parentSettings.Rotation?.offset).toBe(90);
    });

    it('should return this context for chaining on all setter methods', () => {
      const component = new AnimationComponent();
      expect(component.assign({})).toBe(component);
      expect(component.createTrack('Move' as any)).toBe(component);
      expect(component.deleteTrack('Move' as any)).toBe(component);
      expect(component.addKeyframe('Move' as any)).toBe(component);
      expect(component.setMesh('Box' as any)).toBe(component);
      expect(component.setParenting('Move' as any, true)).toBe(component);
      expect(component.setParentOffset('Move' as any, 0)).toBe(component);
    });
  });
});