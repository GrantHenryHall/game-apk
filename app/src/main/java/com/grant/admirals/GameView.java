package com.grant.admirals;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.view.MotionEvent;
import android.view.View;

import java.util.ArrayList;
import java.util.Random;

/** The whole game: board, tray, animations, input and the enemy AI. */
public class GameView extends View {

    // phases
    static final int DEPLOY = 0, AI_DEPLOY = 1, PLAY = 2, OVER = 3;

    private Game game = new Game();
    private int phase = DEPLOY;
    private int turn = Game.HUMAN;
    private boolean busy = false;          // input locked while animating / AI thinking
    private int winner = -1;
    private final Random rnd = new Random();

    // geometry (recomputed each frame)
    private float boardX, boardY, boardSize, cell, unitR;

    // deployment state
    private final boolean[] deployed = new boolean[Pieces.COUNT];
    private int humanBombs = Game.BOMBS_PER_SIDE;
    private int selType = -1;
    private boolean selBomb = false;
    private final ArrayList<TrayItem> tray = new ArrayList<TrayItem>();
    private RectF beginBtn = new RectF();

    // play selection
    private int selR = -1, selC = -1;
    private final ArrayList<Game.Move> selMoves = new ArrayList<Game.Move>();

    // captured trophies
    private final ArrayList<Integer> capByHuman = new ArrayList<Integer>();
    private final ArrayList<Integer> capByAi    = new ArrayList<Integer>();

    private String status = "Deploy your forces, Commander.";

    // animation
    private final ArrayList<Anim> anims = new ArrayList<Anim>();
    private final int[][] hide = new int[Game.N][Game.N];
    private float shakeAmp = 0f; private long shakeStart = 0;

    private final Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Typeface serif = Typeface.create(Typeface.SERIF, Typeface.BOLD);

    public GameView(Context c) {
        super(c);
        setBackgroundColor(Art.SEA_DARK);
        text.setTypeface(serif);
    }

    // ---------------------------------------------------------------- layout
    private void layout() {
        float W = getWidth(), H = getHeight();
        float margin = W * 0.045f;
        boardSize = Math.min(W - 2*margin, H * 0.585f);
        boardX = (W - boardSize) / 2f;
        boardY = H * 0.135f;
        cell = boardSize / Game.N;
        unitR = cell * 0.42f;
        buildTray();
    }

    private float cx(int c){ return boardX + c*cell + cell*0.5f; }
    private float cy(int r){ return boardY + r*cell + cell*0.5f; }

    // ---------------------------------------------------------------- drawing
    @Override protected void onDraw(Canvas cv) {
        layout();
        long now = System.nanoTime();

        // screen shake
        float dx = 0, dy = 0;
        if (shakeAmp > 0) {
            float t = (now - shakeStart) / 1e9f;
            float decay = (float)Math.exp(-9f * t);
            if (decay < 0.02f) { shakeAmp = 0; }
            else {
                dx = shakeAmp * decay * (float)Math.sin(t*70f);
                dy = shakeAmp * decay * (float)Math.cos(t*61f);
            }
        }
        cv.save();
        cv.translate(dx, dy);

        drawBackground(cv);
        Art.drawBoard(cv, boardX, boardY, boardSize, 0);

        // deployment zone glow when placing
        if (phase == DEPLOY && (selType >= 0 || selBomb)) drawZoneHint(cv);

        // mines (only the owner can see their own; the enemy's stay hidden)
        float spark = 0.5f + 0.5f * (float)Math.sin(now / 1.0e8);
        for (int r = 0; r < Game.N; r++)
            for (int c = 0; c < Game.N; c++)
                if (game.bombOwner[r][c] == Game.HUMAN && hide[r][c] == 0)
                    Art.drawMine(cv, cx(c), cy(r), unitR*0.62f, spark, 0.95f);

        // move hints
        if (phase == PLAY && turn == Game.HUMAN && selR >= 0) {
            Art.moveDot(cv, cx(selC), cy(selR), unitR, false);
            for (int i = 0; i < selMoves.size(); i++) {
                Game.Move m = selMoves.get(i);
                boolean cap = game.owner[m.tr][m.tc] >= 0;
                Art.moveDot(cv, cx(m.tc), cy(m.tr), unitR, cap);
            }
        }

        // static pieces
        for (int r = 0; r < Game.N; r++)
            for (int c = 0; c < Game.N; c++)
                if (game.owner[r][c] >= 0 && hide[r][c] == 0) {
                    float bump = (phase == PLAY && r == selR && c == selC) ? 1.08f : 1f;
                    Art.drawUnit(cv, game.owner[r][c], game.type[r][c], cx(c), cy(r), unitR, bump, 1f);
                }

        // animations
        for (int i = 0; i < anims.size(); i++) anims.get(i).draw(cv, now);

        cv.restore();

        // UI chrome (not shaken)
        drawTopBar(cv);
        if (phase == DEPLOY) drawTray(cv);
        else drawTrophies(cv);
        if (phase == OVER) drawGameOver(cv, now);

        // reap finished anims and schedule next frame
        boolean animating = false;
        for (int i = anims.size() - 1; i >= 0; i--) {
            Anim a = anims.get(i);
            if (a.progress(now) >= 1f) {
                anims.remove(i);
                if (!a.ended) { a.ended = true; if (a.onEnd != null) a.onEnd.run(); }
            } else animating = true;
        }
        if (animating || !anims.isEmpty() || phase == AI_DEPLOY || phase == OVER || shakeAmp > 0)
            postInvalidateOnAnimation();
    }

    private void drawBackground(Canvas cv) {
        text.setShader(null);
        text.setStyle(Paint.Style.FILL);
        // parchment vignette
        float W = getWidth(), H = getHeight();
        cv.drawColor(0xFF101A22);
        text.setColor(0xFF16242E);
        cv.drawRect(0, 0, W, H, text);
        // subtle ledger lines feel via two tone top/bottom panels
        text.setColor(0x22000000);
        cv.drawRect(0, 0, W, boardY*0.92f, text);
    }

    private void drawZoneHint(Canvas cv) {
        text.setStyle(Paint.Style.FILL);
        for (int r = 0; r < Game.N; r++) {
            boolean ok = selBomb ? Game.inBombZone(Game.HUMAN, r) : Game.inDeployZone(Game.HUMAN, r);
            if (!ok) continue;
            text.setColor(selBomb ? 0x224CC2FF : 0x2240E080);
            cv.drawRect(boardX, boardY + r*cell, boardX + boardSize, boardY + (r+1)*cell, text);
        }
    }

    // ---------------------------------------------------------------- top bar
    private void drawTopBar(Canvas cv) {
        float W = getWidth();
        text.setShader(null);
        text.setTextAlign(Paint.Align.CENTER);
        text.setColor(Art.BRASS);
        text.setTextSize(boardY * 0.34f);
        text.setStyle(Paint.Style.FILL);
        cv.drawText("BOMBS  &  ADMIRALS", W/2f, boardY*0.42f, text);
        // status
        text.setColor(0xFFE9DCBC);
        text.setTextSize(boardY * 0.20f);
        cv.drawText(status, W/2f, boardY*0.74f, text);
        // build tag so you can confirm the install updated
        text.setColor(0xFF7E6A44);
        text.setTextSize(boardY * 0.13f);
        text.setTextAlign(Paint.Align.RIGHT);
        cv.drawText("v1.1 · last unit standing", W - boardX, boardY*0.96f, text);
        text.setTextAlign(Paint.Align.CENTER);
    }

    // ---------------------------------------------------------------- tray
    static class TrayItem { int type; boolean bomb; int count; RectF rect = new RectF(); }

    private void buildTray() {
        tray.clear();
        for (int t = 0; t < Pieces.COUNT; t++)
            if (!deployed[t]) { TrayItem it = new TrayItem(); it.type = t; it.count = 1; tray.add(it); }
        if (humanBombs > 0) { TrayItem it = new TrayItem(); it.bomb = true; it.type = -1; it.count = humanBombs; tray.add(it); }

        float top = boardY + boardSize + cell*0.55f;
        float bottom = getHeight() - cell*1.25f;
        float areaH = Math.max(cell, bottom - top);
        int perRow = 7;
        int rows = (tray.size() + perRow - 1) / perRow; if (rows < 1) rows = 1;
        float pad = cell*0.12f;
        float itemW = (boardSize - pad*(perRow-1)) / perRow;
        float itemH = Math.min(itemW*1.18f, (areaH - pad*(rows-1)) / rows);
        for (int i = 0; i < tray.size(); i++) {
            int row = i / perRow, col = i % perRow;
            int inRow = Math.min(perRow, tray.size() - row*perRow);
            float rowW = inRow*itemW + (inRow-1)*pad;
            float startX = boardX + (boardSize - rowW)/2f;
            float x = startX + col*(itemW+pad);
            float y = top + row*(itemH+pad);
            tray.get(i).rect.set(x, y, x+itemW, y+itemH);
        }
        // begin button
        float bw = boardSize*0.6f, bh = cell*0.9f;
        beginBtn.set(boardX + (boardSize-bw)/2f, getHeight()-bh-cell*0.18f, boardX + (boardSize+bw)/2f, getHeight()-cell*0.18f);
    }

    private void drawTray(Canvas cv) {
        for (int i = 0; i < tray.size(); i++) {
            TrayItem it = tray.get(i);
            RectF rc = it.rect;
            boolean sel = (it.bomb && selBomb) || (!it.bomb && selType == it.type);
            text.setShader(null); text.setStyle(Paint.Style.FILL);
            text.setColor(sel ? 0xFF3A2E1A : 0xFF241B10);
            cv.drawRoundRect(rc, cell*0.12f, cell*0.12f, text);
            text.setStyle(Paint.Style.STROKE); text.setStrokeWidth(cell*0.04f);
            text.setColor(sel ? Art.BRASS : 0xFF5A4A2C);
            cv.drawRoundRect(rc, cell*0.12f, cell*0.12f, text);
            text.setStyle(Paint.Style.FILL);

            float ccx = rc.centerX(), ccy = rc.top + rc.height()*0.42f, rr = rc.height()*0.30f;
            if (it.bomb) Art.drawMine(cv, ccx, ccy, rr*0.8f, 0.6f, 1f);
            else Art.drawUnit(cv, Game.HUMAN, it.type, ccx, ccy, rr, 1f, 1f);

            text.setColor(0xFFE9DCBC);
            text.setTextAlign(Paint.Align.CENTER);
            text.setTextSize(rc.height()*0.17f);
            String label = it.bomb ? ("Mines x"+it.count) : Pieces.NAME[it.type];
            cv.drawText(label, ccx, rc.bottom - rc.height()*0.10f, text);
        }

        // selected description
        if (selType >= 0 || selBomb) {
            text.setColor(0xFFB7A57A);
            text.setTextSize(cell*0.26f);
            String d = selBomb ? "Hidden mine — detonates the first enemy unit to step on it."
                               : Pieces.DESC[selType];
            cv.drawText(fit(d, getWidth()*0.92f, cell*0.26f), getWidth()/2f, boardY + boardSize + cell*0.40f, text);
        }

        // begin button when fully deployed
        if (allDeployed()) {
            text.setStyle(Paint.Style.FILL);
            text.setShader(null); text.setColor(Art.CRIMSON);
            cv.drawRoundRect(beginBtn, cell*0.22f, cell*0.22f, text);
            text.setStyle(Paint.Style.STROKE); text.setStrokeWidth(cell*0.05f); text.setColor(Art.BRASS);
            cv.drawRoundRect(beginBtn, cell*0.22f, cell*0.22f, text);
            text.setStyle(Paint.Style.FILL); text.setColor(0xFFF6ECD2);
            text.setTextAlign(Paint.Align.CENTER); text.setTextSize(beginBtn.height()*0.42f);
            cv.drawText("BEGIN THE BATTLE", beginBtn.centerX(), beginBtn.centerY()+beginBtn.height()*0.15f, text);
        }
    }

    private String fit(String s, float maxW, float size) {
        text.setTextSize(size);
        if (text.measureText(s) <= maxW) return s;
        while (s.length() > 4 && text.measureText(s+"…") > maxW) s = s.substring(0, s.length()-1);
        return s + "…";
    }

    private void drawTrophies(Canvas cv) {
        float top = boardY + boardSize + cell*0.5f;
        drawTrophyRow(cv, "Your prizes", capByHuman, Game.AI, top);
        drawTrophyRow(cv, "Enemy prizes", capByAi, Game.HUMAN, top + cell*1.55f);
    }
    private void drawTrophyRow(Canvas cv, String title, ArrayList<Integer> caps, int owner, float y) {
        text.setShader(null); text.setStyle(Paint.Style.FILL);
        text.setColor(0xFFB7A57A); text.setTextAlign(Paint.Align.LEFT); text.setTextSize(cell*0.26f);
        cv.drawText(title, boardX, y, text);
        float x = boardX, rr = cell*0.28f, yy = y + cell*0.55f;
        for (int i = 0; i < caps.size(); i++) {
            Art.drawUnit(cv, owner, caps.get(i).intValue(), x+rr, yy, rr, 1f, 0.95f);
            x += rr*2.1f;
        }
    }

    // ---------------------------------------------------------------- input
    @Override public boolean onTouchEvent(MotionEvent e) {
        if (e.getAction() != MotionEvent.ACTION_DOWN) return true;
        float x = e.getX(), y = e.getY();

        if (phase == OVER) { newGame(); return true; }
        if (busy) return true;

        if (phase == DEPLOY) { onDeployTouch(x, y); return true; }
        if (phase == PLAY && turn == Game.HUMAN) { onPlayTouch(x, y); return true; }
        return true;
    }

    private void onDeployTouch(float x, float y) {
        // begin button
        if (allDeployed() && beginBtn.contains(x, y)) { startAiDeploy(); return; }
        // tray hit
        for (int i = 0; i < tray.size(); i++) {
            TrayItem it = tray.get(i);
            if (it.rect.contains(x, y)) {
                if (it.bomb) { selBomb = true; selType = -1; }
                else { selType = it.type; selBomb = false; }
                invalidate(); return;
            }
        }
        // board hit
        int[] rc = cellAt(x, y); if (rc == null) return;
        int r = rc[0], c = rc[1];

        if (selBomb && humanBombs > 0 && game.canPlaceBomb(Game.HUMAN, r, c)) {
            game.placeBomb(Game.HUMAN, r, c);
            humanBombs--;
            spawnDeploy(Game.HUMAN, -1, r, c, true);
            if (humanBombs == 0) selBomb = false;
            invalidate(); return;
        }
        if (selType >= 0 && game.canPlacePiece(Game.HUMAN, r, c)) {
            int t = selType;
            game.place(Game.HUMAN, t, r, c);
            deployed[t] = true;
            spawnDeploy(Game.HUMAN, t, r, c, false);
            selType = -1;
            status = allDeployed() ? "Ranks formed. Sound the advance!" : "Deploy your forces, Commander.";
            invalidate(); return;
        }
        // pick a placed unit back up
        if (selType < 0 && !selBomb && game.owner[r][c] == Game.HUMAN && Game.inDeployZone(Game.HUMAN, r)) {
            int t = game.type[r][c];
            game.type[r][c] = -1; game.owner[r][c] = -1;
            deployed[t] = false;
            invalidate(); return;
        }
        // pick up a mine
        if (selType < 0 && !selBomb && game.bombOwner[r][c] == Game.HUMAN) {
            game.bombOwner[r][c] = -1; humanBombs++; invalidate(); return;
        }
    }

    private void onPlayTouch(float x, float y) {
        int[] rc = cellAt(x, y); if (rc == null) { clearSel(); invalidate(); return; }
        int r = rc[0], c = rc[1];
        // is it a move target?
        if (selR >= 0) {
            for (int i = 0; i < selMoves.size(); i++) {
                Game.Move m = selMoves.get(i);
                if (m.tr == r && m.tc == c) { humanMove(m); return; }
            }
        }
        if (game.owner[r][c] == Game.HUMAN) {
            selR = r; selC = c;
            selMoves.clear(); game.movesFrom(r, c, selMoves);
        } else clearSel();
        invalidate();
    }
    private void clearSel(){ selR = selC = -1; selMoves.clear(); }

    private int[] cellAt(float x, float y) {
        if (x < boardX || x > boardX+boardSize || y < boardY || y > boardY+boardSize) return null;
        int c = (int)((x - boardX) / cell), r = (int)((y - boardY) / cell);
        if (!Game.on(r, c)) return null;
        return new int[]{r, c};
    }

    private boolean allDeployed() {
        for (int t = 0; t < Pieces.COUNT; t++) if (!deployed[t]) return false;
        return true;
    }

    // ---------------------------------------------------------------- turns
    private void humanMove(Game.Move m) { clearSel(); commitMove(m, Game.HUMAN); }

    private void commitMove(final Game.Move m, final int who) {
        busy = true;
        float fx = cx(m.fc), fy = cy(m.fr), tx = cx(m.tc), ty = cy(m.tr);
        final int movedType = game.type[m.fr][m.fc];
        final Game.Result res = game.apply(m);

        // record trophy
        if (res.capturedType >= 0) {
            if (who == Game.HUMAN) capByHuman.add(Integer.valueOf(res.capturedType));
            else capByAi.add(Integer.valueOf(res.capturedType));
        }

        addHide(m.tr, m.tc);
        MoveAnim ma = new MoveAnim(who, movedType, fx, fy, tx, ty,
                res.capturedType, res.capturedOwner);
        ma.durMs = 300; ma.startNs = System.nanoTime();
        ma.onEnd = new Runnable() { public void run() {
            removeHide(m.tr, m.tc);
            resolveAfterMove(res, m.tr, m.tc, who);
        }};
        anims.add(ma);
        invalidate();
    }

    private void resolveAfterMove(final Game.Result res, int tr, int tc, final int who) {
        Runnable cont = new Runnable() { public void run() {
            if (res.winner >= 0) { endGame(res.winner); return; }
            // hand the turn over
            if (who == Game.HUMAN) { turn = Game.AI; startAiThink(); }
            else { turn = Game.HUMAN; busy = false; status = "Your move, Commander."; }
            invalidate();
        }};

        if (res.detonated) {
            shake(unitR * 1.5f);
            spawnExplosion(cx(tc), cy(tr), cont);
            status = "A mine! " + Pieces.NAME[res.movedType] + " is blown to splinters!";
        } else if (res.defused) {
            spawnPuff(cx(tc), cy(tr), 0xFFBFD8FF, cont);
            status = "The Sapper defuses a hidden mine!";
        } else {
            if (res.capturedType >= 0)
                spawnPuff(cx(tc), cy(tr), 0xFFE8C079, null);
            cont.run();
        }
        invalidate();
    }

    private void startAiThink() {
        status = "The enemy maneuvers…";
        busy = true;
        invalidate();
        final Game belief = game.aiBelief();
        Thread th = new Thread(new Runnable() { public void run() {
            final Game.Move m = belief.aiChooseMove(3, 220000);
            try { Thread.sleep(350); } catch (InterruptedException ignore) {}
            post(new Runnable() { public void run() {
                if (m == null) { endGame(Game.HUMAN); return; }
                commitMove(m, Game.AI);
            }});
        }});
        th.setDaemon(true);
        th.start();
    }

    private void startAiDeploy() {
        phase = AI_DEPLOY; busy = true; selType = -1; selBomb = false;
        status = "The enemy musters its forces…";
        final ArrayList<Game.Deploy> plan = game.planAiDeployment();
        // lay the enemy mines silently (hidden from you)
        for (int i = 0; i < plan.size(); i++) {
            Game.Deploy d = plan.get(i);
            if (d.bomb) game.placeBomb(Game.AI, d.r, d.c);
        }
        scheduleAiDrop(plan, 0);
        invalidate();
    }
    private void scheduleAiDrop(final ArrayList<Game.Deploy> plan, final int i) {
        if (i >= plan.size()) {
            phase = PLAY; turn = Game.HUMAN; busy = false;
            status = "Your move, Commander.";
            invalidate(); return;
        }
        Game.Deploy d = plan.get(i);
        if (d.bomb) { scheduleAiDrop(plan, i+1); return; }
        game.place(Game.AI, d.t, d.r, d.c);
        spawnDeploy(Game.AI, d.t, d.r, d.c, false);
        postDelayed(new Runnable() { public void run() { scheduleAiDrop(plan, i+1); }}, 190);
    }

    private void endGame(int w) {
        winner = w; phase = OVER; busy = false;
        status = (w == Game.HUMAN) ? "VICTORY — the enemy fleet is destroyed!"
                                   : "DEFEAT — your forces are wiped out.";
        invalidate();
    }

    // ---------------------------------------------------------------- helpers
    private void addHide(int r,int c){ hide[r][c]++; }
    private void removeHide(int r,int c){ if (hide[r][c]>0) hide[r][c]--; }
    private void shake(float amp){ shakeAmp = amp; shakeStart = System.nanoTime(); }

    private void spawnDeploy(int owner, int type, int r, int c, boolean bomb) {
        addHide(r, c);
        DeployAnim a = new DeployAnim(owner, type, cx(c), cy(r), bomb);
        a.durMs = 430; a.startNs = System.nanoTime();
        final int fr = r, fc = c;
        a.onEnd = new Runnable() { public void run() { removeHide(fr, fc); invalidate(); }};
        anims.add(a);
        invalidate();
    }
    private void spawnExplosion(float x, float y, final Runnable after) {
        Explosion ex = new Explosion(x, y, unitR*2.4f);
        ex.durMs = 900; ex.startNs = System.nanoTime();
        ex.onEnd = after;
        anims.add(ex);
    }
    private void spawnPuff(float x, float y, int color, final Runnable after) {
        Puff p = new Puff(x, y, unitR*1.3f, color);
        p.durMs = 520; p.startNs = System.nanoTime();
        p.onEnd = after;
        anims.add(p);
    }

    private void newGame() {
        game = new Game();
        for (int t=0;t<Pieces.COUNT;t++) deployed[t]=false;
        humanBombs = Game.BOMBS_PER_SIDE; selType=-1; selBomb=false;
        clearSel(); capByHuman.clear(); capByAi.clear();
        anims.clear(); for (int[] row : hide) java.util.Arrays.fill(row, 0);
        phase = DEPLOY; turn = Game.HUMAN; busy=false; winner=-1; shakeAmp=0;
        status = "Deploy your forces, Commander.";
        invalidate();
    }

    // ---------------------------------------------------------------- game over
    private void drawGameOver(Canvas cv, long now) {
        float W = getWidth(), H = getHeight();
        text.setShader(null); text.setStyle(Paint.Style.FILL);
        text.setColor(0xCC0A1016); cv.drawRect(0,0,W,H,text);
        // floating embers
        for (int i=0;i<26;i++){
            float t = ((now/6_000_000L) % 1000) / 1000f;
            float px = (float)((Math.sin(i*1.7)+1)/2)*W;
            float py = H - ((t + i*0.037f) % 1f) * H;
            text.setColor(winner==Game.HUMAN ? 0x88FFD080 : 0x88FF8060);
            cv.drawCircle(px, py, (i%3)+2f, text);
        }
        boolean win = winner == Game.HUMAN;
        RectF ribbon = new RectF(W*0.08f, H*0.40f, W*0.92f, H*0.56f);
        text.setColor(win ? Art.NAVY : Art.CRIMSON);
        cv.drawRoundRect(ribbon, 18, 18, text);
        text.setStyle(Paint.Style.STROKE); text.setStrokeWidth(8); text.setColor(Art.BRASS);
        cv.drawRoundRect(ribbon, 18, 18, text); text.setStyle(Paint.Style.FILL);
        text.setTextAlign(Paint.Align.CENTER);
        text.setColor(0xFFF6ECD2); text.setTextSize(H*0.07f);
        cv.drawText(win ? "VICTORY" : "DEFEAT", W/2f, ribbon.centerY()+H*0.005f, text);
        text.setColor(0xFFE9DCBC); text.setTextSize(H*0.028f);
        cv.drawText(win ? "The last enemy unit is sunk — the field is yours."
                        : "Your last unit has fallen.", W/2f, ribbon.bottom+H*0.05f, text);
        cv.drawText("— tap to play again —", W/2f, ribbon.bottom+H*0.10f, text);
    }

    // ================================================================ anims
    abstract class Anim {
        long startNs; int durMs; Runnable onEnd; boolean ended;
        float progress(long now){ float p=(now-startNs)/(durMs*1_000_000f); return p<0?0:(p>1?1:p); }
        abstract void draw(Canvas cv, long now);
    }

    static float easeOut(float t){ return 1f-(1f-t)*(1f-t); }
    static float easeInOut(float t){ return t<0.5f ? 2*t*t : 1f-(-2*t+2)*(-2*t+2)/2f; }

    class MoveAnim extends Anim {
        int owner, type, capType, capOwner; float fx,fy,tx,ty;
        MoveAnim(int o,int t,float a,float b,float c,float d,int ct,int co){
            owner=o; type=t; fx=a; fy=b; tx=c; ty=d; capType=ct; capOwner=co;
        }
        void draw(Canvas cv, long now){
            float p = progress(now), e = easeInOut(p);
            if (capType >= 0) {
                float s = 1f - p, al = 1f - p;
                if (s > 0.02f) Art.drawUnit(cv, capOwner, capType, tx, ty, unitR, s, al);
            }
            float x = fx + (tx-fx)*e, y = fy + (ty-fy)*e;
            float lift = (float)Math.sin(p*Math.PI) * unitR * 0.35f;
            Art.drawUnit(cv, owner, type, x, y - lift, unitR, 1f + 0.06f*(float)Math.sin(p*Math.PI), 1f);
        }
    }

    class DeployAnim extends Anim {
        int owner, type; float x, y; boolean bomb;
        DeployAnim(int o,int t,float a,float b,boolean bm){ owner=o; type=t; x=a; y=b; bomb=bm; }
        void draw(Canvas cv, long now){
            float p = progress(now);
            float drop = (1f - easeOut(Math.min(1f,p/0.8f))) * -cell*2.4f;
            float overshoot = p>0.8f ? (float)Math.sin((p-0.8f)/0.2f*Math.PI)*0.10f : 0f;
            float scale = 1f + overshoot;
            float al = Math.min(1f, p/0.25f);
            if (bomb) Art.drawMine(cv, x, y+drop, unitR*0.62f*scale, 0.6f, al);
            else Art.drawUnit(cv, owner, type, x, y+drop, unitR, scale, al);
            if (p > 0.78f) { // landing dust ring
                float dp = (p-0.78f)/0.22f;
                text.setShader(null); text.setStyle(Paint.Style.STROKE);
                text.setStrokeWidth(unitR*0.18f*(1f-dp));
                text.setColor(Art.withAlpha(0xFFB79B6A, (1f-dp)*0.7f));
                cv.drawCircle(x, y, unitR*(0.6f+dp*1.2f), text);
                text.setStyle(Paint.Style.FILL);
            }
        }
    }

    class Puff extends Anim {
        float x,y,r; int color;
        Puff(float a,float b,float rr,int c){ x=a;y=b;r=rr;color=c; }
        void draw(Canvas cv, long now){
            float p = progress(now);
            text.setShader(null); text.setStyle(Paint.Style.FILL);
            for (int i=0;i<6;i++){
                double a = i*Math.PI/3 + p*1.5;
                float rad = r*(0.3f+p*0.9f);
                float px=(float)(x+Math.cos(a)*rad), py=(float)(y+Math.sin(a)*rad - p*r*0.4f);
                text.setColor(Art.withAlpha(color, (1f-p)*0.6f));
                cv.drawCircle(px, py, r*(0.35f)*(1f-p*0.5f), text);
            }
        }
    }

    class Explosion extends Anim {
        float x,y,r; float[] px,py,pvx,pvy,psz; int n=22;
        Explosion(float a,float b,float rr){
            x=a;y=b;r=rr; px=new float[n];py=new float[n];pvx=new float[n];pvy=new float[n];psz=new float[n];
            for(int i=0;i<n;i++){
                double ang = rnd.nextDouble()*Math.PI*2; float sp = r*(0.8f+rnd.nextFloat()*1.6f);
                pvx[i]=(float)Math.cos(ang)*sp; pvy[i]=(float)Math.sin(ang)*sp - r*0.6f;
                psz[i]=r*(0.10f+rnd.nextFloat()*0.16f);
            }
        }
        void draw(Canvas cv, long now){
            float p = progress(now);
            text.setShader(null); text.setStyle(Paint.Style.FILL);
            // flash
            if (p < 0.18f){
                float fp = p/0.18f;
                text.setColor(Art.withAlpha(0xFFFFF4C0, (1f-fp)));
                cv.drawCircle(x, y, r*(0.4f+fp*0.9f), text);
            }
            // shockwave ring
            text.setStyle(Paint.Style.STROKE);
            text.setStrokeWidth(r*0.18f*(1f-p));
            text.setColor(Art.withAlpha(0xFFFFC04A, (1f-p)*0.9f));
            cv.drawCircle(x, y, r*(0.2f+p*1.7f), text);
            text.setStyle(Paint.Style.FILL);
            // fire core
            if (p < 0.5f){
                float cp = p/0.5f;
                text.setColor(Art.withAlpha(0xFFFF7A20, (1f-cp)*0.9f));
                cv.drawCircle(x, y, r*(0.5f*(1f-cp)+0.2f), text);
                text.setColor(Art.withAlpha(0xFFFFE070, (1f-cp)));
                cv.drawCircle(x, y, r*(0.3f*(1f-cp)+0.1f), text);
            }
            // debris/sparks with gravity
            float t = p;
            for (int i=0;i<n;i++){
                float gx = x + pvx[i]*t;
                float gy = y + pvy[i]*t + r*1.8f*t*t;
                int col = (i%3==0)?0xFFFFE070:(i%3==1?0xFFFF8030:0xFF3A2A1E);
                text.setColor(Art.withAlpha(col, (1f-t)));
                cv.drawCircle(gx, gy, psz[i]*(1f-0.4f*t), text);
            }
            // smoke rising
            for (int i=0;i<5;i++){
                float sp = (p+ i*0.12f);
                if (sp>1f) continue;
                float sy = y - sp*r*1.3f;
                text.setColor(Art.withAlpha(0xFF55504A, (1f-sp)*0.45f));
                cv.drawCircle(x + (i-2)*r*0.28f, sy, r*(0.25f+sp*0.55f), text);
            }
        }
    }
}
