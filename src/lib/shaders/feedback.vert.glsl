#version 300 es

in vec3 a_position;
in vec3 a_faceNormal;

uniform vec3 u_cameraWorldPosition;
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

// Vertex data texture
uniform sampler2D u_vertexPositionTexture;
uniform int u_textureWidth;

#define MAX_LIGHTS 10
struct Light {
  vec3 position;
  float luminosity;
};

uniform vec3 u_ambientLight;
uniform vec3 u_objectColor;
uniform vec3 u_shadeColor;

uniform Light u_lights[MAX_LIGHTS];
uniform int u_numLights;

out vec2 out_screenCoord;
flat out float out_depth;
flat out vec3 out_color;
flat out float out_isFrontFacing;

vec3 getPositionForIndex(int index) {
  int y = index / u_textureWidth;
  int x = index % u_textureWidth;
  return texelFetch(u_vertexPositionTexture, ivec2(x, y), 0).rgb;
}

void main() {
  vec4 worldPosition4 = u_modelMatrix * vec4(a_position, 1.0);
  vec3 worldPosition = worldPosition4.xyz;
  mat3 normalMatrix = transpose(inverse(mat3(u_modelMatrix)));
  vec3 worldNormal = normalize(normalMatrix * a_faceNormal);

  gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition4;

  // 2D Projection
  vec2 ndc = gl_Position.xy / gl_Position.w;
  out_screenCoord = ndc * 0.5 + 0.5;
  out_depth = gl_Position.z / gl_Position.w;

  // Manual backface culling
  vec3 viewVector = normalize(u_cameraWorldPosition - worldPosition);
  float facing = dot(worldNormal, viewVector);
  out_isFrontFacing = step(0.0, facing);

  // Lighting calculation
  float diffuseIntensity = 0.0;
  for (int i = 0; i < u_numLights; i++) {
    vec3 lightDirection = normalize(u_lights[i].position - worldPosition);
    float diffuseFactor = max(dot(worldNormal, lightDirection), 0.0);
    diffuseIntensity += u_lights[i].luminosity * diffuseFactor;
  }

  float ambientIntensity = length(u_ambientLight);
  float lightingFactor = ambientIntensity + diffuseIntensity;
  lightingFactor = clamp(lightingFactor, 0.0, 1.0);
  vec3 finalColor = mix(u_shadeColor, u_objectColor, lightingFactor);

  out_color = finalColor;
}