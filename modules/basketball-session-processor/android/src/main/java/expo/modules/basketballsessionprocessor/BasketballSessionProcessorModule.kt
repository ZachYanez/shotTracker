package expo.modules.basketballsessionprocessor

import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BasketballSessionProcessorModule : Module() {
  init {
    FrameProcessorPluginRegistry.addFrameProcessorPlugin("basketballSessionProcessor") { proxy, options ->
      BasketballSessionFrameProcessorPlugin(proxy!!, options)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("BasketballSessionProcessor")

    Constant("processorPluginName") {
      "basketballSessionProcessor"
    }

    Function("getNativeBootstrapInfo") {
      mapOf(
        "moduleName" to "BasketballSessionProcessor",
        "platform" to "android",
        "processorPluginName" to "basketballSessionProcessor",
      )
    }
  }
}
