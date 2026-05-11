import CoreMedia
import Foundation
import ImageIO
import UIKit
import Vision
import VisionCamera

private struct NormalizedBox {
  let x: CGFloat
  let y: CGFloat
  let width: CGFloat
  let height: CGFloat

  var area: CGFloat {
    width * height
  }

  var right: CGFloat {
    x + width
  }

  var bottom: CGFloat {
    y + height
  }

  var midX: CGFloat {
    x + (width * 0.5)
  }

  var midY: CGFloat {
    y + (height * 0.5)
  }

  func intersectionOverUnion(with other: NormalizedBox) -> CGFloat {
    let left = max(x, other.x)
    let top = max(y, other.y)
    let right = min(right, other.right)
    let bottom = min(bottom, other.bottom)
    let intersectionWidth = max(0, right - left)
    let intersectionHeight = max(0, bottom - top)
    let intersectionArea = intersectionWidth * intersectionHeight

    if intersectionArea <= 0 {
      return 0
    }

    let unionArea = area + other.area - intersectionArea
    return unionArea > 0 ? intersectionArea / unionArea : 0
  }

  func expanded(xInset: CGFloat, yInset: CGFloat) -> NormalizedBox {
    let nextX = max(0, x - xInset)
    let nextY = max(0, y - yInset)
    let nextRight = min(1, right + xInset)
    let nextBottom = min(1, bottom + yInset)

    return NormalizedBox(
      x: nextX,
      y: nextY,
      width: max(0.02, nextRight - nextX),
      height: max(0.02, nextBottom - nextY)
    )
  }

  func contains(point: CGPoint, marginX: CGFloat = 0, marginY: CGFloat = 0) -> Bool {
    point.x >= (x - marginX) &&
      point.x <= (right + marginX) &&
      point.y >= (y - marginY) &&
      point.y <= (bottom + marginY)
  }

  func toVisionRect() -> CGRect {
    CGRect(x: x, y: 1 - y - height, width: width, height: height)
  }

  func toDictionary() -> [String: Double] {
    [
      "x": Double(x),
      "y": Double(y),
      "width": Double(width),
      "height": Double(height),
    ]
  }

  static func around(point: CGPoint, radius: CGFloat) -> NormalizedBox {
    let diameter = max(radius * 2, 0.01)
    let nextX = Self.clamp(point.x - radius, min: 0, max: 1 - diameter)
    let nextY = Self.clamp(point.y - radius, min: 0, max: 1 - diameter)

    return NormalizedBox(x: nextX, y: nextY, width: diameter, height: diameter)
  }

  private static func clamp(_ value: CGFloat, min minValue: CGFloat, max maxValue: CGFloat) -> CGFloat {
    Swift.min(Swift.max(value, minValue), maxValue)
  }
}

private struct JointSample {
  let visionPoint: CGPoint
  let uiPoint: CGPoint
  let confidence: CGFloat
}

private enum ShootingSide {
  case left
  case right
}

private struct BodyPoseCandidate {
  let box: NormalizedBox
  let confidence: CGFloat
  let landmarks: [Double]
  let joints: [VNHumanBodyPoseObservation.JointName: JointSample]
  let shootingSide: ShootingSide
  let torsoColorHex: String?
}

private struct BallTrack {
  let box: NormalizedBox
  let center: CGPoint
  let velocity: CGPoint?
  let confidence: CGFloat
  let radius: CGFloat
}

private struct RimDetection {
  let box: NormalizedBox
  let confidence: CGFloat
  let source: String
}

private struct ProcessorConfig {
  let ballConfidenceThreshold: CGFloat
  let makeConfidenceThreshold: CGFloat
  let frameAnalysisSpacing: CMTime

  static let fallback = ProcessorConfig(
    ballConfidenceThreshold: 0.68,
    makeConfidenceThreshold: 0.88,
    frameAnalysisSpacing: CMTime(value: 1, timescale: 15)
  )
}

private enum NativeWarning: String {
  case hoopLost = "hoop_lost"
  case shooterLost = "shooter_lost"
  case lowConfidence = "low_confidence"
}

@objc(BasketballSessionFrameProcessorPlugin)
public class BasketballSessionFrameProcessorPlugin: FrameProcessorPlugin {
  private let poseConfidenceThreshold: CGFloat = 0.34
  private let requestHandler = VNSequenceRequestHandler()
  private let trajectoryRequestHandler = VNSequenceRequestHandler()
  private let bodyPoseRequest = VNDetectHumanBodyPoseRequest()
  private let trajectoryRequest = VNDetectTrajectoriesRequest(
    frameAnalysisSpacing: CMTime(value: 1, timescale: 15),
    trajectoryLength: 6,
    completionHandler: nil
  )
  private let shotWindowTimeoutMs: Double = 2200
  private let shotOutcomeCooldownMs: Double = 500
  private var lastWristY: CGFloat?
  private var lastWristTimestampMs: Double?
  private var lastReleaseTimestampMs: Double = 0
  private var lastBallCenter: CGPoint?
  private var lastBallTimestampMs: Double?
  private var shotWindowStartedMs: Double?
  private var shotAttemptConfirmed = false
  private var shotSawBallNearRim = false
  private var shotSawBallAboveRim = false
  private var shotBestBallConfidence: CGFloat = 0
  private var lastOutcomeTimestampMs: Double = 0
  private var smoothedRimBox: NormalizedBox?
  private var smoothedRimConfidence: CGFloat = 0
  /// Recent rim box centers/sizes from strong frames — median fuse to reject single-frame outliers.
  private var rimTrackBuffer: [(midX: CGFloat, midY: CGFloat, width: CGFloat, height: CGFloat)] = []
  private let rimTrackMax = 15
  private let rectangleRequest = VNDetectRectanglesRequest()

  private static let landmarkOrder: [VNHumanBodyPoseObservation.JointName] = [
    .nose,
    .neck,
    .root,
    .leftShoulder,
    .rightShoulder,
    .leftElbow,
    .rightElbow,
    .leftWrist,
    .rightWrist,
    .leftHip,
    .rightHip,
    .leftKnee,
    .rightKnee,
    .leftAnkle,
    .rightAnkle,
  ]

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
    trajectoryRequest.targetFrameTime = CMTime(value: 1, timescale: 15)
    rectangleRequest.maximumObservations = 8
    rectangleRequest.minimumConfidence = 0.42
    rectangleRequest.minimumAspectRatio = 0.22
    rectangleRequest.maximumAspectRatio = 2.35
    rectangleRequest.quadratureTolerance = 28 * .pi / 180
    rectangleRequest.minimumSize = 0.055
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any {
    let timestampMs = frame.timestamp
    let processorConfig = Self.parseProcessorConfig(from: arguments)
    let shooterSeed = Self.parseDictionary(from: arguments?["shooterSeed"])
    let shooterSeedBox = Self.parseNormalizedBox(from: shooterSeed?["initialBox"])
    let referenceHoopROI = Self.parseNormalizedBox(from: arguments?["hoopROI"])

    guard let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
      return makeResult(
        timestampMs: timestampMs,
        shooter: nil,
        ballTrack: nil,
        rim: Self.makeReferenceRimDetection(from: referenceHoopROI),
        events: [],
        warnings: referenceHoopROI == nil ? [.hoopLost, .shooterLost] : [.shooterLost]
      )
    }

    let orientation = Self.cgImageOrientation(from: frame.orientation, mirrored: frame.isMirrored)
    let rimDetection = detectRim(pixelBuffer: pixelBuffer, fallback: referenceHoopROI, orientation: orientation)
    let rim = rimDetection?.box
    let shooter = detectPrimaryShooter(
      pixelBuffer: pixelBuffer,
      orientation: orientation,
      shooterSeedBox: shooterSeedBox
    )
    let releaseEvents = shooter.map { detectReleaseEvents(from: $0, timestampMs: timestampMs) } ?? []
    let ballTrack = detectBallTrack(
      pixelBuffer: pixelBuffer,
      orientation: orientation,
      hoopROI: rim,
      config: processorConfig,
      timestampMs: timestampMs
    )
    let shotEvents = detectShotEvents(
      timestampMs: timestampMs,
      shooter: shooter,
      ballTrack: ballTrack,
      rim: rim,
      releaseEvents: releaseEvents,
      config: processorConfig
    )
    var warnings: [NativeWarning] = []

    if rimDetection == nil {
      warnings.append(.hoopLost)
    }

    if shooter == nil {
      warnings.append(.shooterLost)
    } else if (shooter?.confidence ?? 0) < poseConfidenceThreshold {
      warnings.append(.lowConfidence)
    }

    return makeResult(
      timestampMs: timestampMs,
      shooter: shooter,
      ballTrack: ballTrack,
      rim: rimDetection,
      events: shotEvents,
      warnings: warnings
    )
  }

  private func detectPrimaryShooter(
    pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation,
    shooterSeedBox: NormalizedBox?
  ) -> BodyPoseCandidate? {
    do {
      try requestHandler.perform([bodyPoseRequest], on: pixelBuffer, orientation: orientation)
    } catch {
      resetReleaseTracking()
      return nil
    }

    let observations = bodyPoseRequest.results ?? []
    let candidates = observations.compactMap { buildCandidate(from: $0) }
    guard let bestCandidate = selectBestCandidate(from: candidates, shooterSeedBox: shooterSeedBox) else {
      resetReleaseTracking()
      return nil
    }
    return BodyPoseCandidate(
      box: bestCandidate.box,
      confidence: bestCandidate.confidence,
      landmarks: bestCandidate.landmarks,
      joints: bestCandidate.joints,
      shootingSide: bestCandidate.shootingSide,
      torsoColorHex: sampleTorsoColorHex(pixelBuffer: pixelBuffer, candidate: bestCandidate)
    )
  }

  private func buildCandidate(from observation: VNHumanBodyPoseObservation) -> BodyPoseCandidate? {
    guard let points = try? observation.recognizedPoints(.all) else {
      return nil
    }

    var trackedJoints: [VNHumanBodyPoseObservation.JointName: JointSample] = [:]
    var visibleUiPoints: [CGPoint] = []
    var landmarks: [Double] = []

    for jointName in Self.landmarkOrder {
      guard let point = points[jointName], point.confidence > 0.05 else {
        landmarks.append(contentsOf: [-1.0, -1.0, 0.0])
        continue
      }

      let uiPoint = Self.uiPoint(fromVisionPoint: point.location)
      let confidence = CGFloat(point.confidence)
      let jointSample = JointSample(
        visionPoint: point.location,
        uiPoint: uiPoint,
        confidence: confidence
      )

      trackedJoints[jointName] = jointSample
      landmarks.append(contentsOf: [Double(uiPoint.x), Double(uiPoint.y), Double(confidence)])

      if confidence >= 0.15 {
        visibleUiPoints.append(uiPoint)
      }
    }

    guard visibleUiPoints.count >= 5, let shooterSide = selectShootingSide(from: trackedJoints) else {
      return nil
    }

    let minX = visibleUiPoints.map(\.x).min() ?? 0
    let maxX = visibleUiPoints.map(\.x).max() ?? 0
    let minY = visibleUiPoints.map(\.y).min() ?? 0
    let maxY = visibleUiPoints.map(\.y).max() ?? 0
    let width = maxX - minX
    let height = maxY - minY

    guard width > 0.08, height > 0.16 else {
      return nil
    }

    let box = NormalizedBox(x: minX, y: minY, width: width, height: height)
    let confidence = candidateConfidence(for: trackedJoints, shootingSide: shooterSide)

    return BodyPoseCandidate(
      box: box,
      confidence: confidence,
      landmarks: landmarks,
      joints: trackedJoints,
      shootingSide: shooterSide,
      torsoColorHex: nil
    )
  }

  private func selectBestCandidate(
    from candidates: [BodyPoseCandidate],
    shooterSeedBox: NormalizedBox?
  ) -> BodyPoseCandidate? {
    candidates.max { left, right in
      scoreCandidate(left, shooterSeedBox: shooterSeedBox) < scoreCandidate(right, shooterSeedBox: shooterSeedBox)
    }
  }

  private func scoreCandidate(_ candidate: BodyPoseCandidate, shooterSeedBox: NormalizedBox?) -> CGFloat {
    let areaScore = Self.clamp(candidate.box.area * 3.4, min: 0, max: 1)
    let centerDistance = hypot(candidate.box.midX - 0.5, candidate.box.midY - 0.68)
    let centerScore = 1 - Self.clamp(centerDistance * 1.5, min: 0, max: 1)

    if let shooterSeedBox {
      let overlapScore = candidate.box.intersectionOverUnion(with: shooterSeedBox)
      return (overlapScore * 0.58) + (candidate.confidence * 0.3) + (areaScore * 0.12)
    }

    return (candidate.confidence * 0.5) + (areaScore * 0.22) + (centerScore * 0.28)
  }

  private func candidateConfidence(
    for joints: [VNHumanBodyPoseObservation.JointName: JointSample],
    shootingSide: ShootingSide
  ) -> CGFloat {
    let preferredJoints: [VNHumanBodyPoseObservation.JointName]

    switch shootingSide {
    case .left:
      preferredJoints = [.neck, .root, .leftShoulder, .rightShoulder, .leftElbow, .leftWrist, .leftHip, .rightHip]
    case .right:
      preferredJoints = [.neck, .root, .leftShoulder, .rightShoulder, .rightElbow, .rightWrist, .leftHip, .rightHip]
    }

    let confidences = preferredJoints.compactMap { joints[$0]?.confidence }
    if confidences.isEmpty {
      return 0
    }

    let average = confidences.reduce(CGFloat.zero, +) / CGFloat(confidences.count)
    return Self.clamp(average, min: 0, max: 1)
  }

  private func sampleTorsoColorHex(pixelBuffer: CVPixelBuffer, candidate: BodyPoseCandidate) -> String? {
    let width = CVPixelBufferGetWidth(pixelBuffer)
    let height = CVPixelBufferGetHeight(pixelBuffer)
    guard width > 0, height > 0 else {
      return nil
    }

    let torsoBox = NormalizedBox(
      x: candidate.box.x + (candidate.box.width * 0.24),
      y: candidate.box.y + (candidate.box.height * 0.14),
      width: candidate.box.width * 0.52,
      height: candidate.box.height * 0.30
    )
    let pixelFormat = CVPixelBufferGetPixelFormatType(pixelBuffer)

    CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
    defer {
      CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
    }

    var redTotal: CGFloat = 0
    var greenTotal: CGFloat = 0
    var blueTotal: CGFloat = 0
    var sampleCount: CGFloat = 0

    for rowIndex in 0..<4 {
      for columnIndex in 0..<4 {
        let normalizedX = torsoBox.x + torsoBox.width * ((CGFloat(columnIndex) + 0.5) / 4)
        let normalizedY = torsoBox.y + torsoBox.height * ((CGFloat(rowIndex) + 0.5) / 4)
        let pixelX = Int(Self.clamp(normalizedX, min: 0, max: 0.999) * CGFloat(width))
        let pixelY = Int(Self.clamp(normalizedY, min: 0, max: 0.999) * CGFloat(height))

        guard let color = Self.samplePixelColor(pixelBuffer: pixelBuffer, pixelFormat: pixelFormat, x: pixelX, y: pixelY) else {
          continue
        }

        redTotal += color.red
        greenTotal += color.green
        blueTotal += color.blue
        sampleCount += 1
      }
    }

    guard sampleCount > 0 else {
      return nil
    }

    return Self.hexColor(
      red: redTotal / sampleCount,
      green: greenTotal / sampleCount,
      blue: blueTotal / sampleCount
    )
  }

  private func selectShootingSide(
    from joints: [VNHumanBodyPoseObservation.JointName: JointSample]
  ) -> ShootingSide? {
    let leftWrist = joints[.leftWrist]
    let rightWrist = joints[.rightWrist]

    switch (leftWrist, rightWrist) {
    case let (.some(left), .some(right)):
      if abs(left.visionPoint.y - right.visionPoint.y) > 0.03 {
        return left.visionPoint.y > right.visionPoint.y ? .left : .right
      }
      return left.confidence >= right.confidence ? .left : .right
    case (.some, nil):
      return .left
    case (nil, .some):
      return .right
    case (nil, nil):
      return nil
    }
  }

  private func detectReleaseEvents(from shooter: BodyPoseCandidate, timestampMs: Double) -> [[String: Any]] {
    let wristJointName: VNHumanBodyPoseObservation.JointName = shooter.shootingSide == .left ? .leftWrist : .rightWrist
    let elbowJointName: VNHumanBodyPoseObservation.JointName = shooter.shootingSide == .left ? .leftElbow : .rightElbow
    let shoulderJointName: VNHumanBodyPoseObservation.JointName = shooter.shootingSide == .left ? .leftShoulder : .rightShoulder

    guard
      let wrist = shooter.joints[wristJointName],
      let shoulder = shooter.joints[shoulderJointName]
    else {
      resetReleaseTracking()
      return []
    }

    let elbow = shooter.joints[elbowJointName]
    let deltaTimeMs = timestampMs - (lastWristTimestampMs ?? timestampMs)
    let deltaTimeSeconds = max(deltaTimeMs / 1000, 0.001)
    let upwardVelocity = lastWristY.map { (wrist.visionPoint.y - $0) / CGFloat(deltaTimeSeconds) } ?? 0
    let verticalLift = wrist.visionPoint.y - shoulder.visionPoint.y
    let armSpan = hypot(wrist.visionPoint.x - shoulder.visionPoint.x, wrist.visionPoint.y - shoulder.visionPoint.y)
    let elbowSpan = elbow.map {
      hypot($0.visionPoint.x - shoulder.visionPoint.x, $0.visionPoint.y - shoulder.visionPoint.y)
    } ?? 0
    let extensionMargin = armSpan - elbowSpan
    let cooldownElapsed = timestampMs - lastReleaseTimestampMs

    lastWristY = wrist.visionPoint.y
    lastWristTimestampMs = timestampMs

    let hasReleaseShape = verticalLift > 0.05 && armSpan > 0.12 && extensionMargin > 0.015
    let hasReleaseMotion = upwardVelocity > 0.22

    guard hasReleaseShape, hasReleaseMotion, cooldownElapsed > 900 else {
      return []
    }

    lastReleaseTimestampMs = timestampMs
    let velocityScore = Self.clamp(upwardVelocity / 1.4, min: 0, max: 1)
    let geometryScore = Self.clamp((verticalLift * 4.5) + (extensionMargin * 6), min: 0, max: 1)
    let releaseConfidence = Double(Self.clamp(
      (shooter.confidence * 0.55) + (velocityScore * 0.25) + (geometryScore * 0.2),
      min: 0,
      max: 0.98
    ))

    return [[
      "type": "release",
      "confidence": releaseConfidence,
    ]]
  }

  /// Vision uses a bottom-left origin; we use top-left normalized UI space (same as pose landmarks).
  private static func normalizedBoxFromVisionBoundingBox(_ rect: CGRect) -> NormalizedBox {
    NormalizedBox(
      x: rect.origin.x,
      y: 1 - rect.origin.y - rect.size.height,
      width: rect.size.width,
      height: rect.size.height
    )
  }

  /// Apple Vision **rectangle detection** (on-device CV) finds rigid quads — often backboard / structural edges.
  /// We convert the best candidate into a **rim search band** under that geometry, then the per-frame orange scan
  /// runs inside that band so coordinates track plausible hoop geometry instead of the whole frame.
  private func visionBackboardRimSearchBand(
    pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation,
    fallback: NormalizedBox?
  ) -> NormalizedBox? {
    do {
      let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: orientation, options: [:])
      try handler.perform([rectangleRequest])
    } catch {
      return nil
    }

    guard let observations = rectangleRequest.results, !observations.isEmpty else {
      return nil
    }

    var scored: [(box: NormalizedBox, score: CGFloat)] = []

    for observation in observations {
      let box = Self.normalizedBoxFromVisionBoundingBox(observation.boundingBox)
      let aspect = box.width / max(box.height, 0.001)
      guard aspect >= 0.28, aspect <= 2.6, box.midY < 0.64 else {
        continue
      }

      let conf = CGFloat(observation.confidence)
      let overlap = fallback.map { max(0.04, box.intersectionOverUnion(with: $0.expanded(xInset: 0.14, yInset: 0.2))) } ?? 0.22
      let upperBias = 1 - Self.clamp(box.midY / 0.72, min: 0, max: 1)
      let score = conf * 0.55 + overlap * 0.32 + upperBias * 0.13
      scored.append((box, score))
    }

    guard let best = scored.max(by: { $0.score < $1.score }) else {
      return nil
    }

    let board = best.box
    let bandWidth = min(0.95, max(board.width * 1.22, (fallback?.width ?? board.width) * 1.4))
    let bandHeight = max(0.07, fallback?.height ?? 0.095)
    let anchorY = min(0.6, max(0.04, board.y + board.height * 0.78))
    let cx = board.midX
    var nx = max(0.03, cx - bandWidth * 0.5)
    nx = min(nx, 0.97 - bandWidth)
    let ny = max(0.04, anchorY - bandHeight * 0.4)
    let nh = min(bandHeight, 1 - ny - 0.03)
    let nw = min(bandWidth, 1 - nx - 0.02)

    return NormalizedBox(x: nx, y: ny, width: nw, height: nh)
  }

  /// Rolling median over recent strong rim estimates — rejects one-frame false oranges while still updating every frame.
  private func medianFusedRim(following box: NormalizedBox) -> NormalizedBox {
    rimTrackBuffer.append((box.midX, box.midY, box.width, box.height))

    if rimTrackBuffer.count > rimTrackMax {
      rimTrackBuffer.removeFirst()
    }

    guard rimTrackBuffer.count >= 5 else {
      return box
    }

    let xs = rimTrackBuffer.map(\.midX).sorted()
    let ys = rimTrackBuffer.map(\.midY).sorted()
    let ws = rimTrackBuffer.map(\.width).sorted()
    let hs = rimTrackBuffer.map(\.height).sorted()
    let mid = rimTrackBuffer.count / 2
    let mx = xs[mid]
    let my = ys[mid]
    let mw = ws[mid]
    let mh = hs[mid]
    let x = max(0, min(mx - mw * 0.5, 1 - mw - 0.02))
    let y = max(0, min(my - mh * 0.45, 1 - mh - 0.02))

    return NormalizedBox(x: x, y: y, width: mw, height: mh)
  }

  /// Rim localization: **Vision rectangle prior** (rigid structure) + **per-frame color/contrast grid** (heuristic),
  /// **biased toward `hoopROI`**, temporally smoothed and **median-fused** across recent frames. Weak frames ease
  /// toward the hoop guide. For production-grade accuracy under all lighting, add a **Core ML rim detector** and
  /// plug it in ahead of or instead of the orange heuristic.
  private func detectRim(pixelBuffer: CVPixelBuffer, fallback: NormalizedBox?, orientation: CGImagePropertyOrientation)
    -> RimDetection? {
    let width = CVPixelBufferGetWidth(pixelBuffer)
    let height = CVPixelBufferGetHeight(pixelBuffer)
    let pixelFormat = CVPixelBufferGetPixelFormatType(pixelBuffer)

    guard width > 0, height > 0 else {
      return Self.makeReferenceRimDetection(from: fallback)
    }

    let candidateWidth = Self.clamp(fallback?.width ?? 0.18, min: 0.12, max: 0.26)
    let candidateHeight = Self.clamp(fallback?.height ?? 0.10, min: 0.07, max: 0.16)
    var bestCandidate: (box: NormalizedBox, score: CGFloat)?

    CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
    defer {
      CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
    }

    func considerAnchor(normalizedX: CGFloat, normalizedY: CGFloat) {
      let pixelX = Int((normalizedX * CGFloat(width)).rounded())
      let pixelY = Int((normalizedY * CGFloat(height)).rounded())
      let patchScore = Self.rimPatchOrangeScore(
        pixelBuffer: pixelBuffer,
        pixelFormat: pixelFormat,
        width: width,
        height: height,
        centerX: pixelX,
        centerY: pixelY
      )

      if patchScore < 0.17 {
        return
      }

      let box = NormalizedBox(
        x: Self.clamp(normalizedX - (candidateWidth * 0.5), min: 0, max: 1 - candidateWidth),
        y: Self.clamp(normalizedY - (candidateHeight * 0.45), min: 0, max: 1 - candidateHeight),
        width: candidateWidth,
        height: candidateHeight
      )
      let contrastScore = Self.rimContrastScore(
        pixelBuffer: pixelBuffer,
        pixelFormat: pixelFormat,
        width: width,
        height: height,
        x: pixelX,
        y: pixelY
      )
      let fallbackScore = fallback.map { box.intersectionOverUnion(with: $0) } ?? 0.38
      let upperFrameScore = 1 - Self.clamp(abs(normalizedY - 0.24) / 0.34, min: 0, max: 1)
      let score = (patchScore * 0.52) + (contrastScore * 0.2) + (fallbackScore * 0.22) + (upperFrameScore * 0.06)

      if bestCandidate == nil || score > (bestCandidate?.score ?? 0) {
        bestCandidate = (box, score)
      }
    }

    func scanRect(minNX: CGFloat, maxNX: CGFloat, minNY: CGFloat, maxNY: CGFloat, step: CGFloat) {
      var ny = minNY

      while ny <= maxNY {
        var nx = minNX

        while nx <= maxNX {
          considerAnchor(normalizedX: nx, normalizedY: ny)
          nx += step
        }

        ny += step
      }
    }

    // Phase 0 — Vision-derived rim strip from rigid rectangles (typically backboard / frame geometry).
    let visionBand = visionBackboardRimSearchBand(
      pixelBuffer: pixelBuffer,
      orientation: orientation,
      fallback: fallback
    )

    if let band = visionBand {
      scanRect(
        minNX: max(0.04, band.x),
        maxNX: min(0.96, band.right),
        minNY: max(0.04, band.y),
        maxNY: min(0.62, band.bottom),
        step: 0.01
      )
    }

    // Phase 1 — fine search around the app hoop ROI (where the rim is expected).
    if let fb = fallback {
      let spanX = max(fb.width * 2.1, 0.24)
      let spanY = max(fb.height * 2.6, 0.2)
      let minNX = max(0.05, fb.midX - spanX * 0.5)
      let maxNX = min(0.95, fb.midX + spanX * 0.5)
      let minNY = max(0.06, fb.midY - spanY * 0.5)
      let maxNY = min(0.58, fb.midY + spanY * 0.5)
      scanRect(minNX: minNX, maxNX: maxNX, minNY: minNY, maxNY: maxNY, step: 0.012)
    }

    // Phase 2 — coarser full upper-frame pass if the local search is weak or there is no ROI prior.
    let localPeak = bestCandidate?.score ?? 0

    if localPeak < 0.43 || fallback == nil {
      scanRect(minNX: 0.08, maxNX: 0.92, minNY: 0.08, maxNY: 0.54, step: 0.025)
    }

    if let bestCandidate, bestCandidate.score >= 0.38 {
      let smoothedBox = Self.blendRimBox(current: bestCandidate.box, previous: smoothedRimBox)
      let fusedBox = medianFusedRim(following: smoothedBox)
      let confidence = Self.clamp(bestCandidate.score * 1.18, min: 0.45, max: 0.97)
      smoothedRimBox = fusedBox
      smoothedRimConfidence = confidence

      return RimDetection(
        box: fusedBox,
        confidence: confidence,
        source: fallback.map { fusedBox.intersectionOverUnion(with: $0) > 0.15 } == true ? "refined" : "detected"
      )
    }

    // No strong peak this frame: keep re-evaluating by easing toward the hoop guide instead of freezing a stale box.
    if let fb = fallback {
      if let prev = smoothedRimBox {
        let eased = Self.lerpBox(from: prev, to: fb, t: 0.12)
        smoothedRimBox = eased
        smoothedRimConfidence = max(0.38, smoothedRimConfidence * 0.91)

        return RimDetection(box: eased, confidence: smoothedRimConfidence, source: "reference")
      }

      return Self.makeReferenceRimDetection(from: fb)
    }

    if let smoothedRimBox {
      smoothedRimConfidence *= 0.9

      return RimDetection(
        box: smoothedRimBox,
        confidence: max(0.35, smoothedRimConfidence),
        source: "refined"
      )
    }

    return Self.makeReferenceRimDetection(from: fallback)
  }

  private static func makeReferenceRimDetection(from box: NormalizedBox?) -> RimDetection? {
    guard let box else {
      return nil
    }

    return RimDetection(box: box, confidence: 0.58, source: "reference")
  }

  private static func blendRimBox(current: NormalizedBox, previous: NormalizedBox?) -> NormalizedBox {
    guard let previous else {
      return current
    }

    let iou = current.intersectionOverUnion(with: previous)
    // Favor the fresh peak when it disagrees with history so wrong locks can correct quickly.
    let currentWeight: CGFloat = iou > 0.22 ? 0.58 : 0.84
    let previousWeight = 1 - currentWeight

    return NormalizedBox(
      x: (current.x * currentWeight) + (previous.x * previousWeight),
      y: (current.y * currentWeight) + (previous.y * previousWeight),
      width: (current.width * currentWeight) + (previous.width * previousWeight),
      height: (current.height * currentWeight) + (previous.height * previousWeight)
    )
  }

  private static func lerpBox(from a: NormalizedBox, to b: NormalizedBox, t: CGFloat) -> NormalizedBox {
    let t = clamp(t, min: 0, max: 1)

    return NormalizedBox(
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      width: a.width + (b.width - a.width) * t,
      height: a.height + (b.height - a.height) * t
    )
  }

  /// Small YUV/BGR patch average of `orangeRimScore` — less jitter than a single pixel.
  private static func rimPatchOrangeScore(
    pixelBuffer: CVPixelBuffer,
    pixelFormat: OSType,
    width: Int,
    height: Int,
    centerX: Int,
    centerY: Int
  ) -> CGFloat {
    var accum: CGFloat = 0
    var count: CGFloat = 0

    for dy in -2...2 {
      for dx in -2...2 {
        let x = centerX + dx
        let y = centerY + dy

        guard let color = samplePixelColor(pixelBuffer: pixelBuffer, pixelFormat: pixelFormat, x: x, y: y) else {
          continue
        }

        accum += orangeRimScore(red: color.red, green: color.green, blue: color.blue)
        count += 1
      }
    }

    return count > 0 ? accum / count : 0
  }

  private static func orangeRimScore(red: CGFloat, green: CGFloat, blue: CGFloat) -> CGFloat {
    let warmth = clamp((red - blue) / 180, min: 0, max: 1)
    let redStrength = clamp((red - 90) / 150, min: 0, max: 1)
    let greenBand = 1 - clamp(abs(green - (red * 0.55)) / 130, min: 0, max: 1)
    let bluePenalty = 1 - clamp(blue / max(red, 1), min: 0, max: 1)

    return clamp(
      (warmth * 0.36) + (redStrength * 0.28) + (greenBand * 0.20) + (bluePenalty * 0.16),
      min: 0,
      max: 1
    )
  }

  private static func rimContrastScore(
    pixelBuffer: CVPixelBuffer,
    pixelFormat: OSType,
    width: Int,
    height: Int,
    x: Int,
    y: Int
  ) -> CGFloat {
    guard let center = samplePixelColor(pixelBuffer: pixelBuffer, pixelFormat: pixelFormat, x: x, y: y) else {
      return 0
    }

    let offset = max(4, min(width, height) / 48)
    let samples = [
      samplePixelColor(pixelBuffer: pixelBuffer, pixelFormat: pixelFormat, x: x, y: y - offset),
      samplePixelColor(pixelBuffer: pixelBuffer, pixelFormat: pixelFormat, x: x, y: y + offset),
      samplePixelColor(pixelBuffer: pixelBuffer, pixelFormat: pixelFormat, x: x - offset, y: y),
      samplePixelColor(pixelBuffer: pixelBuffer, pixelFormat: pixelFormat, x: x + offset, y: y),
    ].compactMap { $0 }

    guard !samples.isEmpty else {
      return 0
    }

    let centerBrightness = (center.red + center.green + center.blue) / 3
    let surroundingBrightness = samples
      .map { ($0.red + $0.green + $0.blue) / 3 }
      .reduce(CGFloat.zero, +) / CGFloat(samples.count)

    return clamp((centerBrightness - surroundingBrightness) / 80, min: 0, max: 1)
  }

  private func detectBallTrack(
    pixelBuffer: CVPixelBuffer,
    orientation: CGImagePropertyOrientation,
    hoopROI: NormalizedBox?,
    config: ProcessorConfig,
    timestampMs: Double
  ) -> BallTrack? {
    guard let hoopROI else {
      resetBallTracking()
      return nil
    }

    let searchRegion = hoopROI.expanded(xInset: hoopROI.width * 2.4, yInset: hoopROI.height * 3.1)
    trajectoryRequest.regionOfInterest = searchRegion.toVisionRect()
    trajectoryRequest.targetFrameTime = config.frameAnalysisSpacing
    trajectoryRequest.objectMinimumNormalizedRadius = Float(max(0.004, hoopROI.width * 0.06))
    trajectoryRequest.objectMaximumNormalizedRadius = Float(min(0.18, hoopROI.width * 0.42))

    do {
      try trajectoryRequestHandler.perform([trajectoryRequest], on: pixelBuffer, orientation: orientation)
    } catch {
      resetBallTracking()
      return nil
    }

    let observations = trajectoryRequest.results ?? []
    guard let selectedObservation = selectBestTrajectory(from: observations, rim: hoopROI) else {
      if let lastBallTimestampMs, timestampMs - lastBallTimestampMs > 260 {
        resetBallTracking()
      }
      return nil
    }

    return makeBallTrack(from: selectedObservation, timestampMs: timestampMs)
  }

  private func selectBestTrajectory(
    from observations: [VNTrajectoryObservation],
    rim: NormalizedBox
  ) -> VNTrajectoryObservation? {
    observations.max { left, right in
      scoreTrajectory(left, rim: rim) < scoreTrajectory(right, rim: rim)
    }
  }

  private func scoreTrajectory(_ observation: VNTrajectoryObservation, rim: NormalizedBox) -> CGFloat {
    guard let latestVisionPoint = latestTrajectoryVisionPoint(for: observation) else {
      return 0
    }

    let latestUiPoint = Self.uiPoint(fromVisionPoint: latestVisionPoint)
    let radius = max(observation.movingAverageRadius, rim.width * 0.08)
    let horizontalScore = 1 - Self.clamp(abs(latestUiPoint.x - rim.midX) / max(rim.width * 2.6, 0.001), min: 0, max: 1)
    let verticalScore = 1 - Self.clamp(abs(latestUiPoint.y - (rim.y + (rim.height * 0.85))) / max(rim.height * 4.0, 0.001), min: 0, max: 1)
    let sizeTarget = rim.width * 0.18
    let sizeScore = 1 - Self.clamp(abs(radius - sizeTarget) / max(rim.width * 0.32, 0.001), min: 0, max: 1)
    let confidenceScore = CGFloat(observation.confidence)

    return (confidenceScore * 0.46) + (horizontalScore * 0.26) + (verticalScore * 0.18) + (sizeScore * 0.10)
  }

  private func latestTrajectoryVisionPoint(for observation: VNTrajectoryObservation) -> CGPoint? {
    if let projected = observation.projectedPoints.last {
      return projected.location
    }
    return observation.detectedPoints.last?.location
  }

  private func makeBallTrack(from observation: VNTrajectoryObservation, timestampMs: Double) -> BallTrack? {
    guard let latestVisionPoint = latestTrajectoryVisionPoint(for: observation) else {
      return nil
    }

    let center = Self.uiPoint(fromVisionPoint: latestVisionPoint)
    let radius = max(CGFloat(observation.movingAverageRadius), 0.008)
    let box = NormalizedBox.around(point: center, radius: radius)
    let velocity: CGPoint?

    if let lastBallCenter, let lastBallTimestampMs {
      let deltaMs = timestampMs - lastBallTimestampMs
      if deltaMs > 0, deltaMs < 260 {
        let deltaSeconds = CGFloat(deltaMs / 1000)
        velocity = CGPoint(
          x: (center.x - lastBallCenter.x) / max(deltaSeconds, 0.001),
          y: (center.y - lastBallCenter.y) / max(deltaSeconds, 0.001)
        )
      } else {
        velocity = nil
      }
    } else {
      velocity = nil
    }

    lastBallCenter = center
    lastBallTimestampMs = timestampMs

    return BallTrack(
      box: box,
      center: center,
      velocity: velocity,
      confidence: CGFloat(observation.confidence),
      radius: radius
    )
  }

  private func detectShotEvents(
    timestampMs: Double,
    shooter: BodyPoseCandidate?,
    ballTrack: BallTrack?,
    rim: NormalizedBox?,
    releaseEvents: [[String: Any]],
    config: ProcessorConfig
  ) -> [[String: Any]] {
    var events = releaseEvents

    if !releaseEvents.isEmpty {
      beginShotWindow(at: timestampMs)
    }

    guard let shotWindowStartedMs else {
      return events
    }

    if timestampMs - shotWindowStartedMs > shotWindowTimeoutMs {
      if shotAttemptConfirmed && timestampMs - lastOutcomeTimestampMs > shotOutcomeCooldownMs {
        let missConfidence = Double(Self.clamp(
          (shotBestBallConfidence * 0.6) + ((shooter?.confidence ?? 0) * 0.25) + (shotSawBallAboveRim ? 0.15 : 0),
          min: 0.58,
          max: 0.86
        ))

        events.append([
          "type": "miss",
          "confidence": missConfidence,
        ])
        lastOutcomeTimestampMs = timestampMs
      }
      resetShotWindow()
      return events
    }

    guard let rim, let ballTrack else {
      return events
    }

    shotBestBallConfidence = max(shotBestBallConfidence, ballTrack.confidence)
    let horizontalMargin = max(rim.width * 0.42, ballTrack.radius * 2.6)
    let verticalMargin = max(rim.height * 0.7, ballTrack.radius * 2.0)
    let isNearRimColumn = rim.contains(point: ballTrack.center, marginX: horizontalMargin, marginY: verticalMargin)
    let isAboveRim = (ballTrack.center.y + ballTrack.radius) <= (rim.y + (rim.height * 0.16))
    let isBelowRim = (ballTrack.center.y - ballTrack.radius) >= rim.midY
    let downwardVelocity = (ballTrack.velocity?.y ?? 0) > 0.03
    let attemptFloor = max(0.36, config.ballConfidenceThreshold * 0.72)

    shotSawBallNearRim = shotSawBallNearRim || isNearRimColumn
    shotSawBallAboveRim = shotSawBallAboveRim || (isNearRimColumn && isAboveRim)

    if !shotAttemptConfirmed, ballTrack.confidence >= attemptFloor, (shotSawBallNearRim || shotSawBallAboveRim) {
      shotAttemptConfirmed = true
      let attemptConfidence = Double(Self.clamp(
        (ballTrack.confidence * 0.68) + ((shooter?.confidence ?? 0) * 0.32),
        min: 0.55,
        max: 0.97
      ))
      events.append([
        "type": "attempt",
        "confidence": attemptConfidence,
      ])
    }

    let centerOffset = abs(ballTrack.center.x - rim.midX)
    let alignmentScore = 1 - Self.clamp(centerOffset / max(rim.width * 0.92, 0.001), min: 0, max: 1)
    let descentScore = Self.clamp(((ballTrack.velocity?.y ?? 0) - 0.02) / 0.2, min: 0, max: 1)
    let rimDepthScore = Self.clamp((ballTrack.center.y - rim.midY) / max(rim.height * 1.5, 0.001), min: 0, max: 1)
    let makeConfidence = Self.clamp(
      (ballTrack.confidence * 0.46) +
        (alignmentScore * 0.24) +
        (descentScore * 0.18) +
        (rimDepthScore * 0.12),
      min: 0,
      max: 0.98
    )
    let makeThreshold = max(0.58, config.makeConfidenceThreshold * 0.82)

    if shotAttemptConfirmed,
      shotSawBallAboveRim,
      isNearRimColumn,
      isBelowRim,
      downwardVelocity,
      makeConfidence >= makeThreshold,
      timestampMs - lastOutcomeTimestampMs > shotOutcomeCooldownMs {
      events.append([
        "type": "make",
        "confidence": Double(makeConfidence),
      ])
      lastOutcomeTimestampMs = timestampMs
      resetShotWindow()
    }

    return events
  }

  private func beginShotWindow(at timestampMs: Double) {
    shotWindowStartedMs = timestampMs
    shotAttemptConfirmed = false
    shotSawBallNearRim = false
    shotSawBallAboveRim = false
    shotBestBallConfidence = 0
  }

  private func makeResult(
    timestampMs: Double,
    shooter: BodyPoseCandidate?,
    ballTrack: BallTrack?,
    rim: RimDetection?,
    events: [[String: Any]],
    warnings: [NativeWarning]
  ) -> [String: Any] {
    var shooterPayload: [String: Any] = [
      "tracked": shooter != nil,
      "confidence": Double(shooter?.confidence ?? 0),
    ]
    if let shooter {
      shooterPayload["box"] = shooter.box.toDictionary()
      shooterPayload["landmarks"] = shooter.landmarks
      if let torsoColorHex = shooter.torsoColorHex {
        shooterPayload["appearance"] = [
          "torsoColor": torsoColorHex,
        ]
      }
    }

    var ballPayload: [String: Any] = [
      "detected": ballTrack != nil,
      "confidence": Double(ballTrack?.confidence ?? 0),
    ]
    if let ballTrack {
      ballPayload["box"] = ballTrack.box.toDictionary()
      if let velocity = ballTrack.velocity {
        ballPayload["velocity"] = [
          "x": Double(velocity.x),
          "y": Double(velocity.y),
        ]
      }
    }

    var rimPayload: [String: Any] = [
      "detected": rim != nil,
      "confidence": Double(rim?.confidence ?? 0),
    ]
    if let rim {
      rimPayload["box"] = rim.box.toDictionary()
      rimPayload["source"] = rim.source
    }

    return [
      "timestampMs": timestampMs,
      "shooter": shooterPayload,
      "ball": ballPayload,
      "rim": rimPayload,
      "events": events,
      "warnings": Array(Set(warnings.map(\.rawValue))).sorted(),
    ]
  }

  private func resetReleaseTracking() {
    lastWristY = nil
    lastWristTimestampMs = nil
  }

  private func resetBallTracking() {
    lastBallCenter = nil
    lastBallTimestampMs = nil
  }

  private func resetShotWindow() {
    shotWindowStartedMs = nil
    shotAttemptConfirmed = false
    shotSawBallNearRim = false
    shotSawBallAboveRim = false
    shotBestBallConfidence = 0
  }

  private static func samplePixelColor(
    pixelBuffer: CVPixelBuffer,
    pixelFormat: OSType,
    x: Int,
    y: Int
  ) -> (red: CGFloat, green: CGFloat, blue: CGFloat)? {
    switch pixelFormat {
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange,
      kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
      guard
        CVPixelBufferGetPlaneCount(pixelBuffer) >= 2,
        let yBaseAddress = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0),
        let uvBaseAddress = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1)
      else {
        return nil
      }

      let yWidth = CVPixelBufferGetWidthOfPlane(pixelBuffer, 0)
      let yHeight = CVPixelBufferGetHeightOfPlane(pixelBuffer, 0)
      let uvWidth = CVPixelBufferGetWidthOfPlane(pixelBuffer, 1)
      let uvHeight = CVPixelBufferGetHeightOfPlane(pixelBuffer, 1)
      let yStride = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0)
      let uvStride = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1)
      let yPointer = yBaseAddress.assumingMemoryBound(to: UInt8.self)
      let uvPointer = uvBaseAddress.assumingMemoryBound(to: UInt8.self)
      let safeX = min(max(x, 0), max(0, yWidth - 1))
      let safeY = min(max(y, 0), max(0, yHeight - 1))
      let uvX = min(max(safeX / 2, 0), max(0, uvWidth - 1))
      let uvY = min(max(safeY / 2, 0), max(0, uvHeight - 1))
      let yValue = CGFloat(yPointer[(safeY * yStride) + safeX])
      let uvIndex = (uvY * uvStride) + (uvX * 2)
      let cb = CGFloat(uvPointer[uvIndex]) - 128
      let cr = CGFloat(uvPointer[uvIndex + 1]) - 128

      return (
        red: clamp(yValue + (1.402 * cr), min: 0, max: 255),
        green: clamp(yValue - (0.344136 * cb) - (0.714136 * cr), min: 0, max: 255),
        blue: clamp(yValue + (1.772 * cb), min: 0, max: 255)
      )

    case kCVPixelFormatType_32BGRA:
      guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
        return nil
      }

      let width = CVPixelBufferGetWidth(pixelBuffer)
      let height = CVPixelBufferGetHeight(pixelBuffer)
      let stride = CVPixelBufferGetBytesPerRow(pixelBuffer)
      let pointer = baseAddress.assumingMemoryBound(to: UInt8.self)
      let safeX = min(max(x, 0), max(0, width - 1))
      let safeY = min(max(y, 0), max(0, height - 1))
      let offset = (safeY * stride) + (safeX * 4)

      return (
        red: CGFloat(pointer[offset + 2]),
        green: CGFloat(pointer[offset + 1]),
        blue: CGFloat(pointer[offset])
      )

    default:
      return nil
    }
  }

  private static func hexColor(red: CGFloat, green: CGFloat, blue: CGFloat) -> String {
    let redComponent = Int(clamp(red, min: 0, max: 255))
    let greenComponent = Int(clamp(green, min: 0, max: 255))
    let blueComponent = Int(clamp(blue, min: 0, max: 255))

    return String(format: "#%02X%02X%02X", redComponent, greenComponent, blueComponent)
  }

  private static func parseDictionary(from value: Any?) -> [AnyHashable: Any]? {
    if let dictionary = value as? [AnyHashable: Any] {
      return dictionary
    }
    if let dictionary = value as? [String: Any] {
      return dictionary
    }
    return nil
  }

  private static func parseProcessorConfig(from arguments: [AnyHashable: Any]?) -> ProcessorConfig {
    guard let sessionConfig = parseDictionary(from: arguments?["sessionConfig"]) else {
      return .fallback
    }

    let ballConfidenceThreshold = parseCGFloat(from: sessionConfig["ballConfidenceThreshold"]) ?? Self.fallbackBallThreshold
    let makeConfidenceThreshold = parseCGFloat(from: sessionConfig["makeConfidenceThreshold"]) ?? Self.fallbackMakeThreshold
    let processEveryNthFrame = max(1, Int(parseCGFloat(from: sessionConfig["processEveryNthFrame"]) ?? 2))
    let targetFps = max(1, Int(parseCGFloat(from: sessionConfig["targetFps"]) ?? 30))
    let processedFps = max(1, targetFps / processEveryNthFrame)

    return ProcessorConfig(
      ballConfidenceThreshold: ballConfidenceThreshold,
      makeConfidenceThreshold: makeConfidenceThreshold,
      frameAnalysisSpacing: CMTime(value: 1, timescale: Int32(processedFps))
    )
  }

  private static var fallbackBallThreshold: CGFloat {
    ProcessorConfig.fallback.ballConfidenceThreshold
  }

  private static var fallbackMakeThreshold: CGFloat {
    ProcessorConfig.fallback.makeConfidenceThreshold
  }

  private static func parseNormalizedBox(from value: Any?) -> NormalizedBox? {
    guard let box = parseDictionary(from: value) else {
      return nil
    }

    guard
      let x = parseCGFloat(from: box["x"]),
      let y = parseCGFloat(from: box["y"]),
      let width = parseCGFloat(from: box["width"]),
      let height = parseCGFloat(from: box["height"])
    else {
      return nil
    }

    return NormalizedBox(x: x, y: y, width: width, height: height)
  }

  private static func parseCGFloat(from value: Any?) -> CGFloat? {
    switch value {
    case let number as NSNumber:
      return CGFloat(truncating: number)
    case let double as Double:
      return CGFloat(double)
    case let float as Float:
      return CGFloat(float)
    case let int as Int:
      return CGFloat(int)
    default:
      return nil
    }
  }

  private static func uiPoint(fromVisionPoint point: CGPoint) -> CGPoint {
    CGPoint(x: point.x, y: 1 - point.y)
  }

  private static func cgImageOrientation(from orientation: UIImage.Orientation, mirrored: Bool) -> CGImagePropertyOrientation {
    switch (orientation, mirrored) {
    case (.up, false):
      return .up
    case (.up, true):
      return .upMirrored
    case (.down, false):
      return .down
    case (.down, true):
      return .downMirrored
    case (.left, false):
      return .left
    case (.left, true):
      return .leftMirrored
    case (.right, false):
      return .right
    case (.right, true):
      return .rightMirrored
    case (.upMirrored, _):
      return .upMirrored
    case (.downMirrored, _):
      return .downMirrored
    case (.leftMirrored, _):
      return .leftMirrored
    case (.rightMirrored, _):
      return .rightMirrored
    @unknown default:
      return mirrored ? .upMirrored : .up
    }
  }

  private static func clamp(_ value: CGFloat, min minValue: CGFloat, max maxValue: CGFloat) -> CGFloat {
    Swift.min(Swift.max(value, minValue), maxValue)
  }
}
