package com.simats.hireai;

import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.IdRes;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

final class WindowInsetHelper {
    private WindowInsetHelper() { }

    static void applyRootInsets(@NonNull AppCompatActivity activity) {
        WindowCompat.setDecorFitsSystemWindows(activity.getWindow(), false);
        View content = activity.findViewById(android.R.id.content);
        if (!(content instanceof ViewGroup) || ((ViewGroup) content).getChildCount() == 0) return;
        View root = ((ViewGroup) content).getChildAt(0);
        final int baseLeft = root.getPaddingLeft();
        final int baseTop = root.getPaddingTop();
        final int baseRight = root.getPaddingRight();
        final int baseBottom = root.getPaddingBottom();
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(baseLeft + bars.left, baseTop + bars.top, baseRight + bars.right, baseBottom + bars.bottom);
            return insets;
        });
        ViewCompat.requestApplyInsets(root);
    }

    static void applyShellInsets(@NonNull AppCompatActivity activity, @IdRes int hostId, @IdRes int navId) {
        WindowCompat.setDecorFitsSystemWindows(activity.getWindow(), false);
        View host = activity.findViewById(hostId);
        View nav = activity.findViewById(navId);
        if (host == null) return;

        final int hostLeft = host.getPaddingLeft();
        final int hostTop = host.getPaddingTop();
        final int hostRight = host.getPaddingRight();
        final int hostBottom = host.getPaddingBottom();

        final int navLeft = nav != null ? nav.getPaddingLeft() : 0;
        final int navTop = nav != null ? nav.getPaddingTop() : 0;
        final int navRight = nav != null ? nav.getPaddingRight() : 0;
        final int navBottom = nav != null ? nav.getPaddingBottom() : 0;

        ViewCompat.setOnApplyWindowInsetsListener(host, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            if (nav != null) {
                v.setPadding(hostLeft + bars.left, hostTop + bars.top, hostRight + bars.right, hostBottom);
                nav.setPadding(navLeft + bars.left, navTop, navRight + bars.right, navBottom + bars.bottom);
            } else {
                v.setPadding(hostLeft + bars.left, hostTop + bars.top, hostRight + bars.right, hostBottom + bars.bottom);
            }
            return insets;
        });
        ViewCompat.requestApplyInsets(host);
    }
}

