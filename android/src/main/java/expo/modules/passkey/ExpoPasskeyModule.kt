package expo.modules.passkey

import android.os.Build
import android.util.Log
import androidx.activity.ComponentActivity
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ExpoPasskeyModule : Module() {
  private val TAG = "ExpoPasskeyModule"
  private val mainScope = CoroutineScope(Dispatchers.Main)
  private var credentialManager: PasskeyCredentialManager? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoPasskeyModule")

    OnCreate {
      appContext.reactContext?.let {
        credentialManager = PasskeyCredentialManager(it)
        Log.d(TAG, "ExpoPasskeyModule initialized")
      } ?: Log.e(TAG, "React context is null")
    }

    Function("isPasskeySupported") {
      val version = Build.VERSION.SDK_INT
      val isSupported = version >= 29 // Passkeys are better supported from Android 10 (API 29)
      Log.d(TAG, "isPasskeySupported check: API $version, result: $isSupported")
      isSupported
    }

    AsyncFunction("createPasskey") { options: Map<String, Any>, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null || activity !is ComponentActivity) {
        promise.reject("ERR_NO_ACTIVITY", "No valid current activity", null)
        return@AsyncFunction
      }
      val requestJson = options["requestJson"] as? String
      if (requestJson == null) {
        promise.reject("ERR_INVALID_REQUEST", "Missing requestJson", null)
        return@AsyncFunction
      }
      
      Log.d(TAG, "Starting createPasskey with request: ${requestJson.take(100)}...")
      
      mainScope.launch {
        try {
          val result = credentialManager?.createPasskey(activity, requestJson)
          Log.d(TAG, "createPasskey successful, result length: ${result?.length ?: 0}")
          promise.resolve(result)
        } catch (e: Exception) {
          Log.e(TAG, "createPasskey error: ${e.message}", e)
          promise.reject("ERR_CREATE_FAILED", e.message, e)
        }
      }
    }

    AsyncFunction("authenticateWithPasskey") { options: Map<String, Any>, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null || activity !is ComponentActivity) {
        promise.reject("ERR_NO_ACTIVITY", "No valid current activity", null)
        return@AsyncFunction
      }
      val requestJson = options["requestJson"] as? String
      if (requestJson == null) {
        promise.reject("ERR_INVALID_REQUEST", "Missing requestJson", null)
        return@AsyncFunction
      }
      
      Log.d(TAG, "Starting authenticateWithPasskey with request: ${requestJson.take(100)}...")
      
      mainScope.launch {
        try {
          val result = credentialManager?.authenticateWithPasskey(activity, requestJson)
          Log.d(TAG, "authenticateWithPasskey successful, result length: ${result?.length ?: 0}")
          promise.resolve(result)
        } catch (e: Exception) {
          Log.e(TAG, "authenticateWithPasskey error: ${e.message}", e)
          promise.reject("ERR_AUTH_FAILED", e.message, e)
        }
      }
    }
  }
}