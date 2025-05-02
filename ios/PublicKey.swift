import Foundation

func getPublicKey(from attestationObject: Data) -> Data? {
    // Try to decode the attestation object using the CBOR decoder
    let cborDecoded = try? SimpleCBORDecoder.decode([UInt8](attestationObject))
    guard let decodedAttestationObjectMap = cborDecoded as? [String: Any],
        let authData = decodedAttestationObjectMap["authData"] as? Data
    else {
        print("[ExpoPasskey] Failed to extract authData from attestation object")
        return nil
    }

    // Parse authenticator data
    guard authData.count >= 37 else {
        print("[ExpoPasskey] Authenticator data too short")
        return nil
    }

    // The flags byte is after the RP ID hash (the first 32 bytes)
    let flags = authData[32]
    
    // Check if the attestedCredentialData bit is set (bit 6)
    guard (flags & 0x40) != 0 else {
        print("[ExpoPasskey] No attested credential data present")
        return nil
    }

    // Skip the RP ID hash (32 bytes), flags (1 byte), and signature counter (4 bytes)
    var index = 37

    // Next comes the AAGUID (16 bytes) - just skip it
    index += 16

    // Read the credential ID length (2 bytes)
    guard authData.count >= index + 2 else {
        print("[ExpoPasskey] No credential ID length found")
        return nil
    }
    
    let credentialIdLength = UInt16(authData[index]) << 8 | UInt16(authData[index + 1])
    index += 2

    // Skip reading the credentialId (variable length)
    index += Int(credentialIdLength)

    // Extract the COSE key bytes from the authData
    guard authData.count > index else {
        print("[ExpoPasskey] No COSE key data found")
        return nil
    }
    
    let publicKeyBytes = [UInt8](authData[index...])

    // Decode the COSE key
    let decodedPublicKey = try? SimpleCBORDecoder.decode(publicKeyBytes)
    guard let cosePublicKey = decodedPublicKey as? [AnyHashable: Any] else {
        print("[ExpoPasskey] Failed to decode COSE key")
        return nil
    }

    // Extract the necessary components from the COSE key
    // EC2 key is expected, with specific key parameters
    guard let curve = cosePublicKey[-1] as? UInt64,
        let xCoordinate = cosePublicKey[-2] as? Data,
        let yCoordinate = cosePublicKey[-3] as? Data,
        let keyType = cosePublicKey[1] as? UInt64,
        let algorithm = cosePublicKey[3] as? Int
    else {
        print("[ExpoPasskey] Failed to extract key components")
        return nil
    }

    // Verify the key type
    // According to the COSE spec:
    // - keyType 2 is EC2 (Elliptic Curve Keys with x and y coordinates)
    // - algorithm -7 is ES256 (ECDSA with SHA-256)
    // - curve 1 is P-256
    guard keyType == 2, algorithm == -7, curve == 1 else {
        print("[ExpoPasskey] Unsupported key type, algorithm, or curve")
        print("[ExpoPasskey] Only EC2 P-256 keys with ES256 algorithm are currently supported")
        return nil
    }

    // Combine the X and Y coordinates to form the complete public key
    // For EC2 keys, the public key is composed of the concatenation of the X and Y coordinates
    let publicKeyData = Data(xCoordinate + yCoordinate)
    return publicKeyData
}