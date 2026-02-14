export default class Shader {
  public program: WebGLProgram;
  private uniforms: Map<string, WebGLUniformLocation> = new Map();

  constructor(private gl: WebGL2RenderingContext, vertSource: string, fragSource: string) {
    const vert = this.compile(gl.VERTEX_SHADER, vertSource);
    const frag = this.compile(gl.FRAGMENT_SHADER, fragSource);
    
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vert);
    gl.attachShader(this.program, frag);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(this.program) || 'Link Error');
    }
  }

  private compile(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(this.gl.getShaderInfoLog(shader) || 'Compile Error');
    }
    return shader;
  }

  public use() {
    this.gl.useProgram(this.program);
  }

  // Helper to cache uniform lookups
  public setUniform(name: string, type: '1f' | '2fv' | '3fv' | '4fv' | '1i', value: any) {
    if (!this.uniforms.has(name)) {
      const loc = this.gl.getUniformLocation(this.program, name);
      if (loc) this.uniforms.set(name, loc);
    }
    
    const loc = this.uniforms.get(name);
    if (loc) {
      if (type === '1f') this.gl.uniform1f(loc, value);
      if (type === '2fv') this.gl.uniform2fv(loc, value);
      if (type === '3fv') this.gl.uniform3fv(loc, value);
      if (type === '4fv') this.gl.uniform4fv(loc, value);
      if (type === '1i') this.gl.uniform1i(loc, value); // For textures
    }
  }
}