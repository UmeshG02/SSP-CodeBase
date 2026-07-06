// Polyfills for browser-native APIs needed by pdf-parse on Node.js/Vercel
if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {};
}
if (typeof global.Path2D === 'undefined') {
  (global as any).Path2D = class Path2D {};
}
if (typeof global.ImageData === 'undefined') {
  (global as any).ImageData = class ImageData {};
}
