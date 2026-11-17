// Lets plain Node import app modules that start with `import "server-only"`
// (Next.js normally aliases it). Maps only that specifier to an empty module.
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(`
export async function resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  return next(specifier, context);
}`));
