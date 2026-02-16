export interface PerformanceSnapshot {
  ups: number;
  fps: number;
  cpuMs: number;
  renderMs: number;
  activeObjs: { opaque: number; transparent: number; }
}