package com.equaliza.equaliza

import android.view.WindowManager
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

// O `local_auth` exige uma FragmentActivity para exibir o prompt biométrico.
class MainActivity : FlutterFragmentActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Bloqueio de captura de tela nas telas de pendências (extratos e faturas).
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.equaliza.equaliza/screen_security")
            .setMethodCallHandler { call, result ->
                if (call.method != "setSecure") {
                    result.notImplemented()
                    return@setMethodCallHandler
                }

                if (call.arguments as? Boolean == true) {
                    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
                } else {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                }

                result.success(null)
            }
    }
}
