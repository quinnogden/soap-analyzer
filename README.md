# Soap Analyzer

[Download at Chrome Web Store](http://goo.gl/RaXqW0)

A developer tools chrome extension which allows users to easily track any SOAP HTTP requests that are made by the browser. It's meant to act as the Network tab, but only for SOAP HTTP traffic, currently has ~3,500 actively weekly users. It includes the following features:

- Display list of SOAP web service calls made by service name instead of by URL.
- Parses XML request and response of each web service call, and displays them in an [text editor](https://ace.c9.io/) with collapsible nodes and syntax highlighting.
- Ability to toggle Envelope, Header, and Body tags, to allow users to focus on content of requests and responses.
- Ability to toggle 'xmlns' flavored properties on XML nodes to de-clutter and improve readability.
- Failed web service calls (HTTP errors or no response) are highlighted in red.
- Automatically matches the light or dark theme of the browser's dev tools.

## Demo

![Demo](https://i.imgur.com/9DxRc1n.gif)

## Installation and Development

Soap Analyzer is built using webpack, clone the repo, run `npm install`, then run `npm start` to launch to dev environment which watches for file changes and rebuilds. The `build/dist` folder can be loaded as an unpacked extension:

- **Chrome:** visit `chrome://extensions`, enable Developer mode, click "Load unpacked" and select `build/dist`.
- **Edge:** visit `edge://extensions`, enable Developer mode, click "Load unpacked" and select `build/dist`.

Running `npm run build` will create a zip file in a `./build/packages` directory, which is deployable to the Chrome Web Store and Microsoft Edge Add-ons.

## Support for other browsers

The extension uses Manifest V3 and works in Chrome and Microsoft Edge (and other Chromium-based browsers, version 88+).

## License

MIT License
