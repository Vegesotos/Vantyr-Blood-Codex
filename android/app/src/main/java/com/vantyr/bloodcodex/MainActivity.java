package com.vantyr.bloodcodex;

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

/** Live HTTPS website wrapper. No JavaScript bridge, secrets, or hard-coded DM token. */
public final class MainActivity extends Activity {
  private static final String ORIGIN = "https://vegesotos.github.io";
  private static final String PREFIX = "/Vantyr-Blood-Codex/";
  private static final String HOME = ORIGIN + PREFIX;
  private WebView web;
  private View offlineOverlay;

  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().setStatusBarColor(Color.rgb(17,11,18));
    getWindow().setNavigationBarColor(Color.rgb(17,11,18));
    FrameLayout frame = new FrameLayout(this);
    web = new WebView(this);
    web.setBackgroundColor(Color.rgb(17,11,18));
    frame.addView(web,new FrameLayout.LayoutParams(-1,-1));
    offlineOverlay = createOfflinePanel(frame);
    setContentView(frame);
    WebSettings cfg=web.getSettings();
    cfg.setJavaScriptEnabled(true);
    cfg.setDomStorageEnabled(true);
    cfg.setAllowFileAccess(false);
    cfg.setAllowContentAccess(false);
    cfg.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    cfg.setJavaScriptCanOpenWindowsAutomatically(false);
    cfg.setSupportMultipleWindows(false);
    cfg.setCacheMode(WebSettings.LOAD_DEFAULT);
    cfg.setDefaultTextEncodingName("UTF-8");
    cfg.setMediaPlaybackRequiresUserGesture(true);
    web.setWebChromeClient(new WebChromeClient());
    web.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri=request.getUrl();
        if(isTrusted(uri))return false;
        if(request.isForMainFrame()){
          try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}
          return true;
        }
        return false;
      }
      @Override public void onPageFinished(WebView view,String url) {
        if(isTrusted(Uri.parse(url)))offlineOverlay.setVisibility(View.GONE);
      }
      @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error) {
        if(request.isForMainFrame())offlineOverlay.setVisibility(View.VISIBLE);
      }
    });
    if(savedInstanceState==null)web.loadUrl(HOME);
    else web.restoreState(savedInstanceState);
  }
  private boolean isTrusted(Uri uri){
    return uri!=null && "https".equalsIgnoreCase(uri.getScheme())
      && "vegesotos.github.io".equalsIgnoreCase(uri.getHost())
      && uri.getPath()!=null && uri.getPath().startsWith(PREFIX);
  }
  private View createOfflinePanel(FrameLayout frame){
    LinearLayout panel=new LinearLayout(this);
    panel.setOrientation(LinearLayout.VERTICAL);
    panel.setGravity(Gravity.CENTER);
    panel.setPadding(32,32,32,32);
    panel.setBackgroundColor(Color.rgb(20,12,23));
    TextView title=new TextView(this);
    title.setText("♛ VANTYR BLOOD CODEX");
    title.setTextColor(Color.rgb(255,219,189));
    title.setTextSize(22);
    title.setGravity(Gravity.CENTER);
    panel.addView(title);
    TextView msg=new TextView(this);
    msg.setText("VANTYR couldn't load. Connect to the internet and tap Retry. After the first successful load, the site's offline cache may keep character tools available.");
    msg.setTextSize(15);
    msg.setGravity(Gravity.CENTER);
    msg.setTextColor(Color.rgb(222,181,192));
    LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);
    p.setMargins(0,22,0,26);
    panel.addView(msg,p);
    Button retry=new Button(this);
    retry.setText("Retry connection");
    retry.setAllCaps(false);
    retry.setOnClickListener(v->{offlineOverlay.setVisibility(View.GONE);web.loadUrl(HOME);});
    panel.addView(retry);
    frame.addView(panel,new FrameLayout.LayoutParams(-1,-1));
    panel.setVisibility(View.GONE);
    return panel;
  }
  @Override public void onBackPressed(){
    if(offlineOverlay.getVisibility()==View.VISIBLE){offlineOverlay.setVisibility(View.GONE);return;}
    web.evaluateJavascript("(function(){var o=document.querySelector('#emperorShareDialog:not([hidden]), #observerSettings:not([hidden]), #rollModal:not([hidden])');if(o){o.hidden=true;return true;}var s=document.getElementById('codexSettings');if(s&&s.open){s.open=false;return true;}return false;})()",val->{
      if("true".equals(val))return;
      if(web.canGoBack())web.goBack();else MainActivity.super.onBackPressed();
    });
  }
  @Override protected void onSaveInstanceState(Bundle state){if(web!=null)web.saveState(state);super.onSaveInstanceState(state);}
  @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}
