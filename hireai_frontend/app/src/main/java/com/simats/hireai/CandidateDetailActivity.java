package com.simats.hireai;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.annotation.LayoutRes;
import androidx.appcompat.app.AppCompatActivity;

public class CandidateDetailActivity extends AppCompatActivity {
    public static final String EXTRA_LAYOUT_ID = "extra_layout_id";

    public static Intent createIntent(android.content.Context context, @LayoutRes int layoutId) {
        Intent intent = new Intent(context, CandidateDetailActivity.class);
        intent.putExtra(EXTRA_LAYOUT_ID, layoutId);
        return intent;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_detail);
        WindowInsetHelper.applyShellInsets(this, R.id.detail_nav_host, View.NO_ID);

        if (savedInstanceState == null) {
            int layoutId = getIntent().getIntExtra(EXTRA_LAYOUT_ID, R.layout.fragment_home);
            getSupportFragmentManager().beginTransaction()
                    .replace(R.id.detail_nav_host, StaticLayoutFragment.newInstance(layoutId))
                    .commit();
        }
    }

    public void pushScreen(@LayoutRes int layoutResId) {
        startActivity(createIntent(this, layoutResId));
    }

    public void navigateToRootTab(int tabId) {
        Intent intent = new Intent(this, CandidateActivity.class);
        intent.putExtra(CandidateActivity.EXTRA_START_TAB, tabId);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }
}
