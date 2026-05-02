import { registerWebModule, NativeModule } from 'expo';

import { NativeProcessorBootstrapInfo } from './BasketballSessionProcessor.types';

type BasketballSessionProcessorModuleEvents = Record<string, never>;

class BasketballSessionProcessorModule extends NativeModule<BasketballSessionProcessorModuleEvents> {
  processorPluginName = 'basketballSessionProcessor';

  getNativeBootstrapInfo(): NativeProcessorBootstrapInfo {
    return {
      moduleName: 'BasketballSessionProcessor',
      platform: 'web',
      processorPluginName: this.processorPluginName,
    };
  }
}

export default registerWebModule(BasketballSessionProcessorModule, 'BasketballSessionProcessorModule');
