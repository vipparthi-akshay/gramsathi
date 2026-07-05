export interface MockUser {
  id: string;
  name: string;
  nameLocal: string;
  mobile: string;
  email: string;
  avatar: string;
  village: string;
  district: string;
  state: string;
  language: string;
  aadhaarLinked: boolean;
  bankLinked: boolean;
  rationCard: string;
  occupation: string;
  familySize: number;
}

export interface MockScheme {
  id: string;
  name: string;
  nameLocal: string;
  description: string;
  descriptionLocal: string;
  category: string;
  ministry: string;
  benefits: string[];
  eligibility: string[];
  documents: string[];
  matchScore: number;
  deadline: string;
  applicationCount: number;
  budget: string;
  howToApply: string;
  status: "active" | "closed" | "coming_soon";
  icon: string;
  color: string;
}

export interface MockApplication {
  id: string;
  schemeId: string;
  schemeName: string;
  schemeNameLocal: string;
  status:
    | "draft"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "cancelled";
  progress: number;
  submittedAt: string;
  updatedAt: string;
  estimatedCompletion: string;
  remarks: string;
  timeline: { status: string; date: string; remarks: string }[];
}

export interface MockNewsItem {
  id: string;
  title: string;
  titleLocal: string;
  summary: string;
  summaryLocal: string;
  category: string;
  date: string;
  source: string;
  isUrgent: boolean;
}

export interface DashboardStats {
  activeApplications: number;
  approvedSchemes: number;
  pendingDocuments: number;
  savedSchemes: number;
  notificationsUnread: number;
  totalBenefits: string;
}

export const mockUser: MockUser = {
  id: "user_1",
  name: "Ramesh Kumar Patel",
  nameLocal: "रमेश कुमार पटेल",
  mobile: "9876543210",
  email: "ramesh.patel@email.com",
  avatar: "",
  village: "Barwai",
  district: "Satna",
  state: "Madhya Pradesh",
  language: "hi",
  aadhaarLinked: true,
  bankLinked: true,
  rationCard: "MP/2024/123456",
  occupation: "Farmer (Kisan)",
  familySize: 5,
};

export const mockSchemes: MockScheme[] = [
  {
    id: "pm-kisan",
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    nameLocal: "प्रधानमंत्री किसान सम्मान निधि",
    description:
      "Income support scheme for farmers providing ₹6,000 per year in three equal installments of ₹2,000 each, directly transferred to the bank accounts of eligible farmer families.",
    descriptionLocal:
      "किसानों के लिए आय सहायता योजना, जो पात्र किसान परिवारों के बैंक खातों में सीधे ₹2,000 की तीन समान किस्तों में प्रति वर्ष ₹6,000 प्रदान करती है।",
    category: "Agriculture",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    benefits: [
      "₹6,000 per year in three installments",
      "Direct bank transfer (DBT)",
      "No intermediaries",
      "Covers all landholding farmers",
    ],
    eligibility: [
      "All farmer families with cultivable land",
      "Family should own land as per state records",
      "Not applicable for income tax payers",
      "Not for constitutional/post holders",
    ],
    documents: [
      "Aadhaar Card",
      "Land records",
      "Bank account details",
      "Mobile number linked to Aadhaar",
    ],
    matchScore: 95,
    deadline: "Ongoing (Apply anytime)",
    applicationCount: 12000000,
    budget: "₹60,000 Crore",
    howToApply:
      "Visit PM-KISAN portal (pmkisan.gov.in) or nearest Common Service Centre (CSC)",
    status: "active",
    icon: "🌾",
    color: "#2E7D32",
  },
  {
    id: "mgnrega",
    name: "Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)",
    nameLocal: "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम",
    description:
      "Provides 100 days of guaranteed wage employment in a financial year to every rural household whose adult members volunteer to do unskilled manual work.",
    descriptionLocal:
      "प्रत्येक ग्रामीण परिवार को 100 दिन का गारंटीकृत मजदूरी रोजगार प्रदान करता है जिसके वयस्क सदस्य अकुशल शारीरिक कार्य करने के लिए स्वेच्छुक हों।",
    category: "Employment",
    ministry: "Ministry of Rural Development",
    benefits: [
      "100 days of guaranteed employment",
      "Minimum wage fixed by government",
      "Work within 5 km of residence",
      "Unemployment allowance if work not provided",
      "Equal wages for men and women",
    ],
    eligibility: [
      "Rural households",
      "Adult members (18+ years)",
      "Willing to do unskilled manual work",
      "Job card holder",
    ],
    documents: [
      "Job card",
      "Aadhaar Card",
      "Bank account details",
      "Residence proof",
    ],
    matchScore: 88,
    deadline: "Ongoing",
    applicationCount: 8000000,
    budget: "₹73,000 Crore",
    howToApply:
      "Apply at Gram Panchayat office with Aadhaar and residence proof",
    status: "active",
    icon: "🔨",
    color: "#1565C0",
  },
  {
    id: "ayushman-bharat",
    name: "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
    nameLocal: "आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना",
    description:
      "World's largest health insurance scheme providing ₹5 lakh per family per year for secondary and tertiary care hospitalization.",
    descriptionLocal:
      "दुनिया की सबसे बड़ी स्वास्थ्य बीमा योजना जो प्रति परिवार प्रति वर्ष ₹5 लाख तक का स्वास्थ्य कवर प्रदान करती है।",
    category: "Health",
    ministry: "Ministry of Health and Family Welfare",
    benefits: [
      "₹5 lakh health cover per family per year",
      "Cashless treatment",
      "Coverage for 3 days pre-hospitalization",
      "Coverage for 15 days post-hospitalization",
      "Over 1,900 procedures covered",
    ],
    eligibility: [
      "Based on SECC database 2011",
      "Rural and urban poor families",
      "No age limit",
      "Pre-existing diseases covered",
    ],
    documents: [
      "Aadhaar Card",
      "Ration Card",
      "Income certificate",
      "Mobile number",
    ],
    matchScore: 92,
    deadline: "Ongoing",
    applicationCount: 15000000,
    budget: "₹6,400 Crore",
    howToApply:
      "Check eligibility at ayushmanbharat.gov.in or visit nearest empanelled hospital",
    status: "active",
    icon: "🏥",
    color: "#F57F17",
  },
  {
    id: "pm-awas",
    name: "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
    nameLocal: "प्रधानमंत्री आवास योजना - ग्रामीण",
    description:
      "Housing scheme providing financial assistance to rural poor for construction of pucca houses with basic amenities.",
    descriptionLocal:
      "ग्रामीण गरीबों को बुनियादी सुविधाओं के साथ पक्के मकानों के निर्माण के लिए वित्तीय सहायता प्रदान करने वाली आवास योजना।",
    category: "Housing",
    ministry: "Ministry of Rural Development",
    benefits: [
      "₹1.20 lakh financial assistance in plain areas",
      "₹1.30 lakh in hilly/difficult areas",
      "Top-up under MGNREGA (₹18,000-21,000)",
      "Bank loan up to ₹70,000",
      "House with toilet, LPG, electricity",
    ],
    eligibility: [
      "Rural households without pucca house",
      "Based on SECC 2011 deprivation criteria",
      "Not owning any pucca house",
      "Not availed benefits from other housing schemes",
    ],
    documents: [
      "Aadhaar Card",
      "Ration Card",
      "SECC certificate",
      "Land ownership documents",
      "Bank account details",
    ],
    matchScore: 78,
    deadline: "December 2025",
    applicationCount: 2500000,
    budget: "₹20,000 Crore",
    howToApply: "Apply through Gram Panchayat or online at pmayg.nic.in",
    status: "active",
    icon: "🏠",
    color: "#E65100",
  },
  {
    id: "pm-fasal-bima",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    nameLocal: "प्रधानमंत्री फसल बीमा योजना",
    description:
      "Crop insurance scheme providing comprehensive coverage against crop failure due to natural calamities, pests, and diseases.",
    descriptionLocal:
      "प्राकृतिक आपदाओं, कीटों और बीमारियों के कारण फसल की विफलता के विरुद्ध व्यापक कवरेज प्रदान करने वाली फसल बीमा योजना।",
    category: "Agriculture",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    benefits: [
      "Coverage for all major crops",
      "Low premium (2% kharif, 1.5% rabi)",
      "Full claim amount for prevented sowing",
      "Post-harvest losses covered",
      "On-time claim settlement",
    ],
    eligibility: [
      "All farmers growing notified crops",
      "Both loanee and non-loanee farmers",
      "Tenant/Sharecropper farmers eligible",
      "Must insure at least 1 hectare",
    ],
    documents: [
      "Aadhaar Card",
      "Land records",
      "Bank account details",
      "Crop details",
      "Previous insurance history",
    ],
    matchScore: 82,
    deadline: "July 2025 (Kharif season)",
    applicationCount: 5500000,
    budget: "₹15,000 Crore",
    howToApply:
      "Apply through nearest bank branch, insurance company office, or online portal",
    status: "active",
    icon: "🌱",
    color: "#558B2F",
  },
  {
    id: "sukanya-samriddhi",
    name: "Sukanya Samriddhi Yojana (SSY)",
    nameLocal: "सुकन्या समृद्धि योजना",
    description:
      "Small savings scheme for girl child education and marriage expenses with attractive interest rate and tax benefits.",
    descriptionLocal:
      "बालिका की शिक्षा और विवाह के खर्चों के लिए बचत योजना जिसमें आकर्षक ब्याज दर और कर लाभ हैं।",
    category: "Finance & Banking",
    ministry: "Ministry of Finance",
    benefits: [
      "8.2% interest rate (compounded yearly)",
      "Income tax benefit under 80C",
      "Account can be opened with ₹250",
      "Maximum deposit ₹1.5 lakh per year",
      "Partial withdrawal for education (50%)",
    ],
    eligibility: [
      "Girl child up to 10 years of age",
      "Indian resident",
      "Maximum 2 accounts per family",
      "One girl child can have only one account",
    ],
    documents: [
      "Girl child birth certificate",
      "Guardian Aadhaar",
      "Address proof",
      "Passport size photo",
      "Bank account of guardian",
    ],
    matchScore: 65,
    deadline: "Ongoing",
    applicationCount: 3200000,
    budget: "N/A",
    howToApply: "Open account in any post office or authorized bank branch",
    status: "active",
    icon: "👧",
    color: "#C62828",
  },
  {
    id: "pm-uqv",
    name: "PM Ujjwala Yojana (PMUY)",
    nameLocal: "प्रधानमंत्री उज्ज्वला योजना",
    description:
      "Provides free LPG connections to poor households to replace traditional cooking fuels like firewood, coal, and dung cakes.",
    descriptionLocal:
      "गरीब परिवारों को लकड़ी, कोयला और गोबर के उपले जैसे पारंपरिक ईंधन को बदलने के लिए मुफ्त LPG कनेक्शन प्रदान करती है।",
    category: "Energy",
    ministry: "Ministry of Petroleum and Natural Gas",
    benefits: [
      "Free LPG connection",
      "First refill free",
      "Stove provided free",
      "EMI option for refills",
      "Direct transfer of subsidy",
    ],
    eligibility: [
      "Adult women in BPL households",
      "No existing LPG connection",
      "SC/ST households priority",
      "Not applicable for income tax payers",
    ],
    documents: [
      "Aadhaar Card",
      "BPL certificate/Ration Card",
      "Bank account",
      "Address proof",
    ],
    matchScore: 85,
    deadline: "Ongoing",
    applicationCount: 10000000,
    budget: "₹12,000 Crore",
    howToApply: "Apply at nearest LPG distributor or online at ujjwala.gov.in",
    status: "active",
    icon: "🔥",
    color: "#FF6F00",
  },
  {
    id: "pm-shram-yogi",
    name: "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
    nameLocal: "प्रधानमंत्री श्रम योगी मान-धन योजना",
    description:
      "Pension scheme for unorganized workers providing ₹3,000 per month after age 60 with minimal contribution.",
    descriptionLocal:
      "असंगठित श्रमिकों के लिए पेंशन योजना जो न्यूनतम योगदान के साथ 60 वर्ष की आयु के बाद ₹3,000 प्रति माह प्रदान करती है।",
    category: "Pension",
    ministry: "Ministry of Labour and Employment",
    benefits: [
      "₹3,000/month pension after 60 years",
      "Minimum contribution ₹55/month",
      "Spouse gets 50% pension after death",
      "Entry age 18-40 years",
      "Government matches contribution",
    ],
    eligibility: [
      "Unorganized workers aged 18-40 years",
      "Monthly income up to ₹15,000",
      "Not covered by EPFO/ESIC/NPS",
      "Should have savings bank account",
    ],
    documents: [
      "Aadhaar Card",
      "Bank account",
      "Mobile number",
      "Self-declaration",
    ],
    matchScore: 72,
    deadline: "Ongoing",
    applicationCount: 1800000,
    budget: "₹500 Crore",
    howToApply:
      "Apply at CSC (Common Service Centre) or through registered organizations",
    status: "active",
    icon: "👴",
    color: "#5C6BC0",
  },
  {
    id: "pm-matsya",
    name: "Pradhan Mantri Matsya Sampada Yojana (PMMSY)",
    nameLocal: "प्रधानमंत्री मत्स्य संपदा योजना",
    description:
      "Scheme for sustainable development of fisheries sector with focus on increasing fish production and doubling fishermen income.",
    descriptionLocal:
      "मत्स्य क्षेत्र के सतत विकास के लिए योजना जिसमें मछली उत्पादन बढ़ाने और मछुआरों की आय दोगुनी करने पर ध्यान केंद्रित किया गया है।",
    category: "Agriculture",
    ministry: "Ministry of Fisheries, Animal Husbandry & Dairying",
    benefits: [
      "Subsidy up to 60% for general category",
      "Subsidy up to 80% for SC/ST/women",
      "Loans with interest subvention",
      "Modern equipment support",
      "Training and skill development",
    ],
    eligibility: [
      "Fishermen, fish farmers, fish workers",
      "Fisheries entrepreneurs",
      "Self Help Groups (SHGs)",
      "Fisheries cooperatives",
    ],
    documents: [
      "Aadhaar Card",
      "Residence proof",
      "Fishermen identity card",
      "Bank account",
      "Land/water body documents",
    ],
    matchScore: 45,
    deadline: "March 2025",
    applicationCount: 800000,
    budget: "₹20,000 Crore",
    howToApply: "Apply through State Fisheries Department or online portal",
    status: "active",
    icon: "🐟",
    color: "#00897B",
  },
  {
    id: "nsp",
    name: "National Scholarship Portal (NSP)",
    nameLocal: "राष्ट्रीय छात्रवृत्ति पोर्टल",
    description:
      "Central and state scholarship schemes for students from economically weaker sections, SC/ST/OBC, and minority communities.",
    descriptionLocal:
      "आर्थिक रूप से कमजोर वर्गों, SC/ST/OBC और अल्पसंख्यक समुदायों के छात्रों के लिए केंद्रीय और राज्य छात्रवृत्ति योजनाएं।",
    category: "Education",
    ministry: "Ministry of Education",
    benefits: [
      "Tuition fee coverage",
      "Maintenance allowance",
      "₹10,000-50,000 per year depending on scheme",
      "Merit-cum-means scholarships",
      "Special scholarships for girls",
    ],
    eligibility: [
      "Students from Class 1 to PhD",
      "Family income limit (varies by scheme)",
      "Specific criteria for SC/ST/OBC/Minority",
      "Minimum 50% marks in previous exam",
    ],
    documents: [
      "Aadhaar Card",
      "Income certificate",
      "Caste certificate (if applicable)",
      "Previous marksheet",
      "Bank account",
      "Passport photo",
    ],
    matchScore: 58,
    deadline: "October 2025",
    applicationCount: 20000000,
    budget: "₹3,500 Crore",
    howToApply:
      "Apply online at scholarships.gov.in during the application window",
    status: "active",
    icon: "📚",
    color: "#7B1FA2",
  },
  {
    id: "pm-svanidhi",
    name: "PM Street Vendor's AtmaNirbhar Nidhi (PM SVANidhi)",
    nameLocal: "प्रधानमंत्री स्ट्रीट वेंडर आत्मनिर्भर निधि",
    description:
      "Micro-credit facility for street vendors to recover their livelihoods after COVID-19, providing working capital loans.",
    descriptionLocal:
      "सड़क विक्रेताओं को COVID-19 के बाद उनकी आजीविका पुनः प्राप्त करने के लिए कार्यशील पूंजी ऋण प्रदान करने वाली सूक्ष्म-ऋण सुविधा।",
    category: "Finance & Banking",
    ministry: "Ministry of Housing and Urban Affairs",
    benefits: [
      "₹10,000 initial working capital loan",
      "Interest subsidy @ 7% per annum",
      "Digital transaction rewards",
      "₹50,000 loan on timely repayment",
      "No collateral required",
    ],
    eligibility: [
      "Street vendors in urban areas",
      "Should have Certificate of Vending",
      "Age 18+ years",
      "Not defaulted on previous loans",
    ],
    documents: [
      "Aadhaar Card",
      "Certificate of Vending/ID proof",
      "Bank account",
      "Mobile number",
      "Business address proof",
    ],
    matchScore: 55,
    deadline: "Ongoing",
    applicationCount: 3000000,
    budget: "₹10,000 Crore",
    howToApply:
      "Apply through nearest bank branch, CSC, or online at pmsvanidhi.mohua.gov.in",
    status: "active",
    icon: "🛒",
    color: "#6D4C41",
  },
  {
    id: "nrlm",
    name: "Deendayal Antyodaya Yojana - National Rural Livelihoods Mission (DAY-NRLM)",
    nameLocal: "दीनदयाल अंत्योदय योजना - राष्ट्रीय ग्रामीण आजीविका मिशन",
    description:
      "Poverty alleviation program promoting self-employment and organization of rural poor into Self Help Groups (SHGs).",
    descriptionLocal:
      "गरीबी उन्मूलन कार्यक्रम जो स्वरोजगार को बढ़ावा देता है और ग्रामीण गरीबों को स्वयं सहायता समूहों (SHG) में संगठित करता है।",
    category: "Social Welfare",
    ministry: "Ministry of Rural Development",
    benefits: [
      "Revolving fund to SHGs (₹15,000)",
      "Community investment fund",
      "Skill development training",
      "Bank linkage for loans",
      "Marketing support for products",
    ],
    eligibility: [
      "Rural poor households",
      "Women (priority)",
      "SC/ST households",
      "Disabled persons",
      "Landless laborers",
    ],
    documents: [
      "Aadhaar Card",
      "BPL certificate",
      "Residence proof",
      "SHG membership",
      "Bank account",
    ],
    matchScore: 68,
    deadline: "Ongoing",
    applicationCount: 7000000,
    budget: "₹5,000 Crore",
    howToApply:
      "Contact Block Development Office or join existing SHG in your village",
    status: "active",
    icon: "🤝",
    color: "#AD1457",
  },
];

export const mockApplications: MockApplication[] = [
  {
    id: "app_1",
    schemeId: "pm-kisan",
    schemeName: "PM-KISAN",
    schemeNameLocal: "पीएम-किसान",
    status: "approved",
    progress: 100,
    submittedAt: "2024-08-15T10:30:00Z",
    updatedAt: "2024-09-01T14:20:00Z",
    estimatedCompletion: "Completed",
    remarks: "All installments received successfully",
    timeline: [
      {
        status: "Application Submitted",
        date: "2024-08-15",
        remarks: "Submitted via CSC",
      },
      {
        status: "Document Verification",
        date: "2024-08-20",
        remarks: "Land records verified",
      },
      {
        status: "Bank Validation",
        date: "2024-08-25",
        remarks: "Bank account verified with Aadhaar",
      },
      {
        status: "Approved",
        date: "2024-09-01",
        remarks: "Eligible for all benefits",
      },
      {
        status: "1st Installment Received",
        date: "2024-09-10",
        remarks: "₹2,000 credited",
      },
    ],
  },
  {
    id: "app_2",
    schemeId: "mgnrega",
    schemeName: "MGNREGA",
    schemeNameLocal: "मनरेगा",
    status: "under_review",
    progress: 65,
    submittedAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-02-05T11:30:00Z",
    estimatedCompletion: "2025-04-15",
    remarks: "Job card created, 45 days of work completed",
    timeline: [
      {
        status: "Job Card Created",
        date: "2025-01-10",
        remarks: "Job card issued",
      },
      {
        status: "Work Demand Submitted",
        date: "2025-01-15",
        remarks: "Demand for 100 days",
      },
      {
        status: "Work Allotted",
        date: "2025-01-20",
        remarks: "Pond digging work allotted",
      },
      {
        status: "Work In Progress",
        date: "2025-02-05",
        remarks: "45 days completed so far",
      },
    ],
  },
  {
    id: "app_3",
    schemeId: "ayushman-bharat",
    schemeName: "Ayushman Bharat",
    schemeNameLocal: "आयुष्मान भारत",
    status: "submitted",
    progress: 30,
    submittedAt: "2025-02-01T09:15:00Z",
    updatedAt: "2025-02-10T16:00:00Z",
    estimatedCompletion: "2025-03-20",
    remarks: "Documents under verification",
    timeline: [
      {
        status: "Application Submitted",
        date: "2025-02-01",
        remarks: "Online application",
      },
      {
        status: "Document Upload",
        date: "2025-02-05",
        remarks: "All documents uploaded",
      },
      {
        status: "Verification In Progress",
        date: "2025-02-10",
        remarks: "SECC database matching",
      },
    ],
  },
  {
    id: "app_4",
    schemeId: "pm-awas",
    schemeName: "PMAY-G",
    schemeNameLocal: "प्रधानमंत्री आवास योजना",
    status: "draft",
    progress: 15,
    submittedAt: "",
    updatedAt: "2025-02-12T10:00:00Z",
    estimatedCompletion: "",
    remarks: "Draft incomplete - land documents pending",
    timeline: [
      {
        status: "Draft Created",
        date: "2025-02-01",
        remarks: "Started application",
      },
      {
        status: "Personal Details Filled",
        date: "2025-02-10",
        remarks: "Basic info completed",
      },
    ],
  },
  {
    id: "app_5",
    schemeId: "pm-fasal-bima",
    schemeName: "PMFBY",
    schemeNameLocal: "प्रधानमंत्री फसल बीमा",
    status: "approved",
    progress: 100,
    submittedAt: "2024-06-01T07:00:00Z",
    updatedAt: "2024-12-20T12:00:00Z",
    estimatedCompletion: "Completed",
    remarks: "Claim settled for kharif 2024 season",
    timeline: [
      {
        status: "Insurance Applied",
        date: "2024-06-01",
        remarks: "Applied for kharif season",
      },
      {
        status: "Premium Paid",
        date: "2024-06-15",
        remarks: "Premium of ₹750 paid",
      },
      {
        status: "Crop Assessment",
        date: "2024-10-20",
        remarks: "Damage assessed - 65% loss",
      },
      {
        status: "Claim Approved",
        date: "2024-12-10",
        remarks: "₹45,000 claim approved",
      },
      {
        status: "Claim Settled",
        date: "2024-12-20",
        remarks: "Amount credited to bank",
      },
    ],
  },
  {
    id: "app_6",
    schemeId: "sukanya-samriddhi",
    schemeName: "Sukanya Samriddhi",
    schemeNameLocal: "सुकन्या समृद्धि",
    status: "approved",
    progress: 100,
    submittedAt: "2023-03-10T11:00:00Z",
    updatedAt: "2025-01-05T09:00:00Z",
    estimatedCompletion: "2038 (Maturity)",
    remarks: "Account active with regular deposits",
    timeline: [
      {
        status: "Account Opened",
        date: "2023-03-10",
        remarks: "Opened in post office",
      },
      {
        status: "First Deposit",
        date: "2023-03-10",
        remarks: "₹10,000 deposited",
      },
      {
        status: "Ongoing",
        date: "2025-01-05",
        remarks: "Regular deposits maintained",
      },
    ],
  },
];

export const mockNews: MockNewsItem[] = [
  {
    id: "news_1",
    title:
      "PM-KISAN 14th Installment Released: ₹18,000 Crore Transferred to 9.5 Crore Farmers",
    titleLocal:
      "PM-KISAN 14वीं किस्त जारी: 9.5 करोड़ किसानों को ₹18,000 करोड़ हस्तांतरित",
    summary:
      "The 14th installment of PM-KISAN was released, benefiting over 9.5 crore farmers across the country with direct benefit transfer.",
    summaryLocal:
      "PM-KISAN की 14वीं किस्त जारी की गई, जिससे देश भर के 9.5 करोड़ से अधिक किसानों को प्रत्यक्ष लाभ हस्तांतरण हुआ।",
    category: "Scheme Update",
    date: "2025-02-15",
    source: "PIB India",
    isUrgent: true,
  },
  {
    id: "news_2",
    title:
      "Ayushman Bharat Covers 30 Crore Beneficiaries; New Treatments Added",
    titleLocal:
      "आयुष्मान भारत ने 30 करोड़ लाभार्थियों को कवर किया; नए उपचार जोड़े गए",
    summary:
      "Central government expands Ayushman Bharat coverage with 50 new treatment procedures and 50% increase in package rates for 350+ procedures.",
    summaryLocal:
      "केंद्र सरकार ने 50 नई उपचार प्रक्रियाओं और 350+ प्रक्रियाओं के लिए पैकेज दरों में 50% वृद्धि के साथ आयुष्मान भारत कवरेज का विस्तार किया।",
    category: "Health",
    date: "2025-02-10",
    source: "Ministry of Health",
    isUrgent: false,
  },
  {
    id: "news_3",
    title: "MGNREGA Wage Rate Increased to ₹274 per Day",
    titleLocal: "MGNREGA मजदूरी दर बढ़ाकर ₹274 प्रति दिन की गई",
    summary:
      "The government has revised MGNREGA wage rates with an average increase of 8%, effective from April 2025.",
    summaryLocal:
      "सरकार ने अप्रैल 2025 से प्रभावी MGNREGA मजदूरी दरों में औसतन 8% की वृद्धि की है।",
    category: "Employment",
    date: "2025-02-08",
    source: "Ministry of Rural Development",
    isUrgent: false,
  },
  {
    id: "news_4",
    title: "Ujjwala Yojana Reaches 10 Crore Connections Milestone",
    titleLocal: "उज्ज्वला योजना ने 10 करोड़ कनेक्शन के माइलस्टोन को छुआ",
    summary:
      "PM Ujjwala Yojana achieves 10 crore LPG connections, providing clean cooking fuel to rural households across India.",
    summaryLocal:
      "प्रधानमंत्री उज्ज्वला योजना ने 10 करोड़ LPG कनेक्शन का आंकड़ा पार किया, जो पूरे भारत में ग्रामीण परिवारों को स्वच्छ खाना पकाने का ईंधन प्रदान करता है।",
    category: "Achievement",
    date: "2025-02-05",
    source: "Ministry of Petroleum",
    isUrgent: false,
  },
  {
    id: "news_5",
    title: "PM SVANidhi Yojana Extended Till 2025",
    titleLocal: "PM SVANidhi योजना 2025 तक बढ़ाई गई",
    summary:
      "Street vendor loan scheme PM SVANidhi extended with additional benefits including higher loan limits and interest subsidy.",
    summaryLocal:
      "सड़क विक्रेता ऋण योजना PM SVANidhi को उच्च ऋण सीमाओं और ब्याज सब्सिडी सहित अतिरिक्त लाभों के साथ बढ़ाया गया।",
    category: "Finance",
    date: "2025-01-28",
    source: "Ministry of Housing & Urban Affairs",
    isUrgent: false,
  },
  {
    id: "news_6",
    title: "National Scholarship Portal Opens for 2025-26 Applications",
    titleLocal: "राष्ट्रीय छात्रवृत्ति पोर्टल 2025-26 के आवेदनों के लिए खुला",
    summary:
      "NSP 2025-26 application window opens with over 100 central and state scholarship schemes for students. Apply before October 2025.",
    summaryLocal:
      "NSP 2025-26 आवेदन विंडो छात्रों के लिए 100 से अधिक केंद्रीय और राज्य छात्रवृत्ति योजनाओं के साथ खुली है। अक्टूबर 2025 से पहले आवेदन करें।",
    category: "Education",
    date: "2025-01-20",
    source: "Ministry of Education",
    isUrgent: true,
  },
];

export const dashboardStats: DashboardStats = {
  activeApplications: 3,
  approvedSchemes: 4,
  pendingDocuments: 2,
  savedSchemes: 7,
  notificationsUnread: 5,
  totalBenefits: "₹1,25,000+",
};

export const mockChatResponses: Record<string, string> = {
  "pm-kisan":
    "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi) provides ₹6,000 per year to eligible farmers in three installments. Based on your profile, you are 95% eligible. Your application is already approved! You have received all installments so far.",
  mgnrega:
    "MGNREGA guarantees 100 days of wage employment in rural areas. Your job card is active and you have completed 45 days of work so far. You can demand more work from your Gram Panchayat.",
  "ayushman-bharat":
    "Ayushman Bharat provides ₹5 lakh health cover per family. Your application is under review. Once approved, you can get cashless treatment at any empanelled hospital.",
  default:
    "Namaste! I am GramBot, your AI assistant for government services. I can help you:\n\n1. **Find Schemes** - Discover schemes you are eligible for\n2. **Track Applications** - Check your application status\n3. **Apply for Schemes** - Start a new application\n4. **Document Help** - Guidance on required documents\n\nWhat would you like to know? Just type or speak your question!",
  installment:
    "Your next PM-KISAN installment date depends on the government announcement. Typically, installments are released every 4 months in April, August, and December. You will receive a notification when the next installment is credited.",
  documents:
    "The documents you need depend on the scheme. For most schemes, you need:\n- Aadhaar Card\n- Bank Account (linked to Aadhaar)\n- Ration Card\n- Recent passport photos\n- Mobile number\n\nYou can upload documents in the Document Center on this app!",
};

export const getSchemeById = (id: string): MockScheme | undefined =>
  mockSchemes.find((s) => s.id === id);

export const getApplicationById = (id: string): MockApplication | undefined =>
  mockApplications.find((a) => a.id === id);

export const getChatResponse = (query: string): string => {
  const lower = query.toLowerCase();
  if (
    lower.includes("pm-kisan") ||
    lower.includes("kisan") ||
    lower.includes("pmkisan")
  )
    return mockChatResponses["pm-kisan"];
  if (
    lower.includes("mgnrega") ||
    lower.includes("nrega") ||
    lower.includes("job card") ||
    lower.includes("roigar")
  )
    return mockChatResponses["mgnrega"];
  if (
    lower.includes("ayushman") ||
    lower.includes("health") ||
    lower.includes("hospital")
  )
    return mockChatResponses["ayushman-bharat"];
  if (
    lower.includes("installment") ||
    lower.includes("kist") ||
    lower.includes("payment")
  )
    return mockChatResponses["installment"];
  if (
    lower.includes("document") ||
    lower.includes("paper") ||
    lower.includes("file")
  )
    return mockChatResponses["documents"];
  return mockChatResponses.default;
};
