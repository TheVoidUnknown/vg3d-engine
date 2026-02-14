import RenderTarget from "./RenderTarget";
import Shader from "./Shader";
import ScreenQuad from "./ScreenQuad";

import VS_QUAD from "../shaders/quad.vert";
import FS_DOWNSAMPLE from "../shaders/downsample.frag";
import FS_UPSAMPLE from "../shaders/upsample.frag";

export default class Bloom {
  private mips: RenderTarget[] = [];
  private shaderDown: Shader;
  private shaderUp: Shader;
  private quad: ScreenQuad;

  constructor(private gl: WebGL2RenderingContext, width: number, height: number, mipChainLength = 5) {
    this.quad = new ScreenQuad(gl);
    this.shaderDown = new Shader(gl, VS_QUAD, FS_DOWNSAMPLE);
    this.shaderUp = new Shader(gl, VS_QUAD, FS_UPSAMPLE);

    let currentW = width;
    let currentH = height;

    for (let i = 0; i < mipChainLength; i++) {
      currentW = Math.floor(currentW / 2);
      currentH = Math.floor(currentH / 2);
      // Ensure we don't go below 1x1
      if (currentW < 1 || currentH < 1) break;
      
      this.mips.push(new RenderTarget(gl, currentW, currentH));
    }
  }

  public render(inputTexture: WebGLTexture) {
    const gl = this.gl;
    this.quad.draw();

    this.shaderDown.use();
    gl.activeTexture(gl.TEXTURE0);

    let input = inputTexture;

    for (let i = 0; i < this.mips.length; i++) {
      const mip = this.mips[i];
      const isFirst = i === 0;

      mip.bind(); // Draw to this mip level
      gl.viewport(0, 0, mip.width, mip.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.bindTexture(gl.TEXTURE_2D, input);
      
      this.shaderDown.setUniform('uTexture', '1i', 0);
      this.shaderDown.setUniform('uTexelSize', '2fv', [1 / mip.width, 1 / mip.height]);
      this.shaderDown.setUniform('uIsFirstPass', '1i', isFirst ? 1 : 0);
      if (isFirst) {
        this.shaderDown.setUniform('uThreshold', '1f', 1.0);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      input = mip.texture;
    }

    this.shaderUp.use();
    
    // Enable Additive Blending: (SrcAlpha * 1) + (DstAlpha * 1)
    // We want to ADD the light to what's already there
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    // Loop backwards: Start from smallest, draw onto larger
    // NOTE: We skip the very last mip (smallest) as source, start from second to last
    for (let i = this.mips.length - 1; i > 0; i--) {
      const source = this.mips[i];      // Smaller texture
      const destination = this.mips[i-1]; // Larger texture

      destination.bind(); // We are drawing BACK onto the larger texture (additive)
      gl.viewport(0, 0, destination.width, destination.height);
      
      gl.bindTexture(gl.TEXTURE_2D, source.texture);
      
      this.shaderUp.setUniform('uTexture', '1i', 0);
      this.shaderUp.setUniform('uTexelSize', '2fv', [1 / source.width, 1 / source.height]);
      this.shaderUp.setUniform('uIntensity', '1f', 1.0); // Adjust bloom strength

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // Cleanup
    gl.disable(gl.BLEND);
    
    // The result is now in mips[0] (the largest downsampled buffer)
    return this.mips[0].texture;
  }
}