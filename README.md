# Token Pipeline

This is a simple Typescript-based library that is designed to help you define, transform, and output tokens for your design system. It is still under active development, and feature requests are welcome!

It allows you to define a lazily evaluated pipeline for various tokens, and comes with nifty helpers for transforming and outputting them. It's unopiniated, so you can use it with whatever token format you want without issue. It comes with a couple of helpers to make it a bit easier to transform arrays of tokens and object-based tokens, but you're welcome to define tokens in whatever shape you desire.

The pipeline you define is lazily evaluated, and is only evaluated when you call the `flow` method on the pipeline. It's also entirely promise-based as well, so if you need to leverage file IO or API calls in your pipeline, you can do so without issue.

## Installation

```bash
# If you use npm
npm install -D token-pipeline

# If you use yarn
yarn add -D token-pipeline
```

## Usage

Using this library should be very simple! Let's imagine you have some color tokens you want to define.

Let's imagine you have a color palette that looks like this:

```typescript
const colorPalette = {
  'background-primary': {dark: '#000', light: '#fff'},
  'background-secondary': {dark: '#222', light: '#ddd'},
  'background-tertiary': {dark: '#444', light: '#bbb'},

  'text-primary': {dark: '#eee', light: '#111'},
  'text-secondary': {dark: '#ccc', light: '#333'},
  'header-primary': {dark: '#fff', light: '#000'},
  'header-secondary': {dark: '#ddd', light: '#222'},
};
```

Let's see how we could define a pipeline to transform these tokens into a format that we could use in our design system. Let's imagine that we want these color tokens output as JSON, CSS, and Javascript variables. (Imagine the helper functions `hexToRgb` and `hexToHsl` are defined elsewhere.)

```typescript
import {source, mapItems} from 'token-pipeline';

const colorPalette = [
  {name: 'background-primary', dark: '#000', light: '#fff'},
  {name: 'background-secondary', dark: '#222', light: '#ddd'},
  {name: 'background-tertiary', dark: '#444', light: '#bbb'},

  {name: 'text-primary', dark: '#eee', light: '#111'},
  {name: 'text-secondary', dark: '#ccc', light: '#333'},
  {name: 'header-primary', dark: '#fff', light: '#000'},
  {name: 'header-secondary', dark: '#ddd', light: '#222'},
];

type ColorToken = ReturnType<typeof addColorMetadata>;
function addColorMetadata(color: (typeof colorPalette)[number]) {
  const {name, dark, light} = color;

  return {
    ...color,
    customPropertyName: `--${name}`,
    constantName: name.toUpperCase().replace(/-/g, '_'),
    dark: {hex: dark, rgb: hexToRgb(dark), hsl: hexToHsl(dark)},
    light: {hex: light, rgb: hexToRgb(light), hsl: hexToHsl(light)},
  };
}

function colorCSS(colors: ColorToken[]) {
  return `
    .dark {
      ${colors
        .map((color) => `${color.customPropertyName}: ${color.dark.hsl};`)
        .join('\n')}
    }

    .light {
      ${colors
        .map((color) => `${color.customPropertyName}: ${color.light.hsl};`)
        .join('\n')}
    }
  `;
}

function colorJSON(colors: ColorToken[]) {
  return JSON.stringify({
    dark: colors.map((color) => ({name: color.name, hex: color.dark.hex})),
    light: colors.map((color) => ({name: color.name, hex: color.light.hex})),
  });
}

function colorJS(colors: ColorToken[]) {
  return `
    export const COLORS = {
      ${colors
        .map((color) => {
          return `${color.constantName}: { DARK: '${color.dark.hex}', LIGHT: '${color.light.hex}' } }`;
        })
        .join(',\n')}
    }
  `;
}

source(colorPalette)
  .pipe(mapItems(addColorMetadata))
  .out('colors.json', colorJSON)
  .out('colors.css', colorCSS)
  .out('colors.js', colorJS)
  .flow();
```

This will output the following:

### colors.json

```json
{
  "dark": [
    {"name": "background-primary", "hex": "#000"},
    {"name": "background-secondary", "hex": "#222"},
    {"name": "background-tertiary", "hex": "#444"},
    {"name": "text-primary", "hex": "#eee"},
    {"name": "text-secondary", "hex": "#ccc"},
    {"name": "header-primary", "hex": "#fff"},
    {"name": "header-secondary", "hex": "#ddd"}
  ],
  "light": [
    {"name": "background-primary", "hex": "#fff"},
    {"name": "background-secondary", "hex": "#ddd"},
    {"name": "background-tertiary", "hex": "#bbb"},
    {"name": "text-primary", "hex": "#111"},
    {"name": "text-secondary", "hex": "#333"},
    {"name": "header-primary", "hex": "#000"},
    {"name": "header-secondary", "hex": "#222"}
  ]
}
```

### colors.css

```css
.dark {
  --background-primary: hsl(0, 0%, 0%);
  --background-secondary: hsl(0, 0%, 13.3%);
  --background-tertiary: hsl(0, 0%, 26.6%);
  --text-primary: hsl(0, 0%, 93.3%);
  --text-secondary: hsl(0, 0%, 80%);
  --header-primary: hsl(0, 0%, 100%);
  --header-secondary: hsl(0, 0%, 86.6%);
}

.light {
  --background-primary: hsl(0, 0%, 100%);
  --background-secondary: hsl(0, 0%, 86.6%);
  --background-tertiary: hsl(0, 0%, 73.3%);
  --text-primary: hsl(0, 0%, 6.6%);
  --text-secondary: hsl(0, 0%, 20%);
  --header-primary: hsl(0, 0%, 0%);
  --header-secondary: hsl(0, 0%, 13.3%);
}
```

### colors.ts

```typescript
export const COLORS = {
  BACKGROUND_PRIMARY: {DARK: '#000', LIGHT: '#fff'},
  BACKGROUND_SECONDARY: {DARK: '#222', LIGHT: '#ddd'},
  BACKGROUND_TERTIARY: {DARK: '#444', LIGHT: '#bbb'},
  TEXT_PRIMARY: {DARK: '#eee', LIGHT: '#111'},
  TEXT_SECONDARY: {DARK: '#ccc', LIGHT: '#333'},
  HEADER_PRIMARY: {DARK: '#fff', LIGHT: '#000'},
  HEADER_SECONDARY: {DARK: '#ddd', LIGHT: '#222'},
};
```
