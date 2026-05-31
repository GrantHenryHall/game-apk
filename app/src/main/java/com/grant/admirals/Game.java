package com.grant.admirals;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Random;

/**
 * Board state and rules for "Bombs & Admirals".
 *
 * 10x10 board. Owner 0 = the player (deploys on the bottom rows), owner 1 =
 * the enemy admiral / AI (deploys on the top rows). Win by capturing the enemy
 * Admiral (regicide — no check/checkmate, just take the king).
 *
 * Bombs are hidden mines: they detonate only the FIRST enemy piece that steps
 * on them. A Sapper defuses a bomb instead of dying.
 */
public class Game {
    public static final int N = 10;
    public static final int HUMAN = 0, AI = 1;
    public static final int BOMBS_PER_SIDE = 5;

    // -1 = empty
    public final int[][] type  = new int[N][N];
    public final int[][] owner = new int[N][N];
    // bombOwner[r][c] = -1 none, else owner of the mine
    public final int[][] bombOwner = new int[N][N];

    public Game() { reset(); }

    public void reset() {
        for (int r = 0; r < N; r++)
            for (int c = 0; c < N; c++) {
                type[r][c] = -1; owner[r][c] = -1; bombOwner[r][c] = -1;
            }
    }

    // ---- deployment zones ----
    public static boolean inDeployZone(int owner, int r) {
        return owner == HUMAN ? (r >= 7) : (r <= 2);          // 3 ranks each
    }
    public static boolean inBombZone(int owner, int r) {
        // mines may be sown across the contested ground, not in the enemy's own back ranks
        return owner == HUMAN ? (r >= 3) : (r <= 6);
    }

    public boolean canPlacePiece(int owner, int r, int c) {
        return on(r, c) && inDeployZone(owner, r) && type[r][c] < 0 && bombOwner[r][c] < 0;
    }
    public boolean canPlaceBomb(int owner, int r, int c) {
        return on(r, c) && inBombZone(owner, r) && type[r][c] < 0 && bombOwner[r][c] < 0;
    }

    public void place(int owner, int t, int r, int c) { type[r][c] = t; this.owner[r][c] = owner; }
    public void placeBomb(int owner, int r, int c)     { bombOwner[r][c] = owner; }

    static boolean on(int r, int c) { return r >= 0 && r < N && c >= 0 && c < N; }

    public int count(int who) {
        int n = 0;
        for (int r = 0; r < N; r++)
            for (int c = 0; c < N; c++)
                if (owner[r][c] == who) n++;
        return n;
    }

    public int[] findKing(int who) {
        for (int r = 0; r < N; r++)
            for (int c = 0; c < N; c++)
                if (owner[r][c] == who && type[r][c] == Pieces.ADMIRAL)
                    return new int[]{r, c};
        return null;
    }

    // ======================= move generation =======================
    public static final int[][] DIR8 = {
        {-1,0},{1,0},{0,-1},{0,1}, {-1,-1},{-1,1},{1,-1},{1,1}
    };
    static final int[][] KNIGHT = {
        {-2,-1},{-2,1},{2,-1},{2,1},{-1,-2},{-1,2},{1,-2},{1,2}
    };

    public static class Move {
        public int fr, fc, tr, tc;
        public Move(int a,int b,int c,int d){ fr=a; fc=b; tr=c; tc=d; }
    }

    /** All legal destinations for the piece at (r,c). Enemy mines are invisible
     *  to movement (they only trigger on landing); own mines block landing. */
    public void movesFrom(int r, int c, ArrayList<Move> out) {
        int t = type[r][c]; if (t < 0) return;
        int me = owner[r][c];

        int style = Pieces.slideStyle(t);
        if (style != Pieces.SLIDE_NONE) {
            int range = Pieces.slideRange(t);
            int start = (style == Pieces.SLIDE_DIAG) ? 4 : 0;
            int end   = (style == Pieces.SLIDE_ORTH) ? 4 : (style == Pieces.SLIDE_DIAG ? 8 : 8);
            for (int d = start; d < end; d++) {
                int dr = DIR8[d][0], dc = DIR8[d][1];
                for (int step = 1; step <= range; step++) {
                    int nr = r + dr*step, nc = c + dc*step;
                    if (!on(nr,nc)) break;
                    if (owner[nr][nc] == me) break;          // own piece blocks
                    if (bombOwner[nr][nc] == me) break;       // won't walk onto own mine
                    out.add(new Move(r,c,nr,nc));
                    if (owner[nr][nc] >= 0) break;            // captured enemy: stop
                }
            }
        }

        int leap = Pieces.leapSet(t);
        if (leap != Pieces.LEAP_NONE) {
            int[][] set;
            if (leap == Pieces.LEAP_KNIGHT) set = KNIGHT;
            else if (leap == Pieces.LEAP_ORTH2) set = new int[][]{{-2,0},{2,0},{0,-2},{0,2}};
            else set = new int[][]{{-2,-2},{-2,2},{2,-2},{2,2}};
            for (int i = 0; i < set.length; i++) {
                int nr = r + set[i][0], nc = c + set[i][1];
                if (!on(nr,nc)) continue;
                if (owner[nr][nc] == me) continue;
                if (bombOwner[nr][nc] == me) continue;
                out.add(new Move(r,c,nr,nc));
            }
        }
    }

    public ArrayList<Move> legalMoves(int who) {
        ArrayList<Move> list = new ArrayList<Move>();
        for (int r = 0; r < N; r++)
            for (int c = 0; c < N; c++)
                if (owner[r][c] == who) movesFrom(r, c, list);
        return list;
    }

    public boolean isLegal(int who, int fr, int fc, int tr, int tc) {
        if (!on(fr,fc) || owner[fr][fc] != who) return false;
        ArrayList<Move> list = new ArrayList<Move>();
        movesFrom(fr, fc, list);
        for (int i = 0; i < list.size(); i++) {
            Move m = list.get(i);
            if (m.tr == tr && m.tc == tc) return true;
        }
        return false;
    }

    // ======================= applying a move =======================
    public static class Result {
        public int movedType, movedOwner;
        public int fr, fc, tr, tc;
        public int capturedType = -1, capturedOwner = -1;
        public boolean detonated = false;   // the moving piece stepped on a mine and died
        public boolean defused   = false;   // a Sapper cleared a mine and lives
        public int winner = -1;             // owner who just won, or -1
    }

    public Result apply(Move m) {
        Result res = new Result();
        int t = type[m.fr][m.fc], me = owner[m.fr][m.fc];
        res.movedType = t; res.movedOwner = me;
        res.fr = m.fr; res.fc = m.fc; res.tr = m.tr; res.tc = m.tc;

        // capture on the destination square
        if (owner[m.tr][m.tc] >= 0 && owner[m.tr][m.tc] != me) {
            res.capturedType = type[m.tr][m.tc];
            res.capturedOwner = owner[m.tr][m.tc];
        }

        // lift from source
        type[m.fr][m.fc] = -1; owner[m.fr][m.fc] = -1;
        // land
        type[m.tr][m.tc] = t; owner[m.tr][m.tc] = me;

        // mine resolution on the destination
        int bomb = bombOwner[m.tr][m.tc];
        if (bomb >= 0 && bomb != me) {
            bombOwner[m.tr][m.tc] = -1;            // mine consumed
            if (t == Pieces.SAPPER) {
                res.defused = true;                 // engineer survives
            } else {
                res.detonated = true;               // piece destroyed
                type[m.tr][m.tc] = -1; owner[m.tr][m.tc] = -1;
            }
        }

        // win check — last force standing wins (total annihilation)
        int hc = count(HUMAN), ac = count(AI);
        if (ac == 0 && hc > 0) res.winner = HUMAN;
        else if (hc == 0 && ac > 0) res.winner = AI;
        else if (hc == 0 && ac == 0) res.winner = me; // mutual wipe-out: the mover claims the field
        return res;
    }

    // ======================= enemy AI =======================
    private final Random rnd = new Random();

    /** Plan the enemy's deployment as an ordered list of actions to animate. */
    public static class Deploy {
        public boolean bomb; public int t, r, c;
        Deploy(boolean b,int t,int r,int c){ bomb=b; this.t=t; this.r=r; this.c=c; }
    }

    public ArrayList<Deploy> planAiDeployment() {
        ArrayList<Deploy> plan = new ArrayList<Deploy>();
        boolean[][] used = new boolean[N][N];

        // king tucked in the back rank, near centre
        int kc = 4 + rnd.nextInt(2);
        plan.add(new Deploy(false, Pieces.ADMIRAL, 0, kc));
        used[0][kc] = true;

        // remaining 11 pieces: heavy hitters behind, infantry forward
        int[] order = { Pieces.FRIGATE, Pieces.BOMBARD, Pieces.NAVIGATOR, Pieces.DRAGOON,
                        Pieces.HUSSAR, Pieces.RANGER, Pieces.SAPPER, Pieces.LANCER,
                        Pieces.SCOUT, Pieces.GRENADIER, Pieces.FUSILIER };
        for (int i = 0; i < order.length; i++) {
            int t = order[i];
            int preferredRow = (Pieces.VALUE[t] >= 30) ? (rnd.nextInt(2)) : (1 + rnd.nextInt(2));
            int[] cell = freeCell(used, preferredRow, 0, 2);
            plan.add(new Deploy(false, t, cell[0], cell[1]));
            used[cell[0]][cell[1]] = true;
        }

        // sow mines across the forward ground (rows 3..6), favouring the centre lanes
        int placed = 0, guard = 0;
        while (placed < BOMBS_PER_SIDE && guard++ < 500) {
            int r = 3 + rnd.nextInt(4);
            int c = 1 + rnd.nextInt(8);
            if (used[r][c]) continue;
            used[r][c] = true;
            plan.add(new Deploy(true, -1, r, c));
            placed++;
        }
        return plan;
    }

    private int[] freeCell(boolean[][] used, int preferRow, int loRow, int hiRow) {
        for (int tries = 0; tries < 40; tries++) {
            int r = preferRow;
            if (tries > 8) r = loRow + rnd.nextInt(hiRow - loRow + 1);
            int c = rnd.nextInt(N);
            if (!used[r][c]) return new int[]{r, c};
        }
        for (int r = loRow; r <= hiRow; r++)
            for (int c = 0; c < N; c++) if (!used[r][c]) return new int[]{r, c};
        return new int[]{loRow, 0};
    }

    // ---- search ----
    private long nodeBudget;

    public Move aiChooseMove(int depth, long budget) {
        nodeBudget = budget;
        ArrayList<Move> moves = legalMoves(AI);
        if (moves.isEmpty()) return null;
        orderMoves(moves);

        Move best = moves.get(0);
        int bestScore = Integer.MIN_VALUE;
        int alpha = -1000000, beta = 1000000;
        for (int i = 0; i < moves.size(); i++) {
            Move m = moves.get(i);
            int[] undo = make(m);
            int score = -negamax(depth - 1, -beta, -alpha, HUMAN);
            unmake(m, undo);
            if (score > bestScore) { bestScore = score; best = m; }
            if (score > alpha) alpha = score;
        }
        return best;
    }

    private int negamax(int depth, int alpha, int beta, int side) {
        int term = terminal(side);
        if (term != Integer.MIN_VALUE) return term;
        if (depth <= 0 || nodeBudget <= 0) return evalFor(side);
        nodeBudget--;

        ArrayList<Move> moves = legalMoves(side);
        if (moves.isEmpty()) return evalFor(side);
        orderMoves(moves);

        int bestScore = -1000000;
        int other = 1 - side;
        for (int i = 0; i < moves.size(); i++) {
            Move m = moves.get(i);
            int[] undo = make(m);
            int score = -negamax(depth - 1, -beta, -alpha, other);
            unmake(m, undo);
            if (score > bestScore) bestScore = score;
            if (score > alpha) alpha = score;
            if (alpha >= beta) break;
        }
        return bestScore;
    }

    /** terminal score from `side` perspective, or MIN_VALUE if not terminal. */
    private int terminal(int side) {
        int hc = count(HUMAN), ac = count(AI);
        if (hc > 0 && ac > 0) return Integer.MIN_VALUE;
        int winner = (ac == 0) ? HUMAN : AI;   // whoever still has a force standing
        int s = 900000;
        return (winner == side) ? s : -s;
    }

    /** static evaluation from `side` perspective (positive = good for side).
     *  Annihilation game: it's all about material, with a gentle push forward
     *  so the armies actually close and trade. */
    private int evalFor(int side) {
        int score = 0;
        for (int r = 0; r < N; r++)
            for (int c = 0; c < N; c++) {
                int o = owner[r][c]; if (o < 0) continue;
                int v = Pieces.VALUE[type[r][c]];
                int adv = (o == HUMAN) ? (N - 1 - r) : r;  // 0..9, deeper into enemy ground = better
                int sub = v + adv;
                score += (o == side ? 1 : -1) * sub;
            }
        return score;
    }

    private void orderMoves(ArrayList<Move> moves) {
        Collections.sort(moves, new Comparator<Move>() {
            public int compare(Move a, Move b) { return mscore(b) - mscore(a); }
        });
    }
    private int mscore(Move m) {
        if (owner[m.tr][m.tc] >= 0) return 100 + Pieces.VALUE[type[m.tr][m.tc]];
        return 0;
    }

    // make/unmake for search (no mines involved in the AI's belief board)
    private int[] make(Move m) {
        int ct = type[m.tr][m.tc], co = owner[m.tr][m.tc];
        type[m.tr][m.tc] = type[m.fr][m.fc];
        owner[m.tr][m.tc] = owner[m.fr][m.fc];
        type[m.fr][m.fc] = -1; owner[m.fr][m.fc] = -1;
        return new int[]{ct, co};
    }
    private void unmake(Move m, int[] undo) {
        type[m.fr][m.fc] = type[m.tr][m.tc];
        owner[m.fr][m.fc] = owner[m.tr][m.tc];
        type[m.tr][m.tc] = undo[0];
        owner[m.tr][m.tc] = undo[1];
    }

    /** A copy the AI reasons over: it cannot see the player's hidden mines. */
    public Game aiBelief() {
        Game g = new Game();
        for (int r = 0; r < N; r++)
            for (int c = 0; c < N; c++) {
                g.type[r][c] = type[r][c];
                g.owner[r][c] = owner[r][c];
                g.bombOwner[r][c] = (bombOwner[r][c] == AI) ? AI : -1;
            }
        return g;
    }
}
