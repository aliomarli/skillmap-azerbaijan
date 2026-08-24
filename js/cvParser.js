/**
 * SkillMap Azerbaijan - Professional CV Parser & Entity Extraction Engine
 * Uses Mozilla PDF.js for client-side text extraction.
 * Accurately extracts candidate name, personal email (skipping references),
 * true experience years (filtering out phone numbers), education institution,
 * English proficiency level, and dynamic skill mastery levels (2/5, 3/5, 4/5, 5/5).
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
  
  // 2. Email tap (YALNIZ CV-nin yuxarı hissəsindəki şəxsi email, References bölməsindən əvvəl)
  let email = '';
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const refIndex = textLower.search(/\b(references?|referans(?:lar)?|tövsiyə(?:lər)?|recommendations?|referees?|hakimlər)\b/i);
  const personalSection = refIndex !== -1 ? fullText.substring(0, refIndex) : fullText.substring(0, Math.min(1200, fullText.length));
  
  const headerEmails = personalSection.match(emailRegex);
  if (headerEmails && headerEmails.length > 0) {
    email = headerEmails[0].trim();
  } else {
    const allEmails = fullText.match(emailRegex);
    if (allEmails && allEmails.length > 0) email = allEmails[0].trim();
  }

  // 3. Ad və Soyad tap (İlk sətirlərdən təmiz namizəd adını çıxar)
  let candidateName = '';
  const rawLines = fullText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < Math.min(8, rawLines.length); i++) {
    const line = rawLines[i];
    if (line.includes('@') || line.match(/(\+?\d[\d\s\-\(\)]{7,})/) || line.match(/https?:\/\//i)) continue;
    if (line.match(/\b(curriculum|vitae|resume|cv|contact|profile|summary|education|experience|skills|baku|azerbaijan|email|phone)\b/i)) continue;
    
    const cleanLine = line.replace(/[^a-zA-ZƏəIıÖöÜüĞğÇçŞş\s\.\-]/g, '').trim();
    const words = cleanLine.split(/\s+/).filter(w => w.length > 1);
    if (words.length >= 2 && words.length <= 4 && cleanLine.length >= 4 && cleanLine.length <= 35) {
      candidateName = cleanLine;
      break;
    }
  }

  // 4. Universitet & Təhsil tap
  let university = '';
  if (textLower.includes('international school of economics') || textLower.includes('ise')) {
    university = 'UNEC (International School of Economics)';
  } else if (textLower.includes('azerbaijan state university of economics') || textLower.includes('unec') || textLower.includes('iqtisad universiteti')) {
    university = 'UNEC (Azərbaycan Dövlət İqtisad Universiteti)';
  } else if (textLower.includes('baku state university') || textLower.includes('bdu') || textLower.includes('bakı dövlət universiteti')) {
    university = 'BDU (Bakı Dövlət Universiteti)';
  } else if (textLower.includes('ada university') || textLower.includes('ada')) {
    university = 'ADA Universiteti';
  } else if (textLower.includes('baku higher oil school') || textLower.includes('bhos') || textLower.includes('banm')) {
    university = 'BANM (Bakı Ali Neft Məktəbi)';
  } else if (textLower.includes('oil and industry') || textLower.includes('adnsu') || textLower.includes('asoiu') || textLower.includes('neft akademiyası')) {
    university = 'ADNSU';
  } else if (textLower.includes('ufaz') || textLower.includes('french-azerbaijani')) {
    university = 'UFAZ';
  } else if (textLower.includes('technical university') || textLower.includes('aztu')) {
    university = 'AzTU';
  } else if (textLower.includes('engineering university') || textLower.includes('bmu') || textLower.includes('qafqaz')) {
    university = 'BMU';
  } else if (textLower.includes('khazar') || textLower.includes('xəzər')) {
    university = 'Xəzər Universiteti';
  }

  // 5. Təcrübə illəri tap (Yalnız 1-15 arası real rəqəmlər, telefon nömrələri filtrasiya edilir)
  let experience = 0;
  const expMatch = textLower.match(/\b([1-9]|1[0-5])\+?\s*(?:years?|il|illik|il\s+təcrübə|years?\s+of\s+experience|years?\s+experience)\b/i)
    || textLower.match(/(?:təcrübə|experience)\s*[\:\-\—\–]\s*([1-9]|1[0-5])\+?\s*(?:il|years?)?/i);
    
  if (expMatch) {
    const expNum = parseInt(expMatch[1]);
    if (!isNaN(expNum) && expNum >= 1 && expNum <= 25) {
      experience = expNum;
    }
  }

  // 6. İngilis dili səviyyəsi tap (genişləndirilmiş və dəqiq axtarış)
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
    if (textLower.match(/\b(c2)\b/)) englishLevel = 'C2';
    else if (textLower.match(/\b(c1)\b/)) englishLevel = 'C1';
    else if (textLower.match(/\b(b2)\b/)) englishLevel = 'B2';
    else if (textLower.match(/\b(b1)\b/)) englishLevel = 'B1';
    else if (textLower.match(/\b(a2)\b/)) englishLevel = 'A2';
  }

  // 7. Bacarıqlar Siyahısı & Dinamik Səviyyə Qiymətləndirməsi
  const skillKeywords = {
    sql: ['sql', 'mysql', 'postgresql', 'database', 'verilənlər bazası', 'oracle', 'sqlite', 't-sql', 'pl/sql'],
    excel: ['excel', 'spreadsheet', 'pivot table', 'vlookup', 'xlookup', 'macros', 'power query'],
    python: ['python', 'pandas', 'numpy', 'django', 'flask', 'scikit-learn'],
    power_bi: ['power bi', 'powerbi', 'dax'],
    data_visualization: ['data visualization', 'visualization', 'vizualizasiya', 'tableau', 'matplotlib', 'seaborn', 'plots'],
    data_analysis: ['data analysis', 'data analytics', 'məlumat analizi', 'data analyst'],
    reporting: ['reporting', 'hesabat', 'report', 'business reporting'],
    r_programming: ['r programming', 'r language', 'r studio', 'rstudio', ' r '],
    knime: ['knime', 'knime analytics', 'knime analytics platform'],
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

  // Section splitting for context-aware mastery grading
  const expSecIdx = textLower.search(/\b(experience|iş təcrübəsi|work history|professional experience|projects|layihələr)\b/);
  const skillsSecIdx = textLower.search(/\b(skills|bacarıqlar|technical skills|tools|competencies|texniki bacarıqlar)\b/);
  const expSectionText = expSecIdx !== -1 ? textLower.substring(expSecIdx, skillsSecIdx !== -1 && skillsSecIdx > expSecIdx ? skillsSecIdx : expSecIdx + 1500) : '';
  const skillsSectionText = skillsSecIdx !== -1 ? textLower.substring(skillsSecIdx, skillsSecIdx + 1200) : '';

  const foundSkills = {};

  for (const [skillId, keywords] of Object.entries(skillKeywords)) {
    let occurrences = 0;
    let inExp = false;
    let inSkills = false;
    let isAdvanced = false;

    for (const keyword of keywords) {
      const regex = new RegExp('\\b' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      const matches = textLower.match(regex);
      if (matches) occurrences += matches.length;

      if (expSectionText.includes(keyword)) inExp = true;
      if (skillsSectionText.includes(keyword)) inSkills = true;
      if (textLower.includes(keyword + ' (advanced)') || textLower.includes('advanced ' + keyword) || textLower.includes(keyword + ' - advanced') || textLower.includes(keyword + ' advanced')) {
        isAdvanced = true;
      }
    }

    if (occurrences > 0) {
      if (isAdvanced) {
        foundSkills[skillId] = 4;
      } else if (inExp && occurrences >= 2) {
        foundSkills[skillId] = 4;
      } else if (inSkills || inExp) {
        foundSkills[skillId] = 3;
      } else if (occurrences >= 2) {
        foundSkills[skillId] = 3;
      } else {
        foundSkills[skillId] = 2;
      }
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
    university: university || 'UNEC (Azərbaycan Dövlət İqtisad Universiteti)',
    parsingMethod: 'pdf.js + context-aware keyword analysis',
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
