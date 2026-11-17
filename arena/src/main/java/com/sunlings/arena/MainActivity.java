package com.sunlings.arena;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.DisplayCutout;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Sunlings Arena: a single-Activity WebView shell that loads the bundled,
 * fully offline HTML5 game from the app assets.
 */
public class MainActivity extends Activity {

    private WebView web;
    private boolean pageReady = false;
    private int safeTop = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        // Let the sunny sky run underneath a camera notch; the game is told how much room to leave.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
        hideSystemBars();

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                 // league progress + sound settings
        s.setMediaPlaybackRequiresUserGesture(false); // synthesised WebAudio crowd, moves and music
        s.setTextZoom(100);                           // the layout does its own scaling
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setHapticFeedbackEnabled(false);
        web.setLongClickable(false);
        web.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {
                return true; // no text-selection popups while holding a creature card
            }
        });
        web.setBackgroundColor(0xFF2F9BFF);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                pushSafeArea();
                // which side-by-side edition this is, shown under the logo
                view.evaluateJavascript("window.setEdition && window.setEdition(" + getString(R.string.edition) + ");", null);
            }
        });
        web.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override
            public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                int top = 0;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    DisplayCutout cutout = insets.getDisplayCutout();
                    if (cutout != null) {
                        top = cutout.getSafeInsetTop();
                    }
                }
                safeTop = top;
                pushSafeArea();
                return insets;
            }
        });

        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    /** Tell the game how many device pixels at the top are covered by a notch. */
    private void pushSafeArea() {
        if (web != null && pageReady) {
            web.evaluateJavascript("window.setSafeTop && window.setSafeTop(" + safeTop + ");", null);
        }
    }

    private void hideSystemBars() {
        View decor = getWindow().getDecorView();
        decor.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemBars();
        }
    }

    /** Back pauses a match or steps back a menu; from the title screen it leaves the app. */
    @Override
    public void onBackPressed() {
        if (web == null || !pageReady) {
            super.onBackPressed();
            return;
        }
        web.evaluateJavascript("(window.appBack && window.appBack()) ? 1 : 0", new android.webkit.ValueCallback<String>() {
            @Override
            public void onReceiveValue(String value) {
                if (!"1".equals(value)) {
                    finish();
                }
            }
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) {
            web.onPause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            web.onResume();
        }
        hideSystemBars();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
