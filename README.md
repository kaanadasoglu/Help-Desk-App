# Help-Desk-App
Help Desk Application, kullanıcıların teknik destek taleplerini oluşturup takip edebileceği, destek personelinin ise bu talepleri yönetip yanıtlayabileceği tam donanımlı bir destek sistemi olarak tasarlanmıştır. Proje, React tabanlı frontend ile kullanıcı dostu ve hızlı bir arayüz sağlarken, Node.js / Express tabanlı backend API ile sağlam ve ölçeklenebilir bir altyapı sunar. Veriler MongoDB üzerinde depolanır.https://github.com/kaanadasoglu/Help-Desk-App/blob/main/README.md

Backend bağımlılıkları yüklenmeli: 
cd helpdesk-backend
npm install 
Backend çalıştırmak için: node index.js

Frontend bağımlılıkları yüklenmeli:
cd ../helpdesk-frontend
npm install
Frontend Çalıştırmak için: npm start

mongo-backup.gz dosyası ile database container(docker) içinde şu komutlarla çalıştırılabilir:
docker cp ./mongo-backup.gz mongo:/data/mongo-backup.gz
docker exec -it mongo mongorestore --gzip --archive=/data/mongo-backup.gz


Kullanıcı Kayıt ve Giriş: Kullanıcılar sisteme kayıt olabilir ve giriş yapabilir.

Rol Bazlı Yetkilendirme: Kullanıcılar ve destek personeli için farklı yetkiler.

Talep Oluşturma: Kullanıcılar yeni destek talepleri oluşturabilir.

Talep Listeleme: Destek personeli kendisine atanan talepleri ve tüm talepleri görebilir.

Talep Güncelleme ve Yanıtlama: Destek personeli kendilerine atanan talepleri yanıtlayabilir, kullanıcılar cevapları görüntüleyebilir ve gelen cevaba karşı yanıt verebilir veya sorun çözüldü butonuna tıklayarak talep durumunu kapalıya çevirebilir.

Destek Elemanı Atanması: Destek personelleri bir queue içinden sırayla atanır. Yeni oluşturulan personel de queue ya dahil edilir.

Gerçek Zamanlı Durum Takibi: Taleplerin durumları güncellenir ve anlık takip sağlanır.

MongoDB ile Kalıcı Veri Yönetimi: Tüm veriler MongoDB'de güvenle saklanır.

Databasede bulunan kullanıcıların ve destek personelinin hesaplarına mail adresleri: "adsoyad"@gmail.com şifreleri:123 olarak girilebilir.

Örneğin: kaanadasoglu@gmail.com:123
