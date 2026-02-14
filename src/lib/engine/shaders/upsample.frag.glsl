#version 300 es
precision mediump float;

in vec2 vUv;

uniform sampler2D uTexture;
uniform float uIntensity;
uniform vec2 uTexelSize;

out vec4 FragColor;

void main() {
  float x = uTexelSize.x;
  float y = uTexelSize.y;

  vec4 d = uTexelSize.xyxy * vec4(1.0, 1.0, -1.0, 0.0);

  vec4 s1 = texture(uTexture, vUv - d.xy);
  vec4 s2 = texture(uTexture, vUv - d.wy);
  vec4 s3 = texture(uTexture, vUv - d.zy);

  vec4 s4 = texture(uTexture, vUv - d.xw);
  vec4 s5 = texture(uTexture, vUv);
  vec4 s6 = texture(uTexture, vUv + d.xw);

  vec4 s7 = texture(uTexture, vUv + d.zy);
  vec4 s8 = texture(uTexture, vUv + d.wy);
  vec4 s9 = texture(uTexture, vUv + d.xy);

  vec4 result = (
    s1 + s3 + s7 + s9 + 
    2.0 * (s2 + s4 + s6 + s8) + 
    4.0 * s5
  ) / 16.0;

  FragColor = result * uIntensity;
}