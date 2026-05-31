import net.dongliu.apk.parser.ApkFile;

public class Validate {
    public static void main(String[] a) throws Exception {
        ApkFile apk = new ApkFile(new java.io.File(a[0]));
        System.out.println("=== decoded AndroidManifest.xml ===");
        System.out.println(apk.getManifestXml());
        System.out.println("=== meta ===");
        System.out.println("packageName=" + apk.getApkMeta().getPackageName());
        System.out.println("label=" + apk.getApkMeta().getLabel());
        System.out.println("versionName=" + apk.getApkMeta().getVersionName());
        System.out.println("minSdk=" + apk.getApkMeta().getMinSdkVersion()
                + " targetSdk=" + apk.getApkMeta().getTargetSdkVersion());
        apk.close();
    }
}
