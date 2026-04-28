package com.cleanerschoice

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

class SoftInputModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SoftInputModule"

    @ReactMethod
    fun setAdjustNothing() {
        UiThreadUtil.runOnUiThread {
            currentActivity?.window?.setSoftInputMode(
                WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING
            )
        }
    }

    @Suppress("DEPRECATION")
    @ReactMethod
    fun setAdjustResize() {
        UiThreadUtil.runOnUiThread {
            currentActivity?.window?.setSoftInputMode(
                WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
            )
        }
    }
}
