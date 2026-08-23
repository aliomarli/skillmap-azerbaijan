# 🌐 SkillMap Azerbaijan – Əmək Bazarı və Bacarıq Qərar Dəstəyi Platforması

> **Layihənin Məqsədi:** Real vakansiya elanlarının və əmək bazarı tələblərinin NLP (Təbii Dil Emalı) ilə təhlili əsasında gənclərin "Skill Gap" boşluqlarını ölçən, fərdiləşdirilmiş karyera tövsiyələri verən, habelə universitet və dövlət qurumları üçün qərar dəstəyi təmin edən rəqəmsal platforma.

---

## 📂 Fayl Strukturu

```
skillmap-azerbaijan/
│
├── index.html               # Əsas interfeys (Bütün 7 bölmə, responsive SPA)
├── css/
│   └── styles.css           # Glassmorphism, animasiyalar, print və qrafik stilləri
├── js/
│   ├── data.js              # Çevik JSON formatında mərkəzi data bazası (vakansiyalar, bacarıqlar, xəritə)
│   ├── skillGapEngine.js    # Bacarıq uyğunluğu (Match Score %) və boşluq hesablama mühərriki
│   ├── mapModule.js         # Bakı rayonları və regionlar üzrə interaktiv əmək xəritəsi
│   ├── nlpSimulator.js      # Vakansiya mətnindən bacarıq və təcrübə çıxaran NLP mühərriki
│   └── app.js               # Əsas tətbiq kontroleri, qrafiklərin render olunması və JSON idarəetməsi
└── README.md                # Quraşdırma və istifadə təlimatı
```

---

## 🚀 Saytı Necə İşə Salmaq Olar?

Heç bir mürəkkəb quraşdırmaya və ya kitabxana yükləməyə ehtiyac yoxdur:
1. `skillmap-azerbaijan` qovluğuna daxil olun.
2. `index.html` faylını iki dəfə klikləyərək istənilən brauzerdə (Chrome, Edge, Firefox, Safari) açın.

---

## 📊 Topladığınız Real Datanı Sayta Necə Yerləşdirəcəksiniz?

Platforma **çox çevik data arxitekturasına** malikdir. Məlumatları 2 rahat üsulla sayta daxil edə bilərsiniz:

### Üsul 1: Birbaşa `js/data.js` Faylını Yeniləməklə (Daimi Baza)
Siz vakansiyaları çəkib Python/SQL ilə emal etdikdən sonra nəticələri `js/data.js` faylındakı müvafiq massivlərə yazırsınız:
- `jobRolesBenchmark`: Vəzifələr və hər vəzifə üçün tələb olunan bacarıq faizləri.
- `regionsMapData`: Bakının rayonları üzrə vakansiya sayı, dominant sektorlar və top bacarıqlar.
- `skillsTaxonomy`: Texniki və şəxsi bacarıqların sinonimlər lüğəti.
- `macroMarketStats`: Ümumi toplanmış 5,000-10,000 vakansiyanın ümumi statistikası.

### Üsul 2: Saytın İçindən "Data Yüklə" Düyməsi ilə (Canlı İdxal)
1. Saytın yuxarı sağ küncündə **«Data Yüklə»** düyməsinə klikləyin.
2. Emal etdiyiniz JSON məlumatını pəncərəyə yapışdırın və **«Datanı Tətbiq Et»** düyməsini sıxın.
3. Bütün qrafiklər, xəritələr və faizlər dərhal yeni datanıza uyğunlaşacaqdır.

---

## 🎯 Layihənin 7 Əsas Modulu

1. **🏠 Ana Səhifə & Makro Xülasə:** Əmək bazarı üzrə ümumi statistik göstəricilər və istifadəçi portalları.
2. **👤 Tələbə "Skill Gap" Analizi:** İstifadəçinin bacarıqları ilə bazar tələbinin müqayisəsi, 🟢 Uyğun, 🟠 Orta, 🔴 Kritik boşluqların təyini.
3. **🎯 Fərdiləşdirilmiş Karyera Tövsiyəsi:** Mövcud biliklərə əsasən ən yüksək uyğunluq göstərən alternativ vəzifələrin sıralanması (🥇 78%, 🥈 72%...).
4. **🗺️ Bakı və Regionların İnteraktiv Əmək Xəritəsi:** Nərimanov, Nəsimi, Səbail, Xətai, Yasamal, Sumqayıt və Gəncə üzrə tələbat göstəriciləri.
5. **📊 Vakansiya və 2026 Trendləri Analitikası:** Top 8 bacarıq qrafiki, sektor bölgüsü, ən çox yüksələn (+142% AI alətləri) və tələbatı azalan sahələr.
6. **🏛️ Universitet Dashboard-u:** UNEC, BANM, BDU, ADA profilləri və kurrikulum optimallaşdırılması üçün süni intellekt tövsiyəsi.
7. **⚙️ NLP & Bacarıq Çıxarışı Simulyatoru:** Qrant komissiyasına sistemin texniki tərəfini göstərmək üçün sərbəst mətndən bacarıqları ayıran laboratoriya.
