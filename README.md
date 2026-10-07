# Visited Turkey

Türkiye'de ziyaret ettiğiniz illeri haritada işaretleyin ve haritayı PNG olarak indirin.

Bu proje, Ozan Yerli'nin [TurkeyVisited](https://github.com/ozanyerli/turkeyvisited) projesinin görünümünü ve temel işlevlerini başlangıç noktası olarak kullanır. İl sınırları (`tr-cities.json`), ilk HTML/CSS tasarımı ve GitHub simgesi bu projeden alınmıştır. Özgün projenin MIT lisansı [LICENSE](LICENSE) dosyasındadır.

## Çalıştırma

Depo klasöründe bir yerel sunucu başlatın:

```sh
python3 -m http.server 8000
```

Sonra `http://localhost:8000` adresini açın. GeoJSON dosyası yüklendiği için sayfayı `file://` adresinden açmayın. Kurulum veya derleme adımı gerekmez. D3 v5 ve html2canvas 1.3.2 dosyaları `vendor/` altında tutulur; lisansları aynı klasördedir.

## Kullanım

- Seçilmemiş bir ilin üzerine gelince `#DEF3D7` rengi görünür. İl adları 10 pt Comic Neue ile yazılır.
- Bir ile tıklayınca ziyaret yılı kutusu açılır. Yılı yazıp Enter tuşuna basın. Farklı yıllar için **Yeni yıl ekle** düğmesini kullanın ve **Kaydet** düğmesine basın. Aynı yıl iki kez kaydedilemez; eski tekrarlı kayıtlar da tek yıla indirilir.
- Son ziyaretten bu yana geçen yıl sayısı, tarayıcının bulunduğu yıl eksi son ziyaret yılı olarak hesaplanır. Fark 0–3 ise il `#16B816`, 4–6 ise `#72CD61`, 7–10 ise `#98DA89`, 10'dan fazlaysa `#BCE7B0` görünür. Son üç yılda birden fazla farklı ziyaret yılı varsa ilin dolgusu `#FFD700` olur; il adı diğer iller gibi kalır. Yılı henüz girilmemiş eski işaretlemeler `#16B816` kalır.
- Renkler kaydedilen yıllardan yeniden hesaplanır; açık sayfada 1 Ocak'ta ve sekmeye geri dönüldüğünde güncellenir.
- Seçili ilin üzerine gelince en yeni üç yıl görünür. Daha fazla yıl varsa sonuna `...` eklenir; bütün yılları görmek veya düzenlemek için ile tıklayın.
- İlin işaretini kaldırmak için seçili ile tıklayıp **İşareti kaldır** düğmesini kullanın.
- Sayaç seçili il sayısını gösterir.
- Seçimler ve ziyaret yılları bu tarayıcıdaki `localStorage` alanına kaydedilir ve sayfa yenilense de korunur. Başka cihazlara aktarılmaz.
- **Sıfırla** bütün seçimleri siler.
- **Haritayı İndir** haritayı ve seçili il sayısını `turkeyvisited.png` olarak indirir.
- **JSON yedeği indir** seçili illeri ve ziyaret yıllarını bir dosyaya kaydeder. **JSON yedeğini yükle** aynı verileri geri getirir; doğrulanan yedek mevcut tarayıcı kayıtlarının yerine geçmeden önce onay ister. Dosya kullanıcının cihazında kalır; hesap veya veritabanı gerekmez.
- Dar ekranlarda harita yatay olarak kaydırılabilir.
- Sol üstteki **i** düğmesi kısa kullanım açıklamasını açar.
- Haritanın sağ üstündeki lejant, ziyaret durumlarına karşılık gelen dolgu renklerini açıklar.

## Dosyalar

- `index.html`: Sayfa iskeleti ve düğmeler.
- `styles.css`: Örneğe yakın görünüm ve dar ekran düzeni.
- `tr-cities.json`: 81 ilin GeoJSON sınırları.
- `turkeyvisited.js`: D3 ile çizim, seçim, saklama, sıfırlama ve indirme.
- `vendor/fonts/`: İl etiketleri için Comic Neue yazı tipi ve SIL Open Font License metni.

GitHub Pages ile yayımlamak için depo ayarlarında **Pages** kaynağı olarak `main` dalının kök (`/`) klasörünü seçin.
