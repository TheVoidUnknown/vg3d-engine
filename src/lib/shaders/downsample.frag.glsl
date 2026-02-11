#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uTexelSize;
uniform float uThreshold;
uniform bool uIsFirstPass;

out vec4 FragColor;

void main() {
  vec4 d = uTexelSize.xyxy * vec4(-1.0, -1.0, 1.0, 1.0);

  vec4 s1 = texture(uTexture, vUv + d.xy);
  vec4 s2 = texture(uTexture, vUv + d.zy);
  vec4 s3 = texture(uTexture, vUv + d.xw);
  vec4 s4 = texture(uTexture, vUv + d.zw);

  vec4 color = (s1 + s2 + s3 + s4) * 0.25;

  if (uIsFirstPass) {
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

    if(brightness < uThreshold) {
      color = vec4(0.0);
    }
  }

  FragColor = color;
}