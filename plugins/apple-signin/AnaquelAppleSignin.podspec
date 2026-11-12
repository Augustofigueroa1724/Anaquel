require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# El nombre del pod tiene que ser EXACTAMENTE el que la CLI de Capacitor deriva del
# paquete npm (anaquel-apple-signin → AnaquelAppleSignin), o `cap sync` no lo encuentra.
Pod::Spec.new do |s|
  s.name = 'AnaquelAppleSignin'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = 'https://github.com/Augustofigueroa1724/Anaquel'
  s.author = package['author']
  s.source = { :git => 'https://github.com/Augustofigueroa1724/Anaquel.git', :tag => 'v' + package['version'] }
  s.source_files = 'ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '15.0'
  s.frameworks = 'AuthenticationServices'
  s.dependency 'Capacitor'
  s.swift_version = '5.5'
end
