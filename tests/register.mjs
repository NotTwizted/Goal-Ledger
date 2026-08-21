// The app's imports are written for Vite; these three differences are all Node
// needs told about to run the same modules unchanged.
import { register } from 'node:module';

register('./resolve-hook.mjs', import.meta.url);
