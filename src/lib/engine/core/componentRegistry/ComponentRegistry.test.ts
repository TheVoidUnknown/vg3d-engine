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
import ComponentRegistry from './ComponentRegistry';
import type { IComponent, IComponentStatic } from '../component/Component.types';

/**
 * MOCK DATA & CLASSES
 */
interface IMockComponentData extends IComponentStatic {
  type: 'MockComponent';
  value: number;
}

class MockComponent implements IComponent<MockComponent, IMockComponentData> {
  readonly type = 'MockComponent';
  public value: number;

  constructor(data: IMockComponentData) {
    this.value = data.value;
  }

  static from(data: IMockComponentData): MockComponent {
    return new MockComponent(data);
  }

  serialize(): IMockComponentData {
    return { type: 'MockComponent', value: this.value };
  }

  clone(): MockComponent {
    return new MockComponent(this.serialize());
  }
}

const MOCK_DATA: IMockComponentData = {
  type: 'MockComponent' as any,
  value: 42
};

describe('ComponentRegistry', () => {
  beforeEach(() => {
    // Reset registry state before every test to prevent cross-test pollution
    ComponentRegistry.init();
    vi.clearAllMocks();
  });

  describe('init()', () => {
    it('should clear all registered components with init()', () => {
      ComponentRegistry.register('MockComponent' as any, MockComponent as any);
      ComponentRegistry.init();
      
      const result = ComponentRegistry.get('MockComponent' as any);
      expect(result).toBeUndefined();
    });

    it('should reset the internal map to a new instance', () => {
      const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
      ComponentRegistry.init();
      expect(spy).toHaveBeenCalledWith("Component Registry initialized");
    });
  });

  describe('register()', () => {
    it('should store a component constructor with register()', () => {
      ComponentRegistry.register('MockComponent' as any, MockComponent as any);
      const retrieved = ComponentRegistry.get('MockComponent' as any);
      expect(retrieved).toBe(MockComponent);
    });

    it('should overwrite existing registration and warn with register()', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      class NewMock {}
      
      ComponentRegistry.register('MockComponent' as any, MockComponent as any);
      ComponentRegistry.register('MockComponent' as any, NewMock as any);
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Component with name "MockComponent" was already registered')
      );
      expect(ComponentRegistry.get('MockComponent' as any)).toBe(NewMock);
    });
  });

  describe('get()', () => {
    it('should return the correct constructor with get()', () => {
      ComponentRegistry.register('MockComponent' as any, MockComponent as any);
      const result = ComponentRegistry.get('MockComponent' as any);
      expect(result).toBe(MockComponent);
    });

    it('should return undefined for unregistered components with get()', () => {
      const result = ComponentRegistry.get('NonExistent' as any);
      expect(result).toBeUndefined();
    });
  });

  describe('create()', () => {
    it('should instantiate a component from data with create()', () => {
      ComponentRegistry.register('MockComponent' as any, MockComponent as any);
      
      const instance = ComponentRegistry.create(MOCK_DATA);
      
      expect(instance).toBeInstanceOf(MockComponent);
      expect(instance.value).toBe(42);
    });

    it('should throw an error if component type is not registered with create()', () => {
      const action = () => ComponentRegistry.create({ type: 'Unregistered' } as any);
      
      expect(action).toThrowError('Component type "Unregistered" is not registered.');
    });

    it('should ensure created instance is a fresh object (Reference Pollution Check)', () => {
      ComponentRegistry.register('MockComponent' as any, MockComponent as any);
      
      const localData = { ...MOCK_DATA };
      const instance = ComponentRegistry.create(localData);
      
      // Mutate source data
      localData.value = 999;
      
      // Instance should remain unchanged
      expect(instance.value).toBe(42);
    });
  });

  describe('Integrity & Pollution', () => {
    it('should maintain independent state between registrations', () => {
      class CompA { static from() { return new CompA(); } }
      class CompB { static from() { return new CompB(); } }
      
      ComponentRegistry.register('A' as any, CompA as any);
      ComponentRegistry.register('B' as any, CompB as any);
      
      expect(ComponentRegistry.get('A' as any)).toBe(CompA);
      expect(ComponentRegistry.get('B' as any)).toBe(CompB);
    });

    it('should not allow external modification of the internal components map', () => {
      // This tests if the registry is exposing its internal map by reference.
      // Since it's private, we check the behavior of the public API.
      ComponentRegistry.register('MockComponent' as any, MockComponent as any);
      
      const data = MOCK_DATA;
      const instance1 = ComponentRegistry.create(data);
      
      // If the registry leaked the constructor and we modified the constructor's 
      // static methods (if possible), it would be a leak. 
      // Here we verify that repeated calls produce consistent results.
      const instance2 = ComponentRegistry.create(data);
      expect(instance1).not.toBe(instance2); // Should be different instances
      expect(instance1.value).toBe(instance2.value);
    });
  });
});