import { chickenOneWord } from './chicken';
import { measurePerformance, runWhenHidden } from './utils';

/** Removes console logs when loaded locally.
 * This does not affect the host page, because content
 * scripts are isolated.
 */
const DEV_MODE = !chrome.runtime.getManifest().update_url;
if (!DEV_MODE) {
  for (const key in console) {
    console[key] = () => {};
  }
}

const timings = {
  PER_WORD_FREQUENCY: 2 * 60 * 1000,
  DELAY_AFTER_BACKGROUNDED: 5 * 60 * 1000,
};

setInterval(
  runWhenHidden(
    () => measurePerformance(chickenOneWord),
    timings.DELAY_AFTER_BACKGROUNDED,
  ),
  timings.PER_WORD_FREQUENCY,
);
