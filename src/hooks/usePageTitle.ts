import { useEffect } from 'react';

const APP_NAME = 'Aether';

/**
 * Sets the browser tab title.
 * - With subtitle: "Aether | <subtitle>"
 * - Without:       "Aether"
 */
export function usePageTitle(subtitle?: string) {
  useEffect(() => {
    document.title = subtitle ? `${APP_NAME} | ${subtitle}` : APP_NAME;
    return () => {
      document.title = APP_NAME;
    };
  }, [subtitle]);
}
