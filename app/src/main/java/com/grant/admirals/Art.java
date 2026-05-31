package com.grant.admirals;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;

/**
 * All the hand-drawn artwork: weathered board, brass-rimmed unit medallions with
 * a unique engraved emblem per type, mines, and explosion primitives. A
 * 19th-century "Master and Commander" palette — teak, brass, parchment, the
 * Royal Navy in blue and the enemy in crimson.
 */
public final class Art {
    private Art() {}

    // ---- palette ----
    public static final int PARCHMENT   = 0xFFE7D6AE;
    public static final int PARCHMENT_D = 0xFF8A6E44;
    public static final int SEA_DARK    = 0xFF14202A;
    public static final int WOOD_LIGHT  = 0xFFCBA873;
    public static final int WOOD_DARK   = 0xFF7E5230;
    public static final int FRAME       = 0xFF3C2A18;
    public static final int BRASS       = 0xFFD9B24A;
    public static final int BRASS_D     = 0xFF8A6A22;
    public static final int EMBLEM      = 0xFFF6ECD2;
    public static final int INK         = 0xFF241A10;

    public static final int NAVY        = 0xFF274B78;
    public static final int NAVY_LITE   = 0xFF4E7FB8;
    public static final int CRIMSON     = 0xFF8A2630;
    public static final int CRIMSON_LITE= 0xFFC0535A;

    static int armyDark(int owner){ return owner == Game.HUMAN ? NAVY : CRIMSON; }
    static int armyLite(int owner){ return owner == Game.HUMAN ? NAVY_LITE : CRIMSON_LITE; }

    private static final Paint P  = new Paint(Paint.ANTI_ALIAS_FLAG);
    private static final Path  PATH = new Path();
    private static final RectF R  = new RectF();

    // ---------------------------------------------------------------- board
    public static void drawBoard(Canvas cv, float x, float y, float size, float t) {
        float cell = size / Game.N;
        // brass / teak frame
        float fw = cell * 0.34f;
        P.setStyle(Paint.Style.FILL);
        P.setShader(new LinearGradient(x, y, x, y + size, FRAME, 0xFF2A1C0F, Shader.TileMode.CLAMP));
        R.set(x - fw, y - fw, x + size + fw, y + size + fw);
        cv.drawRoundRect(R, fw, fw, P);
        P.setShader(null);
        // brass beading
        P.setStyle(Paint.Style.STROKE);
        P.setStrokeWidth(cell * 0.06f);
        P.setColor(BRASS);
        R.set(x - fw*0.5f, y - fw*0.5f, x + size + fw*0.5f, y + size + fw*0.5f);
        cv.drawRoundRect(R, fw*0.6f, fw*0.6f, P);

        // squares
        P.setStyle(Paint.Style.FILL);
        for (int r = 0; r < Game.N; r++)
            for (int c = 0; c < Game.N; c++) {
                float sx = x + c * cell, sy = y + r * cell;
                boolean light = ((r + c) & 1) == 0;
                int base = light ? WOOD_LIGHT : WOOD_DARK;
                P.setShader(new LinearGradient(sx, sy, sx, sy + cell,
                        tint(base, 1.10f), tint(base, 0.86f), Shader.TileMode.CLAMP));
                cv.drawRect(sx, sy, sx + cell, sy + cell, P);
            }
        P.setShader(null);
        // fine grid
        P.setStyle(Paint.Style.STROKE);
        P.setStrokeWidth(Math.max(1f, cell * 0.014f));
        P.setColor(0x33000000);
        for (int i = 0; i <= Game.N; i++) {
            cv.drawLine(x + i*cell, y, x + i*cell, y + size, P);
            cv.drawLine(x, y + i*cell, x + size, y + i*cell, P);
        }
    }

    static int tint(int color, float f) {
        int rr = clamp((int)(Color.red(color)   * f));
        int gg = clamp((int)(Color.green(color) * f));
        int bb = clamp((int)(Color.blue(color)  * f));
        return Color.rgb(rr, gg, bb);
    }
    static int clamp(int v){ return v < 0 ? 0 : (v > 255 ? 255 : v); }
    static int withAlpha(int color, float a){
        return (Math.round(a*255) << 24) | (color & 0x00FFFFFF);
    }

    // ------------------------------------------------------------- medallion
    /** Draw a unit. scale 1 = normal, alpha 0..1. */
    public static void drawUnit(Canvas cv, int owner, int type, float cx, float cy,
                                float radius, float scale, float alpha) {
        float rr = radius * scale;
        int a = Math.round(alpha * 255); if (a <= 0) return;

        // shadow
        P.setShader(null); P.setStyle(Paint.Style.FILL);
        P.setColor((Math.round(alpha*90) << 24));
        cv.drawOval(box(cx - rr*0.92f, cy - rr*0.78f + rr*0.34f, rr*1.84f, rr*1.7f), P);

        // body
        int dark = armyDark(owner), lite = armyLite(owner);
        P.setShader(new RadialGradient(cx - rr*0.32f, cy - rr*0.34f, rr*1.5f,
                tint(lite,1.05f), tint(dark,0.82f), Shader.TileMode.CLAMP));
        cv.drawCircle(cx, cy, rr, P);
        P.setShader(null);

        // brass rim
        P.setStyle(Paint.Style.STROKE);
        P.setStrokeWidth(rr * 0.13f);
        P.setColor(withAlpha(BRASS_D, alpha));
        cv.drawCircle(cx, cy, rr * 0.985f, P);
        P.setStrokeWidth(rr * 0.07f);
        P.setColor(withAlpha(BRASS, alpha));
        cv.drawCircle(cx, cy, rr * 0.92f, P);

        // gloss highlight
        P.setStyle(Paint.Style.FILL);
        P.setShader(new RadialGradient(cx - rr*0.34f, cy - rr*0.42f, rr*0.95f,
                withAlpha(0xFFFFFFFF, alpha*0.42f), 0x00FFFFFF, Shader.TileMode.CLAMP));
        cv.drawCircle(cx - rr*0.18f, cy - rr*0.22f, rr*0.72f, P);
        P.setShader(null);

        // emblem
        emblem(cv, type, cx, cy, rr * 0.62f, alpha);
    }

    private static RectF box(float l, float t, float w, float h){ R.set(l, t, l+w, t+h); return R; }

    // ---------------------------------------------------------------- emblems
    private static void emblem(Canvas cv, int type, float cx, float cy, float r, float alpha) {
        int col = withAlpha(EMBLEM, alpha);
        P.setColor(col);
        P.setStyle(Paint.Style.FILL);
        P.setStrokeCap(Paint.Cap.ROUND);
        P.setStrokeJoin(Paint.Join.ROUND);
        Path p = PATH; p.reset();
        float sw = r * 0.28f;

        switch (type) {
            case Pieces.ADMIRAL: { // crown
                p.moveTo(cx-0.62f*r, cy+0.42f*r);
                p.lineTo(cx-0.62f*r, cy-0.12f*r);
                p.lineTo(cx-0.30f*r, cy+0.10f*r);
                p.lineTo(cx,         cy-0.52f*r);
                p.lineTo(cx+0.30f*r, cy+0.10f*r);
                p.lineTo(cx+0.62f*r, cy-0.12f*r);
                p.lineTo(cx+0.62f*r, cy+0.42f*r);
                p.close();
                cv.drawPath(p, P);
                dot(cv, cx-0.62f*r, cy-0.12f*r, r*0.13f);
                dot(cv, cx,         cy-0.52f*r, r*0.15f);
                dot(cv, cx+0.62f*r, cy-0.12f*r, r*0.13f);
                break; }
            case Pieces.FRIGATE: { // ship with sails
                P.setStyle(Paint.Style.FILL);
                p.moveTo(cx-0.6f*r, cy+0.18f*r);
                p.lineTo(cx+0.6f*r, cy+0.18f*r);
                p.lineTo(cx+0.38f*r, cy+0.48f*r);
                p.lineTo(cx-0.38f*r, cy+0.48f*r);
                p.close(); cv.drawPath(p, P);
                stroke(cv, cx, cy+0.18f*r, cx, cy-0.55f*r, r*0.12f, col); // mast
                p.reset(); // right sail
                p.moveTo(cx+0.06f*r, cy-0.5f*r);
                p.lineTo(cx+0.5f*r,  cy+0.02f*r);
                p.lineTo(cx+0.06f*r, cy+0.06f*r); p.close();
                cv.drawPath(p, P);
                p.reset(); // left sail
                p.moveTo(cx-0.06f*r, cy-0.5f*r);
                p.lineTo(cx-0.5f*r,  cy+0.02f*r);
                p.lineTo(cx-0.06f*r, cy+0.06f*r); p.close();
                cv.drawPath(p, P);
                break; }
            case Pieces.BOMBARD: { // cannon
                stroke(cv, cx-0.5f*r, cy+0.22f*r, cx+0.42f*r, cy-0.16f*r, r*0.34f, col);
                P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(r*0.12f); P.setColor(col);
                cv.drawCircle(cx-0.32f*r, cy+0.40f*r, r*0.18f, P);
                P.setStyle(Paint.Style.FILL);
                dot(cv, cx+0.55f*r, cy-0.34f*r, r*0.16f); // ball
                break; }
            case Pieces.NAVIGATOR: { // compass star
                P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(r*0.09f); P.setColor(col);
                cv.drawCircle(cx, cy, r*0.6f, P);
                P.setStyle(Paint.Style.FILL);
                star4(cv, cx, cy, r*0.58f, r*0.14f); // vertical-ish
                star4b(cv, cx, cy, r*0.58f, r*0.14f);
                dot(cv, cx, cy, r*0.1f);
                break; }
            case Pieces.DRAGOON: { // crossed sabres
                sabre(cv, cx-0.5f*r, cy+0.5f*r, cx+0.5f*r, cy-0.45f*r, sw*0.5f, col);
                sabre(cv, cx+0.5f*r, cy+0.5f*r, cx-0.5f*r, cy-0.45f*r, sw*0.5f, col);
                dot(cv, cx-0.5f*r, cy+0.5f*r, r*0.1f);
                dot(cv, cx+0.5f*r, cy+0.5f*r, r*0.1f);
                break; }
            case Pieces.GRENADIER: { // grenade
                P.setStyle(Paint.Style.FILL); P.setColor(col);
                cv.drawCircle(cx, cy+0.12f*r, r*0.46f, P);
                R.set(cx-0.16f*r, cy-0.42f*r, cx+0.16f*r, cy-0.18f*r);
                cv.drawRect(R, P);
                P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(r*0.1f);
                p.reset(); p.moveTo(cx+0.02f*r, cy-0.4f*r);
                p.quadTo(cx+0.4f*r, cy-0.5f*r, cx+0.34f*r, cy-0.72f*r);
                cv.drawPath(p, P);
                P.setStyle(Paint.Style.FILL);
                dot(cv, cx+0.34f*r, cy-0.78f*r, r*0.1f);
                break; }
            case Pieces.FUSILIER: { // musket + bayonet
                stroke(cv, cx-0.5f*r, cy+0.5f*r, cx+0.5f*r, cy-0.5f*r, r*0.16f, col);
                stroke(cv, cx-0.5f*r, cy+0.5f*r, cx-0.22f*r, cy+0.18f*r, r*0.28f, col); // stock
                break; }
            case Pieces.HUSSAR: { // shako with plume
                R.set(cx-0.3f*r, cy-0.05f*r, cx+0.3f*r, cy+0.5f*r);
                P.setStyle(Paint.Style.FILL); P.setColor(col);
                cv.drawRoundRect(R, r*0.08f, r*0.08f, P);
                R.set(cx-0.4f*r, cy+0.42f*r, cx+0.4f*r, cy+0.56f*r);
                cv.drawRoundRect(R, r*0.06f, r*0.06f, P); // visor
                P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(r*0.13f);
                p.reset(); p.moveTo(cx, cy-0.05f*r);
                p.quadTo(cx+0.3f*r, cy-0.5f*r, cx-0.05f*r, cy-0.72f*r);
                cv.drawPath(p, P);
                break; }
            case Pieces.RANGER: { // spyglass
                P.setStyle(Paint.Style.FILL); P.setColor(col);
                float ang = -0.7f;
                cv.save();
                cv.rotate((float)Math.toDegrees(ang), cx, cy);
                p.reset();
                p.moveTo(cx-0.55f*r, cy-0.14f*r);
                p.lineTo(cx+0.55f*r, cy-0.26f*r);
                p.lineTo(cx+0.55f*r, cy+0.26f*r);
                p.lineTo(cx-0.55f*r, cy+0.14f*r);
                p.close(); cv.drawPath(p, P);
                P.setColor(withAlpha(INK, alpha));
                cv.drawCircle(cx+0.45f*r, cy, r*0.2f, P);
                cv.restore();
                break; }
            case Pieces.SAPPER: { // crossed pick & shovel
                stroke(cv, cx-0.45f*r, cy+0.5f*r, cx+0.18f*r, cy-0.4f*r, r*0.1f, col); // shovel handle
                P.setStyle(Paint.Style.FILL);
                p.reset();
                p.moveTo(cx+0.1f*r, cy-0.36f*r); p.lineTo(cx+0.3f*r, cy-0.34f*r);
                p.lineTo(cx+0.22f*r, cy-0.6f*r); p.lineTo(cx+0.04f*r, cy-0.56f*r); p.close();
                cv.drawPath(p, P); // spade head
                stroke(cv, cx+0.45f*r, cy+0.5f*r, cx-0.18f*r, cy-0.4f*r, r*0.1f, col); // pick handle
                P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(r*0.11f);
                p.reset(); p.moveTo(cx-0.42f*r, cy-0.5f*r);
                p.quadTo(cx-0.18f*r, cy-0.62f*r, cx+0.02f*r, cy-0.5f*r);
                cv.drawPath(p, P); // pick head
                break; }
            case Pieces.LANCER: { // lance with pennant
                stroke(cv, cx, cy+0.55f*r, cx, cy-0.55f*r, r*0.1f, col);
                P.setStyle(Paint.Style.FILL);
                p.reset(); p.moveTo(cx, cy-0.72f*r);
                p.lineTo(cx-0.12f*r, cy-0.5f*r); p.lineTo(cx+0.12f*r, cy-0.5f*r); p.close();
                cv.drawPath(p, P); // spear tip
                p.reset(); p.moveTo(cx, cy-0.45f*r);
                p.lineTo(cx+0.42f*r, cy-0.34f*r); p.lineTo(cx, cy-0.2f*r); p.close();
                cv.drawPath(p, P); // pennant
                break; }
            case Pieces.SCOUT: { // signal flag
                stroke(cv, cx-0.28f*r, cy+0.55f*r, cx-0.28f*r, cy-0.55f*r, r*0.1f, col);
                P.setStyle(Paint.Style.FILL);
                p.reset();
                p.moveTo(cx-0.22f*r, cy-0.5f*r);
                p.lineTo(cx+0.55f*r, cy-0.38f*r);
                p.lineTo(cx+0.34f*r, cy-0.16f*r);
                p.lineTo(cx+0.55f*r, cy+0.06f*r);
                p.lineTo(cx-0.22f*r, cy+0.04f*r);
                p.close(); cv.drawPath(p, P);
                break; }
        }
        P.setStyle(Paint.Style.FILL);
    }

    private static void dot(Canvas cv, float x, float y, float rad){
        P.setStyle(Paint.Style.FILL); cv.drawCircle(x, y, rad, P);
    }
    private static void stroke(Canvas cv, float x0,float y0,float x1,float y1,float w,int col){
        P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(w); P.setColor(col);
        cv.drawLine(x0,y0,x1,y1,P);
        P.setStyle(Paint.Style.FILL);
    }
    private static void sabre(Canvas cv, float x0,float y0,float x1,float y1,float w,int col){
        P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(w*2f); P.setColor(col);
        Path p = PATH; p.reset();
        float mx = (x0+x1)/2 + (y1-y0)*0.12f, my=(y0+y1)/2 + (x0-x1)*0.12f;
        p.moveTo(x0,y0); p.quadTo(mx,my,x1,y1);
        cv.drawPath(p,P);
        P.setStyle(Paint.Style.FILL);
    }
    private static void star4(Canvas cv, float cx,float cy,float lng,float wid){
        Path p = PATH; p.reset();
        p.moveTo(cx, cy-lng); p.lineTo(cx+wid, cy); p.lineTo(cx, cy+lng); p.lineTo(cx-wid, cy);
        p.close(); cv.drawPath(p, P);
    }
    private static void star4b(Canvas cv, float cx,float cy,float lng,float wid){
        Path p = PATH; p.reset();
        p.moveTo(cx-lng, cy); p.lineTo(cx, cy-wid); p.lineTo(cx+lng, cy); p.lineTo(cx, cy+wid);
        p.close(); cv.drawPath(p, P);
    }

    // ------------------------------------------------------------------ mine
    public static void drawMine(Canvas cv, float cx, float cy, float r, float spark, float alpha) {
        P.setShader(null);
        // shadow
        P.setStyle(Paint.Style.FILL); P.setColor(Math.round(alpha*80)<<24);
        cv.drawOval(box(cx-r*0.8f, cy+r*0.45f, r*1.6f, r*0.7f), P);
        // iron body
        P.setShader(new RadialGradient(cx-r*0.3f, cy-r*0.35f, r*1.4f,
                withAlpha(0xFF555a60, alpha), withAlpha(0xFF0c0e11, alpha), Shader.TileMode.CLAMP));
        cv.drawCircle(cx, cy, r*0.78f, P);
        P.setShader(null);
        // spikes
        P.setColor(withAlpha(0xFF2a2d31, alpha));
        for (int i=0;i<8;i++){
            double a = i*Math.PI/4;
            float sx=(float)(cx+Math.cos(a)*r*0.7f), sy=(float)(cy+Math.sin(a)*r*0.7f);
            float ex=(float)(cx+Math.cos(a)*r*0.98f), ey=(float)(cy+Math.sin(a)*r*0.98f);
            P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(r*0.16f);
            cv.drawLine(sx,sy,ex,ey,P);
        }
        // highlight
        P.setStyle(Paint.Style.FILL); P.setColor(withAlpha(0xFFFFFFFF, alpha*0.5f));
        cv.drawCircle(cx-r*0.28f, cy-r*0.3f, r*0.14f, P);
        // fuse + flickering spark
        P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(r*0.1f); P.setColor(withAlpha(0xFF6b4a2a, alpha));
        Path p = PATH; p.reset(); p.moveTo(cx, cy-r*0.7f);
        p.quadTo(cx+r*0.5f, cy-r*1.0f, cx+r*0.34f, cy-r*1.25f);
        cv.drawPath(p, P);
        float sr = r*(0.16f + 0.10f*spark);
        P.setStyle(Paint.Style.FILL);
        P.setColor(withAlpha(0xFFFFE08A, alpha)); cv.drawCircle(cx+r*0.34f, cy-r*1.27f, sr, P);
        P.setColor(withAlpha(0xFFFF7B2E, alpha*0.8f)); cv.drawCircle(cx+r*0.34f, cy-r*1.27f, sr*0.55f, P);
    }

    // ---- valid-cell marker & move dot ----
    public static void moveDot(Canvas cv, float cx, float cy, float r, boolean capture){
        P.setShader(null); P.setStyle(Paint.Style.FILL);
        if (capture){
            P.setStyle(Paint.Style.STROKE); P.setStrokeWidth(r*0.22f);
            P.setColor(0xCCB7372E); cv.drawCircle(cx, cy, r*0.92f, P);
            P.setStyle(Paint.Style.FILL);
        } else {
            P.setColor(0x66143A24); cv.drawCircle(cx, cy, r*0.34f, P);
            P.setColor(0x99CDB27E); cv.drawCircle(cx, cy, r*0.20f, P);
        }
    }
}
