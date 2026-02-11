import { generateUUID } from "three/src/math/MathUtils.js";
import type { ILevel, ITheme } from "./Level.types";
import Animatable from "../animatable/Animatable";
import type { IAnimatable } from "../animatable/Animatable.types";

export default class Level {
  public id: string;
  public displayName: string;

  public events: Animatable;
  public themes: Map<string, ITheme>;

  public _objects: (Animatable | null)[]; 
  public _idToIndex: Map<string, number>;
  public _freeIndices: number[]; // Stack for recycling indices

  constructor(initial?: Partial<ILevel>) {
    this.id = generateUUID();
    this.displayName = "My Cool 3D";

    this.events = new Animatable();
    this.themes = new Map();

    this._objects = []; 
    this._idToIndex = new Map();
    this._freeIndices = [];

    if (initial) { this.assign(initial); }
  }

  public get rawObjects(): ReadonlyArray<Animatable | null> { return this._objects; }

  public static from(data: Partial<ILevel>): Level { return new Level(data); }

  public assign(data: Partial<ILevel>): this {
    if (data.metadata) {
      if (data.metadata.id) { this.id = data.metadata.id; }
      if (data.metadata.displayName) { this.displayName = data.metadata.displayName; }
      if (data.events) { this.events = Animatable.from(data.events); }
      if (data.themes) {
        this.themes.clear();
        for (const t of data.themes) { this.themes.set(t.id, t); }
      }
    }

    if (data.objects) {
      for (const objData of data.objects) {
        const object = Animatable.from(objData);
        this.addObject(object);
      }
    }
    return this;
  }

  public serialize(): ILevel {
    const staticObjs: IAnimatable[] = new Array(this._idToIndex.size);
    let objPtr = 0;

    const len = this._objects.length;

    // Serialize objects
    for (let i = 0; i < len; i++) {
      const obj = this._objects[i];
      if (obj !== null) { staticObjs[objPtr++] = obj.serialize(); }
    }

    // Serialize themes
    const staticThemes: ITheme[] = new Array(this.themes.size);
    let themePtr = 0;
    for (const theme of this.themes.values()) {
      staticThemes[themePtr++] = theme;
    }

    return {
      objects: staticObjs,
      events: this.events.serialize(),
      themes: staticThemes,
      metadata: {
        id: this.id,
        displayName: this.displayName,
      }
    }
  }

  public addObject(obj: Animatable): number {
    if (this._idToIndex.has(obj.id)) {
      console.warn(`[Level] Object ID [${obj.id}] already exists. Skipping.`);
      return this._idToIndex.get(obj.id)!;
    }

    let index: number;

    // Reuse a nulled slot if possible
    if (this._freeIndices.length > 0) {
      index = this._freeIndices.pop()!;
      this._objects[index] = obj;
    } else {
      // Push to end of array
      index = this._objects.length;
      this._objects.push(obj);
    }

    this._idToIndex.set(obj.id, index);

    return index;
  }

  public getObject(id: string): Animatable | undefined {
    const index = this._idToIndex.get(id);
    if (index === undefined) { return undefined; }

    return this._objects[index] as Animatable;
  }

  public deleteObject(id: string, markOrphans = false): boolean {
    const index = this._idToIndex.get(id);
    if (index === undefined) { return false; }

    this._objects[index] = null;
    this._freeIndices.push(index); // Mark slot as available for reuse
    this._idToIndex.delete(id);

    // Extremely expensive O(n * (# components)) operation, disabled by default
    if (markOrphans) {
      this.rawObjects.forEach((o) => {
        if (!o) { return; }
        o.components.forEach((c) => {
          if (c.parentId === id) { c._isDirty = true; }
        })
      })
    }

    return true;
  }
}