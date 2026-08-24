/**
 * SkillMap Azerbaijan - Enhanced Real CV Parser Engine (PDF.js + Keyword Matching)
 * Accurately extracts personal email (skipping references), detected skills,
 * English language level, university, experience years, and candidate name.
 */

async function parseCV(file) {
  // 1. PDF-dən və ya sənəddən mətn çıxar
  let fullText = '';
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    if (typeof window !== "undefined" && window.pdfjsLib) {
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n';
      }
    } else {
      const decoder = new TextDecoder("utf-8");
      fullText = decoder.decode(new Uint8Array(arrayBuffer));
    }
  } catch (err) {
    console.warn("PDF.js extraction note:", err);
    try {
      fullText = await file.text();
    } catch (e) {
      console.error("Text extraction failed:", e);
    }
  }
  
  console.log("CV Text extracted:", fullText.length, "chars");
  const textLower = fullText.toLowerCase();
  
  // 2. Email tap (CV-nin yuxarı hissəsindəki şəxsi email, referans bölməsindən əvvəl)
  let email = '';
  const refIndex = textLower.search(/\b(references|referanslar|tövsiyələr|recommendations|hakimlər)\b/);
  const personalSection = refIndex !== -1 ? fullText.substring(0, refIndex) : fullText;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const headerEmails = personalSection.match(emailRegex);
  if (headerEmails && headerEmails.length > 0) {
    email = headerEmails[0].trim();
  } else {
    const allEmails = fullText.match(emailRegex);
    if (allEmails && allEmails.length > 0) email = allEmails[0].trim();
  }

  // 3. Ad və Soyad tap (ilk 5 sətrin içində)
  let candidateName = '';
  const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = lines[i];
    if (line.includes('@') || line.match(/(\+994|\b\d{3}\b)/) || line.toLowerCase().includes('curriculum') || line.toLowerCase().includes('resume')) continue;
    if (line.length >= 3 && line.length <= 40 && line.split(/\s+/).length >= 2) {
      candidateName = line;
      break;
    }
  }
  
  // 4. Genişləndirilmiş Bacarıqlar Siyahısı (keyword matching)
  const skillKeywords = {
    sql: ['sql', 'mysql', 'postgresql', 'database', 'verilənlər bazası', 'oracle', 'sqlite', 't-sql', 'pl/sql'],
    excel: ['excel', 'spreadsheet', 'pivot table', 'vlookup', 'xlookup', 'macros', 'power query'],
    python: ['python', 'pandas', 'numpy', 'django', 'flask', 'scikit-learn'],
    power_bi: ['power bi', 'powerbi', 'dax'],
    data_visualization: ['data visualization', 'visualization', 'vizualizasiya', 'tableau', 'matplotlib', 'seaborn', 'plots'],
    data_analysis: ['data analysis', 'data analytics', 'məlumat analizi', 'data analyst'],
    reporting: ['reporting', 'hesabat', 'report', 'business reporting'],
    r_programming: ['r programming', 'r language', 'r studio', 'rstudio', ' r '],
    knime: ['knime', 'knime analytics'],
    ms_office: ['ms office', 'microsoft office', 'word', 'powerpoint', 'ms word', 'office 365'],
    data_preprocessing: ['data pre-processing', 'data preprocessing', 'data cleaning', 'data preparation', 'data wrangling', 'etl'],
    javascript: ['javascript', 'react', 'vue', 'angular', 'node.js', 'typescript'],
    communication: ['communication', 'ünsiyyət', 'komanda', 'teamwork', 'leadership'],
    analytical_thinking: ['analytical', 'analitik', 'problem solving', 'research', 'tədqiqat'],
    english: ['english', 'ingilis', 'ielts', 'toefl', 'cefr'],
    russian: ['russian', 'rus dili', 'русский'],
    accounting: ['accounting', 'mühasibat', '1c', 'maliyyə', 'audit', 'financial analysis'],
    marketing: ['marketing', 'digital marketing', 'seo', 'smm', 'google ads'],
    sales: ['sales', 'satış', 'crm', 'müştəri'],
    hr: ['hr', 'human resources', 'recruitment', 'insan resursları'],
    project_management: ['project management', 'agile', 'scrum', 'jira', 'trello']
  };
  
  const foundSkills = {};
  
  for (const [skillId, keywords] of Object.entries(skillKeywords)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        foundSkills[skillId] = 2; // default səviyyə: 2/5 (istifadəçi sonra dəqiqləşdirə bilər)
        break;
      }
    }
  }
  
  // 5. Təcrübə illəri tap
  const expMatch = textLower.match(/(\d+)\+?\s*(year|il|год|years|illik)/);
  const experience = expMatch ? parseInt(expMatch[1]) : 0;
  
  // 6. İngilis dili səviyyəsi tap (genişləndirilmiş regex)
  let englishLevel = '';
  const engMatch = textLower.match(/(?:english|ingilis(?:\s*dili)?)\s*[\:\-\—\–\(\)\/\|\,]\s*(c2|c1|b2|b1|a2|a1|native|advanced|upper\s*intermediate|intermediate|elementary|fluent)/i)
    || textLower.match(/(c2|c1|b2|b1|a2|a1)\s*[\:\-\—\–\(\)\/\|\,]\s*(?:english|ingilis)/i)
    || textLower.match(/(?:ielts\s*(?:score)?\s*([789]|6\.5)|toefl\s*([89]\d|1[01]\d))/i);

  if (engMatch) {
    const rawLvl = (engMatch[1] || engMatch[0]).toLowerCase().replace(/\s+/g, '');
    if (rawLvl.includes('c2') || rawLvl.includes('native') || rawLvl.includes('8') || rawLvl.includes('9')) englishLevel = 'C2';
    else if (rawLvl.includes('c1') || rawLvl.includes('advanced') || rawLvl.includes('7')) englishLevel = 'C1';
    else if (rawLvl.includes('b2') || rawLvl.includes('upper') || rawLvl.includes('6.5')) englishLevel = 'B2';
    else if (rawLvl.includes('b1') || rawLvl.includes('intermediate')) englishLevel = 'B1';
    else if (rawLvl.includes('a2') || rawLvl.includes('elementary')) englishLevel = 'A2';
    else if (rawLvl.includes('a1')) englishLevel = 'A1';
  } else {
    // Check if English C1 / B2 / B1 is clearly mentioned
    if (textLower.match(/\b(c2)\b/)) englishLevel = 'C2';
    else if (textLower.match(/\b(c1)\b/)) englishLevel = 'C1';
    else if (textLower.match(/\b(b2)\b/)) englishLevel = 'B2';
    else if (textLower.match(/\b(b1)\b/)) englishLevel = 'B1';
    else if (textLower.match(/\b(a2)\b/)) englishLevel = 'A2';
  }
  
  // 7. Universitet tap
  let university = '';
  const uniKeywords = ['unec', 'bdu', 'ada', 'adnsu', 'aztu', 'bmu', 'banm', 'khazar'];
  for (const uni of uniKeywords) {
    if (textLower.includes(uni)) {
      university = uni.toUpperCase();
      break;
    }
  }
  
  const result = {
    rawText: fullText,
    email: email,
    candidateName: candidateName,
    foundSkills: foundSkills,
    skillCount: Object.keys(foundSkills).length,
    experience: experience,
    englishLevel: englishLevel || 'B2',
    university: university,
    parsingMethod: 'pdf.js + keyword matching',
    confidence: Object.keys(foundSkills).length > 3 ? 'Yüksək' : 'Orta'
  };
  
  console.log("CV Parse result:", result);
  return result;
}

// Global class wrapper for backward compatibility
class CVParserEngine {
  async parseFile(file) {
    return await parseCV(file);
  }
  parseRawText(text, name = "CV") {
    return parseCV(new Blob([text], { type: "text/plain" }));
  }
}

if (typeof window !== "undefined") {
  window.parseCV = parseCV;
  window.cvParser = new CVParserEngine();
}
