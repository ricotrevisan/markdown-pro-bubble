# 🤌 Markdown Pro

A powerful Bubble.io plugin that converts markdown to beautifully styled HTML with syntax highlighting support.

## Features

- **Markdown to HTML conversion** using Showdown.js
- **200+ syntax highlighting themes** via Highlight.js
- **Math rendering support** with KaTeX
- **HTML to Markdown conversion** via external API
- **Configurable options** for tables, line breaks, emoji support, and more

## Core Components

### md-to-html Element
- Converts markdown input to styled HTML output
- Dynamic theme switching for code highlighting
- Math formula rendering with multiple delimiter formats
- Customizable conversion options

### Dependencies
- Showdown.js (v2.1.0) - Markdown parsing
- Highlight.js (v11.7.0) - Syntax highlighting
- KaTeX (v0.16.9) - Math rendering
- showdown-katex (v0.8.0) - KaTeX integration

## Installation

Install this plugin in your Bubble.io app through the Plugin tab.

## Discussion & Support

Join the conversation on the Bubble forum: [Markdown Pro Discussion](https://forum.bubble.io/t/markdown-pro-markdown-to-html-converter/227973)

## Usage

1. Add the md-to-html element to your page
2. Configure the markdown input and styling options
3. The element outputs converted HTML and triggers the `md_converted` event
4. Use the "Highlight code" action to apply syntax highlighting

## Development

This plugin follows Bubble.io's element definition format with JavaScript functions in separate files for better maintainability.

## Support the Project

This project is built on top of an open-source stack. Consider supporting the maintainers of these projects (⭐ star on Github, 💰 donate, write a kind letter 💌...):

- **md-to-html**: [Showdown](https://github.com/showdownjs/showdown)
- **code highlighting**: [Highlight.js](https://github.com/highlightjs/highlight.js)
- **html-to-markdown**: [Johannes Kauffmann](https://github.com/JohannesKaufmann/html-to-markdown)
- **me**: [PayPal](https://paypal.me/), [Patreon](https://patreon.com/)

You can also contribute by improving the code, documentation, or helping out others in the community.

### Local tests and CI

See [the harness test guide](tests/README.md) for reproducible Node 24.19.0 setup,
Chromium/Firefox/WebKit coverage, package provenance and real-Bubble limitations.
Run `npm ci`, `npx playwright install --with-deps chromium firefox webkit`, then
`npm test`. Browser tests use only local dependencies on loopback port 4181.
