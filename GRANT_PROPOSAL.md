# 📄 QRANT LAYİHƏSİ TƏKLİFİ (GRANT PROPOSAL)

**Layihənin Adı:**  
«SkillMap Azerbaijan: Əmək Bazarının Real Məlumatları Əsasında Gənclərin Bacarıq Uyğunluğunun Qiymətləndirilməsi və Rəqəmsal Karyera Qərar Dəstəyi Platforması»

**İngiliscə Adı:**  
*«SkillMap Azerbaijan: Data-Driven Labour Market Intelligence & Skill Gap Decision Support Platform for Youth and Higher Education»*

---

## 1. 📌 İcraçı Xülasə (Executive Summary)

Müasir əmək bazarında ali təhsil müəssisələrinin tədris proqramları ilə işəgötürənlərin real tələbləri arasında nəzərəçarpacaq dərəcədə bacarıq uyğunsuzluğu (**Skill Gap**) mövcuddur. Gənclər hansı bacarıqların bazarda daha çox tələb olunduğunu dəqiq bilmir, universitetlər kurrikulumları bazar tələbatına çevik uyğunlaşdıra bilmir, dövlət qurumları isə məşğulluq siyasətini planlaşdırarkən real vaxt rejimli bacarıq analitikasına ehtiyac duyur.

**SkillMap Azerbaijan** layihəsi açıq əmək bazarı məlumatlarını və işəgötürənlərin vakansiya tələblərini **Təbii Dil Emalı (NLP)** vasitəsilə emal edən, dinamik **Bacarıq Taksonomiyası** quran və tələbələrə fərdiləşdirilmiş karyera inkişaf tövsiyələri verən innovativ rəqəmsal intellekt platformasıdır.

---

## 2. 🔍 Problemin Aktuallığı və Təhlili (Problem Statement)

Azərbaycan əmək bazarında aparılan ilkin tədqiqatlar aşağıdakı fundamental problemləri göstərir:
1. **İnformasiya Asimmetriyası:** Tələbələr və məzunlar iş elanlarındakı tələbləri (məs. SQL, Power BI, Advanced Excel, 1C ERP) təhsil müddətində deyil, yalnız müsahibə mərhələsində dərk edirlər.
2. **Statik Kurrikulumlar:** Universitet proqramları bazarın 2026-cı il trendlərinə (AI alətləri, avtomatlaşdırma, data savadlılığı) gec reaksiya verir.
3. **Struktur Disbalans:** Bakının mərkəzi rayonları (Nərimanov, Nəsimi, Səbail) ilə digər regionlar (Sumqayıt, Gəncə) arasında tələb olunan bacarıq profillərində kəskin fərqlər mövcuddur.

---

## 3. 🎯 Layihənin Məqsəd və Hədəfləri (Objectives & KPIs)

### Əsas Məqsəd:
Gənclərin əmək bazarına inteqrasiyasını sürətləndirmək, bacarıq boşluqlarını minimuma endirmək və təhsil-sənaye əlaqələrini data əsasında gücləndirmək.

### Konkret Hədəflər (KPIs):
- **Data Həcmi:** Minimum **5 000 – 10 000** yerli vakansiya elanının NLP alqoritmləri ilə təhlili və standartlaşdırılması.
- **Əhatə Dairəsi:** Pilot mərhələdə **3 000+** tələbə və məzunun fərdi "Skill Gap" profilinin formalaşdırılması.
- **Tərəfdaşlıq:** Ən azı **4 universitet** (UNEC, BANM, BDU, ADA) və **20+ iri işəgötürən** şirkətlə məlumat mübadiləsi.
- **Praktiki Nəticə:** Məzunların bazar tələblərinə uyğunluq faizinin orta hesabla **%15-20 artırılması** üçün fərdi təlim xəritələrinin təqdim edilməsi.

---

## 4. ⚙️ Texnoloji Metodologiya və Arxitektura

Layihə 4 əsas texnoloji təbəqə üzərində qurulur:

```
[Vakansiya Mənbələri] ──► [NLP & Tokenizer] ──► [Skill Taxonomy (Dictionary)]
                                                              │
[Tələbə Profili]       ──► [Gap Alqoritmi]    ◄───────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
     [Tələbə Portalı]   [Universitet AI]   [Dövlət/Siyasət Paneli]
```

1. **Açıq Verilənlərin Təhlili (Data Layer):** Boss.az, Jobsearch.az, HelloJob.az, LinkedIn və DMA açıq mənbələrindən strukturlaşdırılmamış mətnlərin toplanması.
2. **NLP & Entity Extraction:** Qeyri-dəqiq sinonimlərin (`"MS Excel 365"`, `"Excel"`, `"Microsoft Excel"`) vahid taksonomiya açarına çevrilməsi.
3. **Çəkili Uyğunluq Alqoritmi (Matching Engine):** Hər vəzifə üzrə bacarıqların çəki əmsalları ($W_i$) və istifadəçinin bilik səviyyəsi ($U_i$) əsasında riyazi uyğunluq faizinin hesablanması:
   $$\text{Match Score} = \frac{\sum \min(U_i, W_i)}{\sum W_i} \times 100$$
4. **İnteraktiv Veb İnterfeys:** Tailwind CSS, Chart.js və dinamik Bakı əmək xəritəsi modulu.

---

## 5. 👥 Hədəf Qrupları və Faydalanıcılar

| Hədəf Qrup | Layihədən Əldə Edəcəyi Fayda |
| :--- | :--- |
| **Gənclər və Tələbələr** | Şəxsi boşluqları (Skill Gap) görmək, ən uyğun alternativ karyera istiqamətini seçmək və pulsuz öyrənmə planı əldə etmək. |
| **Universitetlər** | Məzunların zəif tərəflərini aşkar edərək kurrikuluma hansı praktiki fənləri əlavə etmək barədə AI tövsiyələri almaq. |
| **Dövlət və DMA** | Milli səviyyədə bacarıq çatışmazlığını izləmək, təlim qrantlarını və məşğulluq subsidiyalarını düzgün yönləndirmək. |
| **İşəgötürənlər** | Bazarda hazır və tələblərə cavab verən ixtisaslı gənc kadr bazasına çıxış. |

---

## 6. 📅 İcra Planı və Mərhələlər (12 Aylıq Yol Xəritəsi)

- **Mərhələ 1 (1–3-cü aylar):** Data strategiyasının icrası, ilkin 5 000 vakansiyanın toplanması və NLP Taksonomiyasının təkmilləşdirilməsi.
- **Mərhələ 2 (4–6-cı aylar):** SkillMap veb platformasının tam backend və frontend inteqrasiyası, universitetlərlə pilot sınaqların başlanması.
- **Mərhələ 3 (7–9-cu aylar):** 3 000 tələbə arasında kütləvi "Skill Gap" qiymətləndirmə kampaniyasının və karyera seminarlarının keçirilməsi.
- **Mərhələ 4 (10–12-ci aylar):** İllik «Azərbaycan Əmək Bazarı və Bacarıq Barometri – 2026» hesabatının dərci və layihənin yekun təqdimatı.

---

## 7. ⚖️ Hüquqi və Etik Əsaslandırma (Data Ethics)

- Layihə çərçivəsində tələbələrdən heç bir həssas şəxsi məlumat (FIN kod, ünvan və s.) toplanmır; profillər anonim statistik parametrlər üzərində qurulur.
- Vakansiya məlumatları yalnız ictimaiyyətə açıq olan tələb parametrləri əsasında tədqiqat və analitika məqsədilə emal edilir.

---

## 8. 💡 Layihənin Dayanıqlığı (Sustainability)

Qrant müddəti başa çatdıqdan sonra platforma:
1. Universitetlər üçün illik **"Kurrikulum Akkreditasiyası və Bazar Uyğunluğu Hesabatı"** xidməti kimi;
2. İşəgötürənlər üçün **"İstedadların Bacarıq Analitikası"** portalı kimi;
3. Dövlət məşğulluq agentlikləri üçün daimi **"Əmək Bazarı Rəsədxanası"** kimi öz fəaliyyətini davam etdirəcəkdir.
