#version 300 es
precision mediump float;

in vec2 vUv;

uniform sampler2D uTexture;
uniform float uThreshold;

out vec4 FragColor;

void main() { 
  vec4 color = texture(uTexture, vUv);
  FragColor = color;
}