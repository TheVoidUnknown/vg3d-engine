import type { IAnimatable } from "../animatable/Animatable.types";
import type { IEditor } from "./Editor.types";
import AnimationService, { type IAnimationParameters } from "$lib/engine/services/AnimationService";
import RuntimeService from "$lib/engine/services/RuntimeService";
import Animatable from "../animatable/Animatable";
import Level from "../level/Level";
import type { ILevel, ITheme } from "../level/Level.types";
import Renderer from "$lib/engine/gl/Renderer";
import MeshRegistry from "../meshRegistry/MeshRegistry";
import type { MeshType } from "$lib/engine/meshes/3DMeshes";
import ColorService from "$lib/engine/services/ColorService";
import { Camera, Matrix4, OrthographicCamera, PerspectiveCamera, Vector3 } from "three";
import type { ICamera } from "$lib/engine/gl/types";

const _eye = new Vector3(0, 0, 100);
const _target = new Vector3(0, 0, -100);
const _up = new Vector3(0, 1, 0);

const DEFAULT_THEME: ITheme = {
  id: "DEFAULT_THEME",
  name: "New Theme",

  objects: [
    { r: 25, g: 25, b: 25 },
    { r: 50, g: 50, b: 50 },
    { r: 75, g: 75, b: 75 },
    { r: 100, g: 100, b: 100 },
    { r: 125, g: 125, b: 125 },
    { r: 150, g: 150, b: 150 },
    { r: 175, g: 175, b: 175 },
    { r: 200, g: 200, b: 200 },
    { r: 225, g: 225, b: 225 }
  ],

  effects: [
    { r: 25, g: 25, b: 25 },
    { r: 50, g: 50, b: 50 },
    { r: 75, g: 75, b: 75 },
    { r: 100, g: 100, b: 100 },
    { r: 125, g: 125, b: 125 },
    { r: 150, g: 150, b: 150 },
    { r: 175, g: 175, b: 175 },
    { r: 200, g: 200, b: 200 },
    { r: 225, g: 225, b: 225 }
  ],

  parallax: [
    { r: 25, g: 25, b: 25 },
    { r: 50, g: 50, b: 50 },
    { r: 75, g: 75, b: 75 },
    { r: 100, g: 100, b: 100 },
    { r: 125, g: 125, b: 125 },
    { r: 150, g: 150, b: 150 },
    { r: 175, g: 175, b: 175 },
    { r: 200, g: 200, b: 200 },
    { r: 225, g: 225, b: 225 }
  ],

  background: { r: 25, g: 25, b: 25 },
  gui: { r: 200, g: 200, b: 200 },
  guiAccent: { r: 200, g: 200, b: 200 }
}

export default class Editor {
  public readonly isHeadless: boolean;

  public level!: Level;
  public renderer!: Renderer;
  public freecamEnabled = true;
  public freecamPos = new Vector3(0, 0, 100);
  public freecamTarget = new Vector3(0, 0, 0);
  public freecamFov = 45;

  public _viewMatrix = new Matrix4();
  public _events!: IAnimationParameters;
  public _theme!: ITheme;

  public cameraType!: 'perspective' | 'orthographic';
  public perspectiveCamera!: PerspectiveCamera;
  public orthographicCamera!: OrthographicCamera;
  private _activeCamera!: Camera;

  constructor(
    initial?: Partial<IEditor> | null,
    canvas?: HTMLCanvasElement,
    contextAttributes?: WebGLContextAttributes
  ) {
    if (initial) {
      this.assign(initial);
    } else {
      this.level = new Level();
      this.level.themes.set(DEFAULT_THEME.id, DEFAULT_THEME);
      this.newEffectsObject();
    }

    if (canvas) {
      this.isHeadless = false;

      const rect = canvas.getBoundingClientRect();
      const aspect = rect.width / rect.height;

      this.perspectiveCamera = new PerspectiveCamera(45, aspect, 0.1, 10000);
      
      const frustumSize = 100;
      const frustum = {
        left: frustumSize * aspect / -2,
        right: frustumSize * aspect / 2,
        top: frustumSize / 2,
        bottom: frustumSize / -2,
        near: 0.1,
        far: 10000
      }

      this.orthographicCamera = new OrthographicCamera(...Object.values(frustum));
      this.orthographicCamera.zoom = 1.0;

      this.cameraType = 'perspective';
      this._activeCamera = this.perspectiveCamera;

      this.updateCameraMatrix();

      const dpr = Math.min(window.devicePixelRatio || 1, 2); 
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      this.renderer = new Renderer(canvas, contextAttributes);
      this.renderer.init();

      console.info("[Editor] Registering meshes to vbuffer...");
      let numRegistered = 0;
      MeshRegistry.meshes.forEach((v, k) => {
        const key = k as MeshType
        const flatMesh = MeshRegistry.getFlatMesh(key);
        const flatNormals = MeshRegistry.getFlatNormals(key);
        this.renderer.registerMesh(key, flatMesh, flatNormals);

        numRegistered++;
      })

      console.info(`[Editor] Registered ${numRegistered} meshes to vbuffer.`);

      this._theme = structuredClone(DEFAULT_THEME);
    } else {
      this.isHeadless = true;
      console.warn("[Editor] Editor is running in headless mode, no attempt to render will be made.");
    }
  }

  public static from(data: Partial<IEditor>): Editor { return new Editor(data); }

  public assign(data: Partial<IEditor>): this {
    if (data.level) { this.level = Level.from(data.level); }
    return this;
  }

  public serialize(): IEditor {
    const level = this.level.serialize();
    return { level };
  }

  public update(time: number) {
    const eventsComp = this.level.events.getComponent("Animation3D");
    this._events = AnimationService.interpolateTracks(time, eventsComp, this._events ?? {});

    // Update camera events
    if (this.freecamEnabled) {
      _eye.copy(this.freecamPos);
      _target.copy(this.freecamTarget);
      this.perspectiveCamera.fov = this.freecamFov;
      this.perspectiveCamera.updateProjectionMatrix();

      this.orthographicCamera.zoom = this.fovToOrtho(this.freecamFov, 100);
      this.orthographicCamera.updateProjectionMatrix();
    } else {
      if (this._events.CameraMove) { _eye.fromArray(this._events.CameraMove); }
      if (this._events.CameraTarget) { _target.fromArray(this._events.CameraTarget); }
      if (this._events.CameraFOV) {
        this.perspectiveCamera.fov = this._events.CameraFOV[0];
        this.perspectiveCamera.updateProjectionMatrix();

        this.orthographicCamera.zoom = this.fovToOrtho(this._events.CameraFOV[0], 100);
        this.orthographicCamera.updateProjectionMatrix();
      }
    }


    this.updateCameraMatrix(); // Update the projection matrices

    // Update global theme
    let theme = DEFAULT_THEME;
    if (eventsComp.tracks.Theme) {
      theme = AnimationService.interpolateTheme(time, this.level.themes, eventsComp.tracks.Theme);
      this._theme = theme;
    }

    // Clean out the write buffers
    RuntimeService.clean();

    // Update all the things
    this.level.rawObjects.forEach((o) => { // RuntimeService handles the possibility of `null`
      RuntimeService.update(time, o, this.level, theme);
    })

    // Commit the finished frame data and swap the buffers
    RuntimeService.commit();
  }

  public render() {
    if (this.isHeadless || !this.renderer) { return; }

    // TODO: actually animate the lights
    const lights = [ { pos: new Vector3(20, 20, 20), luminosity: 1.0 } ];
    const bg = ColorService.rgbaToRaw(this._theme.background);

    // Fetch camera information
    const cameraPos = new Vector3().copy(_eye);
    const cameraData: ICamera = {
      projection: this._activeCamera.projectionMatrix,
      view: this._viewMatrix
    };

    // And make the gpu go brrrr
    this.renderer.render(cameraData, cameraPos, lights, bg);
  }

  public resize(width: number, height: number) {
    if (this.isHeadless) return;

    const aspect = width / height;

    // Resize perspective
    this.perspectiveCamera.aspect = aspect;
    this.perspectiveCamera.updateProjectionMatrix();

    // Resize orthographic
    const frustumHeight = this.orthographicCamera.top - this.orthographicCamera.bottom;
    const frustumWidth = frustumHeight * aspect;
    this.orthographicCamera.left = -frustumWidth / 2;
    this.orthographicCamera.right = frustumWidth / 2;
    this.orthographicCamera.updateProjectionMatrix();
  }



  public load(level: ILevel): this {
    this.level = Level.from(level);
    return this;
  }

  public getEndTime(): number {
    let t = 0;

    this.level.rawObjects.forEach((o) => {
      if (!o) { return; }
      o.components.forEach((c) => {
        const lifetime = c.lifetime + c.spawnTime;
        if (lifetime > t) { t = lifetime; }
      })
    })

    return t;
  }

  public newObject(initial?: Partial<IAnimatable>): Animatable {
    const obj = Animatable.from(initial ?? {});

    obj.addComponent("Animation3D")
      .addKeyframe("Move",    { data: [ 0, 0, 0 ] })
      .addKeyframe("Scale",    { data: [ 1, 1, 1 ] })
      .addKeyframe("Rotation", { data: [ 0, 0, 0 ] })
      .addKeyframe("Color",    { data: [ 0, 8    ] })

      .setParenting("Move", true)
      .setParenting("Scale", false)
      .setParenting("Rotation", true)

    this.level.addObject(obj);
    return obj;
  }

  public newEffectsObject(initial?: Partial<IAnimatable>): Animatable {
    const obj = Animatable.from(initial ?? {});

    obj.addComponent("Animation3D")
      .addKeyframe("AmbientLight",         { data: [ 40 ]          })
      .addKeyframe("CameraFOV",             { data: [ 45 ]          })
      .addKeyframe("CameraMove",            { data: [ 0, 0, 100 ]   })
      .addKeyframe("CameraTarget",          { data: [ 0, 0, 0 ]     })
      .addKeyframe("LightSourceLuminosity", { data: [ 100 ]         })
      .addKeyframe("LightSourceMove",       { data: [ 100, 100, 0 ] })

      .addKeyframe("Theme", { themeId: this.level.themes.entries().toArray()[0][1].id })

    this.level.events = obj;
    return obj;
  }



  private updateCameraMatrix() {
    this._viewMatrix.lookAt(_eye, _target, _up);
    this._activeCamera.position.copy(_eye);
    this._activeCamera.lookAt(_target);
    this._viewMatrix.copy(this._activeCamera.matrixWorldInverse);
  }

  // TODO: less awful freecam controls
  public setCameraType(type: 'perspective' | 'orthographic') {
    if (this.cameraType === type) return;

    this.cameraType = type;
    if (type === 'perspective') {
      this._activeCamera = this.perspectiveCamera;
    } else {
      this._activeCamera = this.orthographicCamera;
    }

    (this._activeCamera as PerspectiveCamera).updateProjectionMatrix();
  }

  public toggleFreecam() {
    this.freecamEnabled = !this.freecamEnabled;
    this.updateCameraMatrix();
  }

  public fovToOrtho(fov: number, referenceDistance: number) {
    const halfFovRad = (fov / 2) * (Math.PI / 180);
    const visibleHeight = 2 * referenceDistance * Math.tan(halfFovRad);
    const orthoHeight = this.orthographicCamera.top - this.orthographicCamera.bottom;
    const orthoZoom = orthoHeight / visibleHeight;

    return Math.max(0.001, orthoZoom);
  }
}