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
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    return next(`${specifier}.js`, context);
  }
  return next(specifier, context);
}
