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

- Bir ile tıklamak seçimi açar veya kapatır. Seçili il turuncu görünür.
- Sayaç seçili il sayısını gösterir.
- Seçimler bu tarayıcıdaki `localStorage` alanına kaydedilir ve sayfa yenilense de korunur. Başka cihazlara aktarılmaz.
- **Sıfırla** bütün seçimleri siler.
- **Haritayı İndir** haritayı ve seçili il sayısını `turkeyvisited.png` olarak indirir.
- Dar ekranlarda harita yatay olarak kaydırılabilir.

## Dosyalar

- `index.html`: Sayfa iskeleti ve düğmeler.
- `styles.css`: Örneğe yakın görünüm ve dar ekran düzeni.
- `tr-cities.json`: 81 ilin GeoJSON sınırları.
- `turkeyvisited.js`: D3 ile çizim, seçim, saklama, sıfırlama ve indirme.

GitHub Pages ile yayımlamak için depo ayarlarında **Pages** kaynağı olarak `main` dalının kök (`/`) klasörünü seçin.
