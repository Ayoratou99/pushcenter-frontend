import { useRef, useCallback } from 'react';

// ----------------------------------------------------------------------

/**
 * Guards a list screen against out-of-order responses.
 *
 * Changing a filter fires a new request while the previous one is still in
 * flight. Without this, the slower (older) response can land last and repaint
 * rows that no longer match the filters.
 *
 *     const { start, isCurrent } = useLatestRequest();
 *     const token = start();
 *     const response = await service.getAll(params);
 *     if (!isCurrent(token)) return;   // a newer request took over
 */
export function useLatestRequest() {
  const sequence = useRef(0);

  const start = useCallback(() => {
    sequence.current += 1;

    return sequence.current;
  }, []);

  const isCurrent = useCallback((token: number) => token === sequence.current, []);

  return { start, isCurrent };
}
