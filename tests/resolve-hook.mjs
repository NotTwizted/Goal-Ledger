// Node needs the .js the app's imports leave off, knows nothing about Vite's
// "?url" imports, and has no DOM for pdfjs to load into. Only scanLines is
// under test here, which touches none of that.
export function resolve(specifier, context, next) {
  if (specifier.endsWith('?url')) {
    return { url: 'data:text/javascript,export default "worker.js"', shortCircuit: true };
  }
  if (specifier.startsWith('pdfjs-dist')) {
    return { url: 'data:text/javascript,export const GlobalWorkerOptions={};export function getDocument(){throw new Error("not under test")}', shortCircuit: true };
  }
  // The database client reads import.meta.env, which is Vite's and not Node's.
  // Nothing under test talks to it — the modules that import it only ask
  // whether it is configured, and here it never is.
  if (/(^|\/)supabase(\.js)?$/.test(specifier)) {
    return {
      url: 'data:text/javascript,'
        + 'export const isSupabaseConfigured=false;'
        + 'export const supabase={storage:{from(){return{'
        + 'upload:async()=>({error:new Error("not configured")}),'
        + 'download:async()=>({error:new Error("not configured")}),'
        + 'remove:async()=>({error:new Error("not configured")})};}}};',
      shortCircuit: true,
    };
  }

  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    return next(`${specifier}.js`, context);
  }
  return next(specifier, context);
}
