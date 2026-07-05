const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'apps/citizen-web/src/i18n/locales');

const translations = {
  hi: {
    "home": {
      "recommendedSchemes": "आपके लिए अनुशंसित"
    },
    "schemes": {
      "applyNow": "आवेदन करें",
      "sortMatch": "मिलान स्कोर"
    },
    "applications": {
      "viewDetails": "विवरण"
    }
  },
  mr: {
    "home": {
      "recommendedSchemes": "तुमच्यासाठी शिफारस केलेले"
    },
    "schemes": {
      "applyNow": "अर्ज करा",
      "sortMatch": "साम्य"
    },
    "applications": {
      "viewDetails": "तपशील"
    }
  },
  ta: {
    "home": {
      "recommendedSchemes": "பரிந்துரைக்கப்படும் திட்டங்கள்"
    },
    "schemes": {
      "applyNow": "விண்ணப்பிக்கவும்",
      "sortMatch": "பொருத்தம்"
    },
    "applications": {
      "viewDetails": "விவரங்கள்"
    }
  },
  te: {
    "home": {
      "recommendedSchemes": "మీ కోసం సిఫార్సు చేయబడినవి"
    },
    "schemes": {
      "applyNow": "దరఖాస్తు చేయండి",
      "sortMatch": "మ్యాచ్"
    },
    "applications": {
      "viewDetails": "వివరాలు"
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
