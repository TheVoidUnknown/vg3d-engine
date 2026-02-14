export class Geometry {
  private vao: WebGLVertexArrayObject | null;
  private vboPos: WebGLBuffer | null;
  private vboNor: WebGLBuffer | null;
  private vboInst : WebGLBuffer | null;
  private vertexCount: number = 0;
  private instanceCount: number = 0;

  constructor(
    private gl: WebGL2RenderingContext, 
    flatMesh: Float32Array, 
    flatNormals: Float32Array
  ) {
    this.vertexCount = flatMesh.length / 3;

    this.vao = gl.createVertexArray();
    this.vboPos = gl.createBuffer();
    this.vboNor = gl.createBuffer();
    this.vboInst = gl.createBuffer();

    if (!this.vao) { throw new Error("Failed to create VertexAtrributeArray!"); }

    // Bind VAO
    this.gl.bindVertexArray(this.vao);

    // Static mesh data
    // layout(location=0) in vec3 a_position;
    this.bindAttribute(this.vboPos, flatMesh, 0, 3);
    // layout(location=1) in vec3 a_normal;
    this.bindAttribute(this.vboNor, flatNormals, 1, 3);

    // Dynamic instance data
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vboInst);

    // 4 floats (color)
    // 4 floats (shade)
    // 16 floats (matrix)
    // = 24 floats * 4 bytes = 96 bytes
    const stride = 96; 

    //layout(location=2) in vec4 a_color;
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 0); 
    gl.vertexAttribDivisor(2, 1); // Advance once per instance

    // layout(location=3) in vec4 a_shade;
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, stride, 16);
    gl.vertexAttribDivisor(3, 1);

    // layout(location=4) in mat4 a_modelMatrix; 
    for (let i = 0; i < 4; i++) {
      const loc = 4 + i;
      gl.enableVertexAttribArray(loc);
      // Offset = 32 (Color+Shade) + i * 16
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, stride, 32 + (i * 16));
      gl.vertexAttribDivisor(loc, 1);
    }

    this.gl.bindVertexArray(null);
  }

  private bindAttribute(
    buffer: WebGLBuffer | null,
    data: Float32Array,
    loc: number,
    size: number
  ) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(loc);
    this.gl.vertexAttribPointer(loc, size, this.gl.FLOAT, false, 0, 0);
  }

  public bind() {
    if (!this.vao) { return; }
    this.gl.bindVertexArray(this.vao);
  }

  public unbind() {
    this.gl.bindVertexArray(null);
  }

  public draw() {
    if (this.instanceCount === 0) { return; }
    this.gl.bindVertexArray(this.vao);
    this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, this.vertexCount, this.instanceCount);
    this.gl.bindVertexArray(null);
  }

  public uploadInstanceData(data: Float32Array, instanceCount: number) {
    this.instanceCount = instanceCount;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vboInst);

    // Trim the array where the data stops so we dont stuff the GPU
    const floatCount = instanceCount * 24; // 24 stride
    const view = data.subarray(0, floatCount);

    this.gl.bufferData(this.gl.ARRAY_BUFFER, view, this.gl.DYNAMIC_DRAW);
  }

  public dispose() {
    if (this.vboPos)  { this.gl.deleteBuffer(this.vboPos);   }
    if (this.vboNor)  { this.gl.deleteBuffer(this.vboNor);   }
    if (this.vboInst) { this.gl.deleteBuffer(this.vboInst);  }
    if (this.vao)     { this.gl.deleteVertexArray(this.vao); }
    
    this.vboPos = null;
    this.vboNor = null;
    this.vboInst = null
    this.vao = null;
  }
}