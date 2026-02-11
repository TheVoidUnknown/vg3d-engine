#version 300 es
layout(location=0) in vec3 a_position;
layout(location=1) in vec3 a_normal;
layout(location=2) in vec4 a_color;
layout(location=3) in vec4 a_shade;
layout(location=4) in mat4 a_modelMatrix; 

uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

out vec3 v_worldPosition;
out vec3 v_normal;
out vec4 v_color;
out vec4 v_shade;

void main() {
  vec4 worldPos = a_modelMatrix * vec4(a_position, 1.0);
  gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;

  v_worldPosition = worldPos.xyz;
  v_normal = mat3(a_modelMatrix) * a_normal; 
  
  v_color = a_color;
  v_shade = a_shade;
}