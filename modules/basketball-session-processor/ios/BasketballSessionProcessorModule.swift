import ExpoModulesCore

public class BasketballSessionProcessorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BasketballSessionProcessor")

    Constant("processorPluginName") {
      "basketballSessionProcessor"
    }

    Function("getNativeBootstrapInfo") {
      [
        "moduleName": "BasketballSessionProcessor",
        "platform": "ios",
        "processorPluginName": "basketballSessionProcessor",
      ]
    }
  }
}
