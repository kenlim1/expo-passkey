package expo.modules.passkey

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * WebAuthn credential creation options for registration
 * Specification reference: https://w3c.github.io/webauthn/#dictionary-makecredentialoptions
 */
class PublicKeyCredentialCreationOptions: Record {
    @Field
    var rp: PublicKeyCredentialRpEntity = PublicKeyCredentialRpEntity()

    @Field
    var user: PublicKeyCredentialUserEntity = PublicKeyCredentialUserEntity()

    @Field
    var challenge: String = ""

    @Field
    var pubKeyCredParams: List<PublicKeyCredentialParameters> = listOf()

    @Field
    var timeout: Int? = null

    @Field
    var excludeCredentials: List<PublicKeyCredentialDescriptor>? = null

    @Field
    var authenticatorSelection: AuthenticatorSelectionCriteria? = null

    @Field
    var attestation: String? = null
}

/**
 * WebAuthn credential request options for authentication
 * Specification reference: https://w3c.github.io/webauthn/#dictionary-assertion-options
 */
class PublicKeyCredentialRequestOptions: Record {
    @Field
    var challenge: String = ""

    @Field
    var rpId: String = ""

    @Field
    var timeout: Int? = null

    @Field
    var allowCredentials: List<PublicKeyCredentialDescriptor>? = null

    @Field
    var userVerification: String? = null
}

/**
 * Authenticator selection criteria for WebAuthn registration
 * Specification reference: https://w3c.github.io/webauthn/#dictionary-authenticatorSelection
 */
class AuthenticatorSelectionCriteria: Record {
    @Field
    var authenticatorAttachment: String? = null

    @Field
    var residentKey: String? = null

    @Field
    var requireResidentKey: Boolean? = null

    @Field
    var userVerification: String? = null
}

/**
 * Public key credential parameters
 * Specification reference: https://w3c.github.io/webauthn/#dictionary-credential-params
 */
class PublicKeyCredentialParameters: Record {
    @Field
    var type: String = ""

    @Field
    var alg: Long = 0
}

/**
 * Relying party entity information
 * Specification reference: https://w3c.github.io/webauthn/#dictdef-publickeycredentialrpentity
 */
class PublicKeyCredentialRpEntity: Record {
    @Field
    var name: String = ""

    @Field
    var id: String? = null
}

/**
 * User entity information
 * Specification reference: https://w3c.github.io/webauthn/#dictdef-publickeycredentialuserentity
 */
class PublicKeyCredentialUserEntity: Record {
    @Field
    var name: String = ""

    @Field
    var displayName: String = ""

    @Field
    var id: String = ""
}

/**
 * Public key credential descriptor
 * Specification reference: https://w3c.github.io/webauthn/#dictdef-publickeycredentialdescriptor
 */
class PublicKeyCredentialDescriptor: Record {
    @Field
    var id: String = ""

    @Field
    var transports: List<String>? = null

    @Field
    var type: String = "public-key"
}


/**
 * WebAuthn registration response
 * Represents the response from navigator.credentials.create()
 */
class RegistrationResponseJSON {
    var id: String = ""
    var rawId: String = ""
    var type: String = "public-key"
    var response: AuthenticatorAttestationResponseJSON = AuthenticatorAttestationResponseJSON()
    var authenticatorAttachment: String? = null
    var clientExtensionResults: Map<String, Any>? = null
}

/**
 * WebAuthn authenticator attestation response
 * Specification reference: https://w3c.github.io/webauthn/#dictdef-authenticatorattestationresponsejson
 */
class AuthenticatorAttestationResponseJSON {
    var clientDataJSON: String = ""
    var attestationObject: String = ""
    var transports: List<String>? = null
}

/**
 * WebAuthn authentication response
 * Represents the response from navigator.credentials.get()
 */
class AuthenticationResponseJSON {
    var id: String = ""
    var rawId: String = ""
    var type: String = "public-key"
    var response: AuthenticatorAssertionResponseJSON = AuthenticatorAssertionResponseJSON()
    var authenticatorAttachment: String? = null
    var clientExtensionResults: Map<String, Any>? = null
}

/**
 * WebAuthn authenticator assertion response
 * Specification reference: https://w3c.github.io/webauthn/#dictdef-authenticatorassertionresponsejson
 */
class AuthenticatorAssertionResponseJSON {
    var authenticatorData: String = ""
    var clientDataJSON: String = ""
    var signature: String = ""
    var userHandle: String? = null
}