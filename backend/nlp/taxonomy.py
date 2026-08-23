"""
SkillMap Azerbaijan - Comprehensive Skill Taxonomy & Canonical Dictionary
Covers Technical Skills, Business Skills, Soft Skills, and Languages with aliases.
"""

SKILL_CATEGORIES = {
    "technical": "Texniki Bacarıqlar",
    "business": "Biznes & İdarəetmə",
    "soft": "Fərdi & Yumşaq Bacarıqlar (Soft Skills)",
    "language": "Xarici Dillər"
}

CANONICAL_SKILLS = [
    # ==========================================
    # 1. TECHNICAL SKILLS
    # ==========================================
    {
        "id": "excel",
        "canonical_name": "Excel",
        "category": "technical",
        "weight_factor": 1.3,
        "aliases": [
            "excel", "ms excel", "microsoft excel", "vlookup", "xlookup",
            "pivot table", "pivot tables", "ms office excel", "advanced excel",
            "makros", "vba excel", "excel formulas", "ms office (excel)", "microsoft office excel"
        ]
    },
    {
        "id": "sql",
        "canonical_name": "SQL",
        "category": "technical",
        "weight_factor": 1.5,
        "aliases": [
            "sql", "mysql", "postgresql", "postgres", "t-sql", "tsql", "pl/sql", "plsql",
            "oracle sql", "ms sql", "sql server", "database queries", "verilənlər bazası",
            "sql querying", "sql database", "relational database", "dbms"
        ]
    },
    {
        "id": "python",
        "canonical_name": "Python",
        "category": "technical",
        "weight_factor": 1.5,
        "aliases": [
            "python", "python3", "python programming", "pandas", "numpy", "scipy",
            "matplotlib", "seaborn", "django", "flask", "fastapi", "pyspark"
        ]
    },
    {
        "id": "powerbi",
        "canonical_name": "Power BI",
        "category": "technical",
        "weight_factor": 1.4,
        "aliases": [
            "power bi", "powerbi", "ms power bi", "microsoft power bi", "dax",
            "power query", "power pivot", "bi dashboard", "microsoft powerbi"
        ]
    },
    {
        "id": "tableau",
        "canonical_name": "Tableau",
        "category": "technical",
        "weight_factor": 1.3,
        "aliases": ["tableau", "tableau desktop", "tableau server", "tableau software"]
    },
    {
        "id": "r_lang",
        "canonical_name": "R",
        "category": "technical",
        "weight_factor": 1.3,
        "aliases": ["r dili", "r language", "r programming", "r studio", "rstudio"]
    },
    {
        "id": "java",
        "canonical_name": "Java",
        "category": "technical",
        "weight_factor": 1.5,
        "aliases": ["java", "spring boot", "spring framework", "hibernate", "jvm", "core java"]
    },
    {
        "id": "javascript",
        "canonical_name": "JavaScript",
        "category": "technical",
        "weight_factor": 1.5,
        "aliases": [
            "javascript", "js", "typescript", "ts", "es6", "es2020", "node.js",
            "nodejs", "vanilla js", "frontend development"
        ]
    },
    {
        "id": "react",
        "canonical_name": "React",
        "category": "technical",
        "weight_factor": 1.5,
        "aliases": ["react", "react.js", "reactjs", "next.js", "nextjs", "redux", "react native"]
    },
    {
        "id": "csharp",
        "canonical_name": "C# / .NET",
        "category": "technical",
        "weight_factor": 1.5,
        "aliases": ["c#", "csharp", ".net", "asp.net", "dotnet core", ".net core", "entity framework"]
    },
    {
        "id": "cpp",
        "canonical_name": "C++",
        "category": "technical",
        "weight_factor": 1.5,
        "aliases": ["c++", "cpp", "c/c++"]
    },
    {
        "id": "php",
        "canonical_name": "PHP / Laravel",
        "category": "technical",
        "weight_factor": 1.3,
        "aliases": ["php", "laravel", "symfony", "codeigniter", "wordpress"]
    },
    {
        "id": "html_css",
        "canonical_name": "HTML & CSS",
        "category": "technical",
        "weight_factor": 1.2,
        "aliases": ["html", "html5", "css", "css3", "sass", "scss", "tailwind", "bootstrap"]
    },
    {
        "id": "autocad",
        "canonical_name": "AutoCAD",
        "category": "technical",
        "weight_factor": 1.3,
        "aliases": [
            "autocad", "auto cad", "revit", "3ds max", "3d max", "archicad",
            "lira sapr", "tekla structures", "sketchup", "solidworks"
        ]
    },
    {
        "id": "accounting_1c",
        "canonical_name": "1C",
        "category": "technical",
        "weight_factor": 1.3,
        "aliases": [
            "1c", "1s", "1c 8.3", "1c mühasibat", "1c mühasibatlıq", "1c proqramı",
            "1c uçotu", "1c müəssisə", "erp 1c", "1c enterprise", "1c accounting"
        ]
    },
    {
        "id": "docker_devops",
        "canonical_name": "Docker & DevOps",
        "category": "technical",
        "weight_factor": 1.6,
        "aliases": [
            "docker", "kubernetes", "k8s", "ci/cd", "jenkins", "gitlab ci",
            "ansible", "terraform", "devops", "linux administration"
        ]
    },
    {
        "id": "cloud_computing",
        "canonical_name": "Cloud (AWS / Azure)",
        "category": "technical",
        "weight_factor": 1.6,
        "aliases": ["aws", "amazon web services", "azure", "microsoft azure", "gcp", "google cloud"]
    },
    {
        "id": "git",
        "canonical_name": "Git & GitHub",
        "category": "technical",
        "weight_factor": 1.3,
        "aliases": ["git", "github", "gitlab", "version control", "bitbucket"]
    },
    {
        "id": "cyber_security",
        "canonical_name": "Cyber Security",
        "category": "technical",
        "weight_factor": 1.7,
        "aliases": [
            "cyber security", "kibertəhlükəsizlik", "informasiya təhlükəsizliyi", "soc",
            "siem", "firewall", "network security", "penetration testing",
            "vulnerability assessment", "iso 27001", "antivirus"
        ]
    },
    {
        "id": "ui_ux_design",
        "canonical_name": "UI/UX & Graphic Design",
        "category": "technical",
        "weight_factor": 1.3,
        "aliases": [
            "figma", "adobe photoshop", "photoshop", "adobe illustrator", "illustrator",
            "ui/ux", "ui ux", "coreldraw", "corel draw", "graphic design", "qrafik dizayn"
        ]
    },

    # ==========================================
    # 2. BUSINESS & MANAGEMENT SKILLS
    # ==========================================
    {
        "id": "financial_analysis",
        "canonical_name": "Financial Analysis",
        "category": "business",
        "weight_factor": 1.5,
        "aliases": [
            "financial analysis", "maliyyə analizi", "financial modeling",
            "maliyyə modelləşdirilməsi", "dcf", "cash flow", "p&l",
            "büdcələmə", "maliyyə planlaşdırılması", "maliyyə hesabatı"
        ]
    },
    {
        "id": "accounting",
        "canonical_name": "Accounting",
        "category": "business",
        "weight_factor": 1.3,
        "aliases": [
            "accounting", "mühasibat", "mühasibatlıq", "vergi uçotu", "vergi məcəlləsi",
            "bəyannamələr", "əməliyyatların uçotu", "debet kredit", "maliyyə uçotu", "b1"
        ]
    },
    {
        "id": "project_management",
        "canonical_name": "Project Management",
        "category": "business",
        "weight_factor": 1.4,
        "aliases": [
            "project management", "layihə idarəetməsi", "agile", "scrum", "jira",
            "kanban", "pmp", "prince2", "confluence", "trello", "layihələrin idarə olunması"
        ]
    },
    {
        "id": "sales",
        "canonical_name": "Sales",
        "category": "business",
        "weight_factor": 1.2,
        "aliases": [
            "sales", "satış", "b2b satış", "b2c satış", "korporativ satış",
            "satış texnikaları", "müştəri cəlbi", "satışın artırılması", "merçendayzer", "kassa"
        ]
    },
    {
        "id": "marketing",
        "canonical_name": "Marketing",
        "category": "business",
        "weight_factor": 1.3,
        "aliases": [
            "marketing", "marketinq", "digital marketing", "rəqəmsal marketinq",
            "smm", "seo", "sem", "meta ads", "facebook ads", "google ads",
            "tiktok ads", "kotirovka", "content marketing", "reklam"
        ]
    },
    {
        "id": "hr_management",
        "canonical_name": "HR Management",
        "category": "business",
        "weight_factor": 1.3,
        "aliases": [
            "hr", "hr management", "insan resursları", "əmək məcəlləsi", "əmək qanunvericiliyi",
            "recruitment", "işə qəbul", "kadr uçotu", "kadr kargüzarlığı", "əmas", "isb", "təlim və inkişaf"
        ]
    },
    {
        "id": "procurement",
        "canonical_name": "Procurement & Supply Chain",
        "category": "business",
        "weight_factor": 1.3,
        "aliases": [
            "procurement", "satınalma", "təchizat", "təchizat zənciri", "supply chain",
            "logistika", "anbar uçotu", "gömrük rəsmiləşdirilməsi", "tender"
        ]
    },
    {
        "id": "customer_service",
        "canonical_name": "Customer Service",
        "category": "business",
        "weight_factor": 1.1,
        "aliases": [
            "customer service", "müştəri xidmətləri", "müştəri məmnuniyyəti",
            "call center", "zəng mərkəzi", "operator", "müştəri dəstəyi", "resepsn", "reception"
        ]
    },
    {
        "id": "audit",
        "canonical_name": "Auditing",
        "category": "business",
        "weight_factor": 1.4,
        "aliases": ["audit", "daxili audit", "internal audit", "kənar audit", "risk idarəetməsi", "compliance", "komplayns"]
    },

    # ==========================================
    # 3. SOFT SKILLS
    # ==========================================
    {
        "id": "communication",
        "canonical_name": "Communication",
        "category": "soft",
        "weight_factor": 1.2,
        "aliases": [
            "communication", "ünsiyyət", "ünsiyyət bacarığı", "kommunikasiya",
            "təqdimat bacarığı", "presentation skills", "danışıqlar aparmaq",
            "savadlı nitq", "işgüzar yazışma", "səlis danışıq", "gülərüz"
        ]
    },
    {
        "id": "teamwork",
        "canonical_name": "Teamwork",
        "category": "soft",
        "weight_factor": 1.1,
        "aliases": [
            "teamwork", "komanda işi", "komandada işləmək", "kollektivlə işləmə",
            "team player", "əməkdaşlıq", "komanda ilə işləmək bacarığı"
        ]
    },
    {
        "id": "analytical_thinking",
        "canonical_name": "Analytical Thinking",
        "category": "soft",
        "weight_factor": 1.3,
        "aliases": [
            "analytical thinking", "analitik düşüncə", "analitik", "təhlil bacarığı",
            "analitik yanaşma", "məntiqi düşüncə", "data əsaslı düşüncə"
        ]
    },
    {
        "id": "problem_solving",
        "canonical_name": "Problem Solving",
        "category": "soft",
        "weight_factor": 1.3,
        "aliases": ["problem solving", "problem həlli", "problemləri həll etmə", "çətin vəziyyətlərdə qərar vermə"]
    },
    {
        "id": "leadership",
        "canonical_name": "Leadership",
        "category": "soft",
        "weight_factor": 1.3,
        "aliases": ["leadership", "liderlik", "rəhbərlik", "idarəetmə qabiliyyəti", "təşəbbüskarlıq", "nəzarət"]
    },
    {
        "id": "time_management",
        "canonical_name": "Time Management",
        "category": "soft",
        "weight_factor": 1.1,
        "aliases": [
            "time management", "vaxtın idarə edilməsi", "punktual", "dəqiqlik",
            "məsuliyyətli", "intizamlı", "operativlik", "deadline", "çeviklik", "multitasking"
        ]
    },
    {
        "id": "critical_thinking",
        "canonical_name": "Critical Thinking",
        "category": "soft",
        "weight_factor": 1.2,
        "aliases": ["critical thinking", "tənqidi düşüncə", "strateji düşünmə", "qərar qəbul etmə"]
    },

    # ==========================================
    # 4. LANGUAGES
    # ==========================================
    {
        "id": "azerbaijani",
        "canonical_name": "Azerbaijani",
        "category": "language",
        "weight_factor": 1.0,
        "aliases": ["azerbaijani", "azərbaycan dili", "azərbaycan dilini", "ana dili", "səlis azərbaycan", "azərbaycan"]
    },
    {
        "id": "english",
        "canonical_name": "English",
        "category": "language",
        "weight_factor": 1.4,
        "aliases": [
            "english", "ingilis dili", "ingilis", "ielts", "toefl",
            "intermediate english", "advanced english", "ingilis dilini", "ingilisce"
        ]
    },
    {
        "id": "russian",
        "canonical_name": "Russian",
        "category": "language",
        "weight_factor": 1.2,
        "aliases": ["russian", "rus dili", "rus", "rus dilini", "rusca", "rus dili bilikləri"]
    },
    {
        "id": "turkish",
        "canonical_name": "Turkish",
        "category": "language",
        "weight_factor": 1.1,
        "aliases": ["turkish", "türk dili", "türk", "türkcə", "türk dilini"]
    },
    {
        "id": "german",
        "canonical_name": "German",
        "category": "language",
        "weight_factor": 1.2,
        "aliases": ["german", "alman dili", "alman", "almanca"]
    },
    {
        "id": "french",
        "canonical_name": "French",
        "category": "language",
        "weight_factor": 1.2,
        "aliases": ["french", "fransız dili", "fransız", "fransızca"]
    }
]
