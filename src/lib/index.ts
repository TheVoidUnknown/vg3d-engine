import registerComponentHandlers from "./engine/registry/RegisterComponentHandlers";
import registerComponents from "./engine/registry/RegisterComponents";
import registerExportHandlers from "./engine/registry/RegisterExportHandlers";
import registerMeshes from "./engine/registry/RegisterMeshes";

export default function initRegistries() {
  const t1 = performance.now();

  registerMeshes();
  registerComponents();
  registerExportHandlers();
  registerComponentHandlers();

  const t2 = performance.now();
  console.info(`Finished initialization in ${t2 - t1}ms`)
}