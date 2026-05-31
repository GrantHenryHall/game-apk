import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Generates a binary (compiled) AndroidManifest.xml without aapt/aapt2.
 *
 * This emits the AOSP binary resource XML format directly:
 *   RES_XML_TYPE
 *     RES_STRING_POOL_TYPE        (UTF-16 strings)
 *     RES_XML_RESOURCE_MAP_TYPE   (attr-name string index -> framework attr resource id)
 *     RES_XML_START_NAMESPACE_TYPE (android)
 *       ... element / attribute nodes ...
 *     RES_XML_END_NAMESPACE_TYPE
 *
 * The manifest is intentionally resource-free (no res/, no resources.arsc):
 * the whole app is drawn on a Canvas, the launcher icon falls back to the
 * system default, and the window chrome is configured at runtime.
 *
 * Usage: java MakeManifest <output-path>
 */
public class MakeManifest {

    // ---- chunk type constants (AOSP ResourceTypes.h) ----
    static final int RES_STRING_POOL_TYPE          = 0x0001;
    static final int RES_XML_TYPE                  = 0x0003;
    static final int RES_XML_START_NAMESPACE_TYPE  = 0x0100;
    static final int RES_XML_END_NAMESPACE_TYPE    = 0x0101;
    static final int RES_XML_START_ELEMENT_TYPE    = 0x0102;
    static final int RES_XML_END_ELEMENT_TYPE      = 0x0103;
    static final int RES_XML_RESOURCE_MAP_TYPE     = 0x0180;

    // ---- Res_value data types ----
    static final int TYPE_REFERENCE   = 0x01;
    static final int TYPE_STRING      = 0x03;
    static final int TYPE_INT_DEC     = 0x10;
    static final int TYPE_INT_HEX     = 0x11;
    static final int TYPE_INT_BOOLEAN = 0x12;

    // ---- framework attribute resource ids (stable across platform versions) ----
    static final int ATTR_theme            = 0x01010000;
    static final int ATTR_label            = 0x01010001;
    static final int ATTR_name             = 0x01010003;
    static final int ATTR_hasCode          = 0x0101000c;
    static final int ATTR_exported         = 0x01010010;
    static final int ATTR_screenOrientation= 0x0101001e;
    static final int ATTR_configChanges    = 0x0101001f;
    static final int ATTR_minSdkVersion    = 0x0101020c;
    static final int ATTR_versionCode      = 0x0101021b;
    static final int ATTR_versionName      = 0x0101021c;
    static final int ATTR_targetSdkVersion = 0x01010270;

    static final String ANDROID_URI = "http://schemas.android.com/apk/res/android";

    // ---- string pool ----
    static final ArrayList<String> strings = new ArrayList<String>();
    static final HashMap<String,Integer> stringIndex = new HashMap<String,Integer>();
    // resource ids parallel to the FIRST resMap.size() strings:
    static final ArrayList<Integer> resMap = new ArrayList<Integer>();

    static int str(String s) {
        Integer i = stringIndex.get(s);
        if (i != null) return i.intValue();
        int idx = strings.size();
        strings.add(s);
        stringIndex.put(s, Integer.valueOf(idx));
        return idx;
    }

    // Register an attribute-name string together with its framework resource id.
    // These MUST be the first N strings, in the same order as the resource map.
    static int attrName(String name, int resId) {
        int idx = str(name);
        if (idx != resMap.size())
            throw new IllegalStateException("attr name out of order: " + name);
        resMap.add(Integer.valueOf(resId));
        return idx;
    }

    // ---- node model ----
    static class Attr {
        int nsUri;   // string index of namespace uri, or -1
        int name;    // string index of attribute name
        int rawValue;// string index of raw text value, or -1
        int type;    // Res_value type
        int data;    // Res_value data
        int resId;   // for sorting (0 if none)
    }
    static class Elem {
        int name;
        ArrayList<Attr> attrs = new ArrayList<Attr>();
        ArrayList<Elem> kids = new ArrayList<Elem>();
        Elem(int n){ name = n; }
    }

    static Attr aStr(int resId, int nameIdx, String value) {
        Attr a = new Attr();
        a.nsUri = str(ANDROID_URI); a.name = nameIdx; a.resId = resId;
        a.type = TYPE_STRING; a.data = str(value); a.rawValue = a.data;
        return a;
    }
    static Attr aInt(int resId, int nameIdx, int value, int type) {
        Attr a = new Attr();
        a.nsUri = str(ANDROID_URI); a.name = nameIdx; a.resId = resId;
        a.type = type; a.data = value; a.rawValue = -1;
        return a;
    }
    static Attr aBool(int resId, int nameIdx, boolean v) {
        return aInt(resId, nameIdx, v ? 0xFFFFFFFF : 0, TYPE_INT_BOOLEAN);
    }
    // plain (no-namespace) string attribute, e.g. package=
    static Attr aPlainStr(String name, String value) {
        Attr a = new Attr();
        a.nsUri = -1; a.name = str(name); a.resId = 0;
        a.type = TYPE_STRING; a.data = str(value); a.rawValue = a.data;
        return a;
    }

    public static void main(String[] argv) throws Exception {
        final String PKG     = "com.grant.admirals";
        final String CLAZZ   = "com.grant.admirals.MainActivity";
        final String LABEL   = "Bombs & Admirals";
        final int    VCODE   = 2;
        final String VNAME   = "1.1";
        final int    MINSDK  = 24;
        final int    TARGET  = 28;

        // 1) attribute-name strings first, ascending by resource id (matches resMap order)
        int nLabel  = attrName("label",            ATTR_label);            // 0x01010001
        int nName   = attrName("name",             ATTR_name);             // 0x01010003
        int nHasCode= attrName("hasCode",          ATTR_hasCode);          // 0x0101000c
        int nExport = attrName("exported",         ATTR_exported);         // 0x01010010
        int nOrient = attrName("screenOrientation",ATTR_screenOrientation);// 0x0101001e
        int nConfig = attrName("configChanges",    ATTR_configChanges);    // 0x0101001f
        int nMinSdk = attrName("minSdkVersion",    ATTR_minSdkVersion);    // 0x0101020c
        int nVCode  = attrName("versionCode",      ATTR_versionCode);      // 0x0101021b
        int nVName  = attrName("versionName",      ATTR_versionName);      // 0x0101021c
        int nTarget = attrName("targetSdkVersion", ATTR_targetSdkVersion); // 0x01010270

        // 2) make sure namespace prefix/uri strings exist
        int sAndroid = str("android");
        int sUri     = str(ANDROID_URI);

        // 3) build element tree
        Elem manifest = new Elem(str("manifest"));
        manifest.attrs.add(aInt(ATTR_versionCode, nVCode, VCODE, TYPE_INT_DEC));
        manifest.attrs.add(aStr(ATTR_versionName, nVName, VNAME));
        manifest.attrs.add(aPlainStr("package", PKG));

        Elem usesSdk = new Elem(str("uses-sdk"));
        usesSdk.attrs.add(aInt(ATTR_minSdkVersion,    nMinSdk, MINSDK, TYPE_INT_DEC));
        usesSdk.attrs.add(aInt(ATTR_targetSdkVersion, nTarget, TARGET, TYPE_INT_DEC));
        manifest.kids.add(usesSdk);

        Elem app = new Elem(str("application"));
        app.attrs.add(aStr(ATTR_label, nLabel, LABEL));
        app.attrs.add(aBool(ATTR_hasCode, nHasCode, true));
        manifest.kids.add(app);

        Elem activity = new Elem(str("activity"));
        activity.attrs.add(aStr(ATTR_label, nLabel, LABEL));
        activity.attrs.add(aStr(ATTR_name, nName, CLAZZ));
        activity.attrs.add(aBool(ATTR_exported, nExport, true));
        activity.attrs.add(aInt(ATTR_screenOrientation, nOrient, 1, TYPE_INT_DEC)); // portrait
        activity.attrs.add(aInt(ATTR_configChanges, nConfig, 0x04A0, TYPE_INT_HEX));// orientation|keyboardHidden|screenSize
        app.kids.add(activity);

        Elem filter = new Elem(str("intent-filter"));
        Elem action = new Elem(str("action"));
        action.attrs.add(aStr(ATTR_name, nName, "android.intent.action.MAIN"));
        Elem category = new Elem(str("category"));
        category.attrs.add(aStr(ATTR_name, nName, "android.intent.category.LAUNCHER"));
        filter.kids.add(action);
        filter.kids.add(category);
        activity.kids.add(filter);

        // sort attributes by resource id (no-namespace attrs go last)
        sortAttrs(manifest);

        // 4) serialize
        byte[] out = serialize(manifest, sAndroid, sUri);
        FileOutputStream fos = new FileOutputStream(argv[0]);
        fos.write(out);
        fos.close();
        System.out.println("Wrote " + out.length + " bytes -> " + argv[0]);
    }

    static void sortAttrs(Elem e) {
        Collections.sort(e.attrs, new Comparator<Attr>() {
            public int compare(Attr a, Attr b) {
                long ra = (a.resId == 0) ? 0xFFFFFFFFL : (a.resId & 0xFFFFFFFFL);
                long rb = (b.resId == 0) ? 0xFFFFFFFFL : (b.resId & 0xFFFFFFFFL);
                return Long.compare(ra, rb);
            }
        });
        for (int i = 0; i < e.kids.size(); i++) sortAttrs(e.kids.get(i));
    }

    // ---------- little-endian byte buffer ----------
    static class Buf {
        byte[] b = new byte[1024];
        int len = 0;
        void ensure(int n){ if (len+n > b.length){ int ns=b.length*2; while(ns<len+n) ns*=2; b=Arrays.copyOf(b,ns);} }
        void u8(int v){ ensure(1); b[len++]=(byte)(v&0xFF); }
        void u16(int v){ ensure(2); b[len++]=(byte)(v&0xFF); b[len++]=(byte)((v>>8)&0xFF); }
        void u32(int v){ ensure(4); b[len++]=(byte)(v&0xFF); b[len++]=(byte)((v>>8)&0xFF); b[len++]=(byte)((v>>16)&0xFF); b[len++]=(byte)((v>>24)&0xFF); }
        void bytes(byte[] x){ ensure(x.length); System.arraycopy(x,0,b,len,x.length); len+=x.length; }
        byte[] toArray(){ return Arrays.copyOf(b, len); }
    }

    static byte[] buildStringPool() {
        // string data (UTF-16LE), collect offsets
        Buf data = new Buf();
        int[] offsets = new int[strings.size()];
        for (int i = 0; i < strings.size(); i++) {
            offsets[i] = data.len;
            String s = strings.get(i);
            data.u16(s.length());                 // char count (< 0x8000)
            byte[] u = s.getBytes(StandardCharsets.UTF_16LE);
            data.bytes(u);
            data.u16(0);                           // null terminator
        }
        // pad string data to 4 bytes
        while ((data.len & 3) != 0) data.u8(0);

        int stringCount = strings.size();
        int headerSize = 28;
        int offsetsSize = 4 * stringCount;
        int stringsStart = headerSize + offsetsSize;
        int chunkSize = stringsStart + data.len;

        Buf c = new Buf();
        c.u16(RES_STRING_POOL_TYPE);
        c.u16(headerSize);
        c.u32(chunkSize);
        c.u32(stringCount);
        c.u32(0);              // style count
        c.u32(0);              // flags (0 => UTF-16, not sorted)
        c.u32(stringsStart);   // strings start
        c.u32(0);              // styles start
        for (int i = 0; i < stringCount; i++) c.u32(offsets[i]);
        c.bytes(data.toArray());
        return c.toArray();
    }

    static byte[] buildResourceMap() {
        int chunkSize = 8 + 4 * resMap.size();
        Buf c = new Buf();
        c.u16(RES_XML_RESOURCE_MAP_TYPE);
        c.u16(8);              // header size
        c.u32(chunkSize);
        for (int i = 0; i < resMap.size(); i++) c.u32(resMap.get(i).intValue());
        return c.toArray();
    }

    static void writeNamespace(Buf out, int type, int prefix, int uri) {
        out.u16(type);
        out.u16(16);           // header size
        out.u32(24);           // chunk size (16 + 8)
        out.u32(0xFFFFFFFF);   // line number (unknown)
        out.u32(0xFFFFFFFF);   // comment
        out.u32(prefix);
        out.u32(uri);
    }

    static void writeStartElement(Buf out, Elem e) {
        int count = e.attrs.size();
        int chunkSize = 16 + 20 + 20 * count;
        out.u16(RES_XML_START_ELEMENT_TYPE);
        out.u16(16);
        out.u32(chunkSize);
        out.u32(0xFFFFFFFF);   // line
        out.u32(0xFFFFFFFF);   // comment
        // attrExt
        out.u32(0xFFFFFFFF);   // element namespace (none)
        out.u32(e.name);       // element name
        out.u16(20);           // attributeStart
        out.u16(20);           // attributeSize
        out.u16(count);        // attributeCount
        out.u16(0);            // idIndex
        out.u16(0);            // classIndex
        out.u16(0);            // styleIndex
        for (int i = 0; i < count; i++) {
            Attr a = e.attrs.get(i);
            out.u32(a.nsUri);
            out.u32(a.name);
            out.u32(a.rawValue);
            // Res_value
            out.u16(8);        // size
            out.u8(0);         // res0
            out.u8(a.type);
            out.u32(a.data);
        }
    }

    static void writeEndElement(Buf out, Elem e) {
        out.u16(RES_XML_END_ELEMENT_TYPE);
        out.u16(16);
        out.u32(24);
        out.u32(0xFFFFFFFF);
        out.u32(0xFFFFFFFF);
        out.u32(0xFFFFFFFF);   // namespace
        out.u32(e.name);
    }

    static void writeElement(Buf out, Elem e) {
        writeStartElement(out, e);
        for (int i = 0; i < e.kids.size(); i++) writeElement(out, e.kids.get(i));
        writeEndElement(out, e);
    }

    static byte[] serialize(Elem root, int prefix, int uri) {
        // build inner body first (everything after the top header)
        byte[] pool = buildStringPool();
        byte[] rmap = buildResourceMap();

        Buf nodes = new Buf();
        writeNamespace(nodes, RES_XML_START_NAMESPACE_TYPE, prefix, uri);
        writeElement(nodes, root);
        writeNamespace(nodes, RES_XML_END_NAMESPACE_TYPE, prefix, uri);
        byte[] nodeBytes = nodes.toArray();

        int total = 8 + pool.length + rmap.length + nodeBytes.length;
        Buf out = new Buf();
        out.u16(RES_XML_TYPE);
        out.u16(8);
        out.u32(total);
        out.bytes(pool);
        out.bytes(rmap);
        out.bytes(nodeBytes);
        return out.toArray();
    }
}
