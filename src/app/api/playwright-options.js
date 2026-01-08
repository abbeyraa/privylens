import playwrightConfig from "../../../playwright.config.js";

const CONTEXT_OPTION_KEYS = ["geolocation", "permissions"];

export function getPlaywrightContextOptions() {
  const useOptions = playwrightConfig?.use ?? {};
  return CONTEXT_OPTION_KEYS.reduce((options, key) => {
    if (useOptions[key] !== undefined) {
      options[key] = useOptions[key];
    }
    return options;
  }, {});
}
