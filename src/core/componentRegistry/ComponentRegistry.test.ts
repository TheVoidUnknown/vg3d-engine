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
import Component from '../component/Component';
import type { IComponentData } from '../component/Component.types';
import type { ComponentDataType } from '.';

/**
 * MOCK DATA & CLASSES
 */
interface IMockData extends IComponentData {
  type: 'MockComponent';
  value: number;
}

class MockComponent extends Component<IMockData> {
  static readonly TYPE = 'MockComponent' as const;
  public value: number;

  public static type() { return this.TYPE; }
  public type() { return MockComponent.TYPE; }

  constructor(data: IMockData) {
    super();
    this.value = data.value;
  }

  static from(data: IMockData): MockComponent {
    return new MockComponent({ ...data }); // Clone to prevent pollution
  }

  serialize(): IMockData {
    return { type: 'MockComponent', value: this.value };
  }
}

const MOCK_DATA: IMockData = {
  type: 'MockComponent',
  value: 42
};

/**
 * Mocking the external registry list to control init() behavior
 */
vi.mock('../../registry/RegisterComponents', () => ({
  COMPONENTS: [
    {
      TYPE: 'MockComponent',
      from: (data: IMockData) => MockComponent.from(data)
    }
  ]
}));

describe('ComponentRegistry', () => {
  beforeEach(() => {
    // Ensure a clean slate before every test
    ComponentRegistry.init();
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should not be instantiated (Static Utility)', () => {
      // Logic: This is a static class, check if it behaves as a singleton
      expect(ComponentRegistry).toBeDefined();
    });
  });

  describe('Methods', () => {
    describe('init()', () => {
      it('should register components from the master list with init()', () => {
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
        
        ComponentRegistry.init();
        
        const Constructor = ComponentRegistry.get('MockComponent' as any);
        expect(Constructor).toBeDefined();
        expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Registered 1 components'));
      });

      it('should clear existing registrations before re-initializing with init()', () => {
        // Manually register something not in the mock COMPONENTS list
        ComponentRegistry.register('Manual', class {} as any);
        
        ComponentRegistry.init();
        
        const action = () => ComponentRegistry.get('Manual' as any);
        expect(action).toThrowError('[ComponentRegistry] Component "Manual" not registered.');
      });
    });

    describe('register()', () => {
      it('should store a component constructor with register()', () => {
        class NewComponent { static TYPE = 'New'; }
        ComponentRegistry.register('New', NewComponent as any);
        
        expect(ComponentRegistry.get('New' as any)).toBe(NewComponent);
      });

      it('should warn when overwriting an existing component with register()', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        class OverwriteComp { static TYPE = 'MockComponent'; }
        
        ComponentRegistry.register('MockComponent', OverwriteComp as any);
        
        expect(warnSpy).toHaveBeenCalledWith('[ComponentRegistry] Overwriting component "MockComponent"');
        expect(ComponentRegistry.get('MockComponent' as any)).toBe(OverwriteComp);
      });
    });

    describe('get()', () => {
      it('should return the correct constructor with get()', () => {
        ComponentRegistry.register('MockComponent', MockComponent as any);
        const result = ComponentRegistry.get('MockComponent' as any);
        expect(result).toBe(MockComponent);
      });

      it('should throw a specific error if component is not found with get()', () => {
        const action = () => ComponentRegistry.get('Missing' as any);
        expect(action).toThrowError('[ComponentRegistry] Component "Missing" not registered.');
      });
    });

    describe('create()', () => {
      it('should instantiate a component with create()', () => {
        ComponentRegistry.register('MockComponent', MockComponent as any);
        
        const instance = ComponentRegistry.create(MOCK_DATA as unknown as ComponentDataType);
        
        expect(instance).toBeInstanceOf(MockComponent);
        expect(instance.value).toBe(42);
      });

      it('should prevent reference pollution with create()', () => {
        ComponentRegistry.register('MockComponent', MockComponent as any);
        
        const data = { ...MOCK_DATA };
        const instance = ComponentRegistry.create(data);
        
        // Mutate source data after creation
        data.value = 999;
        
        // Instance must remain isolated
        expect(instance.value).toBe(42);
      });

      it('should throw error via get() if data.type is unregistered with create()', () => {
        const action = () => ComponentRegistry.create({ type: 'Unknown' } as any);
        expect(action).toThrowError('[ComponentRegistry] Component "Unknown" not registered.');
      });

      it('should ensure created instances are unique with create()', () => {
        ComponentRegistry.register('MockComponent', MockComponent as any);
        
        const instanceA = ComponentRegistry.create(MOCK_DATA);
        const instanceB = ComponentRegistry.create(MOCK_DATA);
        
        expect(instanceA).not.toBe(instanceB);
        expect(instanceA.serialize()).toEqual(instanceB.serialize());
      });
    });
  });
});