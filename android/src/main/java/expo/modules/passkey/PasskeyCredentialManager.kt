package expo.modules.passkey

import android.content.Context
import android.os.Build
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.GetCredentialException
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

class PasskeyCredentialManager(private val context: Context) {
  private val TAG = "PasskeyCredentialManager"
  private val gson = Gson()

  suspend fun createPasskey(activity: ComponentActivity, requestJson: String): String {
    if (Build.VERSION.SDK_INT < 28) throw Exception("Passkeys not supported on Android < 9")
    val credentialManager = CredentialManager.create(context)
    val createRequest = CreatePublicKeyCredentialRequest(requestJson)

    return withContext(Dispatchers.Main) {
      try {
        val result = credentialManager.createCredential(activity, createRequest)
        
        // Get response using the known bundle key from the data bundle
        val responseJson = result.data?.getString("androidx.credentials.BUNDLE_KEY_REGISTRATION_RESPONSE_JSON")
        
        Log.d(TAG, "Raw registration response: $responseJson")
        
        if (responseJson.isNullOrEmpty()) {
          throw Exception("Registration response is empty or null")
        }
        
        // Parse the JSON to ensure we have required fields
        val clientData = JSONObject(responseJson)
        
        // Log each field from the clientData for debugging
        val keys = clientData.keys()
        while (keys.hasNext()) {
          val key = keys.next()
          Log.d(TAG, "Client data key: $key, value: ${clientData.opt(key)}")
        }
        
        // Check if we need to perform any transformations on the response
        val credentialIdBase64 = clientData.optString("id", "")
        val clientDataJSON = clientData.optString("clientDataJSON", "")
        val attestationObject = clientData.optString("attestationObject", "")
        
        // Verify essential fields
        if (credentialIdBase64.isEmpty() || clientDataJSON.isEmpty() || attestationObject.isEmpty()) {
          Log.e(TAG, "Missing critical fields in credential response: id=${credentialIdBase64.isNotEmpty()}, clientDataJSON=${clientDataJSON.isNotEmpty()}, attestationObject=${attestationObject.isNotEmpty()}")
          
          // Check for alternative locations of these fields
          // This is a fall-back and shouldn't normally be needed
          if (clientData.has("response")) {
            val response = clientData.getJSONObject("response")
            Log.d(TAG, "Found response object, checking for fields there")
            
            if (response.has("clientDataJSON") && clientDataJSON.isEmpty()) {
              Log.d(TAG, "Found clientDataJSON in response")
              clientData.put("clientDataJSON", response.getString("clientDataJSON"))
            }
            
            if (response.has("attestationObject") && attestationObject.isEmpty()) {
              Log.d(TAG, "Found attestationObject in response")
              clientData.put("attestationObject", response.getString("attestationObject"))
            }
          }
        }
        
        // For debugging, let's print the full response we're returning
        Log.d(TAG, "Final response: $responseJson")
        
        return@withContext responseJson
      } catch (e: CreateCredentialException) {
        Log.e(TAG, "Passkey creation failed", e)
        throw Exception("Passkey creation failed: ${e.message}")
      } catch (e: Exception) {
        Log.e(TAG, "Unexpected error during passkey creation", e)
        throw Exception("Passkey creation failed: ${e.message}")
      }
    }
  }

  suspend fun authenticateWithPasskey(activity: ComponentActivity, requestJson: String): String {
    if (Build.VERSION.SDK_INT < 28) throw Exception("Passkeys not supported on Android < 9")
    val credentialManager = CredentialManager.create(context)
    val getRequest = GetCredentialRequest(listOf(GetPublicKeyCredentialOption(requestJson)))

    return withContext(Dispatchers.Main) {
      try {
        val result = credentialManager.getCredential(activity, getRequest)
        
        // Get response using the known bundle key from the credential data bundle
        val responseJson = result.credential?.data?.getString("androidx.credentials.BUNDLE_KEY_AUTHENTICATION_RESPONSE_JSON")
        
        Log.d(TAG, "Raw authentication response: $responseJson")
        
        if (responseJson.isNullOrEmpty()) {
          throw Exception("Authentication response is empty or null")
        }
        
        // Parse the JSON to ensure we have required fields
        val clientData = JSONObject(responseJson)
        
        // Log each field from the clientData for debugging
        val keys = clientData.keys()
        while (keys.hasNext()) {
          val key = keys.next()
          Log.d(TAG, "Auth client data key: $key, value: ${clientData.opt(key)}")
        }
        
        // Check if we need to perform any transformations on the response
        val credentialIdBase64 = clientData.optString("id", "")
        val clientDataJSON = clientData.optString("clientDataJSON", "")
        val authenticatorData = clientData.optString("authenticatorData", "")
        val signature = clientData.optString("signature", "")
        
        // Verify essential fields
        if (credentialIdBase64.isEmpty() || clientDataJSON.isEmpty() || authenticatorData.isEmpty() || signature.isEmpty()) {
          Log.e(TAG, "Missing critical fields in auth response: id=${credentialIdBase64.isNotEmpty()}, clientDataJSON=${clientDataJSON.isNotEmpty()}, authenticatorData=${authenticatorData.isNotEmpty()}, signature=${signature.isNotEmpty()}")
          
          // Check for alternative locations of these fields
          if (clientData.has("response")) {
            val response = clientData.getJSONObject("response")
            Log.d(TAG, "Found response object in auth, checking for fields there")
            
            if (response.has("clientDataJSON") && clientDataJSON.isEmpty()) {
              Log.d(TAG, "Found clientDataJSON in auth response")
              clientData.put("clientDataJSON", response.getString("clientDataJSON"))
            }
            
            if (response.has("authenticatorData") && authenticatorData.isEmpty()) {
              Log.d(TAG, "Found authenticatorData in auth response")
              clientData.put("authenticatorData", response.getString("authenticatorData"))
            }
            
            if (response.has("signature") && signature.isEmpty()) {
              Log.d(TAG, "Found signature in auth response")
              clientData.put("signature", response.getString("signature"))
            }
          }
        }
        
        // For debugging, let's print the full response we're returning
        Log.d(TAG, "Final auth response: $responseJson")
        
        return@withContext responseJson
      } catch (e: GetCredentialException) {
        Log.e(TAG, "Passkey authentication failed", e)
        throw Exception("Passkey authentication failed: ${e.message}")
      } catch (e: Exception) {
        Log.e(TAG, "Unexpected error during passkey authentication", e)
        throw Exception("Passkey authentication failed: ${e.message}")
      }
    }
  }
}