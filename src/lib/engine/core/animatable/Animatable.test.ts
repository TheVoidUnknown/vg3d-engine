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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import Animatable from './Animatable';
import ComponentRegistry from '$lib/engine/core/componentRegistry/ComponentRegistry';
import type { IAnimatable } from './Animatable.types';

/**
 * STATIC MOCK DATA
 */
const MOCK_COMPONENT_DATA = {
  type: 'TransformComponent' as const,
  data: { x: 10, y: 20 }
};

const MOCK_ANIMATABLE_DATA: IAnimatable = {
  id: 'test-uuid-123',
  name: 'Test Object',
  components: [ MOCK_COMPONENT_DATA ]
};

/**
 * MOCK REGISTRY
 */
vi.mock('$lib/engine/core/componentRegistry/ComponentRegistry', () => ({
  default: {
    create: vi.fn((config: any) => ({
      _isDirty: false,
      type: () => config.type,
      serialize: () => ({ ...config })
    }))
  }
}));

describe('Animatable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should construct with provided data', () => {
      const entity = new Animatable(MOCK_ANIMATABLE_DATA);
      expect(entity.id).toBe(MOCK_ANIMATABLE_DATA.id);
      expect(entity.name).toBe(MOCK_ANIMATABLE_DATA.name);
      expect(entity.components.length).toBe(1);
    });

    it('should prevent input mutation', () => {
      const data = { ...MOCK_ANIMATABLE_DATA, components: [{ ...MOCK_COMPONENT_DATA }] };
      const entity = new Animatable(data);
      
      // Mutate source
      data.name = 'CHANGED';

      expect(entity.name).toBe('Test Object');
    });

    it('should fallback to safe defaults', () => {
      const entity = new Animatable();
      expect(typeof entity.id).toBe('string');
      expect(entity.id.length).toBeGreaterThan(0);
      expect(entity.name).toBe('New Object');
      expect(Array.isArray(entity.components)).toBe(true);
      expect(entity.components.length).toBe(0);
    });

    it('should not pollute defaults', () => {
      const entityA = new Animatable();
      const entityB = new Animatable();
      entityA.components.push({} as any);
      
      expect(entityB.components.length).toBe(0);
      expect(entityA.id).not.toBe(entityB.id);
    });
  });

  describe('static from()', () => {
    it('should create instance from static data', () => {
      const entity = Animatable.from(MOCK_ANIMATABLE_DATA);
      expect(entity).toBeInstanceOf(Animatable);
    });

    it('should map all properties correctly', () => {
      const entity = Animatable.from(MOCK_ANIMATABLE_DATA);
      expect(entity.id).toBe(MOCK_ANIMATABLE_DATA.id);
      expect(entity.name).toBe(MOCK_ANIMATABLE_DATA.name);
    });

    it('should handle incomplete data', () => {
      const entity = Animatable.from({ name: 'Partial' });
      expect(entity.name).toBe('Partial');
      expect(entity.id).toBeDefined();
      expect(entity.components).toEqual([]);
    });
  });

  describe('serialize()', () => {
    it('should produce a plain JSON object', () => {
      const entity = new Animatable(MOCK_ANIMATABLE_DATA);
      const output = entity.serialize();
      expect(output.constructor).toBe(Object);
      expect(typeof output.id).toBe('string');
    });

    it('should match source data', () => {
      const entity = new Animatable(MOCK_ANIMATABLE_DATA);
      const output = entity.serialize();
      expect(output.id).toBe(MOCK_ANIMATABLE_DATA.id);
      expect(output.name).toBe(MOCK_ANIMATABLE_DATA.name);
      expect(output.components[0].type).toBe(MOCK_COMPONENT_DATA.type);
    });

    it('should prevent reference pollution', () => {
      const entity = new Animatable(MOCK_ANIMATABLE_DATA);
      const output = entity.serialize();
      
      // Attempt to mutate internal state via serialized output
      output.components.push({ type: 'Malicious' } as any);
      output.name = 'Hacked';

      expect(entity.components.length).toBe(1);
      expect(entity.name).toBe('Test Object');
    });
  });

  describe('Round-Trip', () => {
    it('should be identical when created from same data', () => {
      const data = { id: '1', name: 'Test', components: [] };
      const entityA = Animatable.from(data);
      const entityB = Animatable.from(data);
      expect(entityA.serialize()).toEqual(entityB.serialize());
    });

    it('should produce identical JSON from identical instances', () => {
      const entityA = new Animatable(MOCK_ANIMATABLE_DATA);
      const entityB = new Animatable(MOCK_ANIMATABLE_DATA);
      expect(JSON.stringify(entityA.serialize())).toBe(JSON.stringify(entityB.serialize()));
    });

    it('should satisfy the Serialization Cycle', () => {
      const entityA = new Animatable(MOCK_ANIMATABLE_DATA);
      const serialized = entityA.serialize();
      const entityB = Animatable.from(serialized);
      
      expect(entityB.serialize()).toEqual(serialized);
    });
  });

  describe('methods', () => {
    it('should update all components with _setDirty()', () => {
      const entity = new Animatable(MOCK_ANIMATABLE_DATA);
      entity.addComponent('TransformComponent' as any);
      
      // Manually set false
      entity.components.forEach(c => (c as any)._isDirty = false);
      
      entity._setDirty();
      
      entity.components.forEach(c => {
        expect((c as any)._isDirty).toBe(true);
      });
    });

    it('should add component with addComponent()', () => {
      const entity = new Animatable();
      const comp = entity.addComponent('PhysicsComponent' as any);
      
      expect(entity.components.length).toBe(1);
      expect(comp.type()).toBe('PhysicsComponent');
      expect(ComponentRegistry.create).toHaveBeenCalledWith({ type: 'PhysicsComponent' });
    });

    it('should delete component with deleteComponent()', () => {
      const entity = new Animatable();
      entity.addComponent('A' as any);
      entity.addComponent('B' as any);
      
      // Note: This test highlights a bug in the source code where splice(i, i) is used instead of splice(i, 1)
      // and splice(0, 0) does nothing.
      entity.deleteComponent('A' as any);
      
      // Logic expectation: 'A' should be gone, length should be 1.
      // Current implementation check:
      const hasA = entity.components.some(c => c.type() === 'A');
      expect(hasA).toBe(false); 
      expect(entity.components.length).toBe(1);
    });

    it('should retrieve component with getComponent()', () => {
      const entity = new Animatable();
      entity.addComponent('TransformComponent' as any);
      
      const comp = entity.getComponent('TransformComponent' as any);
      expect(comp).toBeDefined();
      expect(comp.type()).toBe('TransformComponent');
    });

    it('should throw error when getComponent() fails', () => {
      const entity = new Animatable({ name: 'ErrorEntity', id: '999' });
      
      expect(() => {
        entity.getComponent('MissingComponent' as any);
      }).toThrow('[Animatable] Animatable "ErrorEntity" [ 999 ] does not possess the component "MissingComponent"');
    });

    it('should apply data updates with assign()', () => {
      const entity = new Animatable({ name: 'Old' });
      entity.assign({ name: 'New', id: 'fixed-id' });
      
      expect(entity.name).toBe('New');
      expect(entity.id).toBe('fixed-id');
    });

    it('should append components during assign()', () => {
      const entity = new Animatable();
      entity.assign({ components: [MOCK_COMPONENT_DATA] });
      entity.assign({ components: [MOCK_COMPONENT_DATA] });
      
      expect(entity.components.length).toBe(2);
    });

    it('should handle internal state leaks in components array', () => {
      const entity = new Animatable(MOCK_ANIMATABLE_DATA);
      const internalArray = entity.components;
      
      // Check if deleteComponent mutates the array reference (it should) 
      // but ensure external logic can't break the class by reference
      internalArray.push({ type: () => 'Leaked' } as any);
      expect(entity.components.length).toBe(2);
      expect(entity.components[1].type()).toBe('Leaked');
    });
  });
});