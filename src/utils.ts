export function randomNumber(nonInclusiveMax: number): number {
  return Math.floor(Math.random() * nonInclusiveMax);
}

/** A helper function to log scripting time of a function */
export function measurePerformance(fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log('Took', end - start, 'ms');
}

/** Implements our hiding logic */
export function runWhenHidden(fn: () => void, delayMs: number) {
  let nextOkayInterval: number | undefined;
  return () => {
    if (document.visibilityState === 'visible') {
      nextOkayInterval = undefined;
      return;
    }

    if (!nextOkayInterval) {
      nextOkayInterval = Date.now() + delayMs;
      console.log('Set delay', delayMs);
      return;
    } else {
      const diff = nextOkayInterval - Date.now();
      if (diff > 0) {
        console.log('Wait', diff);
        return;
      }
    }

    fn();
  };
}

export function sum(values: number[]): number {
  let total = 0;
  values.forEach((value) => (total += value));
  return total;
}
