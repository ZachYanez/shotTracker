// Reexport the native module. On web, it will be resolved to BasketballSessionProcessorModule.web.ts
// and on native platforms to BasketballSessionProcessorModule.ts
export { default } from './src/BasketballSessionProcessorModule';
export * from './src/BasketballSessionProcessor.types';
