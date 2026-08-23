window.SkillMapData = {
    "skillDictionary": {
        "sql": {
            "id": "sql",
            "name": "SQL & Verilənlər Bazası",
            "demand_frequency": 0.50,
            "required_proficiency": 3.2,
            "importance": "required",
            "importance_distribution": { "required": 0.72, "preferred": 0.28 },
            "typical_roles": ["data_analyst", "financial_analyst", "business_analyst"],
            "industry_distribution": { "IT": 0.85, "Finance": 0.78, "Retail": 0.15 }
        },
        "excel": {
            "id": "excel",
            "name": "Microsoft Excel",
            "demand_frequency": 0.65,
            "required_proficiency": 2.8,
            "importance": "preferred",
            "importance_distribution": { "required": 0.45, "preferred": 0.55 },
            "typical_roles": ["financial_analyst", "business_analyst", "hr_specialist"],
            "industry_distribution": { "Finance": 0.92, "IT": 0.40 }
        },
        "power_bi": {
            "id": "power_bi",
            "name": "Power BI & Vizualizasiya",
            "demand_frequency": 0.28,
            "required_proficiency": 3.5,
            "importance": "required",
            "importance_distribution": { "required": 0.65, "preferred": 0.35 },
            "typical_roles": ["data_analyst", "business_analyst"],
            "industry_distribution": { "IT": 0.72, "Finance": 0.50 }
        },
        "powerbi": {
            "id": "powerbi",
            "name": "Power BI & Vizualizasiya",
            "demand_frequency": 0.28,
            "required_proficiency": 3.5,
            "importance": "required",
            "importance_distribution": { "required": 0.65, "preferred": 0.35 },
            "typical_roles": ["data_analyst", "business_analyst"],
            "industry_distribution": { "IT": 0.72, "Finance": 0.50 }
        },
        "python": {
            "id": "python",
            "name": "Python & Proqramlaşdırma",
            "demand_frequency": 0.35,
            "required_proficiency": 3.8,
            "importance": "preferred",
            "importance_distribution": { "required": 0.80, "preferred": 0.20 },
            "typical_roles": ["data_analyst", "frontend_developer", "business_analyst"],
            "industry_distribution": { "IT": 0.88, "Finance": 0.35 }
        },
        "analytical_thinking": {
            "id": "analytical_thinking",
            "name": "Analitik Təfəkkür",
            "demand_frequency": 0.60,
            "required_proficiency": 4.0,
            "importance": "required",
            "importance_distribution": { "required": 0.85, "preferred": 0.15 },
            "typical_roles": ["data_analyst", "financial_analyst", "business_analyst"],
            "industry_distribution": { "Finance": 0.90, "IT": 0.85 }
        },
        "communication": {
            "id": "communication",
            "name": "Kommunikasiya & Təqdimat",
            "demand_frequency": 0.55,
            "required_proficiency": 3.0,
            "importance": "required",
            "importance_distribution": { "required": 0.70, "preferred": 0.30 },
            "typical_roles": ["data_analyst", "business_analyst", "financial_analyst"],
            "industry_distribution": { "Finance": 0.80, "IT": 0.75 }
        },
        "financial_analysis": {
            "id": "financial_analysis",
            "name": "Maliyyə Analizi",
            "demand_frequency": 0.45,
            "required_proficiency": 3.8,
            "importance": "required",
            "importance_distribution": { "required": 0.85, "preferred": 0.15 },
            "typical_roles": ["financial_analyst"],
            "industry_distribution": { "Finance": 0.95 }
        },
        "financial_modeling": {
            "id": "financial_modeling",
            "name": "Maliyyə Modelləşdirməsi (DCF)",
            "demand_frequency": 0.20,
            "required_proficiency": 3.5,
            "importance": "preferred",
            "importance_distribution": { "required": 0.60, "preferred": 0.40 },
            "typical_roles": ["financial_analyst"],
            "industry_distribution": { "Finance": 0.90 }
        },
        "accounting_1c": {
            "id": "accounting_1c",
            "name": "1C Mühasibat 8.3",
            "demand_frequency": 0.40,
            "required_proficiency": 3.2,
            "importance": "required",
            "importance_distribution": { "required": 0.75, "preferred": 0.25 },
            "typical_roles": ["financial_analyst", "accountant"],
            "industry_distribution": { "Finance": 0.90 }
        },
        "accounting": {
            "id": "accounting",
            "name": "Mühasibat və IFRS",
            "demand_frequency": 0.45,
            "required_proficiency": 3.5,
            "importance": "required",
            "importance_distribution": { "required": 0.80, "preferred": 0.20 },
            "typical_roles": ["accountant", "financial_analyst"],
            "industry_distribution": { "Finance": 0.95 }
        },
        "javascript": {
            "id": "javascript",
            "name": "JavaScript & Frontend",
            "demand_frequency": 0.40,
            "required_proficiency": 3.8,
            "importance": "required",
            "importance_distribution": { "required": 0.90, "preferred": 0.10 },
            "typical_roles": ["frontend_developer"],
            "industry_distribution": { "IT": 0.95 }
        },
        "react": {
            "id": "react",
            "name": "React.js Framework",
            "demand_frequency": 0.35,
            "required_proficiency": 3.5,
            "importance": "required",
            "importance_distribution": { "required": 0.85, "preferred": 0.15 },
            "typical_roles": ["frontend_developer"],
            "industry_distribution": { "IT": 0.95 }
        },
        "digital_marketing": {
            "id": "digital_marketing",
            "name": "Rəqəmsal Marketinq & SMM",
            "demand_frequency": 0.35,
            "required_proficiency": 3.2,
            "importance": "required",
            "importance_distribution": { "required": 0.80, "preferred": 0.20 },
            "typical_roles": ["digital_marketer"],
            "industry_distribution": { "Marketing": 0.95 }
        }
    },

    "methodologySources": {
        "lastUpdated": "Avqust 2026",
        "version": "SkillMap NLP Pipeline v2.0 (Jobsearch.az n=420)",
        "sampleSize": 420,
        "confidenceIndex": "Pilot / Sınaq Mərhələsi (n=420)",
        "primarySources": [
            {
                "name": "Jobsearch.az — Açıq Vakansiya Elanları",
                "type": "✅ Hazırda İnteqrasiya Olunub",
                "description": "420 real vakansiya elanı (Avqust 2026, 8 günlük toplama pəncərəsi) NLP əsaslı açar söz uyğunlaşdırma metodu ilə analiz edilib. 191 elanda (45%) ətraflı tələblər mətni aşkarlanıb və bacarıq çıxarışı üçün istifadə olunub.",
                "link": "https://jobsearch.az"
            },
            {
                "name": "Dövlət Məşğulluq Agentliyi (DMA) Rəsmi Statistikası",
                "type": "🔜 Planlaşdırılan Mənbə (II Faza)",
                "description": "Dövlət tərəfdaşlığı əldə edildikdən sonra milli məşğulluq reyestri ilə inteqrasiya nəzərdə tutulur. Hazırda bu mənbədən data istifadə OLUNMUR.",
                "link": "https://dma.gov.az"
            },
            {
                "name": "Boss.az, HelloJob.az və Digər Əmək Portalları",
                "type": "🔜 Planlaşdırılan Mənbə (II Faza)",
                "description": "Data əhatəsini genişləndirmək üçün əlavə vakansiya platformalarının hüquqi icazə şəraitinin araşdırılması və inteqrasiyası planlaşdırılır.",
                "link": "#"
            },
            {
                "name": "Universitet Tələbə/Məzun Sorğuları (UNEC, BANM, BDU, ADA)",
                "type": "🔜 Planlaşdırılan Mənbə (II Faza)",
                "description": "Real tələbə bacarıq profillərinin toplanması üçün universitetlərlə əməkdaşlıq və sorğu kampaniyası planlaşdırılır. Hazırda bu bölmədə real sorğu datası MÖVCUD DEYİL, nümayiş məqsədli demo istifadəçi profili göstərilir.",
                "link": "#"
            },
            {
                "name": "Dünya İqtisadi Forumu (WEF) «Future of Jobs 2025» Hesabatı",
                "type": "📖 İstinad Mənbəyi (Kontekst üçün)",
                "description": "Qlobal əmək bazarı trendləri barədə ümumi kontekst və metodoloji çərçivə üçün açıq hesabat kimi istinad edilir; birbaşa data inteqrasiyası deyil.",
                "link": "https://weforum.org"
            }
        ],
        "calculationFormulas": {
            "matchScore": "Match Score (%) = (Σ min(İstifadəçi Bacarığı, Bazar Tələbi) / Σ Bazar Tələbi) * 100",
            "skillGap": "Skill Gap = Max(0, Bazar Tələbi - Tələbənin Bilik Səviyyəsi)",
            "salaryPredictor": "Təxmini Bazar Dəyəri = Baza Əməkhaqqı * (1 + 0.6 * MatchScore% + 0.3 * HighDemandSkillsWeight)"
        },
        "limitations": "Bu, PİLOT versiyadır. Nəticələr kiçik nümunə ölçüsünə (420 vakansiya, 8 günlük pəncərə) əsaslanır və statistik etibarlılığı məhduddur. Tam miqyaslı nəticələr üçün minimum 2000-3000 vakansiyalıq davamlı data toplama və real tələbə sorğusu tələb olunur.",
        "disclaimer": "Məlumatlar Jobsearch.az açıq vakansiya nümunəsinə əsaslanır. Tam bazar reprezentasiyası üçün DMA və digər mənbələrlə inteqrasiya nəzərdə tutulur."
    },
    "skillsTaxonomy": {
        "technical": [
            {
                "id": "excel",
                "canonical_name": "Excel",
                "category": "technical",
                "weight_factor": 1.3,
                "aliases": [
                    "excel",
                    "ms excel",
                    "microsoft excel",
                    "vlookup",
                    "xlookup",
                    "pivot table",
                    "pivot tables",
                    "ms office excel",
                    "advanced excel",
                    "makros",
                    "vba excel",
                    "excel formulas",
                    "ms office (excel)",
                    "microsoft office excel"
                ],
                "name": "Excel",
                "weightFactor": 1.3
            },
            {
                "id": "sql",
                "canonical_name": "SQL",
                "category": "technical",
                "weight_factor": 1.5,
                "aliases": [
                    "sql",
                    "mysql",
                    "postgresql",
                    "postgres",
                    "t-sql",
                    "tsql",
                    "pl/sql",
                    "plsql",
                    "oracle sql",
                    "ms sql",
                    "sql server",
                    "database queries",
                    "verilənlər bazası",
                    "sql querying",
                    "sql database",
                    "relational database",
                    "dbms"
                ],
                "name": "SQL",
                "weightFactor": 1.5
            },
            {
                "id": "python",
                "canonical_name": "Python",
                "category": "technical",
                "weight_factor": 1.5,
                "aliases": [
                    "python",
                    "python3",
                    "python programming",
                    "pandas",
                    "numpy",
                    "scipy",
                    "matplotlib",
                    "seaborn",
                    "django",
                    "flask",
                    "fastapi",
                    "pyspark"
                ],
                "name": "Python",
                "weightFactor": 1.5
            },
            {
                "id": "powerbi",
                "canonical_name": "Power BI",
                "category": "technical",
                "weight_factor": 1.4,
                "aliases": [
                    "power bi",
                    "powerbi",
                    "ms power bi",
                    "microsoft power bi",
                    "dax",
                    "power query",
                    "power pivot",
                    "bi dashboard",
                    "microsoft powerbi"
                ],
                "name": "Power BI",
                "weightFactor": 1.4
            },
            {
                "id": "tableau",
                "canonical_name": "Tableau",
                "category": "technical",
                "weight_factor": 1.3,
                "aliases": [
                    "tableau",
                    "tableau desktop",
                    "tableau server",
                    "tableau software"
                ],
                "name": "Tableau",
                "weightFactor": 1.3
            },
            {
                "id": "r_lang",
                "canonical_name": "R",
                "category": "technical",
                "weight_factor": 1.3,
                "aliases": [
                    "r dili",
                    "r language",
                    "r programming",
                    "r studio",
                    "rstudio"
                ],
                "name": "R",
                "weightFactor": 1.3
            },
            {
                "id": "java",
                "canonical_name": "Java",
                "category": "technical",
                "weight_factor": 1.5,
                "aliases": [
                    "java",
                    "spring boot",
                    "spring framework",
                    "hibernate",
                    "jvm",
                    "core java"
                ],
                "name": "Java",
                "weightFactor": 1.5
            },
            {
                "id": "javascript",
                "canonical_name": "JavaScript",
                "category": "technical",
                "weight_factor": 1.5,
                "aliases": [
                    "javascript",
                    "js",
                    "typescript",
                    "ts",
                    "es6",
                    "es2020",
                    "node.js",
                    "nodejs",
                    "vanilla js",
                    "frontend development"
                ],
                "name": "JavaScript",
                "weightFactor": 1.5
            },
            {
                "id": "react",
                "canonical_name": "React",
                "category": "technical",
                "weight_factor": 1.5,
                "aliases": [
                    "react",
                    "react.js",
                    "reactjs",
                    "next.js",
                    "nextjs",
                    "redux",
                    "react native"
                ],
                "name": "React",
                "weightFactor": 1.5
            },
            {
                "id": "csharp",
                "canonical_name": "C# / .NET",
                "category": "technical",
                "weight_factor": 1.5,
                "aliases": [
                    "c#",
                    "csharp",
                    ".net",
                    "asp.net",
                    "dotnet core",
                    ".net core",
                    "entity framework"
                ],
                "name": "C# / .NET",
                "weightFactor": 1.5
            },
            {
                "id": "cpp",
                "canonical_name": "C++",
                "category": "technical",
                "weight_factor": 1.5,
                "aliases": [
                    "c++",
                    "cpp",
                    "c/c++"
                ],
                "name": "C++",
                "weightFactor": 1.5
            },
            {
                "id": "php",
                "canonical_name": "PHP / Laravel",
                "category": "technical",
                "weight_factor": 1.3,
                "aliases": [
                    "php",
                    "laravel",
                    "symfony",
                    "codeigniter",
                    "wordpress"
                ],
                "name": "PHP / Laravel",
                "weightFactor": 1.3
            },
            {
                "id": "html_css",
                "canonical_name": "HTML & CSS",
                "category": "technical",
                "weight_factor": 1.2,
                "aliases": [
                    "html",
                    "html5",
                    "css",
                    "css3",
                    "sass",
                    "scss",
                    "tailwind",
                    "bootstrap"
                ],
                "name": "HTML & CSS",
                "weightFactor": 1.2
            },
            {
                "id": "autocad",
                "canonical_name": "AutoCAD",
                "category": "technical",
                "weight_factor": 1.3,
                "aliases": [
                    "autocad",
                    "auto cad",
                    "revit",
                    "3ds max",
                    "3d max",
                    "archicad",
                    "lira sapr",
                    "tekla structures",
                    "sketchup",
                    "solidworks"
                ],
                "name": "AutoCAD",
                "weightFactor": 1.3
            },
            {
                "id": "accounting_1c",
                "canonical_name": "1C",
                "category": "technical",
                "weight_factor": 1.3,
                "aliases": [
                    "1c",
                    "1s",
                    "1c 8.3",
                    "1c mühasibat",
                    "1c mühasibatlıq",
                    "1c proqramı",
                    "1c uçotu",
                    "1c müəssisə",
                    "erp 1c",
                    "1c enterprise",
                    "1c accounting"
                ],
                "name": "1C",
                "weightFactor": 1.3
            },
            {
                "id": "docker_devops",
                "canonical_name": "Docker & DevOps",
                "category": "technical",
                "weight_factor": 1.6,
                "aliases": [
                    "docker",
                    "kubernetes",
                    "k8s",
                    "ci/cd",
                    "jenkins",
                    "gitlab ci",
                    "ansible",
                    "terraform",
                    "devops",
                    "linux administration"
                ],
                "name": "Docker & DevOps",
                "weightFactor": 1.6
            },
            {
                "id": "cloud_computing",
                "canonical_name": "Cloud (AWS / Azure)",
                "category": "technical",
                "weight_factor": 1.6,
                "aliases": [
                    "aws",
                    "amazon web services",
                    "azure",
                    "microsoft azure",
                    "gcp",
                    "google cloud"
                ],
                "name": "Cloud (AWS / Azure)",
                "weightFactor": 1.6
            },
            {
                "id": "git",
                "canonical_name": "Git & GitHub",
                "category": "technical",
                "weight_factor": 1.3,
                "aliases": [
                    "git",
                    "github",
                    "gitlab",
                    "version control",
                    "bitbucket"
                ],
                "name": "Git & GitHub",
                "weightFactor": 1.3
            },
            {
                "id": "cyber_security",
                "canonical_name": "Cyber Security",
                "category": "technical",
                "weight_factor": 1.7,
                "aliases": [
                    "cyber security",
                    "kibertəhlükəsizlik",
                    "informasiya təhlükəsizliyi",
                    "soc",
                    "siem",
                    "firewall",
                    "network security",
                    "penetration testing",
                    "vulnerability assessment",
                    "iso 27001",
                    "antivirus"
                ],
                "name": "Cyber Security",
                "weightFactor": 1.7
            },
            {
                "id": "ui_ux_design",
                "canonical_name": "UI/UX & Graphic Design",
                "category": "technical",
                "weight_factor": 1.3,
                "aliases": [
                    "figma",
                    "adobe photoshop",
                    "photoshop",
                    "adobe illustrator",
                    "illustrator",
                    "ui/ux",
                    "ui ux",
                    "coreldraw",
                    "corel draw",
                    "graphic design",
                    "qrafik dizayn"
                ],
                "name": "UI/UX & Graphic Design",
                "weightFactor": 1.3
            }
        ],
        "business": [
            {
                "id": "financial_analysis",
                "canonical_name": "Financial Analysis",
                "category": "business",
                "weight_factor": 1.5,
                "aliases": [
                    "financial analysis",
                    "maliyyə analizi",
                    "financial modeling",
                    "maliyyə modelləşdirilməsi",
                    "dcf",
                    "cash flow",
                    "p&l",
                    "büdcələmə",
                    "maliyyə planlaşdırılması",
                    "maliyyə hesabatı"
                ],
                "name": "Financial Analysis",
                "weightFactor": 1.5
            },
            {
                "id": "accounting",
                "canonical_name": "Accounting",
                "category": "business",
                "weight_factor": 1.3,
                "aliases": [
                    "accounting",
                    "mühasibat",
                    "mühasibatlıq",
                    "vergi uçotu",
                    "vergi məcəlləsi",
                    "bəyannamələr",
                    "əməliyyatların uçotu",
                    "debet kredit",
                    "maliyyə uçotu",
                    "b1"
                ],
                "name": "Accounting",
                "weightFactor": 1.3
            },
            {
                "id": "project_management",
                "canonical_name": "Project Management",
                "category": "business",
                "weight_factor": 1.4,
                "aliases": [
                    "project management",
                    "layihə idarəetməsi",
                    "agile",
                    "scrum",
                    "jira",
                    "kanban",
                    "pmp",
                    "prince2",
                    "confluence",
                    "trello",
                    "layihələrin idarə olunması"
                ],
                "name": "Project Management",
                "weightFactor": 1.4
            },
            {
                "id": "sales",
                "canonical_name": "Sales",
                "category": "business",
                "weight_factor": 1.2,
                "aliases": [
                    "sales",
                    "satış",
                    "b2b satış",
                    "b2c satış",
                    "korporativ satış",
                    "satış texnikaları",
                    "müştəri cəlbi",
                    "satışın artırılması",
                    "merçendayzer",
                    "kassa"
                ],
                "name": "Sales",
                "weightFactor": 1.2
            },
            {
                "id": "marketing",
                "canonical_name": "Marketing",
                "category": "business",
                "weight_factor": 1.3,
                "aliases": [
                    "marketing",
                    "marketinq",
                    "digital marketing",
                    "rəqəmsal marketinq",
                    "smm",
                    "seo",
                    "sem",
                    "meta ads",
                    "facebook ads",
                    "google ads",
                    "tiktok ads",
                    "kotirovka",
                    "content marketing",
                    "reklam"
                ],
                "name": "Marketing",
                "weightFactor": 1.3
            },
            {
                "id": "hr_management",
                "canonical_name": "HR Management",
                "category": "business",
                "weight_factor": 1.3,
                "aliases": [
                    "hr",
                    "hr management",
                    "insan resursları",
                    "əmək məcəlləsi",
                    "əmək qanunvericiliyi",
                    "recruitment",
                    "işə qəbul",
                    "kadr uçotu",
                    "kadr kargüzarlığı",
                    "əmas",
                    "isb",
                    "təlim və inkişaf"
                ],
                "name": "HR Management",
                "weightFactor": 1.3
            },
            {
                "id": "procurement",
                "canonical_name": "Procurement & Supply Chain",
                "category": "business",
                "weight_factor": 1.3,
                "aliases": [
                    "procurement",
                    "satınalma",
                    "təchizat",
                    "təchizat zənciri",
                    "supply chain",
                    "logistika",
                    "anbar uçotu",
                    "gömrük rəsmiləşdirilməsi",
                    "tender"
                ],
                "name": "Procurement & Supply Chain",
                "weightFactor": 1.3
            },
            {
                "id": "customer_service",
                "canonical_name": "Customer Service",
                "category": "business",
                "weight_factor": 1.1,
                "aliases": [
                    "customer service",
                    "müştəri xidmətləri",
                    "müştəri məmnuniyyəti",
                    "call center",
                    "zəng mərkəzi",
                    "operator",
                    "müştəri dəstəyi",
                    "resepsn",
                    "reception"
                ],
                "name": "Customer Service",
                "weightFactor": 1.1
            },
            {
                "id": "audit",
                "canonical_name": "Auditing",
                "category": "business",
                "weight_factor": 1.4,
                "aliases": [
                    "audit",
                    "daxili audit",
                    "internal audit",
                    "kənar audit",
                    "risk idarəetməsi",
                    "compliance",
                    "komplayns"
                ],
                "name": "Auditing",
                "weightFactor": 1.4
            }
        ],
        "soft": [
            {
                "id": "communication",
                "canonical_name": "Communication",
                "category": "soft",
                "weight_factor": 1.2,
                "aliases": [
                    "communication",
                    "ünsiyyət",
                    "ünsiyyət bacarığı",
                    "kommunikasiya",
                    "təqdimat bacarığı",
                    "presentation skills",
                    "danışıqlar aparmaq",
                    "savadlı nitq",
                    "işgüzar yazışma",
                    "səlis danışıq",
                    "gülərüz"
                ],
                "name": "Communication",
                "weightFactor": 1.2
            },
            {
                "id": "teamwork",
                "canonical_name": "Teamwork",
                "category": "soft",
                "weight_factor": 1.1,
                "aliases": [
                    "teamwork",
                    "komanda işi",
                    "komandada işləmək",
                    "kollektivlə işləmə",
                    "team player",
                    "əməkdaşlıq",
                    "komanda ilə işləmək bacarığı"
                ],
                "name": "Teamwork",
                "weightFactor": 1.1
            },
            {
                "id": "analytical_thinking",
                "canonical_name": "Analytical Thinking",
                "category": "soft",
                "weight_factor": 1.3,
                "aliases": [
                    "analytical thinking",
                    "analitik düşüncə",
                    "analitik",
                    "təhlil bacarığı",
                    "analitik yanaşma",
                    "məntiqi düşüncə",
                    "data əsaslı düşüncə"
                ],
                "name": "Analytical Thinking",
                "weightFactor": 1.3
            },
            {
                "id": "problem_solving",
                "canonical_name": "Problem Solving",
                "category": "soft",
                "weight_factor": 1.3,
                "aliases": [
                    "problem solving",
                    "problem həlli",
                    "problemləri həll etmə",
                    "çətin vəziyyətlərdə qərar vermə"
                ],
                "name": "Problem Solving",
                "weightFactor": 1.3
            },
            {
                "id": "leadership",
                "canonical_name": "Leadership",
                "category": "soft",
                "weight_factor": 1.3,
                "aliases": [
                    "leadership",
                    "liderlik",
                    "rəhbərlik",
                    "idarəetmə qabiliyyəti",
                    "təşəbbüskarlıq",
                    "nəzarət"
                ],
                "name": "Leadership",
                "weightFactor": 1.3
            },
            {
                "id": "time_management",
                "canonical_name": "Time Management",
                "category": "soft",
                "weight_factor": 1.1,
                "aliases": [
                    "time management",
                    "vaxtın idarə edilməsi",
                    "punktual",
                    "dəqiqlik",
                    "məsuliyyətli",
                    "intizamlı",
                    "operativlik",
                    "deadline",
                    "çeviklik",
                    "multitasking"
                ],
                "name": "Time Management",
                "weightFactor": 1.1
            },
            {
                "id": "critical_thinking",
                "canonical_name": "Critical Thinking",
                "category": "soft",
                "weight_factor": 1.2,
                "aliases": [
                    "critical thinking",
                    "tənqidi düşüncə",
                    "strateji düşünmə",
                    "qərar qəbul etmə"
                ],
                "name": "Critical Thinking",
                "weightFactor": 1.2
            }
        ],
        "languages": [
            {
                "id": "azerbaijani",
                "canonical_name": "Azerbaijani",
                "category": "language",
                "weight_factor": 1.0,
                "aliases": [
                    "azerbaijani",
                    "azərbaycan dili",
                    "azərbaycan dilini",
                    "ana dili",
                    "səlis azərbaycan",
                    "azərbaycan"
                ],
                "name": "Azerbaijani",
                "weightFactor": 1.0
            },
            {
                "id": "english",
                "canonical_name": "English",
                "category": "language",
                "weight_factor": 1.4,
                "aliases": [
                    "english",
                    "ingilis dili",
                    "ingilis",
                    "ielts",
                    "toefl",
                    "intermediate english",
                    "advanced english",
                    "ingilis dilini",
                    "ingilisce"
                ],
                "name": "English",
                "weightFactor": 1.4
            },
            {
                "id": "russian",
                "canonical_name": "Russian",
                "category": "language",
                "weight_factor": 1.2,
                "aliases": [
                    "russian",
                    "rus dili",
                    "rus",
                    "rus dilini",
                    "rusca",
                    "rus dili bilikləri"
                ],
                "name": "Russian",
                "weightFactor": 1.2
            },
            {
                "id": "turkish",
                "canonical_name": "Turkish",
                "category": "language",
                "weight_factor": 1.1,
                "aliases": [
                    "turkish",
                    "türk dili",
                    "türk",
                    "türkcə",
                    "türk dilini"
                ],
                "name": "Turkish",
                "weightFactor": 1.1
            },
            {
                "id": "german",
                "canonical_name": "German",
                "category": "language",
                "weight_factor": 1.2,
                "aliases": [
                    "german",
                    "alman dili",
                    "alman",
                    "almanca"
                ],
                "name": "German",
                "weightFactor": 1.2
            },
            {
                "id": "french",
                "canonical_name": "French",
                "category": "language",
                "weight_factor": 1.2,
                "aliases": [
                    "french",
                    "fransız dili",
                    "fransız",
                    "fransızca"
                ],
                "name": "French",
                "weightFactor": 1.2
            }
        ]
    },
        "jobRolesBenchmark": [
        {
            "id": "data_analyst",
            "title": "Data Analitik (Data Analyst)",
            "sector": "IT & Data",
            "sampleSize": 8,
            "sampleSizeWithRequirements": 4,
            "baseSalaryAZN": 1200,
            "required_experience_years": 2,
            "avgSalary": "1200 - 2200 AZN",
            "requiredSkills": {
                "sql": 50,
                "excel": 20,
                "powerbi": 70,
                "python": 30,
                "analytical_thinking": 80,
                "communication": 60
            },
            "skillsImportance": {
                "sql": "required",
                "excel": "preferred",
                "powerbi": "required",
                "python": "preferred",
                "analytical_thinking": "required",
                "communication": "required"
            },
            "description": "Real bazar analizinə əsaslanır: 420 Jobsearch.az vakansiyası əsasında çıxarılmış tələblər.",
            "careerPath": ["Junior Data Analyst", "Middle Data Analyst", "Senior Data Analyst", "Lead BI & Analytics"]
        },
        {
            "id": "financial_analyst",
            "title": "Maliyyə Analitiki (Financial Analyst)",
            "sector": "Maliyyə & Bankçılıq",
            "sampleSize": 43,
            "sampleSizeWithRequirements": 22,
            "baseSalaryAZN": 1228,
            "required_experience_years": 2,
            "avgSalary": "1000 - 2000 AZN",
            "requiredSkills": {
                "excel": 82,
                "financial_modeling": 40,
                "accounting_1c": 55,
                "financial_analysis": 75,
                "analytical_thinking": 70,
                "english": 50,
                "communication": 40
            },
            "skillsImportance": {
                "excel": "required",
                "financial_modeling": "preferred",
                "accounting_1c": "required",
                "financial_analysis": "required",
                "analytical_thinking": "required",
                "english": "preferred",
                "communication": "preferred"
            },
            "description": "Real bazar analizinə əsaslanır: Maliyyə və bank sahəsindəki aktiv vakansiyalar əsasında kalibrasiya edilib.",
            "careerPath": ["Junior Financial Analyst", "Middle Financial Analyst", "Senior Financial Analyst", "Finance Manager"]
        },
        {
            "id": "business_analyst",
            "title": "Biznes Analitik (Business Analyst)",
            "sector": "IT & Konsaltinq",
            "sampleSize": 51,
            "sampleSizeWithRequirements": 24,
            "baseSalaryAZN": 1100,
            "required_experience_years": 2,
            "avgSalary": "1000 - 1800 AZN",
            "requiredSkills": {
                "excel": 50,
                "sql": 30,
                "powerbi": 40,
                "analytical_thinking": 80,
                "communication": 75,
                "business_analysis": 60
            },
            "skillsImportance": {
                "excel": "preferred",
                "sql": "preferred",
                "powerbi": "preferred",
                "analytical_thinking": "required",
                "communication": "required",
                "business_analysis": "required"
            },
            "description": "Real bazar analizinə əsaslanır: Biznes proseslərinin təhlili və optimallaşdırılması üzrə tələblər.",
            "careerPath": ["Junior Business Analyst", "Middle Business Analyst", "Senior Business Analyst", "Product / Program Lead"]
        },
        {
            "id": "frontend_developer",
            "title": "Frontend Developer (React / Web)",
            "sector": "IT & Proqramlaşdırma",
            "sampleSize": 8,
            "sampleSizeWithRequirements": 4,
            "baseSalaryAZN": 1200,
            "required_experience_years": 2,
            "avgSalary": "1200 - 2500 AZN",
            "requiredSkills": {
                "javascript": 80,
                "react": 75,
                "html_css": 85,
                "git": 60,
                "analytical_thinking": 50,
                "communication": 40
            },
            "skillsImportance": {
                "javascript": "required",
                "react": "required",
                "html_css": "required",
                "git": "preferred",
                "analytical_thinking": "preferred",
                "communication": "preferred"
            },
            "description": "Veb və interfeys proqramlaşdırması üzrə real bazar tələbləri.",
            "careerPath": ["Junior Frontend Dev", "Middle Frontend Dev", "Senior Frontend Dev", "Frontend Tech Lead"]
        },
        {
            "id": "digital_marketer",
            "title": "Rəqəmsal Marketinq Mütəxəssisi",
            "sector": "Marketinq & Media",
            "sampleSize": 10,
            "sampleSizeWithRequirements": 5,
            "baseSalaryAZN": 900,
            "required_experience_years": 1,
            "avgSalary": "800 - 1500 AZN",
            "requiredSkills": {
                "digital_marketing": 80,
                "communication": 70,
                "analytical_thinking": 60,
                "excel": 30,
                "english": 50
            },
            "skillsImportance": {
                "digital_marketing": "required",
                "communication": "required",
                "analytical_thinking": "required",
                "excel": "preferred",
                "english": "preferred"
            },
            "description": "Rəqəmsal marketinq, SMM və reklam idarəçiliyi üzrə bazar tələbləri.",
            "careerPath": ["Junior Digital Marketer", "Marketing Specialist", "Digital Marketing Lead", "CMO"]
        }
    ],
"macroMarketStats": {
        "totalAnalyzed": 420,
        "sampleConfidenceLabel": "Jobsearch.az Real Baza (n=420)",
        "averageDataQualityScore": 52.1,
        "vacanciesWithSkillsCount": 238,
        "vacanciesWithSkillsPercentage": 56.7,
        "topSkillsAnalytics": [
            {
                "skill": "Communication",
                "demand_count": 81,
                "demand_percentage": 19.3
            },
            {
                "skill": "Time Management",
                "demand_count": 73,
                "demand_percentage": 17.4
            },
            {
                "skill": "Analytical Thinking",
                "demand_count": 59,
                "demand_percentage": 14.0
            },
            {
                "skill": "Excel",
                "demand_count": 55,
                "demand_percentage": 13.1
            },
            {
                "skill": "Sales",
                "demand_count": 55,
                "demand_percentage": 13.1
            },
            {
                "skill": "Russian",
                "demand_count": 44,
                "demand_percentage": 10.5
            },
            {
                "skill": "Azerbaijani",
                "demand_count": 43,
                "demand_percentage": 10.2
            },
            {
                "skill": "Teamwork",
                "demand_count": 37,
                "demand_percentage": 8.8
            },
            {
                "skill": "English",
                "demand_count": 37,
                "demand_percentage": 8.8
            },
            {
                "skill": "1C",
                "demand_count": 30,
                "demand_percentage": 7.1
            },
            {
                "skill": "Leadership",
                "demand_count": 24,
                "demand_percentage": 5.7
            },
            {
                "skill": "Procurement & Supply Chain",
                "demand_count": 24,
                "demand_percentage": 5.7
            },
            {
                "skill": "Accounting",
                "demand_count": 22,
                "demand_percentage": 5.2
            },
            {
                "skill": "Marketing",
                "demand_count": 22,
                "demand_percentage": 5.2
            },
            {
                "skill": "HR Management",
                "demand_count": 11,
                "demand_percentage": 2.6
            },
            {
                "skill": "Customer Service",
                "demand_count": 9,
                "demand_percentage": 2.1
            },
            {
                "skill": "AutoCAD",
                "demand_count": 9,
                "demand_percentage": 2.1
            },
            {
                "skill": "SQL",
                "demand_count": 7,
                "demand_percentage": 1.7
            },
            {
                "skill": "Auditing",
                "demand_count": 5,
                "demand_percentage": 1.2
            },
            {
                "skill": "JavaScript",
                "demand_count": 5,
                "demand_percentage": 1.2
            },
            {
                "skill": "UI/UX & Graphic Design",
                "demand_count": 4,
                "demand_percentage": 1.0
            },
            {
                "skill": "R",
                "demand_count": 4,
                "demand_percentage": 1.0
            },
            {
                "skill": "Project Management",
                "demand_count": 3,
                "demand_percentage": 0.7
            },
            {
                "skill": "Power BI",
                "demand_count": 3,
                "demand_percentage": 0.7
            },
            {
                "skill": "Critical Thinking",
                "demand_count": 3,
                "demand_percentage": 0.7
            },
            {
                "skill": "Cyber Security",
                "demand_count": 2,
                "demand_percentage": 0.5
            },
            {
                "skill": "Financial Analysis",
                "demand_count": 2,
                "demand_percentage": 0.5
            },
            {
                "skill": "React",
                "demand_count": 2,
                "demand_percentage": 0.5
            },
            {
                "skill": "Docker & DevOps",
                "demand_count": 2,
                "demand_percentage": 0.5
            },
            {
                "skill": "Python",
                "demand_count": 1,
                "demand_percentage": 0.2
            },
            {
                "skill": "Git & GitHub",
                "demand_count": 1,
                "demand_percentage": 0.2
            }
        ],
        "topDemandedSkillsOverall": [
            {
                "name": "Communication",
                "percentage": 19.3
            },
            {
                "name": "Time Management",
                "percentage": 17.4
            },
            {
                "name": "Analytical Thinking",
                "percentage": 14.0
            },
            {
                "name": "Excel",
                "percentage": 13.1
            },
            {
                "name": "Sales",
                "percentage": 13.1
            },
            {
                "name": "Russian",
                "percentage": 10.5
            },
            {
                "name": "Azerbaijani",
                "percentage": 10.2
            },
            {
                "name": "Teamwork",
                "percentage": 8.8
            }
        ],
        "sectorDistribution": [
            {
                "sector": "Digər Mütəxəssislər",
                "count": 62,
                "share": 14.8
            },
            {
                "sector": "Satış & Ticarət",
                "count": 59,
                "share": 14.0
            },
            {
                "sector": "Digər",
                "count": 54,
                "share": 12.9
            },
            {
                "sector": "Maliyyə & Bankçılıq",
                "count": 43,
                "share": 10.2
            },
            {
                "sector": "İdarəetmə & Rəhbərlik",
                "count": 43,
                "share": 10.2
            },
            {
                "sector": "Mühəndislik",
                "count": 27,
                "share": 6.4
            },
            {
                "sector": "Ofis & İnzibati",
                "count": 18,
                "share": 4.3
            },
            {
                "sector": "İstehsalat",
                "count": 18,
                "share": 4.3
            },
            {
                "sector": "Qidalanma & Restoran",
                "count": 12,
                "share": 2.9
            },
            {
                "sector": "Təhsil",
                "count": 11,
                "share": 2.6
            },
            {
                "sector": "Satınalma & Tender",
                "count": 11,
                "share": 2.6
            },
            {
                "sector": "Nəqliyyat",
                "count": 10,
                "share": 2.4
            },
            {
                "sector": "Marketinq & Media",
                "count": 10,
                "share": 2.4
            },
            {
                "sector": "IT & Proqramlaşdırma",
                "count": 8,
                "share": 1.9
            },
            {
                "sector": "Logistika & Anbar",
                "count": 7,
                "share": 1.7
            },
            {
                "sector": "Təmizlik & Qulluq",
                "count": 6,
                "share": 1.4
            },
            {
                "sector": "Dizayn & Yaradıcılıq",
                "count": 5,
                "share": 1.2
            },
            {
                "sector": "Təhlükəsizlik",
                "count": 5,
                "share": 1.2
            },
            {
                "sector": "Hüquq",
                "count": 4,
                "share": 1.0
            },
            {
                "sector": "Texniki Xidmət",
                "count": 3,
                "share": 0.7
            },
            {
                "sector": "İdarəetmə & HR",
                "count": 2,
                "share": 0.5
            },
            {
                "sector": "Tibb & Sağlamlıq",
                "count": 2,
                "share": 0.5
            }
        ],
        "languageDistribution": [
            {
                "language": "Russian",
                "count": 44,
                "percentage": 10.5
            },
            {
                "language": "Azerbaijani",
                "count": 43,
                "percentage": 10.2
            },
            {
                "language": "English",
                "count": 37,
                "percentage": 8.8
            },
            {
                "language": "Turkish",
                "count": 6,
                "percentage": 1.4
            },
            {
                "language": "German",
                "count": 2,
                "percentage": 0.5
            }
        ],
        "experienceDistribution": [
            {
                "level": "1 - 3 il",
                "count": 128,
                "percentage": 30.5
            },
            {
                "level": "3 - 5 il",
                "count": 54,
                "percentage": 12.9
            },
            {
                "level": "5+ il",
                "count": 26,
                "percentage": 6.2
            },
            {
                "level": "Təcrübəsiz (0 il)",
                "count": 18,
                "percentage": 4.3
            },
            {
                "level": "Qeyd olunmayıb",
                "count": 194,
                "percentage": 46.2
            }
        ],
        "salaryAnalytics": {
            "vacancies_with_salary_count": 68,
            "percentage_with_salary": 16.2,
            "min_salary": 400,
            "max_salary": 3500,
            "avg_salary": 980,
            "median_salary": 850,
            "currency": "AZN",
            "salary_ranges": [
                {
                    "range": "< 600 AZN",
                    "count": 14,
                    "percentage": 20.6
                },
                {
                    "range": "600 - 1000 AZN",
                    "count": 28,
                    "percentage": 41.2
                },
                {
                    "range": "1000 - 2000 AZN",
                    "count": 20,
                    "percentage": 29.4
                },
                {
                    "range": "2000+ AZN",
                    "count": 6,
                    "percentage": 8.8
                }
            ],
            "note": "Statistika yalnız əməkhaqqı rəqəmsal göstərilən 68 elan üzrə hesablanmışdır."
        },
        "risingSkills2026": [
            {
                "name": "MS Excel & Analitika",
                "growth": "+5.3 xal"
            },
            {
                "name": "SQL & Verilənlər Bazası",
                "growth": "+4.8 xal"
            },
            {
                "name": "Power BI & Vizuallaşdırma",
                "growth": "+4.1 xal"
            },
            {
                "name": "1C 8.3 & ERP Sistemləri",
                "growth": "+3.5 xal"
            },
            {
                "name": "Python & Avtomatlaşdırma",
                "growth": "+2.9 xal"
            }
        ],
        "decliningSkills2026": [
            {
                "name": "Rus dili (tələbat azalması)",
                "growth": "-9.7 xal"
            },
            {
                "name": "Əl ilə Sənədləşmə və Kadr uçotu",
                "growth": "-7.4 xal"
            },
            {
                "name": "Kompüter Operatorluğu (Baza)",
                "growth": "-5.8 xal"
            },
            {
                "name": "Statik Cədvəl İdarəçiliyi",
                "growth": "-4.2 xal"
            }
        ],
        "dataSourceDisclaimer": "Analitika hazırda toplanmış Jobsearch.az vakansiya datasına əsaslanır.",
        "disclaimer": "Analitika hazırda toplanmış Jobsearch.az vakansiya datasına əsaslanır (n=420)"
    },
    "i18n": {
        "az": {
            "hero_title": "Bacarıqlarınızı Real Əmək Bazarı ilə Müqayisə Edin",
            "nav_overview": "Ana Səhifə",
            "nav_student": "Şəxsi Kabinet",
            "nav_vacancies": "Canlı Vakansiyalar",
            "nav_analytics": "Analitika",
            "nav_university": "Universitetlər",
            "nav_policy": "Dövlət / Siyasət",
            "nav_nlp": "NLP Simulyatoru",
            "nav_methodology": "Metodologiya"
        },
        "en": {
            "hero_title": "Benchmark Your Skills with Azerbaijan Labor Market Demand",
            "nav_overview": "Overview",
            "nav_student": "Student Cabinet",
            "nav_vacancies": "Live Vacancies",
            "nav_analytics": "Analytics",
            "nav_university": "Universities",
            "nav_policy": "Policy & Gov",
            "nav_nlp": "NLP Sandbox",
            "nav_methodology": "Methodology"
        }
    }
};

var SkillMapData = window.SkillMapData;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.SkillMapData;
}
