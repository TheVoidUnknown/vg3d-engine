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
import Keyframe from './Keyframe';
import type { IKeyframe } from './Keyframe.types';
import type { Easing } from '../easing/Easing.types';

/**
 * MOCK DATA
 */
const MOCK_DATA: IKeyframe = {
  time: 10,
  easing: 'EaseInQuad' as Easing,
  data: [1, 2, 3],
  random: [0.1, 0.2],
  themeId: 'test-theme',
  randomize: 'Linear'
};

const PARTIAL_MOCK: Partial<IKeyframe> = {
  time: 5,
  data: [100]
};

describe('Keyframe', () => {
  describe('Constructor', () => {
    it('should construct with provided data', () => {
      const instance = new Keyframe(MOCK_DATA);
      expect(instance.time).toBe(10);
      expect(instance.easing).toBe('EaseInQuad');
      expect(instance.data).toEqual([1, 2, 3]);
      expect(instance.themeId).toBe('test-theme');
    });

    it('should prevent input mutation', () => {
      const inputData = { ...MOCK_DATA, data: [1, 2, 3] };
      const instance = new Keyframe(inputData);
      
      // Mutate source
      inputData.data.push(4);
      
      expect(instance.data).toEqual([1, 2, 3]);
      expect(instance.data).not.toBe(inputData.data);
    });

    it('should fallback to safe defaults', () => {
      const instance = new Keyframe();
      expect(instance.time).toBe(0);
      expect(instance.easing).toBe('Linear');
      expect(instance.data).toEqual([]);
    });

    it('should not pollute defaults', () => {
      const instanceA = new Keyframe();
      instanceA.data.push(99);
      
      const instanceB = new Keyframe();
      expect(instanceB.data).toEqual([]);
      expect(instanceB.data).not.toBe(instanceA.data);
    });
  });

  describe('static from()', () => {
    it('should create instance from static data', () => {
      const instance = Keyframe.from(MOCK_DATA);
      expect(instance).toBeInstanceOf(Keyframe);
    });

    it('should map all properties correctly', () => {
      const instance = Keyframe.from(MOCK_DATA);
      expect(instance.time).toBe(MOCK_DATA.time);
      expect(instance.easing).toBe(MOCK_DATA.easing);
      expect(instance.data).toEqual(MOCK_DATA.data);
      expect(instance.random).toEqual(MOCK_DATA.random);
      expect(instance.themeId).toBe(MOCK_DATA.themeId);
      expect(instance.randomize).toBe(MOCK_DATA.randomize);
    });

    it('should handle incomplete data', () => {
      const instance = Keyframe.from(PARTIAL_MOCK);
      expect(instance.time).toBe(5);
      expect(instance.easing).toBe('Linear'); // Default
      expect(instance.data).toEqual([100]);
    });
  });

  describe('serialize()', () => {
    it('should produce a plain JSON object', () => {
      const instance = new Keyframe(MOCK_DATA);
      const serialized = instance.serialize();
      
      expect(serialized.constructor.name).toBe('Object');
      expect(typeof (serialized as any).setTime).toBe('undefined');
    });

    it('should match source data', () => {
      const instance = new Keyframe(MOCK_DATA);
      const serialized = instance.serialize();
      
      expect(serialized.time).toBe(MOCK_DATA.time);
      expect(serialized.data).toEqual(MOCK_DATA.data);
      expect(serialized.easing).toBe(MOCK_DATA.easing);
    });

    it('should prevent reference pollution', () => {
      const instance = new Keyframe(MOCK_DATA);
      const serialized = instance.serialize();
      
      // Mutate serialized output
      serialized.data.push(999);
      
      expect(instance.data).toEqual(MOCK_DATA.data);
      expect(instance.data).not.toContain(999);
    });
  });

  describe('Round-Trip', () => {
    it('should be identical when created from same data', () => {
      const instanceA = Keyframe.from(MOCK_DATA);
      const instanceB = Keyframe.from(MOCK_DATA);
      
      expect(instanceA.serialize()).toEqual(instanceB.serialize());
    });

    it('should produce identical JSON from identical instances', () => {
      const instanceA = new Keyframe(MOCK_DATA);
      const instanceB = new Keyframe(MOCK_DATA);
      
      expect(JSON.stringify(instanceA.serialize())).toBe(JSON.stringify(instanceB.serialize()));
    });

    it('should satisfy the Serialization Cycle', () => {
      const originalData = MOCK_DATA;
      const instance = new Keyframe(originalData);
      const output = instance.serialize();
      const roundTripInstance = Keyframe.from(output);
      
      expect(roundTripInstance.serialize()).toEqual(originalData);
    });
  });

  describe('methods', () => {
    it('should update time with setTime()', () => {
      const instance = new Keyframe();
      instance.setTime(500);
      expect(instance.time).toBe(500);
    });

    it('should update easing with setEasing()', () => {
      const instance = new Keyframe();
      instance.setEasing('BounceIn' as Easing);
      expect(instance.easing).toBe('BounceIn');
    });

    it('should update data with setData()', () => {
      const instance = new Keyframe();
      const newData = [10, 20];
      instance.setData(newData);
      expect(instance.data).toEqual([10, 20]);
    });

    it('should update themeId with setThemeId()', () => {
      const instance = new Keyframe();
      instance.setThemeId('new-theme');
      expect(instance.themeId).toBe('new-theme');
    });

    it('should overwrite properties with assign()', () => {
      const instance = new Keyframe(MOCK_DATA);
      instance.assign({ time: 99, themeId: 'assigned' });
      
      expect(instance.time).toBe(99);
      expect(instance.themeId).toBe('assigned');
      // Ensure non-provided fields do NOT persist
      expect(instance.easing).not.toBe(MOCK_DATA.easing);
    });

    it('should maintain fluent interface (return this)', () => {
      const instance = new Keyframe();
      expect(instance.setTime(1)).toBe(instance);
      expect(instance.setEasing('Linear')).toBe(instance);
      expect(instance.setData([])).toBe(instance);
      expect(instance.setThemeId('id')).toBe(instance);
      expect(instance.assign({})).toBe(instance);
    });

    it('should handle internal state leaks in assign()', () => {
      const instance = new Keyframe();
      const externalData = [5, 5, 5];
      instance.assign({ data: externalData });
      
      externalData.push(10);
      expect(instance.data).toEqual([5, 5, 5]);
      expect(instance.data).not.toBe(externalData);
    });
  });
});