export type BasketballSessionProcessorModuleEvents = Record<string, never>;

export type NativeProcessorBootstrapInfo = {
  moduleName: string;
  platform: 'ios' | 'android' | 'web';
  processorPluginName: string;
};
