package com.simats.hireai;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Bitmap;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;

import androidx.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;

public class SignaturePadView extends View {
    public interface OnSignedStateChangeListener {
        void onSignedStateChanged(boolean isSigned);
    }

    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final List<Path> strokes = new ArrayList<>();
    private Path currentPath;
    private float lastX;
    private float lastY;
    private OnSignedStateChangeListener signedStateChangeListener;

    public SignaturePadView(Context context) {
        super(context);
        init();
    }

    public SignaturePadView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public SignaturePadView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        paint.setColor(0xFF111827);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeJoin(Paint.Join.ROUND);
        paint.setStrokeWidth(6f);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        for (Path path : strokes) {
            canvas.drawPath(path, paint);
        }
        if (currentPath != null) {
            canvas.drawPath(currentPath, paint);
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        getParent().requestDisallowInterceptTouchEvent(true);
        float x = event.getX();
        float y = event.getY();
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                currentPath = new Path();
                currentPath.moveTo(x, y);
                strokes.add(currentPath);
                lastX = x;
                lastY = y;
                dispatchSignedState();
                invalidate();
                return true;
            case MotionEvent.ACTION_MOVE:
                if (currentPath != null) {
                    float midX = (x + lastX) / 2f;
                    float midY = (y + lastY) / 2f;
                    currentPath.quadTo(lastX, lastY, midX, midY);
                    lastX = x;
                    lastY = y;
                    invalidate();
                }
                return true;
            case MotionEvent.ACTION_UP:
                if (currentPath != null) {
                    currentPath.lineTo(x, y);
                    invalidate();
                }
                return true;
            default:
                return super.onTouchEvent(event);
        }
    }

    public boolean hasSignature() {
        return !strokes.isEmpty();
    }

    public void clearSignature() {
        strokes.clear();
        currentPath = null;
        dispatchSignedState();
        invalidate();
    }

    public void undoLastStroke() {
        if (!strokes.isEmpty()) {
            strokes.remove(strokes.size() - 1);
            dispatchSignedState();
            invalidate();
        }
    }

    public void setOnSignedStateChangeListener(OnSignedStateChangeListener listener) {
        this.signedStateChangeListener = listener;
    }

    public Bitmap exportSignatureBitmap() {
        int w = Math.max(getWidth(), 1);
        int h = Math.max(getHeight(), 1);
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        canvas.drawColor(Color.WHITE);
        for (Path path : strokes) {
            canvas.drawPath(path, paint);
        }
        return bmp;
    }

    private void dispatchSignedState() {
        if (signedStateChangeListener != null) {
            signedStateChangeListener.onSignedStateChanged(hasSignature());
        }
    }
}
