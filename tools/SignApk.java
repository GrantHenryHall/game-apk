import com.android.apksig.ApkSigner;
import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Signs an APK with v1 + v2 schemes using apksig. */
public class SignApk {
    public static void main(String[] args) throws Exception {
        String inApk    = args[0];
        String outApk   = args[1];
        String ksPath   = args[2];
        String ksPass   = args[3];
        String alias    = args[4];
        int    minSdk   = Integer.parseInt(args[5]);

        KeyStore ks = KeyStore.getInstance("PKCS12");
        FileInputStream fis = new FileInputStream(ksPath);
        ks.load(fis, ksPass.toCharArray());
        fis.close();

        PrivateKey key = (PrivateKey) ks.getKey(alias, ksPass.toCharArray());
        Certificate[] chain = ks.getCertificateChain(alias);
        List<X509Certificate> certs = new ArrayList<X509Certificate>();
        for (int i = 0; i < chain.length; i++) certs.add((X509Certificate) chain[i]);

        ApkSigner.SignerConfig signer =
                new ApkSigner.SignerConfig.Builder("CERT", key, certs).build();

        ApkSigner apkSigner = new ApkSigner.Builder(Collections.singletonList(signer))
                .setInputApk(new File(inApk))
                .setOutputApk(new File(outApk))
                .setMinSdkVersion(minSdk)
                .setV1SigningEnabled(false)
                .setV2SigningEnabled(true)
                .build();
        apkSigner.sign();
        System.out.println("Signed -> " + outApk);
    }
}
