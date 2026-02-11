#version 300 es
precision highp float;

#define MAX_LIGHTS 10

in vec3 v_worldPosition;
in vec3 v_normal;
in vec4 v_color;
in vec4 v_shade;

struct Light {
  vec3 pos;
  float lum;
};

uniform Light u_lights[MAX_LIGHTS];
uniform vec3 u_ambientLight;
uniform int u_numLights;

out vec4 FragColor;

void main() {
  vec3 normal = normalize(v_normal);

  float diffuseIntensity = 0.0;
  
  for (int i = 0; i < u_numLights; i++) {
    vec3 lightDir = normalize(u_lights[i].pos - v_worldPosition);
    float diffuseFactor = max(dot(normal, lightDir), 0.0);
    diffuseIntensity += u_lights[i].lum * diffuseFactor;
  }

  float ambientIntensity = length(u_ambientLight);
  float lightingFactor = ambientIntensity + diffuseIntensity;
  lightingFactor = clamp(lightingFactor, 0.0, 1.0);

  vec3 finalColor = mix(v_shade.rgb, v_color.rgb, lightingFactor);

  FragColor = vec4(finalColor, v_color.a);
}