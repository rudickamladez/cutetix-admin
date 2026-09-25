// Karma config for this project.
//
// The stock ChromeHeadless launcher opens the user's own browser profile, so
// when that browser is already running the launch only focuses the existing
// window: karma never captures it and times out after 60s (and a window pops
// up mid-test). A throwaway profile fixes both.
//
// Requires a Chromium-based browser in CHROME_BIN unless Chrome is on PATH,
// e.g. CHROME_BIN=/path/to/chromium npm test
const os = require('node:os');
const path = require('node:path');

module.exports = function (config) {
  // Frameworks and plugins come from the @angular/build:karma builder, which
  // also merges what is set here; only the launcher is overridden.
  config.set({
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
    ],
    browsers: ['ChromiumHeadlessIsolated'],
    customLaunchers: {
      ChromiumHeadlessIsolated: {
        base: 'ChromeHeadless',
        flags: [
          `--user-data-dir=${path.join(os.tmpdir(), `cutetix-admin-karma-${process.getuid?.() ?? 'user'}`)}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-gpu',
        ],
      },
    },
    restartOnFileChange: false,
  });
};
