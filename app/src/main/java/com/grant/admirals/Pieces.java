package com.grant.admirals;

/**
 * Static metadata for the twelve unique units of "Bombs & Admirals".
 *
 * There is exactly ONE of each per army (no doubles). Five are inspired by the
 * old chess pieces (re-themed for a 19th-century naval / colonial battlefield);
 * the other seven are original and kept deliberately simple so nothing dwarfs
 * the line infantry.
 */
public final class Pieces {
    private Pieces() {}

    // ---- type ids ----
    public static final int ADMIRAL   = 0;  // (king)   royal, 1 step any direction
    public static final int FRIGATE   = 1;  // (queen)  slides any direction
    public static final int BOMBARD   = 2;  // (rook)   slides orthogonally
    public static final int NAVIGATOR = 3;  // (bishop) slides diagonally
    public static final int DRAGOON   = 4;  // (knight) L-shaped leap
    public static final int GRENADIER = 5;  // 1 step orthogonally
    public static final int FUSILIER  = 6;  // 1 step diagonally
    public static final int HUSSAR    = 7;  // charges up to 3 orthogonally
    public static final int RANGER    = 8;  // ranges up to 3 diagonally
    public static final int SAPPER    = 9;  // 1 step any direction; DEFUSES bombs
    public static final int LANCER    = 10; // leaps exactly 2 orthogonally
    public static final int SCOUT     = 11; // leaps exactly 2 diagonally
    public static final int COUNT     = 12;

    // movement style
    static final int SLIDE_NONE = 0, SLIDE_ORTH = 1, SLIDE_DIAG = 2, SLIDE_ALL = 3;
    // leap sets
    static final int LEAP_NONE = 0, LEAP_KNIGHT = 1, LEAP_ORTH2 = 2, LEAP_DIAG2 = 3;

    public static final String[] NAME = {
        "Admiral", "Frigate", "Bombard", "Navigator", "Dragoon", "Grenadier",
        "Fusilier", "Hussar", "Ranger", "Sapper", "Lancer", "Scout"
    };

    // one-line descriptions shown in the field manual / tray
    public static final String[] DESC = {
        "Flagship of the fleet — 1 square any way. Protect at all costs.",
        "The great ship of the line — sails any distance, any way.",
        "Siege gun — fires in straight ranks, any distance.",
        "Charts the diagonals — glides any distance corner-wise.",
        "Mounted dragoon — leaps in an L, clears all in its path.",
        "Line infantry — advances 1 square forward, back or flank.",
        "Skirmisher — slips 1 square along the diagonals.",
        "Light cavalry — charges up to 3 squares in a rank or file.",
        "Frontier ranger — ranges up to 3 squares corner-wise.",
        "Engineer — 1 square any way, and DEFUSES bombs it steps on.",
        "Lancer — leaps exactly 2 squares in a rank or file.",
        "Scout — leaps exactly 2 squares diagonally."
    };

    // rough fighting value, used by the enemy admiral's staff (the AI).
    // The Admiral is no longer the win condition, so it is valued like the
    // ordinary 1-step movers — every last unit must be hunted down.
    public static final int[] VALUE = {
        16, 90, 50, 48, 30, 11, 11, 42, 40, 18, 20, 20
    };

    static int slideStyle(int t) {
        switch (t) {
            case ADMIRAL: case SAPPER:               return SLIDE_ALL;
            case FRIGATE:                            return SLIDE_ALL;
            case BOMBARD: case GRENADIER: case HUSSAR: return SLIDE_ORTH;
            case NAVIGATOR: case FUSILIER: case RANGER: return SLIDE_DIAG;
            default:                                 return SLIDE_NONE;
        }
    }

    static int slideRange(int t) {
        switch (t) {
            case ADMIRAL: case SAPPER: case GRENADIER: case FUSILIER: return 1;
            case HUSSAR: case RANGER: return 3;
            default: return 10; // full-board sliders
        }
    }

    static int leapSet(int t) {
        switch (t) {
            case DRAGOON: return LEAP_KNIGHT;
            case LANCER:  return LEAP_ORTH2;
            case SCOUT:   return LEAP_DIAG2;
            default:      return LEAP_NONE;
        }
    }
}
