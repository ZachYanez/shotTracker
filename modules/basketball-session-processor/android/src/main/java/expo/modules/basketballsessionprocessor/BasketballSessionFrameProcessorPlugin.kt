package expo.modules.basketballsessionprocessor

import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

class BasketballSessionFrameProcessorPlugin(
  proxy: VisionCameraProxy,
  options: Map<String, Any>?,
) : FrameProcessorPlugin() {
  override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
    val hoopRoi = arguments?.get("hoopROI") as? Map<String, Any?> ?: emptyMap()
    val shooterSeed = arguments?.get("shooterSeed") as? Map<String, Any?>
    val initialBox = shooterSeed?.get("initialBox") as? Map<String, Any?>

    val shooter = mutableMapOf<String, Any?>(
      "tracked" to (initialBox != null),
      "confidence" to if (initialBox != null) 0.35 else 0.0,
    )

    if (initialBox != null) {
      shooter["box"] = initialBox
    }

    val torsoColor = shooterSeed?.get("torsoColor") as? String
    if (torsoColor != null) {
      shooter["appearance"] = mapOf("torsoColor" to torsoColor)
    }

    val rim = mutableMapOf<String, Any?>(
      "detected" to hoopRoi.isNotEmpty(),
      "confidence" to if (hoopRoi.isNotEmpty()) 0.45 else 0.0,
    )

    if (hoopRoi.isNotEmpty()) {
      rim["box"] = hoopRoi
    }

    return mapOf(
      "timestampMs" to frame.timestamp.toLong(),
      "shooter" to shooter,
      "ball" to mapOf(
        "detected" to false,
        "confidence" to 0.0,
      ),
      "rim" to rim,
      "events" to emptyList<Map<String, Any>>(),
      "warnings" to emptyList<String>(),
    )
  }
}
