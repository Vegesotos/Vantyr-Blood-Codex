package com.vantyr.dmcompanion;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Dedicated Dungeon Master app; online Supabase initiative board works with player offline.
 * No secret token is embedded in APK and no JavaScript bridge is exposed. */
public final class DmActivity extends Activity {
  private static final String HOST="vegesotos.github.io";
  private static final String ROOT="/Vantyr-Blood-Codex/";
  private static final String DM_URL="https://" + HOST + ROOT + "dm/";
  private WebView browser;
  private View errorView;

  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().setStatusBarColor(Color.rgb(17,11,18));
    getWindow().setNavigationBarColor(Color.rgb(17,11,18));
    FrameLayout root=new FrameLayout(this);
    browser=new WebView(this);
    browser.setBackgroundColor(Color.rgb(17,11,18));
    root.addView(browser,new FrameLayout.LayoutParams(-1,-1));
    errorView=makeErrorOverlay(root);
    setContentView(root);
    WebSettings settings=browser.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setJavaScriptCanOpenWindowsAutomatically(false);
    settings.setSupportMultipleWindows(false);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    settings.setDefaultTextEncodingName("UTF-8");
    browser.setWebChromeClient(new WebChromeClient());
    browser.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri=request.getUrl();
        if(trusted(uri)) return false;
        if(request.isForMainFrame()) {
          try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); } catch(Exception ignored) {}
          return true;
        }
        return false;
      }
      @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error) {
        if(request.isForMainFrame())errorView.setVisibility(View.VISIBLE);
      }
      @Override public void onPageFinished(WebView view,String url) {
        if(trusted(Uri.parse(url)))errorView.setVisibility(View.GONE);
      }
    });
    if(savedInstanceState!=null) browser.restoreState(savedInstanceState);
    else browser.loadUrl(DM_URL);
  }

  private boolean trusted(Uri uri) {
    return uri!=null && "https".equalsIgnoreCase(uri.getScheme())
      && HOST.equalsIgnoreCase(uri.getHost())
      && uri.getPath()!=null && uri.getPath().startsWith(ROOT);
  }

  private View makeErrorOverlay(FrameLayout root) {
    LinearLayout panel=new LinearLayout(this);
    panel.setOrientation(LinearLayout.VERTICAL);
    panel.setGravity(Gravity.CENTER);
    panel.setPadding(34,34,34,34);
    panel.setBackgroundColor(Color.rgb(19,11,21));
    TextView heading=new TextView(this);
    heading.setText("⚔ VANTYR · DM COMPANION");
    heading.setTextColor(Color.rgb(255,220,183));
    heading.setTextSize(21);
    heading.setGravity(Gravity.CENTER);
    panel.addView(heading);
    TextView message=new TextView(this);
    message.setText("The DM dashboard requires internet access. Reconnect to continue combat turns and synchronized initiatives.");
    message.setTextColor(Color.rgb(226,184,193));
    message.setGravity(Gravity.CENTER);
    message.setTextSize(15);
    LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);
    p.setMargins(0,24,0,20);panel.addView(message,p);
    Button retry=new Button(this);
    retry.setText("Retry connection");retry.setAllCaps(false);
    retry.setOnClickListener(v->{errorView.setVisibility(View.GONE);browser.loadUrl(DM_URL);});
    panel.addView(retry);
    root.addView(panel,new FrameLayout.LayoutParams(-1,-1));
    panel.setVisibility(View.GONE);
    return panel;
  }
  @Override public void onBackPressed() {
    if(errorView.getVisibility()==View.VISIBLE){errorView.setVisibility(View.GONE);return;}
    if(browser.canGoBack())browser.goBack();
    else super.onBackPressed();
  }
  @Override protected void onSaveInstanceState(Bundle state) {
    if(browser!=null)browser.saveState(state);
    super.onSaveInstanceState(state);
  }
  @Override protected void onDestroy() {
    if(browser!=null){browser.destroy();browser=null;}
    super.onDestroy();
  }
}
