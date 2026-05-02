Pod::Spec.new do |s|
  s.name           = 'BasketballSessionProcessor'
  s.version        = '1.0.0'
  s.summary        = 'VisionCamera frame processor scaffold for basketball session analysis'
  s.description    = 'Registers the basketballSessionProcessor VisionCamera plugin for Expo development builds.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'VisionCamera'
  s.frameworks = ['Vision', 'CoreMedia', 'CoreVideo', 'ImageIO', 'UIKit']

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
