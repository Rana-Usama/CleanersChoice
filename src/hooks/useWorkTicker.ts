import {useEffect, useState} from 'react';

/**
 * Seconds-resolution clock for the running-session displays.
 *
 * WorkSessionProvider ticks `now` every 15s on purpose - it also re-checks the
 * session on each tick, and every consumer of the context re-renders with it.
 * The wireframes show a live HH:MM:SS timer, which needs 1s resolution, so that
 * is kept local to the components that draw a timer and only runs while one is
 * actually on screen.
 */
export const useWorkTicker = (enabled: boolean): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) {
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
};
