const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'apps/citizen-web/src/i18n/locales');

const translations = {
  hi: {
    "common": {
      "morningGreeting": "सुप्रभात",
      "afternoonGreeting": "शुभ दोपहर",
      "eveningGreeting": "शुभ संध्या",
      "appName": "ग्रामसाथी AI",
      "totalBenefits": "कुल लाभ",
      "viewAll": "सभी देखें"
    },
    "home": {
      "activeApplications": "सक्रिय आवेदन",
      "findSchemes": "योजनाएं खोजें",
      "recentActivity": "नवीनतम अपडेट"
    },
    "applications": {
      "approved": "स्वीकृत",
      "noApplications": "अभी तक कोई आवेदन नहीं"
    },
    "documents": {
      "pending": "लंबित दस्तावेज़"
    },
    "schemes": {
      "savedSchemes": "सहेजी गई योजनाएं",
      "categories": "श्रेणी के अनुसार योजनाएं",
      "agriculture": "कृषि",
      "employment": "रोजगार",
      "health": "स्वास्थ्य",
      "housing": "आवास",
      "financebanking": "वित्त एवं बैंकिंग"
    },
    "navigation": {
      "home": "होम",
      "aiAssistant": "AI सहायक",
      "schemes": "योजनाएं",
      "grievances": "शिकायतें",
      "profile": "प्रोफ़ाइल"
    }
  },
  mr: {
    "common": {
      "morningGreeting": "शुभ सकाळ",
      "afternoonGreeting": "शुभ दुपार",
      "eveningGreeting": "शुभ संध्याकाळ",
      "appName": "ग्रामसाथी एआय",
      "totalBenefits": "एकूण फायदे",
      "viewAll": "सर्व पहा"
    },
    "home": {
      "activeApplications": "सक्रिय अर्ज",
      "findSchemes": "योजना शोधा",
      "recentActivity": "नवीनतम अद्यतने"
    },
    "applications": {
      "approved": "मंजूर",
      "noApplications": "अद्याप कोणतेही अर्ज नाहीत"
    },
    "documents": {
      "pending": "प्रलंबित कागदपत्रे"
    },
    "schemes": {
      "savedSchemes": "जतन केलेल्या योजना",
      "categories": "श्रेणीनुसार योजना",
      "agriculture": "शेती",
      "employment": "रोजगार",
      "health": "आरोग्य",
      "housing": "गृहनिर्माण",
      "financebanking": "वित्त आणि बँकिंग"
    },
    "navigation": {
      "home": "मुख्यपृष्ठ",
      "aiAssistant": "AI सहाय्यक",
      "schemes": "योजना",
      "grievances": "तक्रारी",
      "profile": "प्रोफाइल"
    }
  },
  ta: {
    "common": {
      "morningGreeting": "காலை வணக்கம்",
      "afternoonGreeting": "மதிய வணக்கம்",
      "eveningGreeting": "மாலை வணக்கம்",
      "appName": "கிராம்சாதி ஏஐ",
      "totalBenefits": "மொத்த நன்மைகள்",
      "viewAll": "அனைத்தையும் காண்க"
    },
    "home": {
      "activeApplications": "செயலில் உள்ள விண்ணப்பங்கள்",
      "findSchemes": "திட்டங்களை ஆராயுங்கள்",
      "recentActivity": "சமீபத்திய அறிவிப்புகள்"
    },
    "applications": {
      "approved": "அங்கீகரிக்கப்பட்டது",
      "noApplications": "விண்ணப்பங்கள் எதுவும் இல்லை"
    },
    "documents": {
      "pending": "நிலுவையில் உள்ள ஆவணங்கள்"
    },
    "schemes": {
      "savedSchemes": "சேமிக்கப்பட்ட திட்டங்கள்",
      "categories": "வகை வாரியாக திட்டங்கள்",
      "agriculture": "விவசாயம்",
      "employment": "வேலைவாய்ப்பு",
      "health": "சுகாதாரம்",
      "housing": "வீட்டுவசதி",
      "financebanking": "நிதி மற்றும் வங்கி"
    },
    "navigation": {
      "home": "முகப்பு",
      "aiAssistant": "AI உதவியாளர்",
      "schemes": "திட்டங்கள்",
      "grievances": "குறைகள்",
      "profile": "சுயவிவரம்"
    }
  },
  te: {
    "common": {
      "morningGreeting": "శుభోదయం",
      "afternoonGreeting": "శుభాహ్నం",
      "eveningGreeting": "శుభ సాయంత్రం",
      "appName": "గ్రామసాథి AI",
      "totalBenefits": "మొత్తం ప్రయోజనాలు",
      "viewAll": "అన్నింటిని వీక్షించండి"
    },
    "home": {
      "activeApplications": "క్రియాశీల దరఖాస్తులు",
      "findSchemes": "పథకాలను అన్వేషించండి",
      "recentActivity": "తాజా నవీకరణలు"
    },
    "applications": {
      "approved": "ఆమోదించబడింది",
      "noApplications": "ఇంకా దరఖాస్తులు లేవు"
    },
    "documents": {
      "pending": "పెండింగ్ పత్రాలు"
    },
    "schemes": {
      "savedSchemes": "సేవ్ చేయబడిన పథకాలు",
      "categories": "వర్గం వారీగా పథకాలు",
      "agriculture": "వ్యవసాయం",
      "employment": "ఉపాధి",
      "health": "ఆరోగ్యం",
      "housing": "గృహనిర్మాణం",
      "financebanking": "ఫైనాన్స్ & బ్యాంకింగ్"
    },
    "navigation": {
      "home": "హోమ్",
      "aiAssistant": "AI సహాయకుడు",
      "schemes": "పథకాలు",
      "grievances": "ఫిర్యాదులు",
      "profile": "ప్రొఫైల్"
    }
  }
};

for (const lang of Object.keys(translations)) {
  const filePath = path.join(localesDir, `${lang}.json`);
  let current = {};
  if (fs.existsSync(filePath)) {
    try {
      current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(e);
    }
  }
  
  const updates = translations[lang];
  for (const key of Object.keys(updates)) {
    if (!current[key]) current[key] = {};
    for (const subkey of Object.keys(updates[key])) {
      current[key][subkey] = updates[key][subkey];
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
  console.log(`Updated ${lang}.json`);
}
