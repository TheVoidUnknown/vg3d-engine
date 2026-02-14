import { RenderTarget } from "./RenderTarget";
import { ScreenQuad } from "./ScreenQuad";
import type { IPostProcessPass } from "./types";

export class PostProcessStack {
  private passes: IPostProcessPass[] = [];
  private quad: ScreenQuad;
  
  private readBuffer: RenderTarget;
  private writeBuffer: RenderTarget;

  constructor(gl: WebGL2RenderingContext, width: number, height: number) {
    this.quad = new ScreenQuad(gl);
    
    this.readBuffer = new RenderTarget(gl, width, height);
    this.writeBuffer = new RenderTarget(gl, width, height);
  }

  public addPass(pass: IPostProcessPass) {
    this.passes.push(pass);
  }

  public resize() {
    // TODO: resize FBOs here
  }

  // Execute the stack
  // inputTexture: The raw 3D scene rendered in the first pass
  public render(gl: WebGL2RenderingContext, inputTexture: WebGLTexture) {
    let activeTexture = inputTexture;

    // 1. Loop through all passes except the last one
    // We draw from ActiveTexture -> WriteBuffer
    for (let i = 0; i < this.passes.length; i++) {
      const pass = this.passes[i];
      if (!pass.enabled) continue;

      const isLastPass = i === this.passes.length - 1;

      if (isLastPass) {
        // FINAL PASS: Draw to Screen (Default Framebuffer)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      } else {
        // INTERMEDIATE PASS: Draw to WriteBuffer
        this.writeBuffer.bind();
      }

      gl.clear(gl.COLOR_BUFFER_BIT);
      pass.shader.use();

      // Bind the input texture to slot 0
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, activeTexture);
      pass.shader.setUniform('uTexture', '1i', 0);

      // Allow the pass to set extra uniforms (like bloom threshold)
      if (pass.onApply) pass.onApply(pass.shader);

      this.quad.draw();

      if (!isLastPass) {
        // SWAP: WriteBuffer becomes the new input (ReadBuffer)
        activeTexture = this.writeBuffer.texture;
        this.swapBuffers();
      }
    }
    
    // Fallback: If no passes exist, just copy the scene to screen
    if (this.passes.length === 0) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // Use a simple "Copy" shader here (omitted for brevity)
        // or just blitFramebuffer if WebGL2
    }
  }

  private swapBuffers() {
    const temp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = temp;
  }
}