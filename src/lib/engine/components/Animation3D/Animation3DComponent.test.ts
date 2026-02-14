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

import { describe, it, expect, vi } from 'vitest';
import Animation3DComponent, { type IAnimation3DData } from './Animation3DComponent';
import type { MeshType } from '../../meshes/3D/meshes';

/**
 * MOCK DATA
 */
const MOCK_ORIGIN = { x: 10, y: 20, z: 30 };
const MOCK_PARENT_SETTINGS = { Move: { enabled: true, offset: 0.1 } };

const MOCK_DATA: IAnimation3DData = {
  type: 'Animation3D',
  parentId: 'parent-123',
  mesh: 'Cube',
  tracks: {},
  spawnTime: 100,
  lifetime: 500,
  origin: { ...MOCK_ORIGIN },
  parentSettings: MOCK_PARENT_SETTINGS
};

describe('Animation3DComponent', () => {
  describe('Constructor', () => {
    it('should construct with provided data', () => {
      const component = new Animation3DComponent(MOCK_DATA);
      expect(component.parentId).toBe(MOCK_DATA.parentId);
      expect(component.mesh).toBe(MOCK_DATA.mesh);
      expect(component.origin).toEqual(MOCK_DATA.origin);
      expect(component.spawnTime).toBe(MOCK_DATA.spawnTime);
      expect(component.lifetime).toBe(MOCK_DATA.lifetime);
    });

    it('should prevent input mutation', () => {
      const originRef = { x: 1, y: 1, z: 1 };
      const component = new Animation3DComponent({ origin: originRef });
      
      originRef.x = 999;
      expect(component.origin.x).toBe(1);
    });

    it('should fallback to safe defaults', () => {
      const component = new Animation3DComponent();
      expect(component.origin).toEqual({ x: 0, y: 0, z: 0 });
      expect(component.mesh).toEqual(undefined);
      expect(component.lifetime).toBe(5);
      expect(component.spawnTime).toBe(1);
    });

    it('should not pollute defaults', () => {
      const comp1 = new Animation3DComponent();
      const comp2 = new Animation3DComponent();
      
      comp1.origin.x = 500;
      expect(comp2.origin.x).toBe(0);
    });
  });

  describe('static from()', () => {
    it('should create instance from static data', () => {
      const instance = Animation3DComponent.from(MOCK_DATA);
      expect(instance).toBeInstanceOf(Animation3DComponent);
    });

    it('should map all properties correctly', () => {
      const instance = Animation3DComponent.from(MOCK_DATA);
      expect(instance.origin).toEqual(MOCK_DATA.origin);
      expect(instance.mesh).toBe(MOCK_DATA.mesh);
      expect(instance.parentId).toBe(MOCK_DATA.parentId);
    });

    it('should handle incomplete data', () => {
      // @ts-expect-error - testing partial data via factory
      const instance = Animation3DComponent.from({ mesh: 'Custom' });
      expect(instance.mesh).toBe('Custom');
      expect(instance.origin).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('serialize()', () => {
    it('should produce a plain JSON object', () => {
      const component = new Animation3DComponent(MOCK_DATA);
      const serialized = component.serialize();

      expect(serialized.constructor).toBe(Object);
      expect(typeof serialized.type).toBe('string');
    });

    it('should match source data', () => {
      const component = new Animation3DComponent(MOCK_DATA);
      const serialized = component.serialize();

      expect(serialized.origin).toEqual(MOCK_DATA.origin);
      expect(serialized.mesh).toBe(MOCK_DATA.mesh);
    });

    it('should prevent reference pollution', () => {
      const component = new Animation3DComponent(MOCK_DATA);
      const serialized = component.serialize();
      
      serialized.origin.x = 999;
      expect(component.origin.x).toBe(MOCK_DATA.origin.x);
    });
  });

  describe('Round-Trip', () => {
    it('should be identical when created from same data', () => {
      const data = { ...MOCK_DATA };
      const comp1 = Animation3DComponent.from(data);
      const comp2 = Animation3DComponent.from(data);
      expect(comp1.serialize()).toEqual(comp2.serialize());
    });

    it('should produce identical JSON from identical instances', () => {
      const comp1 = new Animation3DComponent(MOCK_DATA);
      const comp2 = new Animation3DComponent(MOCK_DATA);
      expect(JSON.stringify(comp1.serialize())).toBe(JSON.stringify(comp2.serialize()));
    });

    it('should satisfy the Serialization Cycle', () => {
      const original = new Animation3DComponent(MOCK_DATA);
      const serialized = original.serialize();
      const reconstructed = Animation3DComponent.from(serialized);
      
      // Note: If parentSettings bug exists in source, this will expose it
      expect(reconstructed.serialize()).toEqual(serialized);
    });
  });

  describe('methods', () => {
    it('should return correct type with static type()', () => {
      expect(Animation3DComponent.type()).toBe('Animation3D');
    });

    it('should return correct type with type()', () => {
      const component = new Animation3DComponent();
      expect(component.type()).toBe('Animation3D');
    });

    it('should reset state with init()', () => {
      const component = new Animation3DComponent(MOCK_DATA);
      component.init();
      expect(component.origin).toEqual({ x: 0, y: 0, z: 0 });
      expect(component.mesh).toBe('Cube');
      expect(component.spawnTime).toBe(1);
    });

    it('should do nothing with update()', () => {
      const component = new Animation3DComponent();
      expect(component.update()).toBeUndefined();
    });

    it('should update properties with assign()', () => {
      const component = new Animation3DComponent();
      const newData = { mesh: 'Torus' as MeshType, spawnTime: 99 };
      component.assign(newData);
      expect(component.mesh).toBe('Torus');
      expect(component.spawnTime).toBe(99);
    });

    it('should clone origin object with assign()', () => {
      const component = new Animation3DComponent();
      const newOrigin = { x: 5, y: 5, z: 5 };
      component.assign({ origin: newOrigin });
      
      newOrigin.x = 100;
      expect(component.origin.x).toBe(5);
    });

    it('should correctly assign parentSettings from data with assign()', () => {
      const component = new Animation3DComponent();
      const newSettings = { Scale: { enabled: false, offset: 0 } };
      component.assign({ parentSettings: newSettings });
      
      expect(component.parentSettings).toEqual(newSettings);
    });

    it('should call createTrack for each track with assign()', () => {
      const component = new Animation3DComponent();
      // Spy on the inherited createTrack method
      const spy = vi.spyOn(component, 'createTrack').mockImplementation(() => ({} as unknown as Animation3DComponent));
      
      const tracks = {
        "Move": { id: 't1' } as any,
        "Rotation": { id: 't2' } as any
      };
      
      component.assign({ tracks });
      
      expect(spy).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });
  });
});