import { NativeModule, requireNativeModule } from 'expo';

import {
  BasketballSessionProcessorModuleEvents,
  NativeProcessorBootstrapInfo,
} from './BasketballSessionProcessor.types';

declare class BasketballSessionProcessorModule extends NativeModule<BasketballSessionProcessorModuleEvents> {
  processorPluginName: string;
  getNativeBootstrapInfo(): NativeProcessorBootstrapInfo;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<BasketballSessionProcessorModule>('BasketballSessionProcessor');
