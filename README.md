# ReactPlayground

Testing React components in OctoPrint's UI. Current components available:
* Terminal

## Development

Code is written using modern JS techniques, which is then compiled using a combination of webpack and babel.

**Prerequisites**: Non-ancient NodeJS/npm installation.

To start developing:
1. Clone the repository
2. Run `npm install`

To build in development mode run `npm run build-dev`

To build in production mode, run `npm run build-prod`.

There is also development versions of React bundled, to switch to production versions, switch the setting
`plugins.react_playground.development` to `false`. This could be done by default in the future.

## Setup

Install via the bundled [Plugin Manager](https://docs.octoprint.org/en/master/bundledplugins/pluginmanager.html)
or manually using this URL:

    https://github.com/cp2004/OctoPrint-ReactPlayground/archive/main.zip

**TODO:** Describe how to install your plugin, if more needs to be done than just installing it via pip or through
the plugin manager.

## Configuration

**TODO:** Describe your plugin's configuration options (if any).
