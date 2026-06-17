package com.gowithflow.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.gowithflow.app.listenmedia.ListenMediaPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ListenMediaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
