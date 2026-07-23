package com.simats.hireai;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.LayoutRes;
import androidx.appcompat.app.AppCompatActivity;

public class RecruiterDetailActivity extends AppCompatActivity {
    public static final String EXTRA_LAYOUT_ID = "extra_layout_id";

    public static Intent createIntent(android.content.Context context, @LayoutRes int layoutId) {
        Intent intent = new Intent(context, RecruiterDetailActivity.class);
        intent.putExtra(EXTRA_LAYOUT_ID, layoutId);
        return intent;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_detail);

        if (savedInstanceState == null) {
            int layoutId = getIntent().getIntExtra(EXTRA_LAYOUT_ID, R.layout.fragment_recruiter_dashboard);
            getSupportFragmentManager().beginTransaction()
                    .replace(R.id.detail_nav_host, StaticLayoutFragment.newInstance(layoutId))
                    .commit();
        }
    }

    public void pushScreen(@LayoutRes int layoutResId) {
        startActivity(createIntent(this, layoutResId));
    }

    public void navigateToRootTab(int tabId) {
        Intent intent = new Intent(this, RecruiterActivity.class);
        intent.putExtra(RecruiterActivity.EXTRA_START_TAB, tabId);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }
}
