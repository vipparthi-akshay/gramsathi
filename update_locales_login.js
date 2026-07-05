const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'apps/citizen-web/src/i18n/locales');

const translations = {
  en: {
    "login": {
      "welcome": "Welcome to GramSathi AI",
      "enterMobile": "Enter Mobile Number",
      "mobilePlaceholder": "10-digit mobile number",
      "sendOtp": "Send OTP",
      "enterOtp": "Enter OTP",
      "otpSent": "OTP sent to +91",
      "verifyOtp": "Verify & Login",
      "changeNumber": "Change Number",
      "invalidMobile": "Please enter a valid 10-digit number",
      "invalidOtp": "Invalid OTP. Please try again."
    }
  },
  hi: {
    "login": {
      "welcome": "ग्रामसाथी AI में आपका स्वागत है",
      "enterMobile": "मोबाइल नंबर दर्ज करें",
      "mobilePlaceholder": "10-अंकीय मोबाइल नंबर",
      "sendOtp": "OTP भेजें",
      "enterOtp": "OTP दर्ज करें",
      "otpSent": "+91 पर OTP भेजा गया",
      "verifyOtp": "सत्यापित करें और लॉगिन करें",
      "changeNumber": "नंबर बदलें",
      "invalidMobile": "कृपया एक वैध 10-अंकीय नंबर दर्ज करें",
      "invalidOtp": "अमान्य OTP। कृपया पुनः प्रयास करें।"
    }
  },
  mr: {
    "login": {
      "welcome": "ग्रामसाथी एआय मध्ये आपले स्वागत आहे",
      "enterMobile": "मोबाईल नंबर प्रविष्ट करा",
      "mobilePlaceholder": "१०-अंकी मोबाईल नंबर",
      "sendOtp": "OTP पाठवा",
      "enterOtp": "OTP प्रविष्ट करा",
      "otpSent": "+91 वर OTP पाठवला",
      "verifyOtp": "सत्यापित करा आणि लॉगिन करा",
      "changeNumber": "नंबर बदला",
      "invalidMobile": "कृपया वैध १०-अंकी नंबर प्रविष्ट करा",
      "invalidOtp": "अवैध OTP. कृपया पुन्हा प्रयत्न करा."
    }
  },
  ta: {
    "login": {
      "welcome": "கிராம்சாதி ஏஐ-க்கு வரவேற்கிறோம்",
      "enterMobile": "மொபைல் எண்ணை உள்ளிடவும்",
      "mobilePlaceholder": "10 இலக்க மொபைல் எண்",
      "sendOtp": "OTP அனுப்பவும்",
      "enterOtp": "OTP ஐ உள்ளிடவும்",
      "otpSent": "+91 க்கு OTP அனுப்பப்பட்டது",
      "verifyOtp": "சரிபார்த்து உள்நுழையவும்",
      "changeNumber": "எண்ணை மாற்றவும்",
      "invalidMobile": "சரியான 10 இலக்க எண்ணை உள்ளிடவும்",
      "invalidOtp": "தவறான OTP. மீண்டும் முயற்சிக்கவும்."
    }
  },
  te: {
    "login": {
      "welcome": "గ్రామసాథి AI కి స్వాగతం",
      "enterMobile": "మొబైల్ నంబర్‌ను నమోదు చేయండి",
      "mobilePlaceholder": "10-అంకెల మొబైల్ నంబర్",
      "sendOtp": "OTP పంపండి",
      "enterOtp": "OTP నమోదు చేయండి",
      "otpSent": "+91 కి OTP పంపబడింది",
      "verifyOtp": "నిర్ధారించి లాగిన్ చేయండి",
      "changeNumber": "నంబర్ మార్చండి",
      "invalidMobile": "దయచేసి సరైన 10-అంకెల నంబర్‌ను నమోదు చేయండి",
      "invalidOtp": "చెల్లని OTP. దయచేసి మళ్లీ ప్రయత్నించండి."
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
