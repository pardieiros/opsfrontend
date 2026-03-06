// src/global.d.ts
declare module "*.js";
declare module "*.jsx";

declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": any;
  }
}
