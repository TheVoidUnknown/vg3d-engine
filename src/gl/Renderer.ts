// gl utils
import PostProcessStack from "./PostProcessStack";
import RenderTarget from "./RenderTarget";
import Geometry from "./Geometry";
import Shader from "./Shader";
import Bloom from "./Bloom";

// threejs
import { Vector3 } from "three";

// types
import type RenderBatch from "./RenderBatch";
import type { ICamera, ILightSource } from "./types";
import type { RawRgb } from "../services/ColorService";

// utils
import RuntimeService from "../services/RuntimeService";

// shaders
import VS_SCENE from "../shaders/standard.vert";
import FS_SCENE from "../shaders/standard.frag";
import VS_QUAD from "../shaders/quad.vert";
import FS_BLIT from "../shaders/blit.frag";

import { INSTANCE_STRIDE, MAX_INSTANCES } from "./RenderBatch";
const _scratchBuffer = new Float32Array(MAX_INSTANCES * INSTANCE_STRIDE);

interface RenderCommand {
  meshId: string;
  matrix: Float32Array; // Reference to existing matrix data
  color: RawRgb;
  shade: RawRgb;
  depth: number; // Squared distance from camera for sorting
  transparent: boolean;
}

export default class Renderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  
  // Resources
  private meshCache: Map<string, Geometry> = new Map();
  private quadGeometry!: Geometry;
  private sceneShader!: Shader;
  private sceneTarget!: RenderTarget;
  private ppStack!: PostProcessStack;
  private bloom!: Bloom;

  // Uniform Cache
  private uniformLocs: Record<string, WebGLUniformLocation | null> = {};

  // Render Queue
  private renderQueue: RenderCommand[] = [];
  private renderQueueCount = 0;

  constructor(
    canvas: HTMLCanvasElement,
    contextAttributes?: WebGLContextAttributes
  ) {
    this.canvas = canvas;
    const ctx = this.canvas.getContext('webgl2', contextAttributes);

    if (!ctx) throw new Error("WebGL2 not supported");
    this.gl = ctx;

    // Default GL State
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.gl.disable(this.gl.CULL_FACE); 
  }

  public init() {
    // Set up quad for postprocessing
    this.quadGeometry = new Geometry(this.gl, 
      new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]), 
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])
    );

    this.sceneShader = new Shader(this.gl, VS_SCENE, FS_SCENE);
    this.cacheSceneUniforms();

    this.sceneTarget = new RenderTarget(this.gl, this.canvas.width, this.canvas.height);
    this.ppStack = new PostProcessStack(this.gl, this.canvas.width, this.canvas.height);
    this.bloom = new Bloom(this.gl, this.canvas.width, this.canvas.height, 6);

    // Set up passthrough
    const passthrough = {
      shader: new Shader(this.gl, VS_QUAD, FS_BLIT),
      enabled: true,
      onApply: (shader: Shader) => { shader.setUniform('uThreshold', '1f', 0.8); }
    };
    this.ppStack.addPass(passthrough);
  }

  public registerMesh(id: string, meshData: Float32Array, normalData: Float32Array) {
    if (this.meshCache.has(id)) this.unregisterMesh(id);
    this.meshCache.set(id, new Geometry(this.gl, meshData, normalData));
  }

  public unregisterMesh(id: string) {
    this.meshCache.get(id)?.dispose();
    this.meshCache.delete(id);
  }

  public dispose() {
    this.meshCache.forEach(g => g.dispose());
    this.meshCache.clear();
    this.quadGeometry.dispose();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }



  public render(
    camera: ICamera,
    cameraPosition: Vector3,
    lights: ILightSource[],
    ambientLight: RawRgb
  ) {
    // Prepare Framebuffer
    this.sceneTarget.bind();
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(ambientLight[0], ambientLight[1], ambientLight[2], 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    // Activate Shader
    this.sceneShader.use();
    
    // Upload global uniforms
    this.uploadGlobalUniforms(camera, lights, ambientLight);

    // Render opaque first, then sorted transparent
    this.renderBatches(RuntimeService.opaqueBatches, cameraPosition, false);
    this.gl.depthMask(false); 
    this.renderBatches(RuntimeService.transparentBatches, cameraPosition, true);
    this.gl.depthMask(true);

    // Post Processing
    this.sceneTarget.unbind(); 
    this.ppStack.render(this.gl, this.sceneTarget.texture);
  }

  private renderBatches(
    batches: Map<string, RenderBatch>, 
    camPos: Vector3, 
    shouldSort: boolean
  ) {
    batches.forEach((batch, meshId) => {
      const count = batch.size; 
      if (count === 0) { return; }

      const geometry = this.meshCache.get(meshId);
      if (!geometry) { return; }

      let uploadData: Float32Array;

      if (shouldSort) {
        batch.sort(camPos, true); // true = Back-to-Front
        uploadData = batch.getSortedData(_scratchBuffer);
      } else { 
        uploadData = batch.data; 
      }

      geometry.bind();
      geometry.uploadInstanceData(uploadData, count);
      geometry.draw();
      geometry.unbind();
    });
  }

  private cacheSceneUniforms() {
    this.sceneShader.use();
    const uniforms = [
      'u_projectionMatrix', 'u_viewMatrix', 'u_modelMatrix', 
      'u_ambientLight', 'u_numLights', 'u_objectColor', 'u_shadeColor'
    ];
    
    // Also cache light array locations
    for(let i=0; i<10; i++) {
      uniforms.push(`u_lights[${i}].pos`);
      uniforms.push(`u_lights[${i}].lum`);
    }

    uniforms.forEach(name => {
      this.uniformLocs[name] = this.gl.getUniformLocation(this.sceneShader.program, name);
    });
  }

  private uploadGlobalUniforms(camera: ICamera, lights: ILightSource[], ambient: RawRgb) {
    // Ambient
    const locAmbient = this.uniformLocs['u_ambientLight'];
    if (locAmbient) this.gl.uniform3fv(locAmbient, ambient);

    // Matrices
    const locProj = this.uniformLocs['u_projectionMatrix'];
    const locView = this.uniformLocs['u_viewMatrix'];
    if (locProj) this.gl.uniformMatrix4fv(locProj, false, camera.projection.elements);
    if (locView) this.gl.uniformMatrix4fv(locView, false, camera.view.elements);

    // Lights count
    const locNum = this.uniformLocs['u_numLights'];
    if (locNum) this.gl.uniform1i(locNum, lights.length);

    // Light instances
    for(let i = 0; i < lights.length; i++) {
      const l = lights[i];
      const locPos = this.uniformLocs[`u_lights[${i}].pos`];
      const locLum = this.uniformLocs[`u_lights[${i}].lum`];

      if (locPos) this.gl.uniform3f(locPos, l.pos.x, l.pos.y, l.pos.z);
      if (locLum) this.gl.uniform1f(locLum, l.luminosity);
    }
  }
}