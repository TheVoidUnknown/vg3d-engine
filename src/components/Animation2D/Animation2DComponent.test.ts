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
import Animation2DComponent, { type IAnimation2DData } from './Animation2DComponent';

/**
 * MOCK DATA
 */
const MOCK_ORIGIN = { x: 10, y: 20, z: 30 };
const MOCK_PARENT_SETTINGS = { Move: { enabled: true, offset: 0.1 } };

const MOCK_DATA: IAnimation2DData = {
  type: 'Animation2D',
  parentId: 'parent-123',
  mesh: 'SquareFilled',
  zOffset: -5,
  tracks: {},
  spawnTime: 100,
  lifetime: 500,
  origin: { ...MOCK_ORIGIN },
  parentSettings: MOCK_PARENT_SETTINGS
};

describe('Animation2DComponent', () => {
  describe('Constructor', () => {
    it('should construct with provided data', () => {
      const component = new Animation2DComponent(MOCK_DATA);
      expect(component.zOffset).toBe(MOCK_DATA.zOffset);
      expect(component.origin).toEqual(MOCK_DATA.origin);
      expect(component.spawnTime).toBe(MOCK_DATA.spawnTime);
    });

    it('should prevent input mutation', () => {
      const source = { ...MOCK_DATA, origin: { x: 1, y: 1 } };
      const component = new Animation2DComponent(source);
      
      // Mutate source
      source.origin.x = 999;
      source.zOffset = 999;

      expect(component.origin.x).toBe(1);
      expect(component.zOffset).toBe(-5);
    });

    it('should fallback to safe defaults', () => {
      const component = new Animation2DComponent();
      expect(component.zOffset).toBe(0);
      expect(component.origin).toEqual({ x: 0, y: 0 });
      expect(component.spawnTime).toBe(1);
      expect(component.lifetime).toBe(5);
    });

    it('should not pollute defaults', () => {
      const alpha = new Animation2DComponent();
      const beta = new Animation2DComponent();
      
      alpha.origin.x = 100;
      
      expect(beta.origin.x).toBe(0);
    });
  });

  describe('static from()', () => {
    it('should create instance from static data', () => {
      const instance = Animation2DComponent.from(MOCK_DATA);
      expect(instance).toBeInstanceOf(Animation2DComponent);
    });

    it('should map all properties correctly', () => {
      const instance = Animation2DComponent.from(MOCK_DATA);
      expect(instance.type()).toBe('Animation2D');
      expect(instance.zOffset).toBe(MOCK_DATA.zOffset);
      expect(instance.mesh).toBe(MOCK_DATA.mesh);
      expect(instance.origin).toEqual(MOCK_DATA.origin);
    });

    it('should handle incomplete data', () => {
      const partialData: Partial<IAnimation2DData> = { zOffset: 5 };
      const instance = Animation2DComponent.from(partialData as IAnimation2DData);
      expect(instance.zOffset).toBe(5);
      expect(instance.origin).toEqual({ x: 0, y: 0 }); // Default from init()
    });
  });

  describe('serialize()', () => {
    it('should produce a plain JSON object', () => {
      const component = new Animation2DComponent(MOCK_DATA);
      const serialized = component.serialize();
      expect(typeof serialized).toBe('object');
      expect(serialized.constructor.name).toBe('Object');
      expect(serialized).not.toBeInstanceOf(Animation2DComponent);
    });

    it('should match source data', () => {
      const component = new Animation2DComponent(MOCK_DATA);
      const serialized = component.serialize();
      
      expect(serialized.zOffset).toBe(MOCK_DATA.zOffset);
      expect(serialized.origin).toEqual(MOCK_DATA.origin);
      expect(serialized.spawnTime).toBe(MOCK_DATA.spawnTime);
      expect(serialized.type).toBe('Animation2D');
    });

    it('should prevent reference pollution', () => {
      const component = new Animation2DComponent(MOCK_DATA);
      const serialized = component.serialize();
      
      // Mutate serialized output
      serialized.origin.x = 999;
      if (serialized.parentSettings) serialized.parentSettings.Move!.enabled = true;

      expect(component.origin.x).toBe(MOCK_DATA.origin.x);
      expect(component.parentSettings.Move).toStrictEqual(MOCK_DATA.parentSettings?.Move);
    });
  });

  describe('Round-Trip', () => {
    it('should be identical when created from same data', () => {
      const data = { ...MOCK_DATA };
      const a = Animation2DComponent.from(data);
      const b = Animation2DComponent.from(data);
      expect(a.serialize()).toEqual(b.serialize());
    });

    it('should produce identical JSON from identical instances', () => {
      const a = new Animation2DComponent(MOCK_DATA);
      const b = new Animation2DComponent(MOCK_DATA);
      expect(JSON.stringify(a.serialize())).toBe(JSON.stringify(b.serialize()));
    });

    it('should satisfy the Serialization Cycle', () => {
      const instanceA = new Animation2DComponent(MOCK_DATA);
      const outputA = instanceA.serialize();
      const instanceB = Animation2DComponent.from(outputA);
      const outputB = instanceB.serialize();

      expect(outputA).toEqual(outputB);
    });
  });

  describe('methods', () => {
    it('should reset state with init()', () => {
      const component = new Animation2DComponent(MOCK_DATA);
      component.init();
      
      expect(component.zOffset).toBe(0);
      expect(component.origin).toEqual({ x: 0, y: 0 });
      expect(component.spawnTime).toBe(1);
      expect(Object.keys(component.tracks).length).toBe(0);
    });

    it('should return correct type with type()', () => {
      const component = new Animation2DComponent();
      expect(component.type()).toBe('Animation2D');
      expect(Animation2DComponent.type()).toBe('Animation2D');
    });

    it('should perform no-op with update()', () => {
      const component = new Animation2DComponent();
      expect(() => component.update()).not.toThrow();
    });

    it('should update specific properties with assign()', () => {
      const component = new Animation2DComponent();
      component.assign({ zOffset: 42, mesh: 'Square' as any });
      
      expect(component.zOffset).toBe(42);
      expect(component.mesh).toBe('Square');
      // Ensure others didn't change
      expect(component.spawnTime).toBe(1);
    });

    it('should handle deep cloning in assign()', () => {
      const component = new Animation2DComponent();
      const newOrigin = { x: 25, y: 25 };
      component.assign({ origin: newOrigin });
      
      newOrigin.x = 100; // Mutate source
      expect(component.origin.x).toBe(25);
    });

    it('should handle undefined tracks in assign()', () => {
      const component = new Animation2DComponent(MOCK_DATA);
      const trackCount = Object.keys(component.tracks).length;
      
      component.assign({ tracks: undefined });
      expect(Object.keys(component.tracks).length).toBe(trackCount);
    });

    it('should handle partial parentSettings in assign()', () => {
      const component = new Animation2DComponent();
      const settings = { Scale: { enabled: false, offset: 0 } };
      component.assign({ parentSettings: settings });
      
      expect(component.parentSettings).toEqual(settings);
      expect(component.parentSettings).not.toBe(settings); // Reference check
    });
  });
});