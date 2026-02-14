import { registerComponentHandlers } from "./registry/RegisterComponentHandlers";
import { registerExportHandlers } from "./registry/RegisterExportHandlers";
import { registerComponents } from "./registry/RegisterComponents";
import { registerMeshes } from "./registry/RegisterMeshes";

export * from "./components";
export * from "./core";
export * from "./gl";
export * from "./meshes";
export * from "./registry";
export * from "./services";
// export * from "./shaders";
export * from "./vgd";

export function initRegistries() {
  const t1 = performance.now();

  registerMeshes();
  registerComponents();
  registerExportHandlers();
  registerComponentHandlers();

  const t2 = performance.now();
  console.info(`Finished initialization in ${t2 - t1}ms`);
}