import Foundation
import Capacitor
import AuthenticationServices
import CryptoKit

// Sign in with Apple (copiado de Crate Mates, 13 sep 2026). Plugin LOCAL de Capacitor
// (plugins/apple-signin): Apple EXIGE este botón (guía 5.1.1) en cualquier
// app que ofrezca login propio, así que es bloqueante de la revisión.
//
// Flujo: este plugin pide la autorización NATIVA (hoja del sistema, Face ID),
// Apple devuelve un `identityToken` (JWT firmado por Apple) y la app lo canjea
// por una sesión de Supabase con `signInWithIdToken` — sin navegador, sin
// redirect y sin secreto de cliente. El `nonce` se genera aquí: a Apple se le
// manda su SHA-256 y a Supabase el valor crudo, que vuelve a hashear para
// comprobar que el token es de ESTA petición y no uno reutilizado.
//
//   available() → { available }
//   authorize() → { ok, identityToken, nonce, user, email, givenName, familyName }
//                 ok:false con `reason` = canceled | unavailable | no_token | error
//
// ⚠️ Apple solo manda el NOMBRE en la PRIMERA autorización de cada usuario; en
// las siguientes llega vacío (y para volver a verlo hay que quitar la app en
// Ajustes › ID de Apple › Inicio de sesión con Apple).

@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin,
                                ASAuthorizationControllerDelegate,
                                ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)
    ]

    // Petición en curso: la hoja del sistema es asíncrona y el controlador hay
    // que retenerlo o ARC se lo lleva antes de que el usuario conteste.
    private var pending: CAPPluginCall?
    private var pendingNonce = ""
    private var controller: ASAuthorizationController?

    @objc public func available(_ call: CAPPluginCall) {
        call.resolve(["available": true])
    }

    @objc public func authorize(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let old = self.pending {
                old.resolve(["ok": false, "reason": "canceled"])
            }
            self.pending = call
            let raw = Self.randomNonce()
            self.pendingNonce = raw
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            request.nonce = Self.sha256(raw)
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.controller = controller
            controller.performRequests()
        }
    }

    // MARK: - ASAuthorizationControllerDelegate

    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithAuthorization authorization: ASAuthorization) {
        let call = take()
        guard let cred = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = cred.identityToken,
              let token = String(data: tokenData, encoding: .utf8) else {
            call?.resolve(["ok": false, "reason": "no_token"])
            return
        }
        var out: [String: Any] = [
            "ok": true,
            "identityToken": token,
            "nonce": pendingNonce,
            "user": cred.user,
            "email": cred.email ?? "",
            "givenName": cred.fullName?.givenName ?? "",
            "familyName": cred.fullName?.familyName ?? ""
        ]
        if let codeData = cred.authorizationCode,
           let code = String(data: codeData, encoding: .utf8) {
            out["authorizationCode"] = code
        }
        call?.resolve(out)
    }

    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithError error: Error) {
        let call = take()
        let canceled = (error as? ASAuthorizationError)?.code == .canceled
        call?.resolve([
            "ok": false,
            "reason": canceled ? "canceled" : "error",
            "error": String(describing: error)
        ])
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        bridge?.viewController?.view.window ?? ASPresentationAnchor()
    }

    // MARK: - utilidades

    private func take() -> CAPPluginCall? {
        let call = pending
        pending = nil
        controller = nil
        return call
    }

    /// Nonce aleatorio criptográfico (alfabeto seguro para URL).
    private static func randomNonce(_ length: Int = 32) -> String {
        let chars = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var out = ""
        var remaining = length
        while remaining > 0 {
            var byte: UInt8 = 0
            guard SecRandomCopyBytes(kSecRandomDefault, 1, &byte) == errSecSuccess else { continue }
            if Int(byte) < chars.count {
                out.append(chars[Int(byte)])
                remaining -= 1
            }
        }
        return out
    }

    private static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}
