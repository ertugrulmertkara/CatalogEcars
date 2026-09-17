# Veri Şeması

## Car

| Alan | Tip | Zorunlu | Not |
|---|---|---|---|
| id | ObjectId | otomatik | MongoDB üretir |
| brand | String | evet | Serbest metin |
| model | String | evet | Serbest metin |
| year | Number | evet | 2010–2027 |
| bodyType | Enum | evet | Sabit liste |
| drivetrain | Enum | hayır | Sabit liste |
| range | Number | evet | km, WLTP |
| battery | Number | hayır | kWh |
| price | Number | evet | TL |
| status | Enum | evet | Varsayılan: catalog |
| note | String | hayır | Serbest metin |
| link | String | hayır | URL |
| createdAt | Date | otomatik | Kayıt tarihi |

## Sabit listeler

bodyType: hatchback | sedan | SUV | crossover | station
drivetrain: RWD | AWD
status: catalog | shortlist | testDrive | rejected

## Kararlar ve gerekçeleri

- **Menzil WLTP standardında tutulur.** 

- **bodyType sabit liste olarak tanımlandı.**

- **chargeTime alanı kapsam dışı bırakıldı.** .

- **status varsayılanı catalog.** Uygulama önce bir katalog, sonra bir
  karar aracı. Yeni eklenen araç nötr durumda başlar; kullanıcı üzerinde
  işlem yaptıkça shortlist, testDrive veya rejected durumlarına geçer.

- **brand enum kısmında olmalı , yeni araç girerken bu önemlidir**
## Kapsam dışı

Karşılaştırma ekranı, fiyat geçmişi ve grafik,

## Hata 
Css te important sorunu 