# Visited Turkey

Türkiye'de ziyaret ettiğiniz illeri ve ziyaret yıllarını işaretleyebileceğiniz, [GitHub Pages üzerinde yayımlanan](https://hma-gr.github.io/Visited_Turkey/) statik bir web uygulaması. Hesap, veritabanı veya sunucu tarafı işlem gerekmez.

## Kullanım

1. Haritada bir ile tıklayın. Ziyaret yılını yazıp **Kaydet** düğmesine veya Enter'a basın. Farklı yıllar için **Yeni yıl ekle** düğmesini kullanın. Aynı yıl bir il için iki kez kaydedilemez. Yıl eklemeden kutuyu kapatırsanız il işaretli kalır.
2. İşaretli ilin üzerine gelince en yeni üç ziyaret yılı görünür. Daha fazla kayıt varsa `...` gösterilir; ile tekrar tıklayarak bütün yılları görebilir, düzenleyebilir veya **İşareti kaldır** düğmesini kullanabilirsiniz.
3. **Sıfırla** bu tarayıcıdaki bütün il ve yıl kayıtlarını siler. Haritanın altındaki sayaç işaretli il sayısını gösterir.

Haritanın sağ üstündeki lejant renkleri açıklar. Renk, **bulunulan yıl − en son ziyaret yılı** farkına göre belirlenir:

| Dolgu | Anlamı |
| --- | --- |
| `#FFD700` | Son 0–3 yılda farklı yıllarda birden fazla ziyaret |
| `#16B816` | Son 0–3 yılda tek ziyaret; yıl girilmemiş işaretli iller de bu renkte kalır |
| `#72CD61` | Son ziyaret 4–6 yıl önce |
| `#98DA89` | Son ziyaret 7–10 yıl önce |
| `#BCE7B0` | Son ziyaret 10 yıldan daha eski |
| `#fff2e3` | Gidilmemiş il |

Gidilmemiş bir ilin üzerine gelince geçici olarak `#DEF3D7` görünür. İl adları 10 pt Comic Neue ile yazılır. Renkler açık sayfada 1 Ocak'ta ve sekmeye geri dönüldüğünde yeniden hesaplanır. Dar ekranlarda harita yatay olarak kaydırılabilir; sol üstteki **i** düğmesi kısa kullanım açıklamasını açar.

## Kayıt ve yedekleme

İşaretler ve ziyaret yılları yalnızca kullandığınız tarayıcının `localStorage` alanında saklanır (`selectedCities` ve `visitedCityYears` anahtarları). Sayfayı yenilediğinizde kalırlar; başka tarayıcıya veya cihaza kendiliğinden aktarılmazlar. Tarayıcı verilerini temizlemek ya da **Sıfırla** düğmesini kullanmak bu kayıtları siler.

- **JSON yedeği indir** işaretli illeri ve yılları `visited-turkey-backup-YYYY-MM-DD.json` dosyasına kaydeder. Dosya cihazınızda kalır.
- **JSON yedeğini yükle** bu dosyayı doğrular ve mevcut kayıtların üzerine yazmadan önce onay ister. Geçersiz dosya mevcut kayıtları değiştirmez. Başka tarayıcıya geçmek için önce yedeği indirin, sonra orada yükleyin.
- **Haritayı İndir** il renklerini, adlarını ve sayacı `turkeyvisited.png` olarak kaydeder. PNG, etkileşimli kayıtları veya lejantı içermez; kayıtları geri yüklemek için JSON yedeğini kullanın.

## Yerel çalıştırma

Depo klasöründe bir yerel sunucu başlatın:

```sh
python3 -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın. GeoJSON dosyası ağ isteğiyle yüklendiğinden sayfayı `file://` adresinden açmayın. Kurulum, derleme adımı veya dış API anahtarı gerekmez. Yayımlamak için GitHub Pages kaynağını `main` dalının kök (`/`) klasörü olarak ayarlayın.

## Dosyalar ve kaynaklar

- `index.html`: Sayfa, lejant ve denetimler.
- `styles.css`: Masaüstü ve dar ekran yerleşimi.
- `turkeyvisited.js`: D3 ile harita çizimi, il/yıl kayıtları, renkler, JSON ve PNG işlemleri.
- `tr-cities.json`: 81 ilin GeoJSON sınırları.
- `vendor/d3.v5.min.js`: Yerel D3 v5 kopyası; lisansı `vendor/LICENSE.d3`.
- `vendor/fonts/`: Comic Neue yazı tipi ve `OFL.txt` lisansı.

Proje, Ozan Yerli'nin [TurkeyVisited](https://github.com/ozanyerli/turkeyvisited) çalışmasının görünümünü ve temel işlevlerini başlangıç noktası olarak kullanır. İl sınırları, ilk HTML/CSS tasarımı ve GitHub simgesi bu çalışmadan alınmıştır. Özgün projenin MIT lisansı [LICENSE](LICENSE) dosyasındadır.
