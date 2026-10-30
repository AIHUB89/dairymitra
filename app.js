/**
 * DairyMitra (डेयरी मित्र) - Core Application Logic
 * Voice-enabled, Mobile-First PWA for Dairy Farmers
 * Supports Photo Uploads, Full Edit & Delete for Animals and Customers
 */

// ===================================================================
// DEFAULT DATA & LOCAL STORAGE INITIALIZATION
// ===================================================================

const DEFAULT_STATE = {
  farmSettings: {
    farmName: 'श्री कृष्णा डेयरी फार्म',
    defaultRate: 60,
    defaultFatRate: 8.0,
    defaultSnfRate: 0.0,
    upiId: 'dairyfarm@upi',
    ownerPhone: '9876543210',
    audioFeedback: true,
    isPro: false,
    proValidUntil: null,
    referralCode: 'DM-KRISHNA78',
    referralsCount: 0,
    referredBy: null,
    hasUsedReferral: false
  },
  animals: [
    { id: 'a1', name: 'लाली (मुर्रा)', type: 'buffalo', breed: 'मुर्रा', status: 'milking', expectedYield: 8.0, photo: '' },
    { id: 'a2', name: 'भूरी (गिर गाय)', type: 'cow', breed: 'गिर', status: 'milking', expectedYield: 7.0, photo: '' },
    { id: 'a3', name: 'कजरी (भैंस)', type: 'buffalo', breed: 'देसी', status: 'milking', expectedYield: 6.5, photo: '' },
    { id: 'a4', name: 'गौरी (साहीवाल)', type: 'cow', breed: 'साहीवाल', status: 'pregnant', expectedYield: 5.5, photo: '' },
    { id: 'a5', name: 'रानी (HF क्रॉस)', type: 'cow', breed: 'HF / संकर', status: 'dry', expectedYield: 0, photo: '' }
  ],
  customers: [
    { id: 'c1', name: 'रमेश जी', phone: '9876543211', address: 'मकान नं 12, गली 2', quotaMorning: 2.0, quotaEvening: 1.0, rate: 65, dues: 1850, photo: '' },
    { id: 'c2', name: 'शर्मा जी (किराना)', phone: '9876543212', address: 'दुकान चौक', quotaMorning: 1.5, quotaEvening: 0.0, rate: 60, dues: 900, photo: '' },
    { id: 'c3', name: 'वर्मा मास्टर जी', phone: '9876543213', address: 'स्कूल के पास', quotaMorning: 1.0, quotaEvening: 1.0, rate: 60, dues: 480, photo: '' },
    { id: 'c4', name: 'गुप्ता जी', phone: '9876543214', address: 'प्लॉट नं 45', quotaMorning: 2.5, quotaEvening: 2.0, rate: 65, dues: 3200, photo: '' }
  ],
  // Breeding & Insemination Records (गर्भाधान व सीमन डायरी)
  breedingRecords: [
    {
      id: 'br_sample_1',
      animalId: 'a4', // गौरी (साहीवाल गाय)
      aiDate: '2026-04-15', // ~190 दिन पहले (गाभिन अवस्था)
      semenDetails: 'साहीवाल A2 बुल (स्ट्रॉ #402)',
      doctorName: 'डॉ. वर्मा (पशु चिकित्सालय)',
      doctorPhone: '9876501234',
      status: 'active',
      heatCheckDone: true,
      heatCheckResult: 'passed',
      pdCheckDone: true,
      pdCheckResult: 'positive',
      dryOffDone: false,
      notes: 'पहला सीमन सफल रहा'
    },
    {
      id: 'br_sample_2',
      animalId: 'a1', // लाली (मुर्रा भैंस)
      aiDate: '2026-10-06', // ~16 दिन पहले (5 दिन में 21-दिन हीट चेक अलर्ट)
      semenDetails: 'मुर्रा चैंपियन बुल (#901)',
      doctorName: 'डॉ. शर्मा',
      doctorPhone: '9876549988',
      status: 'active',
      heatCheckDone: false,
      heatCheckResult: null,
      pdCheckDone: false,
      pdCheckResult: null,
      dryOffDone: false,
      notes: 'शाम 5 बजे सीमन लगवाया'
    }
  ],
  // Daily Milk Testing Records (फैट व SNF संकलन रिकॉर्ड)
  milkTests: [
    {
      id: 'mt_sample_1',
      date: '2026-10-22',
      time: '07:30 AM',
      shift: 'सुबह',
      name: 'लाली (मुर्रा)',
      type: 'buffalo',
      litres: 8.0,
      fat: 7.2,
      clr: 29.0,
      snf: 9.05,
      rate: 57.6,
      total: 460.8,
      quality: '🟢 शुद्ध व उत्तम'
    },
    {
      id: 'mt_sample_2',
      date: '2026-10-22',
      time: '08:15 AM',
      shift: 'सुबह',
      name: 'भूरी (गिर गाय)',
      type: 'cow',
      litres: 6.5,
      fat: 4.2,
      clr: 28.0,
      snf: 8.60,
      rate: 33.6,
      total: 218.4,
      quality: '🟢 शुद्ध व उत्तम'
    }
  ],
  // Daily records keyed by date string "YYYY-MM-DD"
  dailyRecords: {}
};

// Application State
let appData = loadData();
let currentShift = (new Date().getHours() < 14) ? 'morning' : 'evening';
let currentDateKey = getTodayDateKey();
let activeFilter = 'all';

// Khata & 30-Day Calendar State
let currentKhataYear = new Date().getFullYear();
let currentKhataMonth = new Date().getMonth() + 1; // 1-12
let selectedCalCustId = null;
let selectedCalYear = currentKhataYear;
let selectedCalMonth = currentKhataMonth;

// Animal Milking Calendar & AI Records State
let selectedCalAnimalId = null;
let selectedAnimalCalYear = currentKhataYear;
let selectedAnimalCalMonth = currentKhataMonth;

const HINDI_MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
function getHindiMonthName(m) {
  return HINDI_MONTHS[(m - 1 + 12) % 12];
}

// Ensure today's record structure exists
initTodayRecord();

function loadData() {
  const saved = localStorage.getItem('dairymitra_db_v1');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (!data.breedingRecords || data.breedingRecords.length === 0) {
        data.breedingRecords = JSON.parse(JSON.stringify(DEFAULT_STATE.breedingRecords));
      }
      if (!data.milkTests) {
        data.milkTests = JSON.parse(JSON.stringify(DEFAULT_STATE.milkTests));
      }
      if (!data.farmSettings.defaultFatRate) {
        data.farmSettings.defaultFatRate = 8.0;
        data.farmSettings.defaultSnfRate = 0.0;
      }
      // One-time upgrade to clean 0 counters for today
      if (!data._v52DailyResetClean) {
        data._v52DailyResetClean = true;
        const todayKey = getTodayDateKey();
        if (data.dailyRecords && data.dailyRecords[todayKey]) {
          if (data.dailyRecords[todayKey].milking) {
            data.dailyRecords[todayKey].milking = { morning: {}, evening: {} };
            (data.animals || []).forEach(a => {
              data.dailyRecords[todayKey].milking.morning[a.id] = 0;
              data.dailyRecords[todayKey].milking.evening[a.id] = 0;
            });
          }
          if (data.dailyRecords[todayKey].delivery) {
            data.dailyRecords[todayKey].delivery = { morning: {}, evening: {} };
            (data.customers || []).forEach(c => {
              data.dailyRecords[todayKey].delivery.morning[c.id] = { status: 'pending', litres: 0 };
              data.dailyRecords[todayKey].delivery.evening[c.id] = { status: 'pending', litres: 0 };
            });
          }
        }
      }

      // One-time migration to purge auto-generated demo attendance data (including November/future and mock naga)
      if (!data._v55CleanDummyAttendance) {
        data._v55CleanDummyAttendance = true;
        const todayKey = getTodayDateKey();
        const keepToday = (data.dailyRecords && data.dailyRecords[todayKey]) ? data.dailyRecords[todayKey] : null;
        data.dailyRecords = {};
        if (keepToday) {
          data.dailyRecords[todayKey] = keepToday;
        }
        localStorage.setItem('dairymitra_db_v1', JSON.stringify(data));
      }

      // Always ensure any future dates are purged from dailyRecords
      const curTodayKey = getTodayDateKey();
      if (data.dailyRecords) {
        Object.keys(data.dailyRecords).forEach(k => {
          if (k > curTodayKey) {
            delete data.dailyRecords[k];
          }
        });
      }

      // Ensure DairyMitra Pro & Referral Settings exist
      if (!data.farmSettings) data.farmSettings = {};
      if (typeof data.farmSettings.isPro === 'undefined') data.farmSettings.isPro = false;
      if (typeof data.farmSettings.referralsCount === 'undefined') data.farmSettings.referralsCount = 0;
      if (!data.farmSettings.referralCode) {
        let cleanName = (data.farmSettings.farmName || 'KRISHNA').replace(/[^a-zA-Z0-9]/g, '').slice(0, 7).toUpperCase();
        if (!cleanName || cleanName.length < 3) cleanName = 'DAIRY';
        const randNum = Math.floor(10 + Math.random() * 90);
        data.farmSettings.referralCode = `DM-${cleanName}${randNum}`;
      }
      if (data.farmSettings.proValidUntil) {
        const expDate = new Date(data.farmSettings.proValidUntil);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (expDate < now) {
          data.farmSettings.isPro = false;
        }
      }

      return data;
    } catch (e) {
      console.error('Error parsing saved data:', e);
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveData() {
  localStorage.setItem('dairymitra_db_v1', JSON.stringify(appData));
  updateStatsHeader();
}

function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initTodayRecord(forceReset = false) {
  const freshDateKey = getTodayDateKey();
  if (freshDateKey !== currentDateKey) {
    currentDateKey = freshDateKey;
  }

  if (!appData.dailyRecords[currentDateKey] || forceReset) {
    appData.dailyRecords[currentDateKey] = {
      milking: {
        morning: {},
        evening: {}
      },
      delivery: {
        morning: {},
        evening: {}
      }
    };

    // On a new day, every animal starts clean at 0.0 L (clean slate for milking)
    appData.animals.forEach(a => {
      appData.dailyRecords[currentDateKey].milking.morning[a.id] = 0;
      appData.dailyRecords[currentDateKey].milking.evening[a.id] = 0;
    });

    // On a new day, all customer deliveries start as 'pending' (0 L delivered until checked)
    appData.customers.forEach(c => {
      appData.dailyRecords[currentDateKey].delivery.morning[c.id] = {
        status: 'pending',
        litres: 0
      };
      appData.dailyRecords[currentDateKey].delivery.evening[c.id] = {
        status: 'pending',
        litres: 0
      };
    });

    // Daily farm expenses (दाना, चारा, भूसा, दवाई, अन्य)
    appData.dailyRecords[currentDateKey].expenses = {
      feed: 0,
      greenFodder: 0,
      dryFodder: 0,
      medical: 0,
      other: 0
    };

    saveData();
  }

  // Ensure expenses exists even if dailyRecord was created earlier
  if (!appData.dailyRecords[currentDateKey].expenses) {
    appData.dailyRecords[currentDateKey].expenses = {
      feed: 0,
      greenFodder: 0,
      dryFodder: 0,
      medical: 0,
      other: 0
    };
  }
}

function resetTodayCounters() {
  initTodayRecord(true);
  updateStatsHeader();
  renderMilkingCards();
  renderDeliveryCards();
  speakAudio('आज का नया दिन शुरू हो गया, सभी काउंटर 0 कर दिए गए हैं');
  showAudioToast('🔄 आज का नया दिन शुरू! सभी काउंटर 0');
}

// ===================================================================
// IMAGE COMPRESSION & PHOTO HELPER
// ===================================================================

/**
 * Compresses uploaded photo using HTML5 Canvas to keep LocalStorage light & fast.
 * Resizes to max 240x240 px, quality 0.75 JPEG (~15-20 KB).
 */
function compressAndStoreImage(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 240;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      callback(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===================================================================
// AUDIO SPEECH SYNTHESIS & RECOGNITION (VOICE ENGINE)
// ===================================================================

let speechRecognition = null;
let isRecognizing = false;

function initVoiceRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    console.warn('Speech Recognition not supported in this browser.');
    return;
  }

  speechRecognition = new SpeechRec();
  speechRecognition.lang = 'hi-IN'; // Indian Hindi
  speechRecognition.continuous = false;
  speechRecognition.interimResults = false;

  speechRecognition.onstart = () => {
    isRecognizing = true;
    const card = document.getElementById('voiceCard');
    if (card) card.classList.add('recording');
    document.getElementById('voiceStatus').innerText = '🎙️ सुन रहा हूँ... बोलिए';
    document.getElementById('voiceResult').innerText = 'उदा. "लाली 6 लीटर" या "रमेश 2 लीटर"';
  };

  speechRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('voiceStatus').innerText = `आपने बोला: "${transcript}"`;
    const docInput = document.getElementById('aiQuestionInput');
    const viewDoc = document.getElementById('viewDoctor');
    if (viewDoc && !viewDoc.classList.contains('hidden') && docInput) {
      docInput.value = transcript;
    }
    processVoiceCommand(transcript);
  };

  speechRecognition.onerror = (event) => {
    console.warn('Voice error:', event.error);
    stopVoiceRecognition();
    document.getElementById('voiceStatus').innerText = 'माइक दबाकर फिर से बोलें';
  };

  speechRecognition.onend = () => {
    stopVoiceRecognition();
  };
}

function startVoiceRecognition() {
  if (!speechRecognition) initVoiceRecognition();
  if (speechRecognition && !isRecognizing) {
    try {
      speechRecognition.start();
    } catch (e) {
      console.warn('Recognition start failed:', e);
    }
  }
}

function stopVoiceRecognition() {
  isRecognizing = false;
  const card = document.getElementById('voiceCard');
  if (card) card.classList.remove('recording');
}

// Clean text for natural speech synthesis (remove asterisks, commas, hyphens, brackets, slashes, emojis)
function cleanTextForSpeech(text) {
  if (!text) return '';
  let str = String(text);

  // 1. Remove HTML tags if present (e.g. <br>, <b>, <strong>)
  str = str.replace(/<[^>]*>/g, ' ');

  // 2. Remove all emojis (emoticons, pictographs, symbols)
  try {
    str = str.replace(/\p{Extended_Pictographic}/gu, ' ');
  } catch (e) {
    str = str.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, ' ');
  }

  // 3. Remove commas inside numbers (e.g. "2,000" -> "2000", "1,50,000" -> "150000")
  str = str.replace(/(\d+),(\d+)/g, '$1$2');
  str = str.replace(/(\d+),(\d+)/g, '$1$2');

  // 4. Units & slashes (e.g. "/लीटर" -> " प्रति लीटर ", "2.5L" -> "2.5 लीटर")
  str = str.replace(/\/\s*(L|लीटर|l)\b/gi, ' प्रति लीटर ');
  str = str.replace(/\/\s*(दिन|day)\b/gi, ' प्रति दिन ');
  str = str.replace(/\/\s*(kg|किलो|किग्रा)\b/gi, ' प्रति किलो ');
  str = str.replace(/(\d+)\s*\/\s*(\d+)/g, '$1 बटा $2');
  str = str.replace(/(\d+(\.\d+)?)\s*L\b/g, '$1 लीटर ');
  str = str.replace(/%/g, ' प्रतिशत ');

  // 5. Rupee symbol: "₹2000" -> "2000 रुपये"
  str = str.replace(/₹\s*(\d+(\.\d+)?)/g, '$1 रुपये');
  str = str.replace(/₹/g, ' रुपये ');

  // 6. Hyphens and dashes:
  // Numbers range: "1-2" -> "1 से 2"
  str = str.replace(/(\d+)\s*[-–—]\s*(\d+)/g, '$1 से $2');
  // Strip all remaining hyphens / dashes / minus signs
  str = str.replace(/[-–—]+/g, ' ');

  // 7. Strip markdown bold / italic stars (**, *, ***)
  str = str.replace(/\*+/g, ' ');

  // 8. Strip markdown hashes, underscores, tildes, backticks
  str = str.replace(/[#_~`]+/g, ' ');

  // 9. Strip brackets, quotes, colons, semicolons, pipes, slashes, equals, plus
  str = str.replace(/[()[\]{}<>"\':;\\/|+\=\^]/g, ' ');

  // 10. Strip ALL commas (so TTS never vocalizes "comma" or "अल्पविराम")
  str = str.replace(/,/g, ' ');

  // 11. Remove stray repetitive symbol-words if generated by TTS/speech mistakes
  str = str.replace(/\b(star|asterisk)\b/gi, ' ');
  str = str.replace(/\b(hyphen|hypen|हाइफन|हाइफ़न)\b/gi, ' ');
  str = str.replace(/\b(comma|coma|कॉमा|अल्पविराम)\b/gi, ' ');

  // 12. Protect decimal numbers (e.g. 1.5, 84.0) while replacing other periods with Hindi viram
  const decimals = [];
  str = str.replace(/(\d+)\.(\d+)/g, (m) => {
    decimals.push(m);
    return `###DEC${decimals.length - 1}###`;
  });
  str = str.replace(/\.+/g, '। ');
  str = str.replace(/###DEC(\d+)###/g, (_, idx) => decimals[Number(idx)]);

  // 13. Collapse multiple spaces and trim
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

// Clean text for visual card display (strips raw markdown symbols like **bold**)
function cleanTextForDisplay(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
}

// Convert markdown to clean HTML for visual answer cards
function formatMarkdownForHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// Speak aloud (Text-to-Speech)
function speakAudio(text) {
  if (!appData.farmSettings.audioFeedback) return;
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'hi-IN';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Prefer natural Hindi voice if available in system
  try {
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    if (voices && voices.length > 0) {
      const hindiVoice = voices.find(v => (v.lang === 'hi-IN' || v.lang === 'hi_IN')) ||
                         voices.find(v => v.lang && v.lang.startsWith('hi'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
    }
  } catch (e) {
    // ignore
  }

  showAudioToast(cleanText);
  window.speechSynthesis.speak(utterance);
}

function showAudioToast(text) {
  const toast = document.getElementById('audioToast');
  const toastText = document.getElementById('audioToastText');
  if (toast && toastText) {
    toastText.innerText = cleanTextForDisplay(text);
    toast.classList.remove('hidden');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3800);
  }
}

// ===================================================================
// VOICE COMMAND PARSER (देसी भाषा समझना)
// ===================================================================

function parseHindiNumbers(text) {
  const map = {
    'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
    'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
    'साढ़े': 0.5, 'आधा': 0.5, 'डेढ़': 1.5, 'ढाई': 2.5
  };

  const numMatch = text.match(/(\d+(\.\d+)?)/);
  if (numMatch) return parseFloat(numMatch[1]);

  for (let [word, val] of Object.entries(map)) {
    if (text.includes(word)) {
      if (text.includes('साढ़े चार')) return 4.5;
      if (text.includes('साढ़े पांच')) return 5.5;
      if (text.includes('साढ़े छह')) return 6.5;
      if (text.includes('साढ़े सात')) return 7.5;
      if (text.includes('साढ़े आठ')) return 8.5;
      if (text.includes('डेढ़')) return 1.5;
      if (text.includes('ढाई')) return 2.5;
      if (text.includes('आधा')) return 0.5;
      return val;
    }
  }
  return null;
}

// Get Yesterday's date string "YYYY-MM-DD"
function getYesterdayDateKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Detect if speech input is a natural question/query
function isVoiceQuery(text) {
  const queryTriggers = [
    'कितना', 'कितने', 'कितनी', 'क्या', 'किस', 'किसने', 'किसका', 'किसकी', 'किसके',
    'कौन', 'कौनसा', 'कौनसी', 'कौनसे', 'कब', 'कहाँ',
    'सबसे ज्यादा', 'सबसे अधिक', 'सब से ज्यादा', 'सर्वश्रेष्ठ', 'टॉप', 'best', 'highest',
    'हिसाब', 'बिल', 'बकाया', 'उधार', 'उधारी', 'बाकी', 'बताओ', 'बताइए', 'दिखाओ', 'दिखाइए',
    'चेक', 'पूरा दूध', 'टोटल दूध', 'कुल दूध', 'सारे पशु', 'सभी पशु', 'सब पशु',
    'मिला के', 'मिलाकर', 'कुल बिक्री', 'कमाई', 'गल्ला', 'औसत', 'रिकॉर्ड',
    'kitna', 'kitne', 'kitni', 'kya', 'kis', 'kisne', 'kiska', 'kaun', 'kon', 'sabse',
    'total', 'hisab', 'batao', 'dikhao', 'record', 'avg', 'average', 'highest', 'bill', 'dues',
    'dudh gya', 'doodh gya', 'kitna gya', 'dudh bika', 'doodh bika', 'kal',
    'गाभिन', 'gabhin', 'गर्भवती', 'ग्याभिन', 'प्रेग्नेंट', 'pregnant',
    'दूध दे रही', 'dudh de rahi', 'doodh de rahi', 'दूध चालू', 'चालू पशु', 'सूखी', 'सूखा', 'ड्राई', 'dry',
    'डिलीवरी', 'ब्याएगी', 'ब्याने', 'बच्चा देगी', 'बच्चा कब', 'delivery', 'calving',
    'हीट', 'सीमन', 'गर्भाधान', 'एआई', 'semen',
    'आज का दिन', 'दिन कैसा', 'मौसम', 'आज कौन', 'तारीख', 'aaj ka din', 'kaisa h', 'kaisa hai', 'kon sa din', 'kaun sa din', 'konsa din', 'weather',
    'सलाह', 'डॉक्टर', 'उपाय', 'बीमारी', 'इलाज', 'दवा', 'बुखार', 'अफारा', 'दस्त', 'कीड़े', 'थनैल',
    'पिछले महीने', 'pichle mahine', 'pichla mahina', 'महीने पहले', 'mahine pehle', 'months ago', 'pehle',
    'चारा', 'खुराक', 'आहार',
    'मुनाफा', 'लाभ', 'प्रॉफिट', 'profit', 'खर्च', 'लागत', 'expense',
    'डाइट', 'राशन', 'diet', 'ration', 'पोषण',
    'बाजार भाव', 'कीमत', 'मूल्य', 'भाव', 'वैल्यू', 'valuation',
    'कुंडली', 'kundali', 'हेल्थ कार्ड', 'आईडी कार्ड',
    'रूटीन', 'routine', 'अलार्म', 'alarm', 'शेड्यूल',
    'शुद्धता', 'गारंटी', 'सर्टिफिकेट', 'पोस्टर', 'poster', 'qr', 'upi',
    'प्रो', 'pro', 'सब्सक्रिप्शन', 'subscription', 'रेफरल', 'referral', 'vip'
  ];
  return queryTriggers.some(t => text.includes(t));
}

// Parse query target month and year (उदा. "पिछले महीने", "3 महीने पहले", "सितंबर", "अगस्त", "इस महीने")
function parseQueryMonthYear(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1; // 1-12

  // 1. Relative "पिछले महीने" / "last month" / "pichle mahine"
  if (
    t.includes('पिछले महीने') || t.includes('पिछला महीना') || t.includes('पिछले माह') ||
    t.includes('पिछली माह') || t.includes('last month') || t.includes('pichle mahine') ||
    t.includes('pichla mahina') || t.includes('pichhle mahine')
  ) {
    let m = curMonth - 1;
    let y = curYear;
    if (m < 1) { m = 12; y--; }
    return {
      isPast: true,
      offset: 1,
      year: y,
      month: m,
      monthName: getHindiMonthName(m),
      label: `पिछले महीने (${getHindiMonthName(m)})`
    };
  }

  // 2. Relative "N महीने पहले" (उदा. "3 महीने पहले", "दो महीने पहले", "3 months ago")
  const hindiNumMap = {
    'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
    'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
    'ग्यारह': 11, 'बारह': 12
  };
  const agoMatch = t.match(/(\d+|एक|दो|तीन|चार|पांच|पाँच|छह|छः|सात|आठ|नौ|दस)\s*(?:महीने|महीना|माह|mahine|mahina|months?)\s*(?:पहले|pehle|ago)/i);
  if (agoMatch) {
    let n = parseInt(agoMatch[1], 10);
    if (isNaN(n)) n = hindiNumMap[agoMatch[1]] || 1;
    if (n >= 1 && n <= 24) {
      let m = curMonth - n;
      let y = curYear;
      while (m < 1) {
        m += 12;
        y--;
      }
      return {
        isPast: true,
        offset: n,
        year: y,
        month: m,
        monthName: getHindiMonthName(m),
        label: `${n} महीने पहले (${getHindiMonthName(m)} ${y})`
      };
    }
  }

  // 3. Named Months (उदा. "सितंबर में", "अगस्त", "जुलाई का हिसाब", "september")
  const MONTH_NAMES_MAP = [
    { m: 1, names: ['जनवरी', 'january', 'jan'] },
    { m: 2, names: ['फरवरी', 'फ़रवरी', 'february', 'feb'] },
    { m: 3, names: ['मार्च', 'march', 'mar'] },
    { m: 4, names: ['अप्रैल', 'april', 'apr'] },
    { m: 5, names: ['मई', 'may'] },
    { m: 6, names: ['जून', 'june', 'jun'] },
    { m: 7, names: ['जुलाई', 'july', 'jul'] },
    { m: 8, names: ['अगस्त', 'august', 'aug'] },
    { m: 9, names: ['सितंबर', 'सितम्बर', 'september', 'sep'] },
    { m: 10, names: ['अक्टूबर', 'अक्टुबर', 'october', 'oct'] },
    { m: 11, names: ['नवंबर', 'नवम्बर', 'november', 'nov'] },
    { m: 12, names: ['दिसंबर', 'दिसम्बर', 'december', 'dec'] }
  ];

  for (let item of MONTH_NAMES_MAP) {
    if (item.names.some(name => t.includes(name))) {
      let y = curYear;
      if (item.m > curMonth) {
        y = curYear - 1;
      }
      const isPast = (y < curYear || item.m < curMonth);
      const yrLabel = y !== curYear ? ` ${y}` : '';
      return {
        isPast: isPast,
        offset: isPast ? (curMonth - item.m + (curYear - y) * 12) : 0,
        year: y,
        month: item.m,
        monthName: getHindiMonthName(item.m),
        label: `${getHindiMonthName(item.m)}${yrLabel} माह`
      };
    }
  }

  // 4. Current Month query (उदा. "इस महीने", "इस माह", "इस महीने में")
  if (t.includes('महीने') || t.includes('महीना') || t.includes('माह') || t.includes('mahine') || t.includes('month')) {
    return {
      isPast: false,
      offset: 0,
      year: curYear,
      month: curMonth,
      monthName: getHindiMonthName(curMonth),
      label: `इस महीने (${getHindiMonthName(curMonth)})`
    };
  }

  return null;
}

// Dynamic Today's Cattle Health & Seasonal Weather Care Bulletin
function getTodayCattleBulletin() {
  const dayNames = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const now = new Date();
  const dayName = dayNames[now.getDay()];
  const dateStr = `${now.getDate()} ${getHindiMonthName(now.getMonth() + 1)} ${now.getFullYear()}`;

  const totalAnimals = appData.animals ? appData.animals.length : 5;
  const milkingCount = appData.animals ? appData.animals.filter(a => a.status === 'milking').length : 3;
  const pregnantCount = appData.animals ? appData.animals.filter(a => a.status === 'pregnant' || getActiveBreedingRecord(a.id) !== null).length : 2;

  let advice = `🌤️ **आज का दिन व पशु स्वास्थ्य बुलेटिन**\n\n`;
  advice += `📅 **दिन व तारीख:** आज **${dayName}, ${dateStr}** है।\n\n`;
  advice += `🍂 **मौसम व मौसमी पशु देखभाल (गुलाबी ठंड / शरद ऋतु):**\n`;
  advice += `1. **रात की ठंडी हवा से बचाव:** रात का तापमान गिर रहा है। पशुओं को रात में खुले में न बांधें, शेड में सूखा पुआल या भूसा बिछाएं ताकि थन में ठंड और नमी न लगे।\n`;
  advice += `2. **थनैल (Mastitis) से सुरक्षा:** दूध निकालने के तुरंत बाद थनों को हल्के गुनगुने पानी और लाल दवा (पोटाश) से साफ करें। दुहने के 20 मिनट तक पशु को बैठने न दें ताकि थन के छिद्र बंद हो सकें।\n`;
  advice += `3. **संतुलित आहार व मिनरल मिक्सचर:** मौसम बदलने पर पाचन सही रखने हेतु रोज प्रति पशु 50 ग्राम मिनरल मिक्सचर और 30 ग्राम मीठा सोडा चारे में दें। 70% हरा चारा और 30% सूखा भूसा मिलाकर खिलाएं।\n`;
  advice += `4. **पीने का पानी:** सुबह-सुबह बहुत ठंडा पानी न दें, ताजा बोरवेल का या धूप में रखा पानी पिलाएं।\n\n`;
  advice += `🐄 **फार्म की स्थिति:** फार्म में कुल ${totalAnimals} पशु हैं (${milkingCount} चालू दूध, ${pregnantCount} गाभिन/सीमन)। सभी पशु स्वस्थ व सामान्य हैं। आज का दिन पशुओं के लिए उत्तम है।`;

  const audioSummary = `आज ${dayName}, ${now.getDate()} ${getHindiMonthName(now.getMonth() + 1)} है। हल्की ठंड शुरू हो चुकी है। रात को पशुओं को ठंडी हवा से बचाएं और सूखा बिछावन डालें ताकि थनैल न हो। साथ ही रोज 50 ग्राम मिनरल मिक्सचर दें। आपके सभी पशु स्वस्थ हैं।`;

  return { reply: advice, audio: audioSummary };
}

// Live Cattle Register Status & Breeding Countdown Summary
function getCattleStatusSummary(query) {
  const q = query ? query.toLowerCase() : '';

  // 1. Calving / Delivery / गाभिन होने वाली
  const isCalving = (
    q.includes('ब्याएगी') || q.includes('ब्याने') || q.includes('डिलीवरी') ||
    q.includes('प्रसव') || q.includes('बच्चा देगी') || q.includes('बच्चा कब') ||
    q.includes('delivery') || q.includes('calving') || q.includes('गाभिन होने वाली') ||
    q.includes('gabhin hone wali')
  );

  // 2. Pregnant animals query
  const isGabhin = (
    q.includes('गाभिन') || q.includes('गर्भवती') || q.includes('ग्याभिन') ||
    q.includes('gabhin') || q.includes('pregnant')
  );

  // 3. Milking animals query
  const isMilking = (
    q.includes('दूध दे रही') || q.includes('दूध दे रहे') || q.includes('दूध चालू') ||
    q.includes('चालू पशु') || q.includes('dudh de rahi') || q.includes('doodh de rahi') ||
    q.includes('दूध देने वाली')
  );

  // 4. Dry animals query
  const isDry = (
    q.includes('सूखी') || q.includes('सूखा') || q.includes('ड्राई') || q.includes('dry')
  );

  // 5. Heat / AI check query
  const isHeat = (
    q.includes('हीट') || q.includes('सीमन') || q.includes('गर्भाधान') ||
    q.includes('heat') || q.includes('semen')
  );

  if (isCalving) {
    const list = [];
    appData.animals.forEach(a => {
      const br = getActiveBreedingRecord(a.id);
      if (a.status === 'pregnant' || br !== null) {
        if (br) {
          const tl = getBreedingTimeline(br, a);
          list.push({ animal: a, br, tl });
        } else {
          list.push({ animal: a, br: null, tl: null });
        }
      }
    });

    list.sort((x, y) => {
      const dx = x.tl ? x.tl.daysRemaining : 999;
      const dy = y.tl ? y.tl.daysRemaining : 999;
      return dx - dy;
    });

    let text = `🍼 **संभावित प्रसव व डिलीवरी स्थिति:**\n\n`;
    if (list.length === 0) {
      text += `फार्म में अभी कोई भी पशु गाभिन या डिलीवरी सूची में दर्ज नहीं है।`;
    } else {
      list.forEach((item, idx) => {
        if (item.tl) {
          text += `${idx + 1}. **${item.animal.name}:**\n   - अवस्था: ${item.tl.stageName}\n   - संभावित डिलीवरी: **${formatHindiDate(item.tl.calvingDate)}** (${item.tl.daysRemaining > 0 ? `${item.tl.daysRemaining} दिन बाकी` : 'डिलीवरी का समय पूरा'})\n   - सीमन: ${item.br.semenDetails} (${item.br.doctorName})\n\n`;
        } else {
          text += `${idx + 1}. **${item.animal.name}:** गाभिन अवस्था में दर्ज है (सीमन रिकॉर्ड अपडेट करें)।\n\n`;
        }
      });
      const dryList = appData.animals.filter(a => a.status === 'dry');
      if (dryList.length > 0) {
        text += `💡 **तैयार पशु:** ${dryList.map(a => a.name).join(', ')} अभी ड्राई है और अगली हीट में सीमन लगवाने के लिए तैयार है।`;
      }
    }

    const first = list[0];
    const audio = first && first.tl 
      ? `सबसे पहले ${first.animal.name} की डिलीवरी ${formatHindiDate(first.tl.calvingDate)} को संभावित है और ${first.tl.daysRemaining} दिन बाकी हैं।`
      : 'फार्म में गौरी साहीवाल गाभिन है और डिलीवरी जनवरी में संभावित है।';

    return { title: '🍼 प्रसव व संभावित डिलीवरी स्थिति', text, audio, filter: 'pregnant' };
  }

  if (isGabhin) {
    const pregnantAnimals = appData.animals.filter(a => a.status === 'pregnant' || getActiveBreedingRecord(a.id) !== null);
    let text = `🤰 **गाभिन (गर्भवती) पशुओं की स्थिति:**\n\n`;
    if (pregnantAnimals.length === 0) {
      text += `फार्म में अभी कोई गाभिन पशु दर्ज नहीं है।`;
    } else {
      pregnantAnimals.forEach((a, i) => {
        const br = getActiveBreedingRecord(a.id);
        if (br) {
          const tl = getBreedingTimeline(br, a);
          text += `${i + 1}. **${a.name}:**\n   - अवस्था: ${tl.stageName}\n   - संभावित प्रसव: **${formatHindiDate(tl.calvingDate)}** (${tl.daysRemaining} दिन बाकी)\n   - सीमन: ${br.semenDetails} (${br.doctorName})\n\n`;
        } else {
          text += `${i + 1}. **${a.name}:** गाभिन अवस्था में है।\n\n`;
        }
      });
      const recentAi = appData.breedingRecords.filter(br => br.status === 'active' && !pregnantAnimals.some(a => a.id === br.animalId));
      if (recentAi.length > 0) {
        text += `🧬 **सीमन निगरानी:** `;
        recentAi.forEach(br => {
          const a = appData.animals.find(an => an.id === br.animalId);
          if (a) text += `${a.name} को ${br.aiDate} को सीमन लगा है (हीट/गर्भ जांच बाकी)। `;
        });
      }
    }
    const audio = 'फार्म में गौरी साहीवाल 6 माह 16 दिन की गाभिन है और लाली को 16 दिन पहले सीमन लगा है।';
    return { title: '🤰 गाभिन पशुओं की स्थिति', text, audio, filter: 'pregnant' };
  }

  if (isMilking) {
    const milkingAnimals = appData.animals.filter(a => a.status === 'milking');
    let text = `🥛 **दूध देने वाले पशु (कुल ${milkingAnimals.length} चालू हैं):**\n\n`;
    let totalEst = 0;
    milkingAnimals.forEach((a, i) => {
      totalEst += (a.expectedYield || 0);
      text += `${i + 1}. **${a.name}:** अनुमानित ${a.expectedYield || 0} लीटर/दिन (${a.breed})\n`;
    });
    totalEst = Math.round(totalEst * 10) / 10;
    text += `\nफार्म का कुल दैनिक दूध उत्पादन लगभग **${totalEst} लीटर** है।\n`;
    const nonMilking = appData.animals.filter(a => a.status !== 'milking');
    if (nonMilking.length > 0) {
      text += `\n🍂 *अन्य पशु:* ${nonMilking.map(a => `${a.name} (${a.status === 'pregnant' ? 'गाभिन' : 'ड्राई'})`).join(', ')}`;
    }
    const audio = `फार्म में ${milkingAnimals.map(a => a.name.split(' ')[0]).join(', ')}, कुल ${milkingAnimals.length} पशु अभी दूध दे रहे हैं।`;
    return { title: '🥛 दूध देने वाले पशु', text, audio, filter: 'milking' };
  }

  if (isDry) {
    const dryAnimals = appData.animals.filter(a => a.status === 'dry');
    let text = `🍂 **सूखे (ड्राई) पशुओं की स्थिति:**\n\n`;
    if (dryAnimals.length === 0) {
      text += `फार्म में अभी कोई भी पशु सूखा (ड्राई) नहीं है, सभी पशु चालू या गाभिन हैं।`;
    } else {
      dryAnimals.forEach((a, i) => {
        text += `${i + 1}. **${a.name}:** ${a.breed} (${a.type === 'cow' ? 'गाय' : 'भैंस'}) अभी दूध नहीं दे रही है (ड्राई अवस्था)।\n`;
      });
      text += `\n💡 **सुझाव:** ड्राई पशु को नियमित मिनरल मिक्सचर दें ताकि अगली हीट में समय पर सीमन लगाया जा सके।`;
    }
    const audio = dryAnimals.length > 0 ? `फार्म में ${dryAnimals[0].name} अभी ड्राई अवस्था में है।` : 'फार्म में कोई भी पशु अभी ड्राई नहीं है।';
    return { title: '🍂 सूखे (ड्राई) पशु', text, audio, filter: 'dry' };
  }

  if (isHeat) {
    let text = `🧬 **सीमन व हीट चेक स्थिति:**\n\n`;
    const activeBrs = appData.breedingRecords.filter(br => br.status === 'active');
    if (activeBrs.length === 0) {
      text += `फार्म में अभी कोई सक्रिय सीमन रिकॉर्ड दर्ज नहीं है।`;
    } else {
      activeBrs.forEach((br, i) => {
        const a = appData.animals.find(an => an.id === br.animalId);
        const tl = a ? getBreedingTimeline(br, a) : null;
        text += `${i + 1}. **${a ? a.name : 'पशु'}:**\n`;
        text += `   - सीमन तारीख: ${br.aiDate} (${br.semenDetails})\n`;
        text += `   - डॉक्टर: ${br.doctorName}\n`;
        if (tl) text += `   - स्थिति: ${tl.stageName}\n`;
        text += `\n`;
      });
    }
    const audio = 'लाली मुर्रा को 16 दिन पहले सीमन लगा है और 5 दिन बाद 21-दिन का हीट चेक होना है।';
    return { title: '🧬 सीमन व हीट चेक स्थिति', text, audio, filter: 'pregnant' };
  }

  return null;
}

// Comprehensive AI Veterinary Guidance Engine (Doctor & Advisor)
function getAiVeterinaryAdvice(query) {
  if (!query) return null;
  const q = query.toLowerCase();

  // 1. Check if asking about today's bulletin / day / date
  if (
    q.includes('आज का दिन') || q.includes('दिन कैसा') || q.includes('मौसम') ||
    q.includes('आज कौन') || q.includes('तारीख') || q.includes('aaj ka din') ||
    q.includes('din kaisa') || q.includes('kaisa h') || q.includes('kaisa hai') ||
    q.includes('kon sa din') || q.includes('kaun sa din') || q.includes('konsa din') ||
    q.includes('weather')
  ) {
    const bul = getTodayCattleBulletin();
    return { title: '🌤️ आज का दिन व पशु सलाह', text: bul.reply, audio: bul.audio };
  }

  // 2. Check if asking about Cattle Status / Breeding
  if (
    q.includes('गाभिन') || q.includes('gabhin') || q.includes('गर्भवती') ||
    q.includes('दूध दे रही') || q.includes('dudh de rahi') || q.includes('डिलीवरी') ||
    q.includes('ब्याएगी') || q.includes('बच्चा कब') || q.includes('calving') ||
    q.includes('सूखी') || q.includes('ड्राई') || q.includes('हीट')
  ) {
    if (q.includes('कौन') || q.includes('किस') || q.includes('कितनी') || q.includes('है') || q.includes('कब') || q.includes('kon') || q.includes('kaun')) {
      const statusRes = getCattleStatusSummary(q);
      if (statusRes) return statusRes;
    }
  }

  // 3. Veterinary Medical Topics Knowledge Base
  const KB_TOPICS = [
    {
      keys: ['दूध', 'फैट', 'snf', 'मलाई', 'गाढ़ा', 'fat', 'doodh', 'dudh', 'yield'],
      title: '🥛 दूध और फैट बढ़ाने के आसान देसी उपाय',
      audio: 'दूध और फैट बढ़ाने के लिए रोज 50 ग्राम मिनरल मिक्सचर और 30 ग्राम मीठा सोडा दें। प्रति ढाई लीटर दूध पर 1 किलो संतुलित दाना दें।',
      text: `🥛 **दूध और फैट बढ़ाने के आसान वैज्ञानिक व देसी उपाय:**\n\n1. **संतुलित दाना (Concentrate):** प्रति 2.5 लीटर दूध पर 1 किलो दाना (30% सरसों या बिनौला खल + 40% मक्का दलिया + 30% चोकर) दें।\n2. **मिनरल मिक्सचर:** रोजाना 50 ग्राम कीलेटेड (Chelated) मिनरल मिक्सचर चारे में मिलाकर दें। इससे 7-10 दिनों में फैट 0.5 से 1.0 तक बढ़ता है।\n3. **मीठा सोडा (Baking Soda):** रोज 30 ग्राम मीठा सोडा देने से रूमेन का pH सही रहता है, पाचन दुरुस्त होता है और दूध पतला नहीं पड़ता।\n4. **बाईपास फैट (Bypass Fat):** उच्च दूध देने वाले पशु को रोज 50-100 ग्राम बाईपास फैट दें।\n5. **साफ व ताजा पानी:** पशु को 24 घंटे साफ पानी उपलब्ध कराएं, क्योंकि दूध में 87% पानी होता है।`
    },
    {
      keys: ['गाभिन', 'गर्भवती', 'प्रेग्नेंट', 'gabhin', 'pregnant', 'ब्याने वाली', 'गर्भ'],
      title: '🤰 गाभिन पशु की विशेष देखभाल व आहार',
      audio: 'गाभिन पशु को ब्याने से दो महीने पहले ड्राई करें और अंतिम दो महीनों में दो किलो अतिरिक्त दाना, दलिया और मिनरल मिक्सचर दें।',
      text: `🤰 **गाभिन (Pregnant) पशु की वैज्ञानिक देखभाल:**\n\n1. **ड्राई पीरियड (दूध बंद करना):** ब्याने से 60 दिन (2 माह) पहले दूध निकालना पूरी तरह बंद कर दें ताकि थन को आराम मिले और आने वाला बछड़ा तंदुरुस्त हो।\n2. **अतिरिक्त पौष्टिक खुराक:** गर्भ के 7वें माह से 2-3 किलो अतिरिक्त दाना, गेहूं का दलिया व उबला बिनौला दें।\n3. **अंतिम 15 दिन:** अंतिम 15 दिनों में कैल्शियम जेल या गुड़-अजवाइन की खुराक दें ताकि प्रसव आसानी से हो और जेर समय पर गिर जाए।\n4. **सावधानी:** गाभिन पशु को फिसलने वाली जगह या भीड़ में न रखें, साफ व हवादार जगह पर रखें।`
    },
    {
      keys: ['सीमन', 'गर्भाधान', 'एआई', 'कृत्रिम', 'बुल', 'semen', 'ai', 'straw'],
      title: '🧬 पशु गर्भाधान (AI) व सीमन के जरूरी नियम',
      audio: 'गर्भाधान का AM-PM नियम याद रखें: सुबह बोले तो शाम को सीमन, और शाम को बोले तो अगली सुबह सीमन लगवाएं। सीमन के बाद 2 घंटे पशु को बैठने न दें।',
      text: `🧬 **पशु गर्भाधान (AI) के सुनहरे नियम (Golden Rules):**\n\n1. **AM-PM नियम:**\n   - यदि पशु **सुबह** हीट में आए, तो **शाम** को सीमन लगवाएं।\n   - यदि पशु **शाम** को हीट में आए, तो **अगली सुबह** सीमन लगवाएं।\n2. **सीमन के बाद देखभाल:** सीमन लगवाने के तुरंत बाद पशु को कम से कम 2 घंटे बैठने न दें और ठंडी छांव में रखें।\n3. **21 दिन बाद हीट चेक:** सीमन लगने के 18 से 24 दिन के बीच पशु पर विशेष नजर रखें कि वह दोबारा हीट में तो नहीं आ रहा।\n4. **60-90 दिन पर गर्भ जांच:** डॉक्टर से गर्भाशय जांच (PD Check) करवाकर गर्भ पक्का करें।`
    },
    {
      keys: ['हीट', 'मूक हीट', 'बोली', 'तार', 'डिस्चार्ज', 'heat', 'silent heat'],
      title: '🔥 गाय-भैंस की हीट के मुख्य लक्षण व पहचान',
      audio: 'हीट के मुख्य लक्षण हैं बार-बार रंभाना, बेचैनी और कांच जैसा पारदर्शी तार गिरना। भैंसों में मूक हीट होती है इसलिए सुबह शाम डिस्चार्ज पर नजर रखें।',
      text: `🔥 **हीट (मद) के मुख्य लक्षण व समय:**\n\n1. **पारदर्शी तार (Clear Discharge):** योनि से कांच जैसा साफ, पारदर्शी और लसलसा तार गिरना सबसे पक्का लक्षण है।\n2. **आवाज व बेचैनी:** बार-बार रंभाना, पूंछ उठाना और दूसरे पशुओं पर चढ़ना।\n3. **दूध में कमी:** दूध उत्पादन में अचानक गिरावट आना।\n💡 **भैंसों में मूक हीट (Silent Heat):** भैंसें अक्सर आवाज नहीं देतीं। सुबह-शाम पूंछ उठाकर डिस्चार्ज चेक करें और पेशाब की जगह पर लाली देखें।`
    },
    {
      keys: ['रिपीट', 'खाली', 'बार बार', 'फिरना', 'repeat', 'ferna'],
      title: '⚠️ बार-बार रिपीट होने के कारण व समाधान',
      audio: 'बार बार रिपीट होने पर डॉक्टर से गर्भाशय की जांच कराएं और संक्रमण का इलाज कराएं। साथ ही रोज मिनरल मिक्सचर दें।',
      text: `⚠️ **बार-बार रिपीट ब्रीडिंग (Repeat Breeding) का समाधान:**\n\n1. **गर्भाशय में संक्रमण (Infection):** यदि डिस्चार्ज मटमैला, सफेद या बदबूदार हो तो सीमन न लगाएं। पहले डॉक्टर से गर्भाशय की धुलाई व एंटीबायोटिक करवाएं।\n2. **खनिज लवणों की कमी:** रोज 50 ग्राम कीलेटेड मिनरल मिक्सचर लगातार 2 माह तक दें।\n3. **विटामिन A, D3, E:** प्रजनन क्षमता बढ़ाने हेतु विटामिन इंजेक्शन या टॉनिक दें।\n4. **सीमन का सही समय:** हीट शुरू होने के 12 से 18 घंटे के बीच ही सीमन लगवाएं।`
    },
    {
      keys: ['थनैल', 'मस्टाइटिस', 'सूजन', 'छीछड़े', 'थन', 'mastitis', 'thanail'],
      title: '🩺 थनैल (Mastitis) रोग के लक्षण व तुरंत उपचार',
      audio: 'थनैल में थन से खराब दूध निकालें, बर्फ से सिंकाई करें और लाल दवा से धोएं। तुरंत पशु डॉक्टर से एंटीबायोटिक लगवाएं।',
      text: `🩺 **थनैल (Mastitis) रोग का तुरंत प्राथमिक उपचार:**\n\n1. **लक्षण:** थन में सूजन, कड़ापन, छूने पर दर्द, दूध में छीछड़े, पीला पानी या खून आना।\n2. **तुरंत करें:**\n   - थन से सारा खराब दूध बार-बार पूरी तरह निकालें और दूर जमीन में गाड़ दें।\n   - **बर्फ से सिंकाई:** दिन में 3-4 बार बर्फ से सिंकाई करें (गर्म पानी बिल्कुल न लगाएं)।\n   - **लाल दवा:** 1:1000 पोटैशियम परमैंगनेट (लाल दवा) के हल्के गुलाबी पानी से थनों की धुलाई करें।\n   - **डॉक्टर संपर्क:** तुरंत पशु चिकित्सक से थन में चढ़ाने वाली ट्यूब (Intramammary) और एंटीबायोटिक इंजेक्शन लगवाएं।`
    },
    {
      keys: ['अफारा', 'पेट फूल', 'गैस', 'ब्लोट', 'bloat', 'afara', 'pet ful'],
      title: '💨 पेट फूलना (अफारा / Bloat) का आपातकालीन देसी इलाज',
      audio: 'अफारे में 50 ग्राम हींग, 250 ग्राम सरसों का तेल और 50 ग्राम अदरक का रस मिलाकर नाल से पिलाएं। पशु को लगातार टहलाएं, बैठने न दें।',
      text: `💨 **पेट फूलना (अफारा / Bloat) का तुरंत घरेलू उपचार:**\n\n1. **आपातकालीन देसी नुस्खा:**\n   - 50 ग्राम हींग + 250 ग्राम कच्चा सरसों का तेल + 50 ग्राम अदरक का रस अच्छी तरह मिलाकर तुरंत नाल से पिलाएं।\n2. **दवा:** बाजार से Bloatosil या Tympol सिरप 100ml तुरंत पिलाएं।\n3. **पशु को टहलाएं:** पशु को लगातार धीरे-धीरे चलाएं, किसी भी हालत में बैठने न दें।\n4. **मुंह खुला रखें:** मुंह में लकड़ी का छोटा टुकड़ा बांधें ताकि डकार आए और गैस बाहर निकले। यदि सांस फूलने लगे तो तुरंत डॉक्टर को बुलाएं।`
    },
    {
      keys: ['दस्त', 'पेचिश', 'पतला गोबर', 'लूज मोशन', 'dast', 'scours', 'diarrhea'],
      title: '💧 दस्त व पेचिश (पतला गोबर) का तुरंत उपचार',
      audio: 'दस्त होने पर ओआरएस घोल पिलाएं, बेल का चूर्ण और नेबुला पाउडर दें। अत्यधिक हरा चारा रोकें और सूखा भूसा दें।',
      text: `💧 **दस्त व पतला गोबर होने पर क्या करें:**\n\n1. **ORS व नमक-पानी:** डिहाइड्रेशन से बचाने हेतु 5 लीटर पानी में 50g नमक, 100g चीनी व नींबू मिलाकर दिन में 2-3 बार पिलाएं।\n2. **देसी नुस्खा:** 100 ग्राम बेल का गूदा या बेल पाउडर + 50 ग्राम मेथी पाउडर छाछ (मट्ठे) में मिलाकर दें।\n3. **दवा:** आयुर्वेदिक नेबुला पाउडर (Neblon) या सल्फा डिमिडिन बोलस डॉक्टर की सलाह से दें।\n4. **आहार बदलाव:** 1-2 दिन तक ताजा रसीला हरा चारा रोकें और केवल सूखा भूसा दें।`
    },
    {
      keys: ['बुखार', 'तापमान', 'सुस्त', 'खाना छोड़', 'bukhar', 'fever'],
      title: '🌡️ पशु को बुखार व सुस्ती होने पर क्या करें',
      audio: 'पशु का सामान्य तापमान 101.5 डिग्री होता है। बुखार होने पर सिर पर ठंडा पानी डालें और डॉक्टर की सलाह से मेलोनेक्स या पैरासिटामोल दें।',
      text: `🌡️ **पशु का बुखार व तापमान नियंत्रण:**\n\n1. **सामान्य तापमान:**\n   - गाय का सामान्य तापमान: **101.5°F**\n   - भैंस का सामान्य तापमान: **100.5°F**\n2. **लक्षण:** कान ठंडे या बहुत गर्म होना, नाक का सूखा रहना, जुगाली बंद करना और सुस्त खड़े रहना।\n3. **प्राथमिक उपचार:**\n   - सिर और माथे पर ताजा पानी डालें।\n   - मेलोक्सीकैम + पैरासिटामोल बोलस (Melonex Plus) चारे या गुड़ में दें।\n   - तुरंत डॉक्टर से खून की जांच करवाएं कि कहीं सर्रा या टिक्स फीवर तो नहीं है।`
    },
    {
      keys: ['कीड़े', 'पेट के कीड़े', 'डीवर्मिंग', 'कीड़े की दवा', 'deworming', 'kide'],
      title: '🪱 पेट के कीड़े (Deworming) का सही कैलेंडर व दवा',
      audio: 'हर तीन महीने में एक बार सुबह खाली पेट कीड़े की दवा दें। गाभिन पशु को केवल फेनबेंडाजोल दवा ही दें।',
      text: `🪱 **पेट के कीड़े (Deworming) का सही तरीका:**\n\n1. **समय:** हर 3 महीने (मौसम बदलने पर) सुबह खाली पेट दवा दें। दवा देने के 2 घंटे बाद ही चारा दें।\n2. **दवा का चुनाव:**\n   - **गाभिन पशु के लिए सुरक्षित:** फेनबेंडाजोल (Fenbendazole 3g Bolus / Panacur).\n   - **खाली पशु के लिए:** एल्बेंडाजोल (Albendazole) या आइवरमेक्टिन (Ivermectin).\n3. **लाभ:** कीड़े खत्म होने से पशु का दूध 10-15% बढ़ता है और चारे का पूरा पोषण शरीर को लगता है।`
    },
    {
      keys: ['चिचड़ी', 'जूं', 'पिस्सू', 'किलनी', 'ticks', 'chichdi', 'lice'],
      title: '🕷️ चिचड़ी, जूं व किलनी से बचाव व दवा',
      audio: 'चिचड़ी हटाने के लिए ब्यूटॉक्स दवा 2 मिलीलीटर प्रति लीटर पानी में घोलकर शरीर पर लगाएं। पशु को चाटने न दें।',
      text: `🕷️ **चिचड़ी (Ticks) व बाह्य परजीवी नियंत्रण:**\n\n1. **दवा का लेप:** ब्यूटॉक्स (Butox) या एमिट्राज (Taktic) 2ml प्रति 1 लीटर पानी में घोलकर पशु के शरीर पर लगाएं।\n2. **सावधानी:** दवा लगाने के 1 घंटे तक पशु को चाटने न दें। आंख व मुंह से दूर रखें।\n3. **बाड़े की सफाई:** चिचड़ी दीवारों की दरारों में अंडे देती है, इसलिए फर्श व दीवारों पर भी स्प्रे करें।\n4. **देसी उपाय:** 1 लीटर नीम का तेल + 50ml कपूर का तेल मिलाकर लगाना भी बहुत असरदार है।`
    },
    {
      keys: ['टीका', 'वैक्सीन', 'टीकाकरण', 'खुरपका', 'गलघोंटू', 'vaccine', 'fmd', 'hs'],
      title: '💉 पशु टीकाकरण (Vaccination) वार्षिक कैलेंडर',
      audio: 'खुरपका-मुंहपका का टीका साल में दो बार मई और नवंबर में लगाएं। गलघोंटू का टीका बारिश शुरू होने से पहले मई-जून में लगवाएं।',
      text: `💉 **सरकारी व वैज्ञानिक पशु टीकाकरण कैलेंडर:**\n\n1. **FMD (खुरपका-मुंहपका):** साल में दो बार — मई-जून और नवंबर-दिसंबर।\n2. **HS (गलघोंटू):** मानसून शुरू होने से पहले — मई-जून।\n3. **BQ (लंगड़ा बुखार):** मानसून से ठीक पहले — मई-जून।\n4. **लंपी स्किन (Lumpy Skin):** गोट पॉक्स वैक्सीन साल में एक बार।\n💡 *नोट:* टीका हमेशा स्वस्थ पशु को ही लगाएं और टीका लगाने के बाद 2 दिन हल्का बुखार आना सामान्य है।`
    },
    {
      keys: ['चारा', 'खुराक', 'आहार', 'साइलेज', 'भूसा', 'feed', 'fodder', 'chara', 'ration'],
      title: '🌾 दुधारू पशु का आदर्श दैनिक आहार (Ration Chart)',
      audio: 'प्रतिदिन सत्तर प्रतिशत हरा चारा और तीस प्रतिशत सूखा भूसा दें। प्रति ढाई लीटर दूध पर एक किलो दाना और पचास ग्राम मिनरल मिक्सचर जरूर दें।',
      text: `🌾 **दुधारू पशु का आदर्श दैनिक भोजन अनुपात:**\n\n1. **सूखा भूसा:** 4 से 6 किलो प्रति दिन।\n2. **हरा चारा (बरसीम/ज्वार/मक्का):** 15 से 25 किलो प्रति दिन (चारे में 70% हरा + 30% सूखा भूसा मिलाएं)।\n3. **दाना मिश्रण:**\n   - शरीर की देखभाल हेतु: 1.5 किलो दाना।\n   - दूध उत्पादन हेतु: प्रति 2.5 लीटर दूध पर 1.0 किलो अतिरिक्त दाना।\n4. **खनिज व लवण:** 50 ग्राम मिनरल मिक्सचर + 30 ग्राम साधारण नमक + 30 ग्राम मीठा सोडा प्रतिदिन।`
    },
    {
      keys: ['जेर', 'प्लेसेंटा', 'jer', 'placenta', 'rop'],
      title: '⚠️ ब्याने के बाद जेर न गिरने पर प्राथमिक उपाय',
      audio: 'ब्याने के बाद छह से आठ घंटे तक जेर को हाथ से न खींचें। गुड़, सोंठ और अजवाइन का काढ़ा दें या रिप्लेन्टा सिरप पिलाएं।',
      text: `⚠️ **ब्याने के बाद जेर (Placenta) न गिरने पर क्या करें:**\n\n1. **जबरदस्ती न खींचें:** ब्याने के 6-8 घंटे तक जेर को हाथ से बिल्कुल न खींचें, इससे गर्भाशय छिल सकता है और खून बह सकता है।\n2. **देसी काढ़ा:** 500 ग्राम गुड़ + 50 ग्राम सोंठ + 50 ग्राम अजवाइन + 25 ग्राम हल्दी को 2 लीटर पानी में उबालकर गुनगुना पिलाएं।\n3. **दवा:** रिप्लेन्टा (Replanta) या एक्साबोल (Exabol) सिरप 200ml पिलाएं।\n4. **डॉक्टर:** यदि 10-12 घंटे तक जेर न गिरे तो तुरंत पशु चिकित्सक से सुरक्षित तरीके से निकलवाएं।`
    },
    {
      keys: ['कैल्शियम', 'मिल्क फीवर', 'बैठ जाना', 'calcium', 'milk fever'],
      title: '🦴 कैल्शियम की कमी व मिल्क फीवर (Downer Cow) का इलाज',
      audio: 'ब्याने के तुरंत बाद पशु बैठ जाए और गर्दन मोड़ ले तो यह मिल्क फीवर है। तुरंत डॉक्टर से नस में कैल्शियम चढ़वाएं।',
      text: `🦴 **मिल्क फीवर (Milk Fever) व कैल्शियम की कमी:**\n\n1. **लक्षण:** ब्याने के 24-48 घंटे के भीतर पशु अचानक बैठ जाता है, उठ नहीं पाता, गर्दन मोड़कर पेट की तरफ रख लेता है और शरीर ठंडा पड़ने लगता है।\n2. **आपातकाल:** यह तुरंत जानलेवा हो सकता है। बिना समय गंवाए पशु चिकित्सक से Calborol या CBG नस (IV) में चढ़वाएं।\n3. **बचाव:** ब्याने से 15 दिन पहले और ब्याने के 3 दिन बाद तक रोज 100ml ओरल कैल्शियम जेल पिलाएं।`
    }
  ];

  for (let topic of KB_TOPICS) {
    if (topic.keys.some(k => q.includes(k))) {
      return { title: topic.title, text: topic.text, audio: topic.audio };
    }
  }

  // Fallback smart advisor
  const fallbackText = `💡 **पशु मित्र AI डॉक्टर की सलाह:**\n\nआपके सवाल *" ${query} "* के लिए:\n1. **स्वच्छता व आवास:** पशु को हमेशा साफ, सूखे और हवादार शेड में रखें। फर्श पर सूखा बिछावन रखें।\n2. **दैनिक पोषण:** रोज प्रति पशु 50 ग्राम मिनरल मिक्सचर, 30 ग्राम नमक और 30 ग्राम मीठा सोडा चारे में मिलाकर दें।\n3. **पानी:** 24 घंटे साफ व ताजा पीने का पानी उपलब्ध कराएं।\n4. **डॉक्टर परामर्श:** यदि पशु को बुखार है, चारा नहीं खा रहा है या जुगाली बंद है, तो तुरंत नजदीकी पशु चिकित्सालय या डॉक्टर से संपर्क करें।`;
  const fallbackAudio = `पशु को सूखा और हवादार जगह पर रखें और रोज 50 ग्राम मिनरल मिक्सचर दें। किसी गंभीर लक्षण पर तुरंत पशु डॉक्टर से संपर्क करें।`;
  return { title: '💡 पशु मित्र सलाह', text: fallbackText, audio: fallbackAudio };
}


// Extract day range like "1 se 28", "1 से 28 तारीख", "1 to 28"
function extractDayRange(text) {
  if (!text) return null;
  // Normalize devanagari digits: ०-९
  const normalized = text.replace(/[\u0966-\u096F]/g, d => d.charCodeAt(0) - 0x0966);
  const match = normalized.match(/(\d{1,2})\s*(?:तारीख\s*)?(?:से|to|se|-)\s*(\d{1,2})/i);
  if (match) {
    const s = parseInt(match[1], 10);
    const e = parseInt(match[2], 10);
    if (s >= 1 && e <= 31 && s <= e) {
      return { startDay: s, endDay: e };
    }
  }
  return null;
}

// Detect explicit shift in voice commands (उदा. "शाम का", "सुबह का", "shaam", "subah")
function detectShiftInText(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (
    t.includes('शाम') || t.includes('सांझ') || t.includes('संझा') ||
    t.includes('shaam') || t.includes('sham') || t.includes('evening') || t.includes('sanjh')
  ) {
    return 'evening';
  }
  if (
    t.includes('सुबह') || t.includes('सवेरे') || t.includes('तड़के') || t.includes('भोर') ||
    t.includes('subah') || t.includes('subha') || t.includes('morning') || t.includes('savere')
  ) {
    return 'morning';
  }
  return null;
}

function findAnimalFuzzy(text) {
  const t = text.toLowerCase();
  for (let animal of appData.animals) {
    const rawName = animal.name.toLowerCase();
    const cleanName = rawName.split(' ')[0].replace(/[^a-z\u0900-\u097F]/gi, '');
    if (t.includes(cleanName) || t.includes(rawName)) return animal;
    // लाली / ललाई / लालई / ललई
    if (cleanName.includes('लाली') && (
      t.includes('ललाई') || t.includes('लालई') || t.includes('ललई') ||
      t.includes('लालि') || t.includes('लली') || t.includes('लाली') ||
      t.includes('lali') || t.includes('laali') || t.includes('lalai') || t.includes('lallai') ||
      t.includes('मुर्रा') || t.includes('murra')
    )) return animal;
    // भूरी / भूरिया
    if (cleanName.includes('भूरी') && (
      t.includes('भूरी') || t.includes('भुरि') || t.includes('भूरिया') ||
      t.includes('bhuri') || t.includes('bhoori') || t.includes('bhuriya') ||
      t.includes('गिर') || t.includes('gir')
    )) return animal;
    // कजरी / कजरा
    if (cleanName.includes('कजरी') && (
      t.includes('कजरी') || t.includes('कजरि') || t.includes('कजरा') ||
      t.includes('kajri') || t.includes('kajari') || t.includes('देसी')
    )) return animal;
    // गौरी
    if (cleanName.includes('गौरी') && (
      t.includes('गौरी') || t.includes('गौरि') ||
      t.includes('gauri') || t.includes('gouri') ||
      t.includes('साहीवाल') || t.includes('sahiwal')
    )) return animal;
    // रानी
    if (cleanName.includes('रानी') && (
      t.includes('रानी') || t.includes('रानि') ||
      t.includes('rani') || t.includes('hf') || t.includes('एचएफ')
    )) return animal;
  }
  return null;
}

function findCustomerFuzzy(text) {
  const t = text.toLowerCase();
  for (let cust of appData.customers) {
    const rawName = cust.name.toLowerCase();
    const cleanName = rawName.split(' ')[0].replace(/[^a-z\u0900-\u097F]/gi, '');
    if (t.includes(cleanName) || t.includes(rawName)) return cust;
    // शर्मा जी
    if (cleanName.includes('शर्मा') && (
      t.includes('शर्मा') || t.includes('सरमा') ||
      t.includes('sharma') || t.includes('sarma') ||
      t.includes('किराना') || t.includes('kirana')
    )) return cust;
    // वर्मा मास्टर जी
    if (cleanName.includes('वर्मा') && (
      t.includes('वर्मा') || t.includes('वारमा') ||
      t.includes('verma') || t.includes('varma') ||
      t.includes('मास्टर') || t.includes('master')
    )) return cust;
    // रमेश जी
    if (cleanName.includes('रमेश') && (
      t.includes('रमेश') || t.includes('रमेस') ||
      t.includes('ramesh') || t.includes('rames')
    )) return cust;
    // गुप्ता जी
    if (cleanName.includes('गुप्ता') && (
      t.includes('गुप्ता') || t.includes('गुपता') ||
      t.includes('gupta')
    )) return cust;
  }
  return null;
}

function showAiVoiceReply(title, message) {
  const card = document.getElementById('aiVoiceReplyCard');
  const titleEl = document.getElementById('aiVoiceReplyTitle');
  const textEl = document.getElementById('aiVoiceReplyText');
  if (card && textEl) {
    if (titleEl) titleEl.innerText = title || '🤖 AI मुंशी का जवाब';
    textEl.innerHTML = formatMarkdownForHtml(message);
    card.classList.remove('hidden');
  }
  const statusEl = document.getElementById('voiceStatus');
  if (statusEl) statusEl.innerText = title || '🤖 AI मुंशी का जवाब:';
  const resultEl = document.getElementById('voiceResult');
  if (resultEl) resultEl.innerText = cleanTextForDisplay(message);

  showAudioToast(message);
  speakAudio(message);
}

// SMART DAIRY AI VOICE QUERY ENGINE (स्मार्ट डेयरी AI मुंशी)
// SMART DAIRY AI VOICE QUERY ENGINE (स्मार्ट डेयरी AI मुंशी)
function handleDairyAiVoiceQuery(text, rawText) {
  const now = new Date();
  const isYesterday = text.includes('कल') || text.includes('बीते दिन') || text.includes('yesterday') || text.includes('kal');
  const targetDate = isYesterday ? getYesterdayDateKey() : currentDateKey;
  const dateLabel = isYesterday ? 'कल' : 'आज';

  const queryMonth = parseQueryMonthYear(text);

  const matchedAnimal = findAnimalFuzzy(text);
  const matchedCust = findCustomerFuzzy(text);
  const dateRange = extractDayRange(text);

  // ===================================================================
  // 0.0 PRO SUBSCRIPTION & REFERRAL QUERY (Priority 0.0)
  // उदा. "प्रो प्लान क्या है", "रेफरल कोड बताओ", "सब्सक्रिप्शन कैसे लें"
  // ===================================================================
  if (text.includes('प्रो') || text.includes('pro') || text.includes('सब्सक्रिप्शन') || text.includes('रेफरल') || text.includes('referral') || text.includes('vip')) {
    openProSubscriptionModal();
    const isPro = isProMember();
    const daysLeft = getProDaysRemaining();
    const myCode = appData.farmSettings.referralCode || 'DM-KRISHNA78';
    let reply = '';
    if (isPro) {
      reply = `👑 आप डेयरी मित्र प्रो VIP सदस्य हैं! आपके पास अभी ${daysLeft} दिन की वैद्यता शेष है। किसी भी मित्र को अपना रेफरल कोड ${myCode} शेयर करके आप +30 दिन (1 महीना) मुफ़्त और बढ़ा सकते हैं।`;
    } else {
      reply = `डेयरी मित्र प्रो व रेफरल प्लान खुला है। अपना रेफरल कोड ${myCode} किसी भी 1 मित्र को शेयर करें और तुरंत पाएँ 1 महीना प्रो बिल्कुल मुफ़्त!`;
    }
    showAiVoiceReply('👑 डेयरी मित्र प्रो व रेफरल', reply);
    return true;
  }

  // ===================================================================
  // 0. TODAY'S CATTLE BULLETIN & WEATHER CARE QUERY (Priority 0)
  // उदा. "आज का दिन पशु लोगों के लिए कैसा है", "आज कौन सा दिन है", "मौसम के अनुसार सलाह"
  // ===================================================================
  const isDailyBulletinQuery = (
    text.includes('आज का दिन') || text.includes('दिन कैसा') || text.includes('मौसम') ||
    text.includes('आज कौन') || text.includes('तारीख') || text.includes('aaj ka din') ||
    text.includes('din kaisa') || text.includes('kaisa h') || text.includes('kaisa hai') ||
    text.includes('kon sa din') || text.includes('kaun sa din') || text.includes('konsa din') ||
    text.includes('weather')
  ) && !matchedCust && !matchedAnimal;

  if (isDailyBulletinQuery) {
    const bul = getTodayCattleBulletin();
    showAiVoiceReply('🌤️ आज का दिन व पशु सलाह', bul.reply);
    return true;
  }

  // ===================================================================
  // 0.5 CATTLE STATUS & BREEDING INQUIRIES (Priority 0.5)
  // उदा. "कौन सी पशु गाभिन है", "कौन कौन दूध दे रही है", "कौन सी गाभिन होने वाली है", "किसकी डिलीवरी कब है"
  // ===================================================================
  if (!matchedCust && !matchedAnimal) {
    const statusResult = getCattleStatusSummary(text);
    if (statusResult) {
      if (statusResult.filter) {
        switchTab('viewCattle');
        activeFilter = statusResult.filter;
        document.querySelectorAll('.filter-pill').forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-filter') === statusResult.filter);
        });
        renderCattleRegister();
      }
      showAiVoiceReply(statusResult.title, statusResult.text);
      return true;
    }
  }

  // ===================================================================
  // 0.8 GENERAL VETERINARY / DOCTOR QUERIES (Priority 0.8)
  // उदा. "थनैल का क्या उपाय है", "फैट कैसे बढ़ाएं", "पेट फूल गया है क्या करें", "कीड़े की दवा कब दें"
  // ===================================================================
  const isDoctorQuery = (
    text.includes('इलाज') || text.includes('उपाय') || text.includes('दवा') ||
    text.includes('बीमार') || text.includes('रोग') || text.includes('लक्षण') ||
    text.includes('थनैल') || text.includes('अफारा') || text.includes('पेट फूल') ||
    text.includes('दस्त') || text.includes('बुखार') || text.includes('कीड़े') ||
    text.includes('टीका') || text.includes('चिचड़ी') || text.includes('खुराक') ||
    text.includes('चारा') || text.includes('कैसे बढ़ाएं') || text.includes('मिल्क फीवर') ||
    text.includes('जेर') || text.includes('doctor') || text.includes('salah')
  ) && !matchedCust && !matchedAnimal;

  if (isDoctorQuery) {
    const docRes = getAiVeterinaryAdvice(text);
    if (docRes) {
      switchTab('viewDoctor');
      const inEl = document.getElementById('aiQuestionInput');
      if (inEl) inEl.value = rawText || text;
      const bodyEl = document.getElementById('aiAnswerBody');
      const cardEl = document.getElementById('aiAnswerCard');
      if (bodyEl && cardEl) {
        bodyEl.innerHTML = formatMarkdownForHtml(docRes.text);
        cardEl.classList.remove('hidden');
      }
      showAiVoiceReply(docRes.title, docRes.text);
      return true;
    }
  }

  // ===================================================================
  // 0.9 TRENDING FEATURES VOICE QUERIES (Priority 0.9)
  // उदा. "आज का मुनाफा कितना हुआ", "डाइट प्लान", "बाजार भाव", "पशु कुंडली", "रूटीन अलार्म", "शुद्धता पोस्टर"
  // ===================================================================
  // 1. Daily Profit & Expenses
  if (text.includes('मुनाफा') || text.includes('लाभ') || text.includes('प्रॉफिट') || text.includes('profit') || text.includes('दैनिक खर्च') || text.includes('आज का खर्च')) {
    const prof = calculateDailyProfit(currentDateKey);
    openExpenseProfitModal(currentDateKey);
    const reply = `आज कुल दूध बिक्री ₹${prof.revenue} हुई है और कुल पशु खर्च ₹${prof.totalExpenses} रहा। आज का शुद्ध दैनिक मुनाफा ₹${prof.netProfit} है (1 लीटर दूध लागत ₹${prof.costPerLitre.toFixed(1)})।`;
    showAiVoiceReply('💰 आज का शुद्ध मुनाफा व खर्च', reply);
    return true;
  }

  // 2. AI Pashu Poshan & Diet Plan
  if (text.includes('डाइट') || text.includes('राशन') || text.includes('diet') || text.includes('ration') || (text.includes('खुराक') && matchedAnimal)) {
    const targetA = matchedAnimal || appData.animals[0];
    openFeedOptimizerModal(targetA ? targetA.id : null);
    const ration = calculateFeedRation(targetA, targetA.type === 'buffalo' ? 500 : 420, targetA.expectedYield || 8, 'milking_peak');
    const reply = `${targetA.name} के लिए AI संतुलित आहार: ${ration.greenFodder} हरा चारा, ${ration.dryFodder} सूखा भूसा, ${ration.concentrate} दाना, ${ration.mineral} मिनरल और ${ration.water} पानी।`;
    showAiVoiceReply('🌾 AI संतुलित आहार चार्ट', reply);
    return true;
  }

  // 3. Animal Market Valuation
  if (text.includes('बाजार भाव') || text.includes('कीमत') || text.includes('मूल्य') || text.includes('valuation') || text.includes('भाव क्या')) {
    const targetA = matchedAnimal || appData.animals[0];
    openAnimalValuationModal(targetA ? targetA.id : null);
    const val = calculateAnimalMarketValue(targetA);
    const reply = `${targetA.name} का अनुमानित उचित बाजार भाव ₹${val.fair.toLocaleString('en-IN')} है (अनुमानित रेंज: ₹${val.low.toLocaleString('en-IN')} से ₹${val.high.toLocaleString('en-IN')})।`;
    showAiVoiceReply('🏷️ AI पशु बाजार भाव', reply);
    return true;
  }

  // 4. Digital Cattle Kundali
  if (text.includes('कुंडली') || text.includes('kundali') || text.includes('हेल्थ कार्ड') || text.includes('आईडी कार्ड')) {
    const targetA = matchedAnimal || appData.animals[0];
    openAnimalKundaliModal(targetA ? targetA.id : null);
    const reply = `${targetA.name} की डिजिटल पशु कुंडली व हेल्थ कार्ड स्क्रीन पर खोल दिया गया है। आप इसे WhatsApp पर भी शेयर कर सकते हैं।`;
    showAiVoiceReply('🪪 डिजिटल पशु कुंडली', reply);
    return true;
  }

  // 5. Smart Farm Routine & Alarms
  if (text.includes('रूटीन') || text.includes('routine') || text.includes('अलार्म') || text.includes('alarm') || text.includes('शेड्यूल')) {
    openFarmRoutineModal();
    triggerRoutineAlarm('morning_milking');
    const reply = `डेयरी फार्म का दैनिक रूटीन स्क्रीन पर उपलब्ध है। सुबह 5:00 बजे और शाम 4:30 बजे दोहन का मुख्य समय है।`;
    showAiVoiceReply('⏰ स्मार्ट फार्म रूटीन', reply);
    return true;
  }

  // 6. 100% Purity Poster
  if (text.includes('शुद्धता') || text.includes('सर्टिफिकेट') || text.includes('पोस्टर') || text.includes('स्टेटस')) {
    openPurityCertModal();
    const reply = `100% शुद्धता गारंटी स्टेटस पोस्टर तैयार है! आप इसे 1-क्लिक में WhatsApp स्टेटस पर शेयर कर सकते हैं।`;
    showAiVoiceReply('🥛 शुद्धता गारंटी पोस्टर', reply);
    return true;
  }

  // 7. Digital Pashu Mela / Cattle Sale Ad
  if (text.includes('पशु मेला') || text.includes('बिकाऊ') || text.includes('बेचना') || text.includes('बेचनी') || text.includes('pashu mela') || text.includes('mela') || text.includes('sell')) {
    const targetA = matchedAnimal || appData.animals[0];
    openPashuMelaModal(targetA ? targetA.id : null);
    const reply = `${targetA.name} का बिकाऊ विज्ञापन कार्ड खुल गया है। आप इसे 1-क्लिक में WhatsApp पर शेयर कर सकते हैं।`;
    showAiVoiceReply('🎪 डिजिटल पशु मेला', reply);
    return true;
  }

  // ===================================================================
  // 1. SPECIFIC CUSTOMER QUERY (Priority 1)
  // उदा. "शर्मा जी के यहाँ कल कितना दूध गया", "3 महीने पहले रमेश जी ने टोटल कितना दूध लिया"
  // ===================================================================
  if (matchedCust) {
    // 1A. Customer Date Range (उदा. "रमेश को 1 से 28 तक कितना दूध गया और कितना हिसाब हुआ")
    if (dateRange && !isYesterday) {
      const year = queryMonth ? queryMonth.year : now.getFullYear();
      const month = queryMonth ? queryMonth.month : (now.getMonth() + 1);
      const monthName = getHindiMonthName(month);
      let rangeLitres = 0;
      let deliveredCount = 0;
      let skippedCount = 0;

      for (let d = dateRange.startDay; d <= dateRange.endDay; d++) {
        const dKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const m = appData.dailyRecords[dKey]?.delivery?.morning?.[matchedCust.id];
        const e = appData.dailyRecords[dKey]?.delivery?.evening?.[matchedCust.id];
        const mQ = (m && m.status !== 'skipped') ? (parseFloat(m.litres) || 0) : 0;
        const eQ = (e && e.status !== 'skipped') ? (parseFloat(e.litres) || 0) : 0;
        const tot = Math.round((mQ + eQ) * 10) / 10;
        if (tot > 0) {
          rangeLitres += tot;
          deliveredCount++;
        } else if ((m && m.status === 'skipped') || (e && e.status === 'skipped')) {
          skippedCount++;
        }
      }
      rangeLitres = Math.round(rangeLitres * 10) / 10;
      const rangeBill = Math.round(rangeLitres * (matchedCust.rate || 60));
      let reply = `${dateRange.startDay} से ${dateRange.endDay} ${monthName} तक ${matchedCust.name} के यहाँ कुल ${rangeLitres.toFixed(1)} लीटर दूध गया है (${deliveredCount} दिन दूध लिया${skippedCount > 0 ? `, ${skippedCount} दिन नागा रहा` : ''})।`;
      reply += ` ₹${matchedCust.rate}/लीटर के भाव से इसका दूध बिल ₹${rangeBill.toLocaleString('en-IN')} बनता है।`;
      if (matchedCust.dues > 0) {
        reply += ` पिछला बकाया ₹${matchedCust.dues.toLocaleString('en-IN')} जोड़कर कुल शुद्ध हिसाब ₹${Math.round(rangeBill + matchedCust.dues).toLocaleString('en-IN')} होता है।`;
      }
      showAiVoiceReply(`📒 ${matchedCust.name} (${dateRange.startDay} से ${dateRange.endDay} तारीख)`, reply);
      return true;
    }

    // 1B. Customer Monthly / Past Months / Dues (उदा. "3 महीने पहले रमेश जी ने टोटल कितना दूध लिया था")
    const isMonthlyOrBill = (
      queryMonth !== null ||
      text.includes('महीने') || text.includes('महीना') || text.includes('mahine') ||
      text.includes('अभी तक') || text.includes('हिसाब') || 
      text.includes('बिल') || text.includes('बकाया') || 
      text.includes('उधार') || text.includes('उधारी') || 
      text.includes('टोटल हिसाब') || text.includes('पूरा हिसाब') ||
      text.includes('hisab') || text.includes('bill')
    );

    if (isMonthlyOrBill && !isYesterday) {
      const targetYear = queryMonth ? queryMonth.year : now.getFullYear();
      const targetMonth = queryMonth ? queryMonth.month : (now.getMonth() + 1);
      const targetLabel = queryMonth ? queryMonth.label : `इस महीने (${getHindiMonthName(now.getMonth() + 1)})`;

      const stats = getCustomerMonthlyStats(matchedCust.id, targetYear, targetMonth);
      
      let reply = '';
      if (queryMonth && queryMonth.isPast) {
        reply = `${targetLabel} में ${matchedCust.name} के यहाँ कुल ${stats.totalLitres.toFixed(1)} लीटर दूध गया था (${stats.deliveredDays} दिन दूध लिया${stats.skippedDays > 0 ? `, ${stats.skippedDays} दिन नागा रहा` : ', कोई नागा नहीं रहा'})।`;
        reply += ` ₹${matchedCust.rate}/लीटर के भाव से उस महीने का दूध बिल ₹${stats.monthBill.toLocaleString('en-IN')} बनता है।`;
        if (matchedCust.dues > 0) {
          reply += ` पुराना बकाया ₹${matchedCust.dues.toLocaleString('en-IN')} जोड़कर कुल देय हिसाब ₹${Math.round(stats.monthBill + matchedCust.dues).toLocaleString('en-IN')} होता है।`;
        }
      } else {
        reply = `${targetLabel} में ${matchedCust.name} के यहाँ अब तक कुल ${stats.totalLitres.toFixed(1)} लीटर दूध गया है (${stats.deliveredDays} दिन दूध लिया${stats.skippedDays > 0 ? `, ${stats.skippedDays} दिन नागा रहा` : ', कोई नागा नहीं'})।`;
        reply += ` ₹${matchedCust.rate}/लीटर के भाव से इस महीने का दूध बिल ₹${stats.monthBill.toLocaleString('en-IN')} हुआ है।`;
        if (matchedCust.dues > 0) {
          reply += ` पिछला बकाया ₹${matchedCust.dues.toLocaleString('en-IN')} जोड़कर कुल शुद्ध देय हिसाब ₹${stats.totalPayable.toLocaleString('en-IN')} बनता है।`;
        } else {
          reply += ` पिछला कोई बकाया नहीं है, कुल देय हिसाब ₹${stats.totalPayable.toLocaleString('en-IN')} है।`;
        }
      }
      showAiVoiceReply(`📒 ${matchedCust.name} (${targetLabel})`, reply);
      return true;
    }

    // 1C. Specific Day Delivery
    const mEntry = appData.dailyRecords[targetDate]?.delivery?.morning?.[matchedCust.id];
    const eEntry = appData.dailyRecords[targetDate]?.delivery?.evening?.[matchedCust.id];
    const mQty = (mEntry && mEntry.status !== 'skipped') ? (parseFloat(mEntry.litres) || 0) : 0;
    const eQty = (eEntry && eEntry.status !== 'skipped') ? (parseFloat(eEntry.litres) || 0) : 0;
    const dayTot = Math.round((mQty + eQty) * 10) / 10;

    let reply = '';
    if (dayTot === 0 && ((mEntry && mEntry.status === 'skipped') || (eEntry && eEntry.status === 'skipped'))) {
      reply = `${dateLabel} ${matchedCust.name} का नागा (छुट्टी) था, उन्हें कोई दूध नहीं दिया गया।`;
    } else if (text.includes('सुबह') && !text.includes('शाम')) {
      reply = `${dateLabel} ${matchedCust.name} को सुबह ${mQty.toFixed(1)} लीटर दूध दिया गया था (भाव ₹${matchedCust.rate}/L)।`;
    } else if (text.includes('शाम') && !text.includes('सुबह')) {
      reply = `${dateLabel} ${matchedCust.name} को शाम को ${eQty.toFixed(1)} लीटर दूध दिया गया था (भाव ₹${matchedCust.rate}/L)।`;
    } else {
      reply = `${dateLabel} ${matchedCust.name} के यहाँ कुल ${dayTot.toFixed(1)} लीटर दूध गया था — सुबह ${mQty.toFixed(1)}L और शाम को ${eQty.toFixed(1)}L (भाव ₹${matchedCust.rate}/L, ${dateLabel} का हिसाब ₹${Math.round(dayTot * matchedCust.rate)})।`;
    }
    showAiVoiceReply(`🚚 ${matchedCust.name} का दूध`, reply);
    return true;
  }

  // ===================================================================
  // 1.5 OVERALL FARM MONTHLY / RANGE DELIVERY & BILLING (Priority 1.5)
  // उदा. "पिछले महीने फार्म का कुल कितना दूध बिका", "3 महीने पहले कितना दूध सप्लाई हुआ"
  // ===================================================================
  const isOverallDeliveryOrBill = (
    dateRange ||
    queryMonth !== null ||
    text.includes('महीने') || text.includes('महीना') || text.includes('mahine') ||
    text.includes('अब तक') || text.includes('अभी तक')
  ) && (
    text.includes('दूध गया') || text.includes('दूध बिका') || text.includes('दूध बांटा') || 
    text.includes('वितरण') || text.includes('सप्लाई') || text.includes('बिक्री') ||
    text.includes('हिसाब') || text.includes('बिल') || text.includes('कमाई') ||
    text.includes('kitna dudh gya') || text.includes('dudh gya') || text.includes('hisab') || text.includes('bill') ||
    text.includes('kitna dudh bika') || text.includes('dudh bika')
  ) && !matchedCust && !matchedAnimal;

  if (isOverallDeliveryOrBill) {
    const targetYear = queryMonth ? queryMonth.year : now.getFullYear();
    const targetMonth = queryMonth ? queryMonth.month : (now.getMonth() + 1);
    const targetMonthName = queryMonth ? queryMonth.monthName : getHindiMonthName(now.getMonth() + 1);
    const isPast = queryMonth ? queryMonth.isPast : false;
    const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();

    const startDay = dateRange ? dateRange.startDay : 1;
    const endDay = dateRange ? dateRange.endDay : (isPast ? daysInTargetMonth : now.getDate());

    let totalLitres = 0;
    let totalBill = 0;
    let totalDues = 0;

    appData.customers.forEach(c => {
      totalDues += (c.dues || 0);
      let cLitres = 0;
      for (let d = startDay; d <= endDay; d++) {
        const dKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const m = appData.dailyRecords[dKey]?.delivery?.morning?.[c.id];
        const e = appData.dailyRecords[dKey]?.delivery?.evening?.[c.id];
        if (m && m.status !== 'skipped') cLitres += (parseFloat(m.litres) || 0);
        if (e && e.status !== 'skipped') cLitres += (parseFloat(e.litres) || 0);
      }
      totalLitres += cLitres;
      totalBill += Math.round(cLitres * (c.rate || 60));
    });

    totalLitres = Math.round(totalLitres * 10) / 10;
    const rangeLabel = dateRange 
      ? `${startDay} से ${endDay} ${targetMonthName}` 
      : (queryMonth ? queryMonth.label : `इस महीने ${targetMonthName} में 1 से ${endDay} तारीख तक`);

    let reply = `${rangeLabel} सभी ग्राहकों को कुल मिलाकर ${totalLitres.toFixed(1)} लीटर दूध सप्लाई किया गया${isPast ? ' था' : ' है'}। इसका कुल दूध बिल ₹${totalBill.toLocaleString('en-IN')} बनता है।`;
    if (totalDues > 0) {
      reply += ` पुराना बकाया ₹${totalDues.toLocaleString('en-IN')} जोड़कर फार्म का कुल देय हिसाब ₹${Math.round(totalBill + totalDues).toLocaleString('en-IN')} है।`;
    }
    showAiVoiceReply(`📊 कुल दूध वितरण व हिसाब (${rangeLabel})`, reply);
    return true;
  }

  // ===================================================================
  // 2. SPECIFIC ANIMAL MILK QUERY (Priority 2)
  // उदा. "लाली ने पिछले महीने में कितना दूध दिया था", "लाली कब ब्याएगी"
  // ===================================================================
  if (matchedAnimal) {
    // 2A. Specific animal breeding questions (उदा. "लाली कब ब्याएगी", "गौरी की डिलीवरी कब है")
    if (text.includes('ब्याएगी') || text.includes('डिलीवरी') || text.includes('बच्चा कब') || text.includes('गाभिन') || text.includes('सीमन')) {
      const br = getActiveBreedingRecord(matchedAnimal.id);
      if (br) {
        const tl = getBreedingTimeline(br, matchedAnimal);
        let reply = `🐄 **${matchedAnimal.name} की गर्भाधान स्थिति:**\n\n`;
        reply += `- अवस्था: ${tl.stageName}\n`;
        reply += `- संभावित डिलीवरी तारीख: **${formatHindiDate(tl.calvingDate)}** (${tl.daysRemaining > 0 ? `${tl.daysRemaining} दिन बाकी हैं` : 'तारीख पूरी हो चुकी है'})\n`;
        reply += `- सीमन: ${br.semenDetails} (${br.doctorName})\n`;
        if (tl.alert) {
          reply += `- अलर्ट: ${tl.alert.title} - ${tl.alert.message}\n`;
        }
        showAiVoiceReply(`🤰 ${matchedAnimal.name} डिलीवरी`, reply);
        switchTab('viewCattle');
        return true;
      } else if (matchedAnimal.status === 'pregnant') {
        const reply = `${matchedAnimal.name} गाभिन अवस्था में दर्ज है, लेकिन इसका सीमन रिकॉर्ड दर्ज नहीं है। आप 'पशु' टैब में जाकर सीमन तारीख जोड़ सकते हैं।`;
        showAiVoiceReply(`🤰 ${matchedAnimal.name}`, reply);
        switchTab('viewCattle');
        return true;
      }
    }

    // 2B. Animal Monthly / Past Months / Average (उदा. "लाली ने पिछले महीने कितना दूध दिया था")
    if (queryMonth !== null || text.includes('महीने') || text.includes('महीना') || text.includes('mahine') || text.includes('अभी तक') || text.includes('औसत') || text.includes('रिकॉर्ड')) {
      const targetYear = queryMonth ? queryMonth.year : now.getFullYear();
      const targetMonth = queryMonth ? queryMonth.month : (now.getMonth() + 1);
      const targetLabel = queryMonth ? queryMonth.label : `इस महीने (${getHindiMonthName(now.getMonth() + 1)})`;

      const stats = getAnimalMonthlyMilkingStats(matchedAnimal.id, targetYear, targetMonth);
      let reply = '';
      if (queryMonth && queryMonth.isPast) {
        reply = `${targetLabel} में ${matchedAnimal.name} ने कुल ${stats.totalLitres.toFixed(1)} लीटर दूध दिया था (${stats.milkedDays} दिन दूध चालू रहा)। इसका दैनिक AI औसत ${stats.avgDailyMilk} लीटर प्रति दिन रहा था।`;
        if (stats.highestYield && stats.highestYield.litres > 0) {
          reply += ` सबसे ज्यादा दूध ${stats.highestYield.dayNum} तारीख को ${stats.highestYield.litres} लीटर दिया था।`;
        }
      } else {
        reply = `${targetLabel} में ${matchedAnimal.name} ने अब तक कुल ${stats.totalLitres.toFixed(1)} लीटर दूध दिया है (${stats.milkedDays} दिन दूध चालू रहा)। इसका दैनिक AI औसत ${stats.avgDailyMilk} लीटर प्रति दिन है।`;
        if (stats.highestYield && stats.highestYield.litres > 0) {
          reply += ` सबसे ज्यादा दूध ${stats.highestYield.dayNum} तारीख को ${stats.highestYield.litres} लीटर दिया था।`;
        }
      }
      showAiVoiceReply(`🐄 ${matchedAnimal.name} (${targetLabel})`, reply);
      return true;
    }

    // 2C. Specific Day Milk
    const mQty = parseFloat(appData.dailyRecords[targetDate]?.milking?.morning?.[matchedAnimal.id]) || 0;
    const eQty = parseFloat(appData.dailyRecords[targetDate]?.milking?.evening?.[matchedAnimal.id]) || 0;
    const dayTot = Math.round((mQty + eQty) * 10) / 10;

    let reply = '';
    if (text.includes('सुबह') && !text.includes('शाम')) {
      reply = `${dateLabel} ${matchedAnimal.name} ने सुबह ${mQty.toFixed(1)} लीटर दूध दिया है।`;
    } else if (text.includes('शाम') && !text.includes('सुबह')) {
      reply = `${dateLabel} ${matchedAnimal.name} ने शाम को ${eQty.toFixed(1)} लीटर दूध दिया है।`;
    } else {
      if (dayTot === 0) {
        reply = `${dateLabel} ${matchedAnimal.name} का दूध अभी दर्ज नहीं हुआ है (0 लीटर)। आप "${matchedAnimal.name.split(' ')[0]} 6 लीटर" बोलकर तुरंत दर्ज कर सकते हैं।`;
      } else {
        reply = `${dateLabel} ${matchedAnimal.name} ने सुबह ${mQty.toFixed(1)} लीटर और शाम को ${eQty.toFixed(1)} लीटर, यानी कुल मिलाकर ${dayTot.toFixed(1)} लीटर दूध दिया है।`;
      }
    }
    showAiVoiceReply(`🥛 ${matchedAnimal.name} का दूध`, reply);
    return true;
  }

  // ===================================================================
  // 3. TOP / BEST MILK ANIMAL (Priority 3)
  // उदा. "किस पशु ने सबसे ज्यादा दूध दिया", "पिछले महीने सबसे ज्यादा दूध किसका था"
  // ===================================================================
  const isTopAnimalQuery = (
    text.includes('सबसे ज्यादा') || text.includes('सबसे अधिक') || text.includes('सब से ज्यादा') ||
    text.includes('सर्वश्रेष्ठ') || text.includes('टॉप') || text.includes('top') || text.includes('highest') || text.includes('best')
  ) && (
    text.includes('पशु') || text.includes('दूध') || text.includes('गाय') || text.includes('भैंस') ||
    text.includes('दिया') || text.includes('किसने') || text.includes('किसका') || text.includes('देती')
  );

  if (isTopAnimalQuery) {
    if (queryMonth !== null || text.includes('महीने') || text.includes('महीना') || text.includes('mahine')) {
      const targetYear = queryMonth ? queryMonth.year : now.getFullYear();
      const targetMonth = queryMonth ? queryMonth.month : (now.getMonth() + 1);
      const targetLabel = queryMonth ? queryMonth.label : `इस महीने (${getHindiMonthName(now.getMonth() + 1)})`;

      const monthStatsList = appData.animals.map(a => {
        const st = getAnimalMonthlyMilkingStats(a.id, targetYear, targetMonth);
        return { animal: a, stats: st };
      }).sort((a, b) => b.stats.totalLitres - a.stats.totalLitres);

      const top = monthStatsList[0];
      if (top && top.stats.totalLitres > 0) {
        let reply = `${targetLabel} में सबसे ज्यादा दूध ${top.animal.name} ने दिया${queryMonth && queryMonth.isPast ? ' था' : ' है'} — कुल ${top.stats.totalLitres.toFixed(1)} लीटर (दैनिक AI औसत ${top.stats.avgDailyMilk}L/दिन)।`;
        if (monthStatsList.length > 1 && monthStatsList[1].stats.totalLitres > 0) {
          reply += ` दूसरे नंबर पर ${monthStatsList[1].animal.name} ${queryMonth && queryMonth.isPast ? 'रहा' : 'है'} (${monthStatsList[1].stats.totalLitres.toFixed(1)} लीटर)।`;
        }
        showAiVoiceReply(`⭐ सर्वश्रेष्ठ दूध देने वाला पशु (${targetLabel})`, reply);
        return true;
      }
    }

    const list = appData.animals.map(a => {
      const m = parseFloat(appData.dailyRecords[targetDate]?.milking?.morning?.[a.id]) || 0;
      const e = parseFloat(appData.dailyRecords[targetDate]?.milking?.evening?.[a.id]) || 0;
      return { animal: a, morning: m, evening: e, total: Math.round((m + e) * 10) / 10 };
    }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

    if (list.length === 0) {
      const monthStatsList = appData.animals.map(a => {
        const st = getAnimalMonthlyMilkingStats(a.id, now.getFullYear(), now.getMonth() + 1);
        return { animal: a, stats: st };
      }).sort((a, b) => b.stats.totalLitres - a.stats.totalLitres);
      const topMonth = monthStatsList[0];
      
      let reply = `${dateLabel} अभी किसी पशु का दूध दर्ज नहीं हुआ है। लेकिन इस महीने सबसे ज्यादा दूध ${topMonth ? topMonth.animal.name : 'लाली'} ने दिया है (कुल ${topMonth ? topMonth.stats.totalLitres.toFixed(1) : '0'} लीटर, औसत ${topMonth ? topMonth.stats.avgDailyMilk : '0'}L/दिन)।`;
      showAiVoiceReply('⭐ टॉप पशु', reply);
      return true;
    }

    const top = list[0];
    let reply = `${dateLabel} सबसे ज्यादा दूध ${top.animal.name} ने दिया है — कुल ${top.total} लीटर (सुबह ${top.morning}L + शाम ${top.evening}L)।`;
    if (list.length > 1 && list[1].total > 0) {
      const second = list[1];
      reply += ` इसके बाद दूसरे नंबर पर ${second.animal.name} है (${second.total} लीटर)।`;
    }
    showAiVoiceReply('⭐ सबसे ज्यादा दूध', reply);
    return true;
  }

  // ===================================================================
  // 4. TOTAL FARM MILK PRODUCTION (Priority 4)
  // उदा. "आज सारे पशु को मिला के कितना दूध हो गया", "कुल दूध कितना हुआ"
  // ===================================================================
  const isFarmTotalQuery = (
    text.includes('सारे पशु') || text.includes('सभी पशु') || text.includes('सब पशु') ||
    text.includes('सारे') || text.includes('सभी') || text.includes('सबका') ||
    text.includes('कुल दूध') || text.includes('पूरा दूध') || text.includes('टोटल दूध') ||
    text.includes('फार्म का दूध') || text.includes('फार्म में कितना दूध') ||
    text.includes('मिला के') || text.includes('मिलाकर')
  ) && (
    text.includes('दूध') || text.includes('कितना') || text.includes('निकला') ||
    text.includes('हो गया') || text.includes('हुआ') || text.includes('बना')
  );

  if (isFarmTotalQuery) {
    let mTot = 0, eTot = 0;
    appData.animals.forEach(a => {
      mTot += parseFloat(appData.dailyRecords[targetDate]?.milking?.morning?.[a.id]) || 0;
      eTot += parseFloat(appData.dailyRecords[targetDate]?.milking?.evening?.[a.id]) || 0;
    });
    const farmTot = Math.round((mTot + eTot) * 10) / 10;
    mTot = Math.round(mTot * 10) / 10;
    eTot = Math.round(eTot * 10) / 10;

    let delTot = 0;
    appData.customers.forEach(c => {
      const m = appData.dailyRecords[targetDate]?.delivery?.morning?.[c.id];
      const e = appData.dailyRecords[targetDate]?.delivery?.evening?.[c.id];
      if (m && m.status !== 'skipped') delTot += (parseFloat(m.litres) || 0);
      if (e && e.status !== 'skipped') delTot += (parseFloat(e.litres) || 0);
    });
    delTot = Math.round(delTot * 10) / 10;
    const remTot = Math.max(0, Math.round((farmTot - delTot) * 10) / 10);

    let reply = '';
    if (farmTot === 0) {
      reply = `${dateLabel} फार्म के पशुओं का दूध अभी दर्ज नहीं हुआ है (0 लीटर)। आप बोलकर दूध दर्ज कर सकते हैं।`;
    } else {
      reply = `${dateLabel} फार्म के सभी पशुओं को मिलाकर कुल ${farmTot} लीटर दूध हुआ है — सुबह ${mTot} लीटर और शाम को ${eTot} लीटर।`;
      if (delTot > 0) {
        reply += ` इसमें से ${delTot} लीटर ग्राहकों को बंट चुका है${remTot > 0 ? ` और ${remTot} लीटर अभी घर में बचा हुआ है।` : '।'}`;
      } else {
        reply += ` पूरा ${farmTot} लीटर दूध अभी उपलब्ध है।`;
      }
    }
    showAiVoiceReply('🥛 कुल फार्म दूध उत्पादन', reply);
    return true;
  }

  // ===================================================================
  // 5. OVERALL FARM EARNINGS / DUES QUERY (Priority 5)
  // उदा. "आज की कमाई कितनी है", "कुल कितना बकाया है"
  // ===================================================================
  if (text.includes('कमाई') || text.includes('बिक्री') || text.includes('कलेक्शन') || text.includes('गल्ला')) {
    let dayEarnings = 0;
    appData.customers.forEach(c => {
      const m = appData.dailyRecords[targetDate]?.delivery?.morning?.[c.id];
      const e = appData.dailyRecords[targetDate]?.delivery?.evening?.[c.id];
      const mQ = (m && m.status !== 'skipped') ? (parseFloat(m.litres) || 0) : 0;
      const eQ = (e && e.status !== 'skipped') ? (parseFloat(e.litres) || 0) : 0;
      dayEarnings += ((mQ + eQ) * (c.rate || 60));
    });
    const reply = `${dateLabel} कुल ₹${Math.round(dayEarnings).toLocaleString('en-IN')} का दूध बिका है।`;
    showAiVoiceReply('💰 फार्म कमाई', reply);
    return true;
  }

  if (text.includes('कुल बकाया') || text.includes('उधार') || text.includes('उधारी') || (text.includes('बकाया') && !matchedCust)) {
    let totalDues = 0;
    appData.customers.forEach(c => totalDues += (c.dues || 0));
    const reply = `सभी ग्राहकों का मिलाकर कुल पुराना बकाया ₹${totalDues.toLocaleString('en-IN')} है।`;
    showAiVoiceReply('📒 कुल बकाया', reply);
    return true;
  }

  // ===================================================================
  // 6. ANIMAL HEADCOUNT QUERY (Priority 6)
  // उदा. "कुल कितने पशु हैं", "कितनी गाय हैं"
  // ===================================================================
  if (text.includes('कितने पशु') || text.includes('कितनी गाय') || text.includes('कितनी भैंस') || text.includes('कुल पशु')) {
    const cows = appData.animals.filter(a => a.type === 'cow').length;
    const buff = appData.animals.filter(a => a.type === 'buffalo').length;
    const milking = appData.animals.filter(a => a.status === 'milking').length;
    const reply = `फार्म में कुल ${appData.animals.length} पशु हैं (${cows} गाय और ${buff} भैंस)। इनमें से ${milking} पशु अभी दूध दे रहे हैं।`;
    showAiVoiceReply('🐄 फार्म के पशु', reply);
    return true;
  }

  return false;
}

function processVoiceCommand(rawText) {
  const text = rawText.toLowerCase();

  // ===================================================================
  // 0. SHIFT & TAB VOICE SWITCHING (शाम का टैब / सुबह का टैब / पशु दूध शिफ्ट)
  // उदा. "शाम का टैब खोलो", "सुबह का टैब खोलो", "पशु वाले में शाम का टैब खोलो", "सुबह की शिफ्ट खोलो"
  // ===================================================================
  const explicitShift = detectShiftInText(text);
  const litresInVoice = parseHindiNumbers(text);
  const isDeliveryNaga = (findCustomerFuzzy(text) && (text.includes('नागा') || text.includes('नहीं') || text.includes('छुट्टी') || text.includes('naga')));

  const hasShiftTabIntent = (
    text.includes('tab') || text.includes('टैब') ||
    text.includes('shift') || text.includes('शिफ्ट') ||
    text.includes('kholo') || text.includes('खोलो') || text.includes('open') ||
    text.includes('dikhao') || text.includes('दिखाओ') || text.includes('show') ||
    text.includes('lagao') || text.includes('लगाओ') ||
    text.includes('badlo') || text.includes('बदलो') ||
    text.includes('pe jao') || text.includes('par jao') ||
    text.includes('panna') || text.includes('पन्ना') ||
    text.includes('wala') || text.includes('wale') || text.includes('वाले') || text.includes('वाला')
  );

  // If a shift (morning/evening) is mentioned and user is not recording specific litres or naga
  if (explicitShift && litresInVoice === null && !isDeliveryNaga && (hasShiftTabIntent || text.trim().length <= 16)) {
    let targetTab = 'viewMilking';
    let tabLabel = 'पशुओं का दूध';

    if (text.includes('बांट') || text.includes('वितरण') || text.includes('डिलीवरी') || text.includes('delivery') || text.includes('ग्राहक') || text.includes('customer')) {
      targetTab = 'viewDelivery';
      tabLabel = 'दूध वितरण';
    } else if (text.includes('खाता') || text.includes('बिल') || text.includes('khata') || text.includes('bill')) {
      targetTab = 'viewKhata';
      tabLabel = 'ग्राहक खाता';
    } else {
      // By default or when "पशु" / "दूध" is mentioned:
      const mentionsPashuOrDudh = text.includes('पशु') || text.includes('pashu') || text.includes('दूध') || text.includes('dudh') || text.includes('doodh') || text.includes('गाय') || text.includes('भैंस') || text.includes('दोहन');
      const activeTabEl = document.querySelector('.view-tab.active');
      const currentTabId = activeTabEl ? activeTabEl.id : 'viewMilking';

      if (mentionsPashuOrDudh) {
        targetTab = 'viewMilking';
        tabLabel = 'पशुओं का दूध';
      } else if (currentTabId === 'viewDelivery') {
        targetTab = 'viewDelivery';
        tabLabel = 'दूध वितरण';
      } else {
        targetTab = 'viewMilking';
        tabLabel = 'पशुओं का दूध';
      }
    }

    switchTab(targetTab);
    setShift(explicitShift, true);

    const shiftHindi = explicitShift === 'morning' ? '🌅 सुबह' : '🌇 शाम';
    const spokenShift = explicitShift === 'morning' ? 'सुबह' : 'शाम';
    const audioMsg = `${tabLabel} में ${spokenShift} की शिफ्ट खुल गई`;
    speakAudio(audioMsg);

    const resEl = document.getElementById('voiceResult');
    if (resEl) {
      resEl.innerText = `${shiftHindi} की शिफ्ट खुली (${tabLabel})`;
    }
    showAudioToast(`${shiftHindi} की शिफ्ट खुली (${tabLabel})`);
    return;
  }

  // 0. CHECK IF USER IS ASKING A QUESTION (AI VOICE QUERY)
  if (isVoiceQuery(text)) {
    const answered = handleDairyAiVoiceQuery(text, rawText);
    if (answered) return;
  }

  // Navigation Commands
  if (text.includes('दूध निकाला') || text.includes('दूध निकाल') || text.includes('पशु दूध') || text.includes('पशुओं का दूध') || text.includes('milking')) {
    switchTab('viewMilking');
    speakAudio('पशुओं के दूध का पन्ना खुल गया');
    return;
  }
  if (text.includes('बांट') || text.includes('वितरण') || text.includes('डिलीवरी')) {
    switchTab('viewDelivery');
    speakAudio('दूध वितरण का पन्ना खुल गया');
    return;
  }
  if (text.includes('खाता') || text.includes('बिल') || text.includes('उधार')) {
    switchTab('viewKhata');
    speakAudio('ग्राहक खाता खुल गया');
    return;
  }
  if ((text.includes('पशु') || text.includes('गाय') || text.includes('भैंस')) && !text.match(/\d/)) {
    switchTab('viewCattle');
    speakAudio('पशुओं की डायरी खुल गई');
    return;
  }
  if (text.includes('सलाह') || text.includes('डॉक्टर') || text.includes('बीमार')) {
    switchTab('viewDoctor');
    speakAudio('पशु मित्र सलाहकार खुला है');
    return;
  }

  // Reset / New Day Voice Commands (उदा. "आज का नया दिन शुरू करो", "सारे काउंटर 0 करो")
  if (
    text.includes('नया दिन') || text.includes('सारे काउंटर 0') ||
    text.includes('सब 0 करो') || text.includes('0 कर दो') ||
    text.includes('reset today') || text.includes('reset counter')
  ) {
    resetTodayCounters();
    return;
  }

  // Animal Milking Commands (उदा. "लाली का शाम का दूध 5 लीटर हुआ", "सुबह भूरी ने 4 l दूध दिया")
  const matchedAnimalVoice = findAnimalFuzzy(text);
  if (matchedAnimalVoice) {
    const litres = parseHindiNumbers(text);
    if (litres !== null) {
      const explicitShift = detectShiftInText(text);
      const targetShift = explicitShift || currentShift;
      const shiftLabel = targetShift === 'morning' ? 'सुबह' : 'शाम';

      // Automatically switch to the morning or evening shift tab if explicitly spoken
      if (explicitShift && explicitShift !== currentShift) {
        setShift(explicitShift, true);
      }
      // Ensure Milking Tab is active
      switchTab('viewMilking');

      setAnimalMilk(matchedAnimalVoice.id, litres, targetShift);
      speakAudio(`${matchedAnimalVoice.name} का ${shiftLabel} का ${litres} लीटर दर्ज हो गया!`);
      const resEl = document.getElementById('voiceResult');
      if (resEl) resEl.innerText = `✅ ${matchedAnimalVoice.name} (${shiftLabel}): ${litres} L दर्ज`;
      return;
    }
  }

  // Customer Delivery Commands (उदा. "रमेश को शाम 2 लीटर दिया", "सुबह रमेश का नागा")
  const matchedCustVoice = findCustomerFuzzy(text);
  if (matchedCustVoice) {
    const explicitShift = detectShiftInText(text);
    const targetShift = explicitShift || currentShift;
    const shiftLabel = targetShift === 'morning' ? 'सुबह' : 'शाम';

    if (explicitShift && explicitShift !== currentShift) {
      setShift(explicitShift, true);
    }
    switchTab('viewDelivery');

    if (text.includes('नागा') || text.includes('नहीं') || text.includes('छुट्टी') || text.includes('naga')) {
      setCustomerDeliveryStatus(matchedCustVoice.id, 'skipped', 0, targetShift);
      speakAudio(`${matchedCustVoice.name} का ${shiftLabel} का नागा दर्ज किया गया!`);
      const resEl = document.getElementById('voiceResult');
      if (resEl) resEl.innerText = `🔴 ${matchedCustVoice.name} (${shiftLabel}): नागा`;
      return;
    }

    const litres = parseHindiNumbers(text);
    if (litres !== null) {
      setCustomerDeliveryStatus(matchedCustVoice.id, 'custom', litres, targetShift);
      speakAudio(`${matchedCustVoice.name} को ${shiftLabel} का ${litres} लीटर दर्ज हो गया!`);
      const resEl = document.getElementById('voiceResult');
      if (resEl) resEl.innerText = `✅ ${matchedCustVoice.name} (${shiftLabel}): ${litres} L`;
      return;
    } else {
      const defaultLitres = targetShift === 'morning' ? (matchedCustVoice.quotaMorning || 0) : (matchedCustVoice.quotaEvening || 0);
      setCustomerDeliveryStatus(matchedCustVoice.id, 'delivered', defaultLitres, targetShift);
      speakAudio(`${matchedCustVoice.name} को ${shiftLabel} का ${defaultLitres} लीटर दूध दिया गया!`);
      const resEl = document.getElementById('voiceResult');
      if (resEl) resEl.innerText = `✅ ${matchedCustVoice.name} (${shiftLabel}): ${defaultLitres} L`;
      return;
    }
  }

  // Breeding & Calving Voice Commands
  if (text.includes('सीमन') || text.includes('गर्भाधान') || text.includes('गाभिन') || text.includes('ब्या') || text.includes('डिलीवरी')) {
    // Check for specific animal commands
    for (let animal of appData.animals) {
      const cleanName = animal.name.split(' ')[0].toLowerCase();
      if (text.includes(cleanName)) {
        if (text.includes('ब्या गई') || text.includes('डिलीवरी हो गई') || text.includes('बच्चा दिया')) {
          switchTab('viewCattle');
          const br = getActiveBreedingRecord(animal.id);
          openCalvingModal(br ? br.id : null, animal.id);
          speakAudio(`${animal.name} की डिलीवरी दर्ज करें`);
          return;
        }
        if (text.includes('कब ब्याएगी') || text.includes('डिलीवरी कब') || text.includes('कितने दिन') || text.includes('गाभिन')) {
          const br = getActiveBreedingRecord(animal.id);
          if (br) {
            const tl = getBreedingTimeline(br, animal);
            speakAudio(`${animal.name} की संभावित डिलीवरी ${formatHindiDate(tl.calvingDate)} को है। अभी ${tl.daysRemaining} दिन बाकी हैं।`);
            switchTab('viewCattle');
            return;
          } else {
            speakAudio(`${animal.name} का कोई सक्रिय गर्भाधान रिकॉर्ड नहीं मिला।`);
            return;
          }
        }
        if (text.includes('सीमन') || text.includes('गर्भाधान')) {
          switchTab('viewCattle');
          openAddBreedingModal(animal.id);
          speakAudio(`${animal.name} का सीमन फॉर्म खुला है`);
          return;
        }
      }
    }
    // Generic breeding tab / filter command
    switchTab('viewCattle');
    activeFilter = 'pregnant';
    document.querySelectorAll('.filter-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-filter') === 'pregnant');
    });
    renderCattleRegister();
    speakAudio('गाभिन और सीमन लगे पशुओं की सूची खुली है');
    return;
  }

  // FAT & SNF Calculator Voice Commands
  if (text.includes('फैट') || text.includes('fat') || text.includes('snf') || text.includes('पर्ची') || text.includes('लैक्टो') || text.includes('clr') || text.includes('टेस्ट')) {
    openFatCalcModal();
    const numbers = text.match(/\d+(\.\d+)?/g);
    if (numbers && numbers.length > 0) {
      const fatVal = parseFloat(numbers[0]);
      if (fatVal >= 1 && fatVal <= 15) {
        document.getElementById('fatCalcInput').value = fatVal;
      }
      if (numbers.length > 1) {
        const secondVal = parseFloat(numbers[1]);
        if (secondVal >= 20 && secondVal <= 36) {
          document.getElementById('clrCalcInput').value = secondVal;
        } else if (secondVal <= 20) {
          document.getElementById('fatCalcLitres').value = secondVal;
        }
      }
      recalculateFatSlip();
      const rate = document.getElementById('resRateVal').innerText;
      const total = document.getElementById('resTotalVal').innerText;
      speakAudio(`फैट ${fatVal} का भाव हुआ ${rate} प्रति लीटर, कुल रकम ${total}`);
      return;
    }
    speakAudio('फैट और एस एन एफ कैलकुलेटर खुल गया है');
    return;
  }

  // 30-Day Calendar & Excel Voice Commands
  if (text.includes('कैलेंडर') || text.includes('हाजिरी') || text.includes('नागा')) {
    switchTab('viewKhata');
    const matched = appData.customers.find(c => text.includes(c.name.toLowerCase()));
    const targetCust = matched || appData.customers[0];
    if (targetCust) {
      openCustomerCalendarModal(targetCust.id, currentKhataYear, currentKhataMonth);
      speakAudio(`${targetCust.name} का 30-दिन दूध कैलेंडर खुल गया है`);
    }
    return;
  }

  if (text.includes('एक्सेल') || text.includes('excel') || text.includes('रिपोर्ट डाउनलोड')) {
    switchTab('viewKhata');
    exportAllMonthlyExcel(currentKhataYear, currentKhataMonth);
    return;
  }

  // Question AI
  if (text.includes('कैसे') || text.includes('क्या') || text.includes('इलाज') || text.includes('दवा')) {
    switchTab('viewDoctor');
    document.getElementById('aiQuestionInput').value = rawText;
    handleAiQuestion(rawText);
    return;
  }

  speakAudio('माफ कीजिए, समझ नहीं आया। फिर से बोलें जैसे: लाली 6 लीटर');
}

// ===================================================================
// UI RENDERING FUNCTIONS
// ===================================================================

// Update top statistics summary
function updateStatsHeader() {
  initTodayRecord();
  const day = appData.dailyRecords[currentDateKey];
  const shiftMilking = day.milking[currentShift] || {};
  const shiftDelivery = day.delivery[currentShift] || {};

  let totalProduced = 0;
  for (let aid in shiftMilking) {
    totalProduced += (parseFloat(shiftMilking[aid]) || 0);
  }

  let totalDelivered = 0;
  let totalEarnings = 0;
  for (let cid in shiftDelivery) {
    const entry = shiftDelivery[cid];
    if (entry && (entry.status === 'delivered' || entry.status === 'custom') && entry.litres > 0) {
      const qty = parseFloat(entry.litres) || 0;
      totalDelivered += qty;
      const cust = appData.customers.find(c => c.id === cid);
      const rate = cust ? cust.rate : appData.farmSettings.defaultRate;
      totalEarnings += (qty * rate);
    }
  }

  const remaining = Math.max(0, totalProduced - totalDelivered);

  document.getElementById('statProduced').innerHTML = `${totalProduced.toFixed(1)} <small>L</small>`;
  document.getElementById('statDelivered').innerHTML = `${totalDelivered.toFixed(1)} <small>L</small>`;
  document.getElementById('statRemaining').innerHTML = `${remaining.toFixed(1)} <small>L</small>`;
  document.getElementById('statEarnings').innerText = `₹${Math.round(totalEarnings).toLocaleString('en-IN')}`;

  const options = { day: 'numeric', month: 'long' };
  document.getElementById('currentDateDisplay').innerText = `📅 आज, ${new Date().toLocaleDateString('hi-IN', options)}`;
  document.getElementById('farmNameDisplay').innerText = appData.farmSettings.farmName;
}

// Helper to render Avatar (Photo or Icon)
function getAnimalAvatarHtml(animal) {
  if (animal.photo) {
    return `<img src="${animal.photo}" class="avatar-photo-img" alt="${animal.name}">`;
  }
  return animal.type === 'cow' ? '🐄' : '🐃';
}

function getCustomerAvatarHtml(cust) {
  if (cust.photo) {
    return `<img src="${cust.photo}" class="avatar-photo-img" alt="${cust.name}">`;
  }
  return cust.name.charAt(0);
}

// TAB 1: RENDER MILKING CARDS
function renderMilkingCards() {
  const container = document.getElementById('milkingCardsList');
  if (!container) return;
  container.innerHTML = '';

  const day = appData.dailyRecords[currentDateKey];
  const shiftMilking = day.milking[currentShift] || {};

  document.getElementById('milkingShiftLabel').innerText = 
    `${currentShift === 'morning' ? '🌅 सुबह' : '🌇 शाम'} की शिफ्ट की दूध एंट्री`;

  appData.animals.forEach(animal => {
    const isCow = animal.type === 'cow';
    const currentYield = shiftMilking[animal.id] !== undefined ? shiftMilking[animal.id] : 0;
    const isCompleted = currentYield > 0;

    const card = document.createElement('div');
    card.className = `milking-card ${isCompleted ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="card-top-row">
        <div class="animal-identity">
          <div class="animal-avatar ${isCow ? 'cow' : 'buffalo'}" data-edit-animal="${animal.id}" title="फोटो या नाम बदलने के लिए दबाएं">
            ${getAnimalAvatarHtml(animal)}
          </div>
          <div>
            <div class="animal-name">
              ${animal.name}
              <button class="btn-edit-badge" data-edit-animal="${animal.id}">✏️ नाम/फोटो</button>
            </div>
            <div class="animal-breed">${animal.breed} • ${animal.status === 'milking' ? 'दूध दे रही' : (animal.status === 'pregnant' ? 'गाभिन' : 'सूखी')}</div>
          </div>
        </div>
        <div class="cattle-actions" style="display: flex; gap: 4px; align-items: center;">
          <span class="card-status-badge ${animal.status === 'milking' ? 'badge-milking' : 'badge-dry'}">
            ${animal.status === 'milking' ? '🥛 चालू' : 'ड्राई'}
          </span>
          <button type="button" class="btn-animal-cal-card" data-cal-animal="${animal.id}" style="padding: 2px 7px; font-size: 10px;" title="30-दिन दूध कैलेंडर व AI औसत देखें">
            📅 कैलेंडर
          </button>
        </div>
      </div>

      <div class="quantity-stepper">
        <button class="step-btn" data-action="minus" data-id="${animal.id}">➖</button>
        <div class="stepper-value-wrap">
          <input type="number" step="0.5" class="stepper-input" data-id="${animal.id}" value="${currentYield.toFixed(1)}">
          <span class="stepper-unit">लीटर</span>
        </div>
        <button class="step-btn" data-action="plus" data-id="${animal.id}">➕</button>
      </div>

      <div class="quick-chips-row">
        <button class="quick-chip" data-id="${animal.id}" data-val="0">0L (नागा)</button>
        <button class="quick-chip" data-id="${animal.id}" data-val="3">3L</button>
        <button class="quick-chip" data-id="${animal.id}" data-val="4">4L</button>
        <button class="quick-chip" data-id="${animal.id}" data-val="5">5L</button>
        <button class="quick-chip" data-id="${animal.id}" data-val="6">6L</button>
        <button class="quick-chip" data-id="${animal.id}" data-val="7">7L</button>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach Stepper Buttons
  container.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      let val = parseFloat(appData.dailyRecords[currentDateKey].milking[currentShift][id] || 0);
      if (action === 'plus') val += 0.5;
      if (action === 'minus') val = Math.max(0, val - 0.5);
      val = Math.round(val * 10) / 10;
      setAnimalMilk(id, val);
    });
  });

  // Attach Stepper Input Change
  container.querySelectorAll('.stepper-input').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.getAttribute('data-id');
      let val = Math.max(0, parseFloat(input.value) || 0);
      setAnimalMilk(id, val);
    });
  });

  // Quick Chips
  container.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.getAttribute('data-id');
      const val = parseFloat(chip.getAttribute('data-val'));
      setAnimalMilk(id, val);
    });
  });

  // Calendar Button Listeners
  container.querySelectorAll('[data-cal-animal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-cal-animal');
      openAnimalCalendarModal(id);
    });
  });

  // Edit Animal Listeners (Badge or Avatar)
  container.querySelectorAll('[data-edit-animal]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-edit-animal');
      openEditAnimalModal(id);
    });
  });
}

function setAnimalMilk(animalId, litres, shift = currentShift) {
  initTodayRecord();
  if (!appData.dailyRecords[currentDateKey].milking[shift]) {
    appData.dailyRecords[currentDateKey].milking[shift] = {};
  }
  appData.dailyRecords[currentDateKey].milking[shift][animalId] = litres;
  saveData();
  renderMilkingCards();
}

// TAB 2: RENDER DELIVERY CARDS
function renderDeliveryCards() {
  const container = document.getElementById('deliveryCardsList');
  if (!container) return;
  container.innerHTML = '';

  const day = appData.dailyRecords[currentDateKey];
  const shiftDelivery = day.delivery[currentShift] || {};

  document.getElementById('deliveryShiftLabel').innerText = 
    `${currentShift === 'morning' ? '🌅 सुबह' : '🌇 शाम'} की डिलीवरी लिस्ट`;

  let totalCustomers = appData.customers.length;
  let deliveredCount = 0;

  appData.customers.forEach(cust => {
    const shiftQuota = currentShift === 'morning' ? (cust.quotaMorning !== undefined ? cust.quotaMorning : 1.0) : (cust.quotaEvening !== undefined ? cust.quotaEvening : 1.0);
    const entry = shiftDelivery[cust.id] || { status: 'pending', litres: 0 };
    const isDelivered = (entry.status === 'delivered' || entry.status === 'custom') && entry.litres > 0;
    const isSkipped = entry.status === 'skipped';
    if (isDelivered) deliveredCount++;

    const badgeText = isDelivered ? `${entry.litres} L` : (isSkipped ? 'नागा (0L)' : `कोटा: ${shiftQuota}L`);
    const deliverBtnQty = isDelivered ? entry.litres : shiftQuota;

    const card = document.createElement('div');
    card.className = `delivery-card ${isDelivered ? 'delivered' : ''} ${isSkipped ? 'skipped' : ''}`;
    card.innerHTML = `
      <div class="cust-row">
        <div class="cust-identity">
          <div class="cust-avatar" data-edit-cust="${cust.id}" title="फोटो या नाम बदलने के लिए दबाएं">
            ${getCustomerAvatarHtml(cust)}
          </div>
          <div>
            <div class="cust-name">
              ${cust.name}
              <button class="btn-edit-badge" data-edit-cust="${cust.id}">✏️ नाम/फोटो</button>
            </div>
            <div class="cust-address">${cust.address || 'पक्का ग्राहक'} • ₹${cust.rate}/L</div>
          </div>
        </div>
        <div class="cattle-actions">
          <div class="cust-quota-badge">
            ${badgeText}
          </div>
        </div>
      </div>

      <div class="delivery-actions-row">
        <button class="btn-delivery-action btn-deliver-ok ${isDelivered ? 'active' : ''}" data-id="${cust.id}">
          ✔ दिया (${deliverBtnQty}L)
        </button>
        <button class="btn-delivery-action btn-deliver-skip ${isSkipped ? 'active' : ''}" data-id="${cust.id}">
          ✕ नागा
        </button>
        <button class="btn-delivery-action btn-deliver-edit" data-id="${cust.id}">
          ✏️ मात्रा बदलें
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  const pct = totalCustomers > 0 ? Math.round((deliveredCount / totalCustomers) * 100) : 0;
  document.getElementById('deliveryCountLabel').innerText = `कुल ${totalCustomers} में से ${deliveredCount} को दिया`;
  document.getElementById('deliveryPctLabel').innerText = `${pct}%`;
  document.getElementById('deliveryProgressBar').style.width = `${pct}%`;

  container.querySelectorAll('.btn-deliver-ok').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const cust = appData.customers.find(c => c.id === id);
      const defaultQty = currentShift === 'morning' ? (cust.quotaMorning || 0) : (cust.quotaEvening || 0);
      setCustomerDeliveryStatus(id, defaultQty > 0 ? 'delivered' : 'skipped', defaultQty);
      speakAudio(`${cust.name} को ${defaultQty} लीटर दूध दिया`);
    });
  });

  container.querySelectorAll('.btn-deliver-skip').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const cust = appData.customers.find(c => c.id === id);
      setCustomerDeliveryStatus(id, 'skipped', 0);
      speakAudio(`${cust.name} का आज नागा दर्ज किया गया`);
    });
  });

  container.querySelectorAll('.btn-deliver-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const cust = appData.customers.find(c => c.id === id);
      const currentQty = currentShift === 'morning' ? (cust.quotaMorning || 0) : (cust.quotaEvening || 0);
      const customLitres = prompt(`आज ${cust.name} को कितना लीटर दूध दिया?`, currentQty);
      if (customLitres !== null && !isNaN(customLitres)) {
        const val = Math.max(0, parseFloat(customLitres));
        setCustomerDeliveryStatus(id, val > 0 ? 'custom' : 'skipped', val);
        speakAudio(`${cust.name} का ${val} लीटर दर्ज हुआ`);
      }
    });
  });

  // Edit Customer Listeners
  container.querySelectorAll('[data-edit-cust]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-edit-cust');
      openEditCustomerModal(id);
    });
  });
}

function setCustomerDeliveryStatus(custId, status, litres, shift = currentShift) {
  initTodayRecord();
  if (!appData.dailyRecords[currentDateKey].delivery[shift]) {
    appData.dailyRecords[currentDateKey].delivery[shift] = {};
  }
  appData.dailyRecords[currentDateKey].delivery[shift][custId] = {
    status: status,
    litres: parseFloat(litres) || 0
  };
  saveData();
  renderDeliveryCards();
}

// ===================================================================
// RANK 3: 30-DAY MILK CALENDAR, ATTENDANCE & EXCEL REPORTING
// ===================================================================

function ensureMonthlyDeliveryRecords(year, month) {
  // Purposely disabled: No automatic pre-filling of demo data.
  // Milk attendance is only recorded when user enters it.
}

// Ensure animal monthly milking records exist
function ensureMonthlyMilkingRecords(year, month) {
  // Purposely disabled: No automatic pre-filling of demo data.
}

// AI Smart Calculation of Animal Daily Milk Stats & Analytics
function getAnimalMonthlyMilkingStats(animalId, year = currentKhataYear, month = currentKhataMonth) {
  const animal = appData.animals.find(a => a.id === animalId);
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayKey = getTodayDateKey();

  let totalLitres = 0;
  let morningTotal = 0;
  let eveningTotal = 0;
  let milkedDays = 0;
  let dryDays = 0;
  let highestYield = { dayNum: 0, dateKey: '', litres: 0 };
  const daysArray = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isFuture = (dKey > todayKey);
    const isToday = (dKey === todayKey);

    let mQty = 0;
    let eQty = 0;
    let hasRecord = false;

    if (!isFuture && appData.dailyRecords[dKey] && appData.dailyRecords[dKey].milking) {
      const mRec = appData.dailyRecords[dKey].milking.morning ? appData.dailyRecords[dKey].milking.morning[animalId] : undefined;
      const eRec = appData.dailyRecords[dKey].milking.evening ? appData.dailyRecords[dKey].milking.evening[animalId] : undefined;

      if (mRec !== undefined && mRec !== null) {
        hasRecord = true;
        mQty = parseFloat(mRec) || 0;
      }
      if (eRec !== undefined && eRec !== null) {
        hasRecord = true;
        eQty = parseFloat(eRec) || 0;
      }
    }

    const dayTotal = Math.round((mQty + eQty) * 10) / 10;
    let status = 'unrecorded';

    if (isFuture) {
      status = 'future';
    } else if (isToday) {
      if (dayTotal > 0) {
        status = 'milking';
        milkedDays++;
        totalLitres += dayTotal;
        morningTotal += mQty;
        eveningTotal += eQty;
        if (dayTotal > highestYield.litres) {
          highestYield = { dayNum: day, dateKey: dKey, litres: dayTotal };
        }
      } else {
        status = 'today_pending';
      }
    } else {
      // Past day
      if (!hasRecord) {
        status = 'unrecorded';
      } else if (dayTotal > 0) {
        status = 'milking';
        milkedDays++;
        totalLitres += dayTotal;
        morningTotal += mQty;
        eveningTotal += eQty;
        if (dayTotal > highestYield.litres) {
          highestYield = { dayNum: day, dateKey: dKey, litres: dayTotal };
        }
      } else {
        status = 'dry';
        dryDays++;
      }
    }

    daysArray.push({
      dayNum: day,
      dateKey: dKey,
      morningQty: mQty,
      eveningQty: eQty,
      totalLitres: dayTotal,
      status,
      isFuture,
      hasRecord
    });
  }

  totalLitres = Math.round(totalLitres * 10) / 10;
  morningTotal = Math.round(morningTotal * 10) / 10;
  eveningTotal = Math.round(eveningTotal * 10) / 10;
  const avgDailyMilk = milkedDays > 0 ? (totalLitres / milkedDays).toFixed(1) : '0.0';

  // Calculate recent 7 days average to determine trend
  let recent7Sum = 0;
  let recent7Days = 0;
  const pastDays = daysArray.filter(d => !d.isFuture && d.status !== 'unrecorded');
  const last7 = pastDays.slice(-7);
  last7.forEach(d => {
    if (d.totalLitres > 0) {
      recent7Sum += d.totalLitres;
      recent7Days++;
    }
  });
  const recent7Avg = recent7Days > 0 ? (recent7Sum / recent7Days) : parseFloat(avgDailyMilk);
  let trend = '➡️ स्थिर';
  const diff = Math.round((recent7Avg - parseFloat(avgDailyMilk)) * 10) / 10;
  if (milkedDays > 0) {
    if (diff >= 0.3) {
      trend = `↗️ बढ़ रहा है (+${diff}L)`;
    } else if (diff <= -0.3) {
      trend = `↘️ घट रहा है (${diff}L)`;
    }
  }

  return {
    animalId,
    animalName: animal ? animal.name : '',
    totalLitres,
    morningTotal,
    eveningTotal,
    milkedDays,
    dryDays,
    avgDailyMilk,
    highestYield,
    trend,
    daysArray
  };
}

// Helper to get Live AI Average Yield
function getAnimalAiAverageYield(animalId) {
  const d = new Date();
  const stats = getAnimalMonthlyMilkingStats(animalId, d.getFullYear(), d.getMonth() + 1);
  return stats.avgDailyMilk;
}

function syncCustomerMonthRecordsWithQuota(custId, year, month) {
  const cust = appData.customers.find(c => c.id === custId);
  if (!cust) return;

  const today = new Date();
  const todayKey = getTodayDateKey();
  if (year > today.getFullYear() || (year === today.getFullYear() && month > (today.getMonth() + 1))) {
    showAudioToast('भविष्य के महीने में कोटा नहीं भरा जा सकता');
    return;
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth = (today.getFullYear() === year && (today.getMonth() + 1) === month);
  const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;

  const mQ = (cust.quotaMorning !== undefined && cust.quotaMorning !== null) ? cust.quotaMorning : 0;
  const eQ = (cust.quotaEvening !== undefined && cust.quotaEvening !== null) ? cust.quotaEvening : 0;

  for (let day = 1; day <= maxDay; day++) {
    const dKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dKey > todayKey) continue; // Never write into future

    if (!appData.dailyRecords[dKey]) {
      appData.dailyRecords[dKey] = {
        milking: { morning: {}, evening: {} },
        delivery: { morning: {}, evening: {} }
      };
    }
    if (!appData.dailyRecords[dKey].delivery) {
      appData.dailyRecords[dKey].delivery = { morning: {}, evening: {} };
    }
    if (!appData.dailyRecords[dKey].delivery.morning) {
      appData.dailyRecords[dKey].delivery.morning = {};
    }
    if (!appData.dailyRecords[dKey].delivery.evening) {
      appData.dailyRecords[dKey].delivery.evening = {};
    }

    appData.dailyRecords[dKey].delivery.morning[custId] = {
      status: mQ > 0 ? 'delivered' : 'skipped',
      litres: mQ
    };
    appData.dailyRecords[dKey].delivery.evening[custId] = {
      status: eQ > 0 ? 'delivered' : 'skipped',
      litres: eQ
    };
  }
}

function getCustomerMonthlyStats(custId, year, month) {
  const cust = appData.customers.find(c => c.id === custId);
  const rate = cust ? cust.rate : (appData.farmSettings.defaultRate || 60);
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayKey = getTodayDateKey();

  let totalLitres = 0;
  let deliveredDays = 0;
  let skippedDays = 0;
  const nagaDates = [];
  const daysArray = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isFuture = (dKey > todayKey);
    const isToday = (dKey === todayKey);
    
    let morningQty = 0;
    let morningStatus = 'pending';
    let eveningQty = 0;
    let eveningStatus = 'pending';
    let hasRecord = false;

    if (!isFuture && appData.dailyRecords[dKey] && appData.dailyRecords[dKey].delivery) {
      const mEntry = appData.dailyRecords[dKey].delivery.morning ? appData.dailyRecords[dKey].delivery.morning[custId] : null;
      const eEntry = appData.dailyRecords[dKey].delivery.evening ? appData.dailyRecords[dKey].delivery.evening[custId] : null;

      if (mEntry !== null && mEntry !== undefined) {
        hasRecord = true;
        morningQty = parseFloat(mEntry.litres) || 0;
        morningStatus = mEntry.status || (morningQty > 0 ? 'delivered' : 'pending');
      }
      if (eEntry !== null && eEntry !== undefined) {
        hasRecord = true;
        eveningQty = parseFloat(eEntry.litres) || 0;
        eveningStatus = eEntry.status || (eveningQty > 0 ? 'delivered' : 'pending');
      }
    }

    const dayTotal = Math.round((morningQty + eveningQty) * 10) / 10;
    
    let status = 'unrecorded';
    if (isFuture) {
      status = 'future';
    } else if (isToday) {
      if (dayTotal > 0) {
        const defaultDaily = (cust ? ((cust.quotaMorning || 0) + (cust.quotaEvening || 0)) : 0);
        status = (defaultDaily > 0 && Math.abs(dayTotal - defaultDaily) > 0.05) ? 'custom' : 'delivered';
        deliveredDays++;
        totalLitres += dayTotal;
      } else if (morningStatus === 'skipped' && eveningStatus === 'skipped') {
        status = 'skipped';
        skippedDays++;
        nagaDates.push(day);
      } else {
        status = 'today_pending';
      }
    } else {
      // Past day: only count if user actually entered something
      if (!hasRecord || (morningStatus === 'pending' && eveningStatus === 'pending' && dayTotal === 0)) {
        status = 'unrecorded';
      } else if (dayTotal === 0 && (morningStatus === 'skipped' || eveningStatus === 'skipped')) {
        status = 'skipped';
        skippedDays++;
        nagaDates.push(day);
      } else if (dayTotal > 0) {
        const defaultDaily = (cust ? ((cust.quotaMorning || 0) + (cust.quotaEvening || 0)) : 0);
        if (defaultDaily > 0 && Math.abs(dayTotal - defaultDaily) > 0.05) {
          status = 'custom';
        } else {
          status = 'delivered';
        }
        deliveredDays++;
        totalLitres += dayTotal;
      } else {
        status = 'unrecorded';
      }
    }

    daysArray.push({
      dayNum: day,
      dateKey: dKey,
      morningQty: morningQty,
      morningStatus: morningStatus,
      eveningQty: eveningQty,
      eveningStatus: eveningStatus,
      totalLitres: dayTotal,
      status: status,
      isFuture: isFuture,
      hasRecord: hasRecord
    });
  }

  totalLitres = Math.round(totalLitres * 10) / 10;
  const monthBill = Math.round(totalLitres * rate);
  const dues = cust ? (cust.dues || 0) : 0;
  const totalPayable = monthBill + dues;

  return {
    custId,
    cust,
    year,
    month,
    daysInMonth,
    totalLitres,
    deliveredDays,
    skippedDays,
    nagaDates,
    monthBill,
    dues,
    totalPayable,
    daysArray
  };
}

// TAB 3: RENDER CUSTOMER KHATA & BILLING
function renderCustomerKhata() {
  const container = document.getElementById('customerKhataList');
  if (!container) return;
  container.innerHTML = '';

  const monthLabel = document.getElementById('khataCurrentMonthLabel');
  if (monthLabel) {
    monthLabel.innerText = `${getHindiMonthName(currentKhataMonth)} ${currentKhataYear}`;
  }

  let totalDues = 0;

  appData.customers.forEach(cust => {
    totalDues += (cust.dues || 0);

    const stats = getCustomerMonthlyStats(cust.id, currentKhataYear, currentKhataMonth);

    const card = document.createElement('div');
    card.className = 'khata-card';
    card.innerHTML = `
      <div class="cust-row">
        <div class="cust-identity">
          <div class="cust-avatar" data-edit-cust="${cust.id}" title="फोटो या नाम बदलने के लिए दबाएं">
            ${getCustomerAvatarHtml(cust)}
          </div>
          <div>
            <div class="cust-name">
              ${cust.name}
              <button class="btn-edit-badge" data-edit-cust="${cust.id}">✏️ नाम/फोटो</button>
            </div>
            <div class="cust-address">📱 ${cust.phone} • ₹${cust.rate}/L</div>
          </div>
        </div>
        <div class="cattle-actions">
          <span class="card-status-badge ${cust.dues > 0 ? 'badge-dry' : 'badge-milking'}">
            ${cust.dues > 0 ? 'बकाया' : 'हिसाब चुकता'}
          </span>
        </div>
      </div>

      <div class="khata-stats-grid">
        <div class="khata-stat-col">
          <span class="khata-stat-title">माह का दूध</span>
          <span class="khata-stat-num">${stats.totalLitres.toFixed(1)} L</span>
        </div>
        <div class="khata-stat-col">
          <span class="khata-stat-title">माह का बिल</span>
          <span class="khata-stat-num">₹${stats.monthBill.toLocaleString('en-IN')}</span>
        </div>
        <div class="khata-stat-col">
          <span class="khata-stat-title">कुल बकाया</span>
          <span class="khata-stat-num danger">₹${cust.dues || 0}</span>
        </div>
      </div>

      <div class="khata-actions-row">
        <button class="btn-khata-calendar" data-cal-cust="${cust.id}" title="30-दिन की दैनिक हाज़िरी व नागा कैलेंडर देखें">
          📅 30-दिन कैलेंडर
        </button>
        <button class="btn-upi-bill" data-upi-cust="${cust.id}" title="1-क्लिक UPI QR कोड व डिजिटल पर्ची">
          ⚡ UPI QR
        </button>
        <button class="btn-whatsapp-bill" data-id="${cust.id}">
          💬 WhatsApp
        </button>
        <button class="btn-record-payment" data-id="${cust.id}">
          💵 जमा
        </button>
        <button class="btn-edit-profile" data-edit-cust="${cust.id}">
          ✏️ बदलें
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  document.getElementById('totalPendingDues').innerText = `₹${totalDues.toLocaleString('en-IN')}`;

  container.querySelectorAll('[data-cal-cust]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cal-cust');
      openCustomerCalendarModal(id, currentKhataYear, currentKhataMonth);
    });
  });

  container.querySelectorAll('[data-upi-cust]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-upi-cust');
      openUpiBillModal(id, currentKhataYear, currentKhataMonth);
    });
  });

  container.querySelectorAll('.btn-whatsapp-bill').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      sendWhatsAppBill(id);
    });
  });

  container.querySelectorAll('.btn-record-payment').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openPaymentModal(id);
    });
  });

  // Trigger edit modal from Avatar, Badge, or Button
  container.querySelectorAll('[data-edit-cust]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-edit-cust');
      openEditCustomerModal(id);
    });
  });
}

// Generate & Open WhatsApp Direct Bill
function sendWhatsAppBill(customerId) {
  const cust = appData.customers.find(c => c.id === customerId);
  if (!cust) return;

  const farm = appData.farmSettings;
  const monthName = getHindiMonthName(currentKhataMonth);
  const stats = getCustomerMonthlyStats(customerId, currentKhataYear, currentKhataMonth);
  const totalAmount = stats.totalPayable;

  const nagaMention = stats.skippedDays > 0 
    ? `❌ नागा (छुट्टी): *${stats.skippedDays} दिन* (तारीख: ${stats.nagaDates.join(', ')})\n` 
    : `✨ नागा: *0 दिन (पूरे माह नियमित दूध)*\n`;

  const message = `🥛 *${farm.farmName} - मासिक दूध बिल* 🥛\n\n` +
    `नमस्ते *${cust.name}* जी,\n` +
    `आपके ${monthName} ${currentKhataYear} माह का दूध हिसाब निम्नलिखित है:\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📅 महीना: *${monthName} ${currentKhataYear}*\n` +
    `🥛 कुल दूध: *${stats.totalLitres.toFixed(1)} लीटर* (${stats.deliveredDays} दिन सप्लाई)\n` +
    `${nagaMention}` +
    `💰 दूध का भाव: *₹${cust.rate}/लीटर*\n` +
    `💵 इस माह का बिल: *₹${stats.monthBill.toLocaleString('en-IN')}*\n` +
    (cust.dues > 0 ? `➕ पिछला बकाया: *₹${(cust.dues).toLocaleString('en-IN')}*\n` : '') +
    `🏷️ कुल शुद्ध बकाया: *₹${totalAmount.toLocaleString('en-IN')}*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📲 कृपया Google Pay / PhonePe द्वारा इस UPI ID पर भुगतान करें:\n` +
    `👉 *${farm.upiId}*\n\n` +
    `_नागा या हाज़िरी का पूरा 30-दिन कैलेंडर विवरण देखने हेतु सम्पर्क करें।_\n` +
    `धन्यवाद! 🙏\n_${farm.farmName}_`;

  const encodedMsg = encodeURIComponent(message);
  const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
  const url = `https://wa.me/91${cleanPhone}?text=${encodedMsg}`;

  speakAudio(`${cust.name} का WhatsApp बिल तैयार है`);
  window.open(url, '_blank');
}

// ===================================================================
// BREEDING & GESTATION SCIENTIFIC HELPERS
// ===================================================================

/**
 * Normal gestation periods in Indian conditions:
 * - Cow (गाय): 280 days (~9 months 9 days)
 * - Buffalo (भैंस): 310 days (~10 months 10 days)
 */
function getGestationDays(animalType) {
  return animalType === 'buffalo' ? 310 : 280;
}

function addDaysToDate(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatHindiDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDaysDiff(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return 0;
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function getActiveBreedingRecord(animalId) {
  if (!appData.breedingRecords) return null;
  return appData.breedingRecords.find(br => br.animalId === animalId && br.status === 'active') || null;
}

function getBreedingTimeline(record, animal) {
  const todayKey = getTodayDateKey();
  const animalType = animal ? animal.type : 'cow';
  const gestationTotal = getGestationDays(animalType);
  const daysElapsed = Math.max(0, getDaysDiff(record.aiDate, todayKey));
  const calvingDate = addDaysToDate(record.aiDate, gestationTotal);
  const daysRemaining = getDaysDiff(todayKey, calvingDate);
  const progressPct = Math.min(100, Math.max(0, Math.round((daysElapsed / gestationTotal) * 100)));

  const heatCheckDate = addDaysToDate(record.aiDate, 21);
  const heatDaysLeft = getDaysDiff(todayKey, heatCheckDate);

  const pdStartDate = addDaysToDate(record.aiDate, 60);
  const pdEndDate = addDaysToDate(record.aiDate, 90);
  const pdDaysLeft = getDaysDiff(todayKey, pdStartDate);

  const dryOffDate = addDaysToDate(calvingDate, -60);
  const dryDaysLeft = getDaysDiff(todayKey, dryOffDate);

  const monthsElapsed = Math.floor(daysElapsed / 30);
  const remainingDaysInMonth = daysElapsed % 30;

  let stageName = '';
  let stageBadgeClass = '';
  let alert = null;

  if (record.status === 'calved') {
    stageName = 'ब्या चुकी है (Calved)';
    stageBadgeClass = 'badge-calved';
  } else if (record.status === 'repeat') {
    stageName = 'रिपीट / खाली (Repeat)';
    stageBadgeClass = 'badge-repeat';
  } else {
    // Active Pregnancy / Insemination
    if (!record.heatCheckDone && daysElapsed >= 18 && daysElapsed <= 25) {
      stageName = '⚠️ 21-दिन हीट चेक समय!';
      stageBadgeClass = 'badge-alert-urgent';
      alert = {
        type: 'heat',
        level: 'urgent',
        title: '⚠️ 21-दिन हीट चेक अलर्ट!',
        message: `${animal.name} के सीमन को ${daysElapsed} दिन हो चुके हैं। ध्यान दें: क्या पशु दोबारा तो नहीं बोला?`,
        actionLabel: 'हीट चेक दर्ज करें',
        breedingId: record.id
      };
    } else if (!record.heatCheckDone && daysElapsed < 18) {
      stageName = `हीट चेक में ${heatDaysLeft} दिन बाकी`;
      stageBadgeClass = 'badge-waiting';
    } else if (!record.pdCheckDone && daysElapsed >= 60) {
      stageName = '🩺 डॉक्टर से गर्भ जांच (PD) कराएं';
      stageBadgeClass = 'badge-alert-urgent';
      alert = {
        type: 'pd',
        level: 'urgent',
        title: '🩺 गर्भ जांच (PD Check) का समय!',
        message: `${animal.name} के सीमन को ${daysElapsed} दिन हो चुके हैं। डॉक्टर से जांच कराकर पक्का करें।`,
        actionLabel: 'गर्भ जांच दर्ज करें',
        breedingId: record.id
      };
    } else if (daysRemaining <= 0) {
      stageName = '🚨 डिलीवरी तारीख पूरी! कभी भी ब्या सकती है';
      stageBadgeClass = 'badge-alert-urgent';
      alert = {
        type: 'calving_due',
        level: 'urgent',
        title: `🍼 ${animal.name} की डिलीवरी तारीख पूरी!`,
        message: `संभावित दिन पूरे हो चुके हैं। साफ-सुथरी जगह रखें व डॉक्टर को सूचित रखें।`,
        actionLabel: '🍼 प्रसव दर्ज करें',
        breedingId: record.id
      };
    } else if (daysRemaining <= 15) {
      stageName = `🍼 डिलीवरी नजदीक (${daysRemaining} दिन बाकी)`;
      stageBadgeClass = 'badge-calving';
      alert = {
        type: 'calving_near',
        level: 'warning',
        title: `🍼 ${animal.name} की डिलीवरी नजदीक (${daysRemaining} दिन)`,
        message: `संभावित डिलीवरी: ${formatHindiDate(calvingDate)}। दाना-गुड़ व देखभाल शुरू करें।`,
        actionLabel: '🍼 प्रसव दर्ज करें',
        breedingId: record.id
      };
    } else if (!record.dryOffDone && daysRemaining <= 60) {
      stageName = '🍂 दूध दुहना बंद करें (ड्राई पीरियड)';
      stageBadgeClass = 'badge-dryoff';
      alert = {
        type: 'dry_off',
        level: 'warning',
        title: '🍂 दूध दुहना बंद करने का समय (Dry Off)',
        message: `${animal.name} के ब्याने में ${daysRemaining} दिन बाकी हैं। बछड़े के पोषण हेतु दूध दुहना बंद करें।`,
        actionLabel: 'दूध बंद किया',
        breedingId: record.id
      };
    } else {
      stageName = `🤰 ${monthsElapsed} माह ${remainingDaysInMonth} दिन गाभिन`;
      stageBadgeClass = 'badge-pregnant';
    }
  }

  return {
    daysElapsed,
    gestationTotal,
    daysRemaining,
    progressPct,
    monthsElapsed,
    remainingDaysInMonth,
    calvingDate,
    heatCheckDate,
    heatDaysLeft,
    pdStartDate,
    pdEndDate,
    pdDaysLeft,
    dryOffDate,
    dryDaysLeft,
    stageName,
    stageBadgeClass,
    alert
  };
}

// TAB 4: RENDER CATTLE REGISTER & BREEDING TRACKER
function renderCattleRegister() {
  const container = document.getElementById('cattleRegisterList');
  if (!container) return;
  container.innerHTML = '';

  let allCount = appData.animals.length;
  let milkingCount = 0;
  let dryCount = 0;
  let pregCount = 0;

  appData.animals.forEach(a => {
    const activeBr = getActiveBreedingRecord(a.id);
    if (a.status === 'milking') milkingCount++;
    if (a.status === 'dry') dryCount++;
    if (a.status === 'pregnant' || activeBr !== null) pregCount++;
  });

  document.getElementById('countAllCattle').innerText = allCount;
  document.getElementById('countMilkingCattle').innerText = milkingCount;
  document.getElementById('countDryCattle').innerText = dryCount;
  document.getElementById('countPregnantCattle').innerText = pregCount;

  // Render Breeding Urgent Alerts Banner
  renderBreedingAlerts();

  const filtered = appData.animals.filter(a => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pregnant') {
      return a.status === 'pregnant' || getActiveBreedingRecord(a.id) !== null;
    }
    return a.status === activeFilter;
  });

  filtered.forEach(animal => {
    const isCow = animal.type === 'cow';
    const activeBr = getActiveBreedingRecord(animal.id);
    const card = document.createElement('div');
    card.className = `cattle-card ${activeBr ? 'pregnant-card' : ''}`;

    let breedingHtml = '';
    let badgeHtml = '';

    if (activeBr) {
      const tl = getBreedingTimeline(activeBr, animal);
      badgeHtml = `<span class="cattle-badge ${tl.stageBadgeClass}">${tl.stageName}</span>`;

      const countdownLabel = tl.daysRemaining <= 0 
        ? `<span class="breeding-countdown-badge urgent">🚨 समय पूरा (${Math.abs(tl.daysRemaining)}d+)</span>`
        : `<span class="breeding-countdown-badge ${tl.daysRemaining <= 15 ? 'urgent' : ''}">🍼 ${tl.daysRemaining} दिन बाकी</span>`;

      breedingHtml = `
        <div class="cattle-breeding-box">
          <div class="breeding-box-top">
            <span class="breeding-gestation-text">
              🤰 <strong>${tl.monthsElapsed} माह ${tl.remainingDaysInMonth} दिन गाभिन</strong> (${tl.daysElapsed}/${tl.gestationTotal} दिन)
            </span>
            ${countdownLabel}
          </div>
          <div class="gestation-progress-bar">
            <div class="gestation-progress-fill" style="width: ${tl.progressPct}%"></div>
          </div>
          <div class="breeding-next-action">
            📅 संभावित डिलीवरी: <strong>${formatHindiDate(tl.calvingDate)}</strong> • सीमन: ${activeBr.semenDetails || 'दर्ज'}
          </div>
          <div class="breeding-card-actions">
            <button class="btn-card-action primary btn-view-timeline" data-brid="${activeBr.id}">
              📋 टाइमलाइन देखें
            </button>
            <button class="btn-card-action calve btn-quick-calve" data-brid="${activeBr.id}" data-aid="${animal.id}">
              🍼 ब्या गई (Calved)
            </button>
            <button class="btn-card-action btn-add-ai" data-aid="${animal.id}" title="नया सीमन दर्ज करें">
              ➕ नया AI
            </button>
          </div>
        </div>
      `;
    } else {
      const statusLabel = animal.status === 'milking' ? 'दूध दे रही' : (animal.status === 'pregnant' ? 'गाभिन' : 'सूखी');
      badgeHtml = `<span class="cattle-badge ${animal.status === 'milking' ? 'badge-milking' : 'badge-dry'}">${statusLabel}</span>`;

      breedingHtml = `
        <div class="breeding-card-actions">
          <button class="btn-card-action primary btn-add-ai" data-aid="${animal.id}">
            🤰 सीमन / AI दर्ज करें
          </button>
        </div>
      `;
    }

    const stats = getAnimalMonthlyMilkingStats(animal.id, currentKhataYear, currentKhataMonth);
    const avgYieldDisplay = animal.status === 'milking' 
      ? `🤖 AI औसत: <strong>${stats.avgDailyMilk} L/दिन</strong> ${stats.milkedDays > 0 ? `(${stats.milkedDays} दिन का दूध)` : ''}`
      : `⚪ ${animal.status === 'pregnant' ? 'गाभिन' : 'सूखी (ड्राई)'}`;

    const forSaleBadge = animal.forSale ? `<span class="badge-for-sale">🔴 बिकाऊ: ₹${((animal.salePrice || Math.round((animal.expectedYield || 8) * 6000)) || 60000).toLocaleString('en-IN')}</span>` : '';

    card.innerHTML = `
      <div class="cattle-main-row">
        <div class="cattle-icon-large ${isCow ? 'cow' : 'buffalo'}" data-edit-animal="${animal.id}" title="फोटो या नाम बदलने के लिए दबाएं">
          ${getAnimalAvatarHtml(animal)}
        </div>
        <div class="cattle-info">
          <div class="cattle-title-row">
            <div class="animal-name">
              ${animal.name}
              ${forSaleBadge}
              <button class="btn-edit-badge" data-edit-animal="${animal.id}">✏️ नाम/फोटो</button>
            </div>
            <div class="cattle-actions">
              ${badgeHtml}
            </div>
          </div>
          <div class="animal-breed">नस्ल: ${animal.breed} • ${avgYieldDisplay}</div>
        </div>
      </div>
      <div class="animal-smart-actions-row">
        <button type="button" class="btn-card-action btn-animal-cal-card" data-aid="${animal.id}">
          📅 दूध कैलेंडर
        </button>
        <button type="button" class="btn-smart-action btn-animal-kundali" data-kundali-aid="${animal.id}" title="डिजिटल पशु कुंडली व हेल्थ कार्ड">
          🪪 कुंडली
        </button>
        <button type="button" class="btn-smart-action btn-feed-optimizer" data-feed-aid="${animal.id}" title="AI संतुलित आहार चार्ट">
          🌾 डाइट
        </button>
        <button type="button" class="btn-smart-action btn-animal-valuation" data-val-aid="${animal.id}" title="AI बाजार भाव कैलकुलेटर">
          🏷️ बाजार भाव
        </button>
        <button type="button" class="btn-smart-action btn-pashu-mela ${animal.forSale ? 'is-active' : ''}" data-mela-aid="${animal.id}" title="डिजिटल पशु मेला - बिकाऊ विज्ञापन बनाएं">
          📢 ${animal.forSale ? 'बिकाऊ कार्ड' : 'बिकाऊ बनाएं'}
        </button>
      </div>
      ${breedingHtml}
    `;

    container.appendChild(card);
  });

  // Animal Calendar Card Button Listeners
  container.querySelectorAll('.btn-animal-cal-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const aid = btn.getAttribute('data-aid');
      openAnimalCalendarModal(aid);
    });
  });

  // Animal Kundali Listeners
  container.querySelectorAll('[data-kundali-aid]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const aid = btn.getAttribute('data-kundali-aid');
      openAnimalKundaliModal(aid);
    });
  });

  // Feed Optimizer Listeners
  container.querySelectorAll('[data-feed-aid]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const aid = btn.getAttribute('data-feed-aid');
      openFeedOptimizerModal(aid);
    });
  });

  // Animal Valuation Listeners
  container.querySelectorAll('[data-val-aid]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const aid = btn.getAttribute('data-val-aid');
      openAnimalValuationModal(aid);
    });
  });

  // Pashu Mela Listeners
  container.querySelectorAll('[data-mela-aid]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const aid = btn.getAttribute('data-mela-aid');
      openPashuMelaModal(aid);
    });
  });

  // Edit Animal Listeners
  container.querySelectorAll('[data-edit-animal]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-edit-animal');
      openEditAnimalModal(id);
    });
  });

  // Breeding Timeline Modal Listeners
  container.querySelectorAll('.btn-view-timeline').forEach(btn => {
    btn.addEventListener('click', () => {
      const brid = btn.getAttribute('data-brid');
      openBreedingDetailsModal(brid);
    });
  });

  // Quick Calve Listeners
  container.querySelectorAll('.btn-quick-calve').forEach(btn => {
    btn.addEventListener('click', () => {
      const brid = btn.getAttribute('data-brid');
      const aid = btn.getAttribute('data-aid');
      openCalvingModal(brid, aid);
    });
  });

  // Add AI Listeners
  container.querySelectorAll('.btn-add-ai').forEach(btn => {
    btn.addEventListener('click', () => {
      const aid = btn.getAttribute('data-aid');
      openAddBreedingModal(aid);
    });
  });
}

function renderBreedingAlerts() {
  const container = document.getElementById('breedingAlertsContainer');
  const list = document.getElementById('breedingAlertsList');
  const countEl = document.getElementById('breedingAlertCount');
  if (!container || !list) return;

  const alerts = [];
  appData.animals.forEach(animal => {
    const activeBr = getActiveBreedingRecord(animal.id);
    if (activeBr) {
      const tl = getBreedingTimeline(activeBr, animal);
      if (tl.alert) {
        alerts.push({
          ...tl.alert,
          animalName: animal.name,
          animalId: animal.id,
          breedingId: activeBr.id
        });
      }
    }
  });

  if (alerts.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  countEl.innerText = alerts.length;
  list.innerHTML = '';

  alerts.forEach(al => {
    const item = document.createElement('div');
    item.className = `breeding-alert-item ${al.level === 'urgent' ? 'urgent' : 'info'}`;
    item.innerHTML = `
      <div class="breeding-alert-text">
        <strong>${al.title}</strong>
        <span>${al.message}</span>
      </div>
      <button class="breeding-alert-act-btn" data-type="${al.type}" data-brid="${al.breedingId}" data-aid="${al.animalId}">
        ${al.actionLabel}
      </button>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('.breeding-alert-act-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      const brid = btn.getAttribute('data-brid');
      const aid = btn.getAttribute('data-aid');

      if (type === 'heat' || type === 'pd') {
        openBreedingDetailsModal(brid);
      } else if (type === 'dry_off') {
        confirmDryOff(brid);
      } else if (type === 'calving_due' || type === 'calving_near') {
        openCalvingModal(brid, aid);
      }
    });
  });
}

// ===================================================================
// MODAL LOGIC: ADD, EDIT & DELETE (ANIMALS & CUSTOMERS)
// ===================================================================

function openAddAnimalModal() {
  document.getElementById('animalForm').reset();
  document.getElementById('animalId').value = '';
  document.getElementById('animalPhotoData').value = '';
  document.getElementById('animalModalTitle').innerText = '🐄 नया पशु जोड़ें';
  document.getElementById('saveAnimalBtn').innerText = '💾 सुरक्षित करें';
  document.getElementById('deleteAnimalBtn').classList.add('hidden');
  
  // Reset photo preview
  document.getElementById('animalPhotoPreview').src = '';
  document.getElementById('animalPhotoPreview').classList.add('hidden');
  document.getElementById('animalPlaceholderIcon').classList.remove('hidden');
  document.getElementById('removeAnimalPhotoBtn').classList.add('hidden');

  document.getElementById('animalModal').classList.remove('hidden');
}

function openEditAnimalModal(animalId) {
  const animal = appData.animals.find(a => a.id === animalId);
  if (!animal) return;

  document.getElementById('animalId').value = animal.id;
  document.getElementById('animalName').value = animal.name;
  document.getElementById('animalBreed').value = animal.breed;
  document.getElementById('animalExpectedYield').value = animal.expectedYield || 6;
  document.getElementById('animalModalTitle').innerText = `✏️ "${animal.name}" का विवरण बदलें`;
  document.getElementById('saveAnimalBtn').innerText = '💾 बदलाव सुरक्षित करें';
  document.getElementById('deleteAnimalBtn').classList.remove('hidden');

  // Set Type radio
  const typeRadio = document.querySelector(`input[name="animalType"][value="${animal.type}"]`);
  if (typeRadio) typeRadio.checked = true;

  // Set Status radio
  const statusRadio = document.querySelector(`input[name="animalStatus"][value="${animal.status}"]`);
  if (statusRadio) statusRadio.checked = true;

  // Set Photo
  document.getElementById('animalPhotoData').value = animal.photo || '';
  if (animal.photo) {
    document.getElementById('animalPhotoPreview').src = animal.photo;
    document.getElementById('animalPhotoPreview').classList.remove('hidden');
    document.getElementById('animalPlaceholderIcon').classList.add('hidden');
    document.getElementById('removeAnimalPhotoBtn').classList.remove('hidden');
  } else {
    document.getElementById('animalPhotoPreview').src = '';
    document.getElementById('animalPhotoPreview').classList.add('hidden');
    document.getElementById('animalPlaceholderIcon').classList.remove('hidden');
    document.getElementById('animalPlaceholderIcon').innerText = animal.type === 'cow' ? '🐄' : '🐃';
    document.getElementById('removeAnimalPhotoBtn').classList.add('hidden');
  }

  document.getElementById('animalModal').classList.remove('hidden');
}

function deleteAnimal(animalId) {
  const animal = appData.animals.find(a => a.id === animalId);
  if (!animal) return;

  const confirmed = confirm(`क्या आप सचमुच "${animal.name}" को फार्म से हटाना चाहते हैं?`);
  if (confirmed) {
    appData.animals = appData.animals.filter(a => a.id !== animalId);
    saveData();
    document.getElementById('animalModal').classList.add('hidden');
    renderMilkingCards();
    renderCattleRegister();
    speakAudio(`${animal.name} को फार्म से हटा दिया गया`);
  }
}

function openAddCustomerModal() {
  document.getElementById('customerForm').reset();
  document.getElementById('customerId').value = '';
  document.getElementById('custPhotoData').value = '';
  document.getElementById('customerModalTitle').innerText = '👤 नया ग्राहक जोड़ें';
  document.getElementById('saveCustomerBtn').innerText = '💾 ग्राहक सेव करें';
  document.getElementById('deleteCustBtn').classList.add('hidden');

  // Reset photo preview
  document.getElementById('custPhotoPreview').src = '';
  document.getElementById('custPhotoPreview').classList.add('hidden');
  document.getElementById('custPlaceholderIcon').classList.remove('hidden');
  document.getElementById('removeCustPhotoBtn').classList.add('hidden');

  document.getElementById('customerModal').classList.remove('hidden');
}

function openEditCustomerModal(customerId) {
  const cust = appData.customers.find(c => c.id === customerId);
  if (!cust) return;

  document.getElementById('customerId').value = cust.id;
  document.getElementById('custName').value = cust.name;
  document.getElementById('custPhone').value = cust.phone;
  document.getElementById('custAddress').value = cust.address || '';
  document.getElementById('custQuotaMorning').value = (cust.quotaMorning !== undefined && cust.quotaMorning !== null) ? cust.quotaMorning : 1.0;
  document.getElementById('custQuotaEvening').value = (cust.quotaEvening !== undefined && cust.quotaEvening !== null) ? cust.quotaEvening : 0.0;
  if (document.getElementById('custSyncMonthQuota')) document.getElementById('custSyncMonthQuota').checked = true;
  document.getElementById('custRate').value = cust.rate || appData.farmSettings.defaultRate;
  document.getElementById('custInitialDues').value = cust.dues || 0;
  document.getElementById('customerModalTitle').innerText = `✏️ "${cust.name}" का विवरण बदलें`;
  document.getElementById('saveCustomerBtn').innerText = '💾 बदलाव सुरक्षित करें';
  document.getElementById('deleteCustBtn').classList.remove('hidden');

  // Set Photo
  document.getElementById('custPhotoData').value = cust.photo || '';
  if (cust.photo) {
    document.getElementById('custPhotoPreview').src = cust.photo;
    document.getElementById('custPhotoPreview').classList.remove('hidden');
    document.getElementById('custPlaceholderIcon').classList.add('hidden');
    document.getElementById('removeCustPhotoBtn').classList.remove('hidden');
  } else {
    document.getElementById('custPhotoPreview').src = '';
    document.getElementById('custPhotoPreview').classList.add('hidden');
    document.getElementById('custPlaceholderIcon').classList.remove('hidden');
    document.getElementById('removeCustPhotoBtn').classList.add('hidden');
  }

  document.getElementById('customerModal').classList.remove('hidden');
}

function deleteCustomer(customerId) {
  const cust = appData.customers.find(c => c.id === customerId);
  if (!cust) return;

  const confirmed = confirm(`क्या आप सचमुच ग्राहक "${cust.name}" को हटाना चाहते हैं?`);
  if (confirmed) {
    appData.customers = appData.customers.filter(c => c.id !== customerId);
    saveData();
    document.getElementById('customerModal').classList.add('hidden');
    renderDeliveryCards();
    renderCustomerKhata();
    speakAudio(`ग्राहक ${cust.name} को हटा दिया गया`);
  }
}

// TAB 5: AI PASHU MITRA KNOWLEDGE BASE (Offline & Instant)
const AI_KNOWLEDGE_BASE = {
  'दूध': `🥛 **दूध और फैट बढ़ाने के आसान देसी उपाय:**\n\n1. **संतुलित दाना:** प्रति 2.5 लीटर दूध पर 1 किलो दाना (खली + चोकर + मक्का दलिया) दें।\n2. **मिनरल मिक्सचर:** रोजाना 50 ग्राम अच्छी कंपनी का मिनरल मिक्सचर चारे में मिलाकर दें। इससे 10 दिन में फैट बढ़ेगा।\n3. **मीठा सोडा (Baking Soda):** रोज 30 ग्राम मीठा सोडा देने से पाचन सही रहता है और दूध पतला नहीं होता।\n4. **साफ व ताजा पानी:** गाय-भैंस को 24 घंटे साफ पानी पीने दें।`,
  
  'गाभिन': `🤰 **गाभिन पशु की विशेष देखभाल:**\n\n1. **ड्राई पीरियड:** ब्याने से 2 महीने पहले दूध निकालना बंद कर दें ताकि बछड़ा तंदुरुस्त हो।\n2. **खुराक:** अंतिम 2 महीनों में 2-3 किलो अतिरिक्त दाना और दलिया दें।\n3. **कैल्शियम व गुड़:** अंतिम 15 दिनों में कैल्शियम और गुड़ का सेवन बढ़ाएं ताकि ब्याने में आसानी हो और जेर आसानी से गिर जाए।`,

  'गर्भाधान': `🤰 **पशु गर्भाधान (AI) के जरूरी नियम:**\n\n1. **सही समय (Golden Rule):** 'सुबह बोले तो शाम को सीमन, और शाम को बोले तो अगली सुबह सीमन' (AM-PM Rule).\n2. **सीमन के बाद:** पशु को 2 घंटे बैठने न दें, ठंडी छाया में रखें।\n3. **21 दिन बाद:** हीट चेक जरूर करें कि पशु दोबारा तो नहीं बोल रहा।\n4. **60-90 दिन:** डॉक्टर से गर्भ जांच (PD Check) करवाकर पक्का करें।`,

  'सीमन': `🧬 **सीमन और बुल का चुनाव:**\n\n1. हमेशा प्रमाणित वीर्य बैंक (जैसे NDDB, Saguna, BAIF) का उच्च गुणवत्ता वाला फ्रोजन सीमन ही इस्तेमाल करें।\n2. भैंस के लिए उच्च वंशावली वाला मुर्रा सीमन और गाय के लिए गिर/साहीवाल/HF सीमन लगाएं।\n3. स्ट्रॉ नंबर और तारीख ऐप में जरूर दर्ज रखें ताकि रिकॉर्ड बना रहे।`,

  'हीट': `🔥 **गाय-भैंस की हीट के मुख्य लक्षण:**\n\n1. बार-बार आवाज देना और बेचैन होना।\n2. योनि से कांच जैसा पारदर्शी, गाढ़ा डिस्चार्ज (तार) गिरना।\n3. दूसरे पशुओं पर चढ़ना या खड़े रहना।\n4. दूध में अचानक कमी।\n💡 *नोट:* भैंसों में अक्सर 'मूक हीट' (Silent Heat) होती है, सुबह-शाम डिस्चार्ज पर विशेष नजर रखें।`,

  'रिपीट': `⚠️ **बार-बार रिपीट होने (Repeat Breeding) के कारण और समाधान:**\n\n1. **गर्भाशय में संक्रमण:** डिस्चार्ज मटमैला हो तो पहले डॉक्टर से गर्भाशय की सफाई करवाएं।\n2. **खनिज लवण की कमी:** रोज 50 ग्राम कीलेटेड मिनरल मिक्सचर दें।\n3. **विटामिन A, D3, E:** प्रजनन क्षमता बढ़ाने के लिए आवश्यक इंजेक्शन या टॉनिक दें।\n4. **सही समय:** हीट शुरू होने के 12 से 18 घंटे के बीच ही सीमन लगवाएं।`,

  'थनैल': `🩺 **थनैल (Mastitis) रोग के लक्षण और प्राथमिक उपचार:**\n\n1. **लक्षण:** थन में सूजन, कड़ापन, दूध में छीछड़े या खून आना।\n2. **प्राथमिक उपचार:**\n   - थन से सारा खराब दूध तुरंत निकालें और फेंक दें।\n   - बर्फ से थन की सिंकाई करें (गर्म पानी न लगाएं)।\n   - पोटैशियम परमैंगनेट (लाल दवा) के हल्के पानी से थन धोएं।\n   - तुरंत पशु चिकित्सक (डॉक्टर) से एंटीबायोटिक लगवाएं।`,

  'टीका': `💉 **टीकाकरण (Vaccination) कैलेंडर:**\n\n1. **FMD (खुरपका-मुंहपका):** साल में दो बार (मई-जून और नवंबर-दिसंबर).\n2. **HS (गलघोंटू):** मानसून शुरू होने से पहले (मई-जून).\n3. **पेट के कीड़े की दवा (Deworming):** हर 3 महीने में एक बार सुबह खाली पेट दें।`
};

function handleAiQuestion(query) {
  const answerCard = document.getElementById('aiAnswerCard');
  const answerBody = document.getElementById('aiAnswerBody');

  const advice = getAiVeterinaryAdvice(query);
  if (advice) {
    if (answerBody && answerCard) {
      answerBody.innerHTML = formatMarkdownForHtml(advice.text);
      answerCard.classList.remove('hidden');
    }
    showAudioToast(advice.audio || advice.title);
    speakAudio(advice.audio || advice.text);
  }
}

// ===================================================================
// EVENT LISTENERS INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs Switching
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Shift Toggle
  document.getElementById('shiftMorningBtn').addEventListener('click', () => setShift('morning'));
  document.getElementById('shiftEveningBtn').addEventListener('click', () => setShift('evening'));

  // Global Voice Mic
  document.getElementById('globalMicBtn').addEventListener('click', () => {
    if (isRecognizing) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  });

  // Audio Toggle
  document.getElementById('audioToggleBtn').addEventListener('click', () => {
    appData.farmSettings.audioFeedback = !appData.farmSettings.audioFeedback;
    document.getElementById('audioIcon').innerText = appData.farmSettings.audioFeedback ? '🔊' : '🔇';
    saveData();
    showAudioToast(appData.farmSettings.audioFeedback ? 'आवाज़ चालू है' : 'आवाज़ बंद है');
  });

  // Voice Help Modal
  document.getElementById('voiceHelpBtn').addEventListener('click', () => {
    document.getElementById('voiceHelpModal').classList.remove('hidden');
  });
  document.getElementById('closeVoiceHelpModalBtn').addEventListener('click', () => {
    document.getElementById('voiceHelpModal').classList.add('hidden');
  });
  document.getElementById('gotVoiceHelpBtn').addEventListener('click', () => {
    document.getElementById('voiceHelpModal').classList.add('hidden');
  });

  // Bulk Deliver All
  document.getElementById('markAllDeliveredBtn').addEventListener('click', () => {
    appData.customers.forEach(c => {
      const defaultQty = currentShift === 'morning' ? c.quotaMorning : c.quotaEvening;
      appData.dailyRecords[currentDateKey].delivery[currentShift][c.id] = {
        status: 'delivered',
        litres: defaultQty
      };
    });
    saveData();
    renderDeliveryCards();
    speakAudio('सभी ग्राहकों को दूध देना दर्ज हो गया');
  });

  // Setup Modals and File Pickers
  setupModals();

  // Initial Render
  updateStatsHeader();
  renderMilkingCards();
  renderDeliveryCards();
  renderCustomerKhata();
  renderCattleRegister();
});

function switchTab(tabId) {
  document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const activeTab = document.getElementById(tabId);
  const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (activeTab) activeTab.classList.add('active');
  if (activeNav) activeNav.classList.add('active');

  if (tabId === 'viewMilking') renderMilkingCards();
  if (tabId === 'viewDelivery') renderDeliveryCards();
  if (tabId === 'viewKhata') renderCustomerKhata();
  if (tabId === 'viewCattle') renderCattleRegister();
}

function setShift(shift, silent = false) {
  currentShift = shift;
  const mBtn = document.getElementById('shiftMorningBtn');
  const eBtn = document.getElementById('shiftEveningBtn');
  if (mBtn) mBtn.classList.toggle('active', shift === 'morning');
  if (eBtn) eBtn.classList.toggle('active', shift === 'evening');
  updateStatsHeader();
  renderMilkingCards();
  renderDeliveryCards();
  if (!silent) {
    speakAudio(shift === 'morning' ? 'सुबह की शिफ्ट चुनी गई' : 'शाम की शिफ्ट चुनी गई');
  }
}

function setupModals() {
  // Animal Photo Picker & Delete
  document.getElementById('animalPhotoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      compressAndStoreImage(file, (dataUrl) => {
        document.getElementById('animalPhotoData').value = dataUrl;
        document.getElementById('animalPhotoPreview').src = dataUrl;
        document.getElementById('animalPhotoPreview').classList.remove('hidden');
        document.getElementById('animalPlaceholderIcon').classList.add('hidden');
        document.getElementById('removeAnimalPhotoBtn').classList.remove('hidden');
      });
    }
  });

  document.getElementById('removeAnimalPhotoBtn').addEventListener('click', () => {
    document.getElementById('animalPhotoData').value = '';
    document.getElementById('animalPhotoPreview').src = '';
    document.getElementById('animalPhotoPreview').classList.add('hidden');
    document.getElementById('animalPlaceholderIcon').classList.remove('hidden');
    document.getElementById('removeAnimalPhotoBtn').classList.add('hidden');
  });

  // Customer Photo Picker & Delete
  document.getElementById('custPhotoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      compressAndStoreImage(file, (dataUrl) => {
        document.getElementById('custPhotoData').value = dataUrl;
        document.getElementById('custPhotoPreview').src = dataUrl;
        document.getElementById('custPhotoPreview').classList.remove('hidden');
        document.getElementById('custPlaceholderIcon').classList.add('hidden');
        document.getElementById('removeCustPhotoBtn').classList.remove('hidden');
      });
    }
  });

  document.getElementById('removeCustPhotoBtn').addEventListener('click', () => {
    document.getElementById('custPhotoData').value = '';
    document.getElementById('custPhotoPreview').src = '';
    document.getElementById('custPhotoPreview').classList.add('hidden');
    document.getElementById('custPlaceholderIcon').classList.remove('hidden');
    document.getElementById('removeCustPhotoBtn').classList.add('hidden');
  });

  // Open Add Animal
  document.getElementById('openAddAnimalModalBtn').addEventListener('click', openAddAnimalModal);
  document.getElementById('addCattleFromTabBtn').addEventListener('click', openAddAnimalModal);
  document.getElementById('closeAnimalModalBtn').addEventListener('click', () => {
    document.getElementById('animalModal').classList.add('hidden');
  });
  document.getElementById('cancelAnimalModalBtn').addEventListener('click', () => {
    document.getElementById('animalModal').classList.add('hidden');
  });
  document.getElementById('deleteAnimalBtn').addEventListener('click', () => {
    const id = document.getElementById('animalId').value;
    if (id) deleteAnimal(id);
  });

  // Animal Form Submit (Add or Edit)
  document.getElementById('animalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const existingId = document.getElementById('animalId').value;
    const type = document.querySelector('input[name="animalType"]:checked').value;
    const name = document.getElementById('animalName').value.trim();
    const breed = document.getElementById('animalBreed').value;
    // Automatic Smart Yield (Manual input removed, computed from type/status or existing records)
    let yieldVal = 0;
    if (existingId) {
      const animal = appData.animals.find(a => a.id === existingId);
      yieldVal = animal ? (animal.expectedYield || (type === 'cow' ? 7 : 8)) : (type === 'cow' ? 7 : 8);
    } else {
      yieldVal = (status === 'milking') ? (type === 'cow' ? 7.0 : 8.0) : 0;
    }
    const photo = document.getElementById('animalPhotoData').value || '';

    if (existingId) {
      // Edit existing animal
      const animal = appData.animals.find(a => a.id === existingId);
      if (animal) {
        animal.name = name;
        animal.type = type;
        animal.breed = breed;
        animal.status = status;
        animal.expectedYield = yieldVal;
        animal.photo = photo;
        speakAudio(`${name} का विवरण बदल दिया गया`);
      }
    } else {
      // Add new animal
      const newAnimal = {
        id: 'a_' + Date.now(),
        name,
        type,
        breed,
        status,
        expectedYield: yieldVal,
        photo
      };
      appData.animals.push(newAnimal);
      speakAudio(`${name} को फार्म में जोड़ दिया गया`);
    }

    saveData();
    document.getElementById('animalModal').classList.add('hidden');
    renderMilkingCards();
    renderCattleRegister();
  });

  // Open Add Customer
  document.getElementById('openAddCustomerModalBtn').addEventListener('click', openAddCustomerModal);
  document.getElementById('closeCustomerModalBtn').addEventListener('click', () => {
    document.getElementById('customerModal').classList.add('hidden');
  });
  document.getElementById('cancelCustomerModalBtn').addEventListener('click', () => {
    document.getElementById('customerModal').classList.add('hidden');
  });
  document.getElementById('deleteCustBtn').addEventListener('click', () => {
    const id = document.getElementById('customerId').value;
    if (id) deleteCustomer(id);
  });

  // Customer Form Submit (Add or Edit)
  document.getElementById('customerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const existingId = document.getElementById('customerId').value;
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const qMInput = document.getElementById('custQuotaMorning').value.trim();
    const qEInput = document.getElementById('custQuotaEvening').value.trim();
    const qM = (qMInput === '' || isNaN(parseFloat(qMInput))) ? 0 : Math.max(0, parseFloat(qMInput));
    const qE = (qEInput === '' || isNaN(parseFloat(qEInput))) ? 0 : Math.max(0, parseFloat(qEInput));
    const rate = parseFloat(document.getElementById('custRate').value) || appData.farmSettings.defaultRate;
    const dues = parseFloat(document.getElementById('custInitialDues').value) || 0;
    const photo = document.getElementById('custPhotoData').value || '';

    const syncCheckbox = document.getElementById('custSyncMonthQuota');
    const shouldSyncMonth = syncCheckbox ? syncCheckbox.checked : true;

    if (existingId) {
      // Edit existing customer
      const cust = appData.customers.find(c => c.id === existingId);
      if (cust) {
        cust.name = name;
        cust.phone = phone;
        cust.address = address;
        cust.quotaMorning = qM;
        cust.quotaEvening = qE;
        cust.rate = rate;
        cust.dues = dues;
        cust.photo = photo;

        if (shouldSyncMonth) {
          syncCustomerMonthRecordsWithQuota(cust.id, currentKhataYear, currentKhataMonth);
        }

        speakAudio(`ग्राहक ${name} का विवरण बदल दिया गया`);
      }
    } else {
      // Add new customer
      const newCust = {
        id: 'c_' + Date.now(),
        name,
        phone,
        address,
        quotaMorning: qM,
        quotaEvening: qE,
        rate,
        dues,
        photo
      };
      appData.customers.push(newCust);
      if (shouldSyncMonth) {
        syncCustomerMonthRecordsWithQuota(newCust.id, currentKhataYear, currentKhataMonth);
      }
      speakAudio(`ग्राहक ${name} को जोड़ दिया गया`);
    }

    saveData();
    document.getElementById('customerModal').classList.add('hidden');
    renderDeliveryCards();
    renderCustomerKhata();
    if (selectedCalCustId) {
      renderCustomerCalendarView();
    }
  });

  // Payment Modal
  document.getElementById('closePaymentModalBtn').addEventListener('click', () => {
    document.getElementById('paymentModal').classList.add('hidden');
  });
  document.getElementById('cancelPaymentModalBtn').addEventListener('click', () => {
    document.getElementById('paymentModal').classList.add('hidden');
  });
  document.getElementById('paymentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const custId = document.getElementById('payCustomerId').value;
    const amount = parseFloat(document.getElementById('payAmount').value) || 0;
    const cust = appData.customers.find(c => c.id === custId);
    if (cust && amount > 0) {
      cust.dues = Math.max(0, (cust.dues || 0) - amount);
      saveData();
      document.getElementById('paymentModal').classList.add('hidden');
      renderCustomerKhata();
      speakAudio(`${cust.name} से ₹${amount} जमा दर्ज हो गए`);
    }
  });

  // Settings Modal
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingFarmName').value = appData.farmSettings.farmName;
    document.getElementById('settingDefaultRate').value = appData.farmSettings.defaultRate;
    document.getElementById('settingUpiId').value = appData.farmSettings.upiId || '';
    document.getElementById('settingFatRate').value = appData.farmSettings.defaultFatRate || 8.0;
    document.getElementById('settingSnfRate').value = appData.farmSettings.defaultSnfRate || 0.0;
    document.getElementById('settingOwnerPhone').value = appData.farmSettings.ownerPhone || '';
    document.getElementById('settingsModal').classList.remove('hidden');
  });
  document.getElementById('closeSettingsModalBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').classList.add('hidden');
  });
  document.getElementById('settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    appData.farmSettings.farmName = document.getElementById('settingFarmName').value.trim();
    appData.farmSettings.defaultRate = parseFloat(document.getElementById('settingDefaultRate').value) || 60;
    appData.farmSettings.defaultFatRate = parseFloat(document.getElementById('settingFatRate').value) || 8.0;
    appData.farmSettings.defaultSnfRate = parseFloat(document.getElementById('settingSnfRate').value) || 0.0;
    appData.farmSettings.upiId = document.getElementById('settingUpiId').value.trim();
    appData.farmSettings.ownerPhone = document.getElementById('settingOwnerPhone').value.trim();
    saveData();
    document.getElementById('settingsModal').classList.add('hidden');
    updateStatsHeader();
    speakAudio('फार्म सेटिंग्स सुरक्षित कर दी गई हैं');
  });

  // Reset Data Handler
  document.getElementById('resetDataBtn').addEventListener('click', () => {
    if (confirm('क्या आप सचमुच सारा डेटा रीसेट करके डिफ़ॉल्ट पर लाना चाहते हैं?')) {
      localStorage.removeItem('dairymitra_db_v1');
      appData = JSON.parse(JSON.stringify(DEFAULT_STATE));
      saveData();
      location.reload();
    }
  });

  // AI Doctor ask
  // AI Doctor ask & Mic
  document.getElementById('aiAskBtn').addEventListener('click', () => {
    const q = document.getElementById('aiQuestionInput').value.trim();
    if (q) handleAiQuestion(q);
  });

  const aiMicBtn = document.getElementById('aiMicBtn');
  if (aiMicBtn) {
    aiMicBtn.addEventListener('click', () => {
      if (isRecognizing) {
        stopVoiceRecognition();
      } else {
        startVoiceRecognition();
      }
    });
  }

  // Quick Topic chips
  document.querySelectorAll('.topic-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      document.getElementById('aiQuestionInput').value = q;
      handleAiQuestion(q);
    });
  });

  // Speak AI answer aloud button
  document.getElementById('speakAnswerBtn').addEventListener('click', () => {
    const text = document.getElementById('aiAnswerBody').innerText;
    speakAudio(text);
  });

  // Filter Pills in Cattle Register
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-filter');
      renderCattleRegister();
    });
  });
  // Breeding Modals Listeners
  const openBreedingBtn = document.getElementById('openAddBreedingModalBtn');
  if (openBreedingBtn) {
    openBreedingBtn.addEventListener('click', () => openAddBreedingModal());
  }

  const closeBreedingBtn = document.getElementById('closeBreedingModalBtn');
  if (closeBreedingBtn) {
    closeBreedingBtn.addEventListener('click', () => {
      document.getElementById('breedingModal').classList.add('hidden');
    });
  }

  const cancelBreedingBtn = document.getElementById('cancelBreedingModalBtn');
  if (cancelBreedingBtn) {
    cancelBreedingBtn.addEventListener('click', () => {
      document.getElementById('breedingModal').classList.add('hidden');
    });
  }

  // Live Calculation Preview triggers
  const animalSelect = document.getElementById('breedingAnimalSelect');
  if (animalSelect) {
    animalSelect.addEventListener('change', updateBreedingCalcPreview);
  }
  const breedingDateInput = document.getElementById('breedingDate');
  if (breedingDateInput) {
    breedingDateInput.addEventListener('input', updateBreedingCalcPreview);
    breedingDateInput.addEventListener('change', updateBreedingCalcPreview);
  }

  // Breeding Form Submit
  const breedingForm = document.getElementById('breedingForm');
  if (breedingForm) {
    breedingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const animalId = document.getElementById('breedingAnimalSelect').value;
      const aiDate = document.getElementById('breedingDate').value;
      const semen = document.getElementById('breedingSemenDetails').value.trim();
      const doctor = document.getElementById('breedingDoctorName').value.trim();
      const phone = document.getElementById('breedingDoctorPhone').value.trim();
      const notes = document.getElementById('breedingNotes').value.trim();

      const animal = appData.animals.find(a => a.id === animalId);
      if (!animal) return;

      // Close any previously active breeding record for this animal
      appData.breedingRecords.forEach(b => {
        if (b.animalId === animalId && b.status === 'active') {
          b.status = 'repeat';
        }
      });

      const newRecord = {
        id: 'br_' + Date.now(),
        animalId: animalId,
        aiDate: aiDate,
        semenDetails: semen || 'साधारण वीर्य',
        doctorName: doctor || '',
        doctorPhone: phone || '',
        status: 'active',
        heatCheckDone: false,
        heatCheckResult: null,
        pdCheckDone: false,
        pdCheckResult: null,
        dryOffDone: false,
        notes: notes
      };

      appData.breedingRecords.push(newRecord);
      saveData();
      document.getElementById('breedingModal').classList.add('hidden');
      renderCattleRegister();

      const heatDate = addDaysToDate(aiDate, 21);
      speakAudio(`${animal.name} का सीमन दर्ज हो गया! 21 दिन बाद ${formatHindiDate(heatDate)} को हीट चेक करें।`);
    });
  }

  // Breeding Details Modal Close
  const closeBreedingDetailsBtn = document.getElementById('closeBreedingDetailsBtn');
  if (closeBreedingDetailsBtn) {
    closeBreedingDetailsBtn.addEventListener('click', () => {
      document.getElementById('breedingDetailsModal').classList.add('hidden');
    });
  }

  // Calving Modal Close
  const closeCalvingBtn = document.getElementById('closeCalvingModalBtn');
  if (closeCalvingBtn) {
    closeCalvingBtn.addEventListener('click', () => {
      document.getElementById('calvingModal').classList.add('hidden');
    });
  }
  const cancelCalvingBtn = document.getElementById('cancelCalvingModalBtn');
  if (cancelCalvingBtn) {
    cancelCalvingBtn.addEventListener('click', () => {
      document.getElementById('calvingModal').classList.add('hidden');
    });
  }

  // Calving Form Submit
  const calvingForm = document.getElementById('calvingForm');
  if (calvingForm) {
    calvingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const animalId = document.getElementById('calvingAnimalId').value;
      const breedingId = document.getElementById('calvingBreedingId').value;
      const calveDate = document.getElementById('calvingDate').value;
      const gender = document.querySelector('input[name="calfGender"]:checked').value;
      const yieldVal = parseFloat(document.getElementById('calvingInitialYield').value) || 8;
      const notes = document.getElementById('calvingNotes').value.trim();

      const animal = appData.animals.find(a => a.id === animalId);
      if (!animal) return;

      if (breedingId) {
        const br = appData.breedingRecords.find(b => b.id === breedingId);
        if (br) {
          br.status = 'calved';
          br.calvedDate = calveDate;
          br.calfGender = gender;
          if (notes) br.notes = (br.notes ? br.notes + ' | ' : '') + notes;
        }
      }

      // Update animal status to milking and update expected yield
      animal.status = 'milking';
      animal.expectedYield = yieldVal;

      // Set today's milking record half in morning and evening
      initTodayRecord();
      const halfYield = Math.round((yieldVal / 2) * 10) / 10;
      appData.dailyRecords[currentDateKey].milking.morning[animal.id] = halfYield;
      appData.dailyRecords[currentDateKey].milking.evening[animal.id] = halfYield;

      saveData();
      document.getElementById('calvingModal').classList.add('hidden');
      renderMilkingCards();
      renderCattleRegister();
      speakAudio(`बधाई हो! ${animal.name} ने ${gender} को जन्म दिया। दूध रिकॉर्ड में चालू हो गया है!`);
    });
  }
}

// ===================================================================
// BREEDING & CALVING MODALS CONTROLLER
// ===================================================================

function openAddBreedingModal(animalId = null) {
  const form = document.getElementById('breedingForm');
  if (form) form.reset();

  const animalSelect = document.getElementById('breedingAnimalSelect');
  animalSelect.innerHTML = '';

  appData.animals.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.innerText = `${a.name} (${a.type === 'cow' ? '🐄 गाय' : '🐃 भैंस'}) - ${a.breed}`;
    if (animalId && a.id === animalId) {
      opt.selected = true;
    }
    animalSelect.appendChild(opt);
  });

  document.getElementById('breedingEditId').value = '';
  document.getElementById('breedingDate').value = getTodayDateKey();
  document.getElementById('breedingModalTitle').innerText = '🤰 नया सीमन / AI दर्ज करें';
  document.getElementById('saveBreedingBtn').innerText = '💾 सीमन सुरक्षित करें';

  updateBreedingCalcPreview();
  document.getElementById('breedingModal').classList.remove('hidden');
}

function updateBreedingCalcPreview() {
  const animalSelect = document.getElementById('breedingAnimalSelect');
  const dateInput = document.getElementById('breedingDate');
  if (!animalSelect || !dateInput) return;

  const animalId = animalSelect.value;
  const dateStr = dateInput.value;
  if (!animalId || !dateStr) return;

  const animal = appData.animals.find(a => a.id === animalId);
  const animalType = animal ? animal.type : 'cow';
  const gestationTotal = getGestationDays(animalType);

  const heatDate = addDaysToDate(dateStr, 21);
  const pdDate = addDaysToDate(dateStr, 60);
  const calvingDate = addDaysToDate(dateStr, gestationTotal);
  const dryDate = addDaysToDate(calvingDate, -60);

  document.getElementById('prevHeatCheckDate').innerText = formatHindiDate(heatDate);
  document.getElementById('prevPdDate').innerText = formatHindiDate(pdDate);
  document.getElementById('prevDryDate').innerText = formatHindiDate(dryDate);
  document.getElementById('prevCalvingDate').innerText = `${formatHindiDate(calvingDate)} (${gestationTotal} दिन)`;
}

function openBreedingDetailsModal(breedingId) {
  const br = appData.breedingRecords.find(b => b.id === breedingId);
  if (!br) return;
  const animal = appData.animals.find(a => a.id === br.animalId);
  if (!animal) return;

  const tl = getBreedingTimeline(br, animal);
  const content = document.getElementById('breedingDetailsContent');
  document.getElementById('timelineModalTitle').innerText = `🤰 ${animal.name} - गर्भाधान टाइमलाइन`;

  const isHeatDone = br.heatCheckDone;
  const isPdDone = br.pdCheckDone;
  const isDryDone = br.dryOffDone;
  const isCalved = br.status === 'calved';

  content.innerHTML = `
    <!-- Hero Status Card -->
    <div class="timeline-hero-card">
      <div class="timeline-hero-top">
        <span class="timeline-animal-title">${animal.name} (${animal.type === 'cow' ? '🐄 गाय' : '🐃 भैंस'} - ${animal.breed})</span>
        <span class="cattle-badge ${tl.stageBadgeClass}">${tl.stageName}</span>
      </div>
      <div class="gestation-progress-bar" style="background: rgba(255,255,255,0.25); height: 10px;">
        <div class="gestation-progress-fill" style="width: ${tl.progressPct}%; background: #34d399;"></div>
      </div>
      <div class="timeline-hero-stats">
        <div class="timeline-stat-cell">
          <span class="timeline-stat-lbl">दिन पूरे</span>
          <span class="timeline-stat-v">${tl.daysElapsed} d</span>
        </div>
        <div class="timeline-stat-cell">
          <span class="timeline-stat-lbl">दिन बाकी</span>
          <span class="timeline-stat-v">${tl.daysRemaining} d</span>
        </div>
        <div class="timeline-stat-cell">
          <span class="timeline-stat-lbl">संभावित डिलीवरी</span>
          <span class="timeline-stat-v">${formatHindiDate(tl.calvingDate)}</span>
        </div>
      </div>
    </div>

    <!-- 5-Step Timeline -->
    <div class="timeline-container">
      
      <!-- Step 1: AI Date -->
      <div class="timeline-step completed">
        <div class="step-marker">✔</div>
        <div class="step-title-row">
          <span class="step-title">1️⃣ सीमन / गर्भाधान तारीख</span>
          <span class="step-date">${formatHindiDate(br.aiDate)}</span>
        </div>
        <div class="step-desc">
          सीमन स्ट्रॉ / बुल: <strong>${br.semenDetails || 'साधारण'}</strong> • डॉक्टर: ${br.doctorName || 'नहीं लिखा'}
          ${br.notes ? `<br><em>नोट: ${br.notes}</em>` : ''}
        </div>
      </div>

      <!-- Step 2: 21-Day Heat Check -->
      <div class="timeline-step ${isHeatDone ? 'completed' : (tl.daysElapsed >= 18 ? 'active' : '')}">
        <div class="step-marker">${isHeatDone ? '✔' : '2'}</div>
        <div class="step-title-row">
          <span class="step-title">2️⃣ 21-दिन हीट चेक (Repeat Check)</span>
          <span class="step-date">${formatHindiDate(tl.heatCheckDate)}</span>
        </div>
        <div class="step-desc">
          ${isHeatDone 
            ? `<span style="color: #10b981; font-weight:700;">✔ हीट चेक सफल: पशु दोबारा नहीं बोला (गाभिन रुका)</span>`
            : `सीमन के 18 से 24 दिन पर ध्यान दें कि क्या पशु दोबारा बोल रहा है?`
          }
        </div>
        ${!isHeatDone ? `
          <div class="step-action-row">
            <button class="btn-step-act success" onclick="confirmHeatPass('${br.id}')">
              ✔ हीट नहीं आई (पशु रुका)
            </button>
            <button class="btn-step-act danger" onclick="markHeatRepeated('${br.id}')">
              ✕ दोबारा बोली (रिपीट AI)
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Step 3: PD Check (60-90 Days) -->
      <div class="timeline-step ${isPdDone ? 'completed' : (tl.daysElapsed >= 60 ? 'active' : '')}">
        <div class="step-marker">${isPdDone ? '✔' : '3'}</div>
        <div class="step-title-row">
          <span class="step-title">3️⃣ गर्भ जांच (PD Check: 60-90 दिन)</span>
          <span class="step-date">${formatHindiDate(tl.pdStartDate)} से ${formatHindiDate(tl.pdEndDate)}</span>
        </div>
        <div class="step-desc">
          ${isPdDone
            ? `<span style="color: #10b981; font-weight:700;">✔ डॉक्टर द्वारा गाभिन सत्यापित (Confirmed Pregnant)</span>`
            : `पशु चिकित्सक (डॉक्टर) से हाथ डलवाकर पक्का करें कि पशु गाभिन है या नहीं।`
          }
        </div>
        ${(!isPdDone && isHeatDone) ? `
          <div class="step-action-row">
            <button class="btn-step-act success" onclick="confirmPdPositive('${br.id}')">
              ✔ डॉक्टर ने गाभिन बताया
            </button>
            <button class="btn-step-act danger" onclick="markPdNegative('${br.id}')">
              ✕ खाली निकली (Not Pregnant)
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Step 4: Dry-Off Period -->
      <div class="timeline-step ${isDryDone ? 'completed' : (tl.daysRemaining <= 60 && !isCalved ? 'active' : '')}">
        <div class="step-marker">${isDryDone ? '✔' : '4'}</div>
        <div class="step-title-row">
          <span class="step-title">4️⃣ दूध सुखाना (Dry Period)</span>
          <span class="step-date">${formatHindiDate(tl.dryOffDate)}</span>
        </div>
        <div class="step-desc">
          ${isDryDone
            ? `<span style="color: #10b981; font-weight:700;">✔ दूध निकालना बंद कर दिया गया है (पशु ड्राई है)</span>`
            : `ब्याने से 2 महीने पहले दूध निकालना बंद कर दें ताकि पेट में पल रहा बच्चा तंदुरुस्त पैदा हो।`
          }
        </div>
        ${(!isDryDone && !isCalved) ? `
          <div class="step-action-row">
            <button class="btn-step-act success" onclick="confirmDryOff('${br.id}')">
              ✔ दूध निकालना बंद किया
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Step 5: Expected Calving -->
      <div class="timeline-step ${isCalved ? 'completed' : (tl.daysRemaining <= 15 ? 'active' : '')}">
        <div class="step-marker">${isCalved ? '✔' : '5'}</div>
        <div class="step-title-row">
          <span class="step-title">5️⃣ प्रसव / ब्याने का दिन (Calving)</span>
          <span class="step-date">${formatHindiDate(tl.calvingDate)}</span>
        </div>
        <div class="step-desc">
          ${isCalved
            ? `<span style="color: #10b981; font-weight:700;">🎉 पशु ब्या चुका है! (${br.calfGender || 'बच्चा'})</span>`
            : `अनुमानित डिलीवरी तारीख: <strong>${formatHindiDate(tl.calvingDate)}</strong> (कुल ${tl.gestationTotal} दिन)।`
          }
        </div>
        ${!isCalved ? `
          <div class="step-action-row">
            <button class="btn-step-act celebrate" onclick="openCalvingModal('${br.id}', '${animal.id}')">
              🎉 पशु ब्या गया (डिलीवरी दर्ज करें)
            </button>
          </div>
        ` : ''}
      </div>

    </div>
  `;

  document.getElementById('breedingDetailsModal').classList.remove('hidden');
}

// Global Timeline Milestone Actions
window.confirmHeatPass = function(breedingId) {
  const br = appData.breedingRecords.find(b => b.id === breedingId);
  if (!br) return;
  br.heatCheckDone = true;
  br.heatCheckResult = 'passed';
  saveData();
  openBreedingDetailsModal(breedingId);
  renderCattleRegister();
  speakAudio('हीट चेक सफल दर्ज हो गया! पशु गाभिन रुका है।');
};

window.markHeatRepeated = function(breedingId) {
  const br = appData.breedingRecords.find(b => b.id === breedingId);
  if (!br) return;
  const animal = appData.animals.find(a => a.id === br.animalId);
  br.status = 'repeat';
  br.heatCheckDone = true;
  br.heatCheckResult = 'repeated';
  saveData();
  document.getElementById('breedingDetailsModal').classList.add('hidden');
  renderCattleRegister();
  speakAudio(`${animal ? animal.name : 'पशु'} का रिपीट दर्ज हो गया। नया सीमन लगा सकते हैं।`);
  if (confirm('पशु दोबारा बोल गया है। क्या नया सीमन (AI) दर्ज करना चाहते हैं?')) {
    openAddBreedingModal(br.animalId);
  }
};

window.confirmPdPositive = function(breedingId) {
  const br = appData.breedingRecords.find(b => b.id === breedingId);
  if (!br) return;
  br.pdCheckDone = true;
  br.pdCheckResult = 'positive';
  const animal = appData.animals.find(a => a.id === br.animalId);
  if (animal) animal.status = 'pregnant';
  saveData();
  openBreedingDetailsModal(breedingId);
  renderCattleRegister();
  speakAudio('बधाई! गर्भ जांच पक्की दर्ज हो गई है।');
};

window.markPdNegative = function(breedingId) {
  const br = appData.breedingRecords.find(b => b.id === breedingId);
  if (!br) return;
  const animal = appData.animals.find(a => a.id === br.animalId);
  br.status = 'repeat';
  br.pdCheckDone = true;
  br.pdCheckResult = 'negative';
  if (animal && animal.status === 'pregnant') animal.status = 'milking';
  saveData();
  document.getElementById('breedingDetailsModal').classList.add('hidden');
  renderCattleRegister();
  speakAudio(`${animal ? animal.name : 'पशु'} खाली दर्ज किया गया।`);
};

window.confirmDryOff = function(breedingId) {
  const br = appData.breedingRecords.find(b => b.id === breedingId);
  if (!br) return;
  br.dryOffDone = true;
  const animal = appData.animals.find(a => a.id === br.animalId);
  if (animal) animal.status = 'dry';
  saveData();
  if (!document.getElementById('breedingDetailsModal').classList.contains('hidden')) {
    openBreedingDetailsModal(breedingId);
  }
  renderCattleRegister();
  speakAudio(`${animal ? animal.name : 'पशु'} का दूध बंद (ड्राई) दर्ज हो गया।`);
};

window.openCalvingModal = function(breedingId, animalId = null) {
  let animal = null;
  let br = null;

  if (breedingId) {
    br = appData.breedingRecords.find(b => b.id === breedingId);
    if (br) animal = appData.animals.find(a => a.id === br.animalId);
  }
  if (!animal && animalId) {
    animal = appData.animals.find(a => a.id === animalId);
  }
  if (!animal) return;

  document.getElementById('calvingAnimalId').value = animal.id;
  document.getElementById('calvingBreedingId').value = br ? br.id : '';
  document.getElementById('calvingAnimalName').innerText = `${animal.name} (${animal.type === 'cow' ? '🐄 गाय' : '🐃 भैंस'})`;
  document.getElementById('calvingDate').value = getTodayDateKey();
  document.getElementById('calvingInitialYield').value = animal.expectedYield || (animal.type === 'cow' ? 8 : 10);
  document.getElementById('calvingNotes').value = '';

  const isCow = animal.type === 'cow';
  const group = document.getElementById('calfGenderRadioGroup');
  group.innerHTML = isCow ? `
    <label class="radio-pill">
      <input type="radio" name="calfGender" value="बछड़ी (Heifer)" checked>
      <span>🐄 बछड़ी (Heifer / मादा)</span>
    </label>
    <label class="radio-pill">
      <input type="radio" name="calfGender" value="बछड़ा (Bull calf)">
      <span>🐂 बछड़ा (Bull / नर)</span>
    </label>
  ` : `
    <label class="radio-pill">
      <input type="radio" name="calfGender" value="कटड़ी (Female calf)" checked>
      <span>🐃 कटड़ी (Female / मादा)</span>
    </label>
    <label class="radio-pill">
      <input type="radio" name="calfGender" value="कटड़ा (Male calf)">
      <span>🐃 कटड़ा (Male / नर)</span>
    </label>
  `;

  document.getElementById('breedingDetailsModal').classList.add('hidden');
  document.getElementById('calvingModal').classList.remove('hidden');
};

function openPaymentModal(customerId) {
  const cust = appData.customers.find(c => c.id === customerId);
  if (!cust) return;
  document.getElementById('payCustomerId').value = cust.id;
  document.getElementById('payCustomerName').innerText = cust.name;
  document.getElementById('payCustomerDue').innerText = `₹${(cust.dues || 0).toLocaleString('en-IN')}`;
  document.getElementById('payAmount').value = cust.dues || '';
  document.getElementById('paymentModal').classList.remove('hidden');
}

// ===================================================================
// FAT & SNF / CLR CALCULATOR & THERMAL MILK SLIP CONTROLLER
// ===================================================================

let currentSlipData = null;

function openFatCalcModal(defaultTarget = '') {
  const sel = document.getElementById('fatCalcSelect');

  if (sel) {
    sel.innerHTML = '';

    // Only Farm Animals (फार्म के दुधारू पशु)
    if (appData.animals && appData.animals.length > 0) {
      appData.animals.forEach(a => {
        const opt = document.createElement('option');
        opt.value = `animal_${a.id}`;
        opt.dataset.type = a.type || 'buffalo';
        opt.dataset.name = a.name;
        const icon = a.type === 'cow' ? '🐄' : '🐃';
        const typeLabel = a.type === 'cow' ? 'गाय' : 'भैंस';
        opt.textContent = `${icon} ${a.name} (${typeLabel})`;
        sel.appendChild(opt);
      });
    } else {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'कोई पशु उपलब्ध नहीं है';
      sel.appendChild(opt);
    }

    // Auto-select match if provided, else default to first animal
    if (defaultTarget) {
      for (let i = 0; i < sel.options.length; i++) {
        const o = sel.options[i];
        if (o.value === defaultTarget || (o.dataset.name && (o.dataset.name === defaultTarget || o.dataset.name.includes(defaultTarget)))) {
          sel.selectedIndex = i;
          break;
        }
      }
    } else if (sel.options.length > 0) {
      sel.selectedIndex = 0;
    }

    syncMilkTypeFromSelection();
  }

  const fatRateInput = document.getElementById('fatRateFactorInput');
  if (fatRateInput) {
    fatRateInput.value = appData.farmSettings.defaultFatRate || 8.0;
  }
  const snfRateInput = document.getElementById('snfRateFactorInput');
  if (snfRateInput) {
    snfRateInput.value = appData.farmSettings.defaultSnfRate || 0.0;
  }

  recalculateFatSlip();
  renderRecentTests();
  document.getElementById('fatCalcModal').classList.remove('hidden');
}

function syncMilkTypeFromSelection() {
  const sel = document.getElementById('fatCalcSelect');
  if (!sel || !sel.options[sel.selectedIndex]) return;
  const opt = sel.options[sel.selectedIndex];
  const type = opt.dataset.type;
  if (type === 'cow' || type === 'buffalo') {
    const radio = document.querySelector(`input[name="fatMilkType"][value="${type}"]`);
    if (radio && !radio.checked) {
      radio.checked = true;
      const fatInput = document.getElementById('fatCalcInput');
      const clrInput = document.getElementById('clrCalcInput');
      if (type === 'cow') {
        if (fatInput && parseFloat(fatInput.value) >= 6.0) fatInput.value = '4.0';
        if (clrInput && parseFloat(clrInput.value) <= 28.5) clrInput.value = '29.0';
      } else {
        if (fatInput && parseFloat(fatInput.value) <= 4.5) fatInput.value = '6.5';
        if (clrInput && parseFloat(clrInput.value) >= 29.0) clrInput.value = '28.5';
      }
    }
  }
}

function recalculateFatSlip() {
  const typeRadio = document.querySelector('input[name="fatMilkType"]:checked');
  const milkType = typeRadio ? typeRadio.value : 'buffalo';
  const litres = Math.max(0.1, parseFloat(document.getElementById('fatCalcLitres').value) || 1.0);
  const fat = Math.max(0.1, parseFloat(document.getElementById('fatCalcInput').value) || 6.5);
  const fatRateFactor = parseFloat(document.getElementById('fatRateFactorInput').value) || 8.0;
  const snfRateFactor = parseFloat(document.getElementById('snfRateFactorInput').value) || 0.0;

  const isClrMode = document.getElementById('methodClrBtn').classList.contains('active');
  let clr = parseFloat(document.getElementById('clrCalcInput').value) || 28.5;
  let snf = 0;

  if (isClrMode) {
    // Standard Richmond Formula: SNF = (CLR / 4) + (0.2 * FAT) + 0.36
    snf = Math.round(((clr / 4) + (0.2 * fat) + 0.36) * 100) / 100;
  } else {
    snf = Math.max(1, parseFloat(document.getElementById('snfCalcInput').value) || 8.8);
    clr = Math.round(((snf - (0.2 * fat) - 0.36) * 4) * 10) / 10;
  }

  let ratePerLitre = Math.round((fat * fatRateFactor) * 100) / 100;
  if (snfRateFactor > 0) {
    ratePerLitre += Math.round((snf * snfRateFactor) * 100) / 100;
  }
  const totalAmount = Math.round((litres * ratePerLitre) * 100) / 100;

  let qualityText = '🟢 शुद्ध व उत्तम';
  let qualityClass = 'badge-quality-good';
  let isAdulterated = false;

  if (snf < 8.0 || clr < 24.0) {
    isAdulterated = true;
    qualityText = '🔴 पानी मिलावट आशंका';
    qualityClass = 'badge-quality-bad';
  } else if ((milkType === 'buffalo' && snf < 8.8) || (milkType === 'cow' && snf < 8.3)) {
    qualityText = '🟡 सामान्य दूध';
    qualityClass = 'badge-quality-std';
  }

  document.getElementById('fatValDisplay').innerText = `${fat.toFixed(1)}%`;
  document.getElementById('resSnfVal').innerText = `${snf.toFixed(2)}%`;
  document.getElementById('resRateVal').innerText = `₹${ratePerLitre.toFixed(2)}`;
  document.getElementById('resTotalVal').innerText = `₹${totalAmount.toFixed(2)}`;

  const qBadge = document.getElementById('fatQualityBadge');
  if (qBadge) {
    qBadge.innerText = qualityText;
    qBadge.className = `quality-badge ${qualityClass}`;
  }

  const alertBox = document.getElementById('adulterationAlert');
  if (alertBox) {
    if (isAdulterated) {
      alertBox.classList.remove('hidden');
    } else {
      alertBox.classList.add('hidden');
    }
  }

  const sel = document.getElementById('fatCalcSelect');
  let nameVal = 'डेयरी पशु';

  if (sel && sel.selectedIndex >= 0 && sel.options[sel.selectedIndex]) {
    const selectedOpt = sel.options[sel.selectedIndex];
    if (selectedOpt.dataset.name) {
      nameVal = `${selectedOpt.dataset.name} (${selectedOpt.dataset.type === 'cow' ? 'गाय' : 'भैंस'})`;
    } else {
      nameVal = selectedOpt.textContent.trim();
    }
  }

  currentSlipData = {
    id: 'mt_' + Date.now(),
    date: currentDateKey,
    time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
    shift: currentShift === 'morning' ? 'सुबह' : 'शाम',
    name: nameVal,
    type: milkType,
    litres: litres,
    fat: fat,
    clr: clr,
    snf: snf,
    rate: ratePerLitre,
    total: totalAmount,
    quality: qualityText
  };
}

function generateMilkSlip() {
  if (!currentSlipData) recalculateFatSlip();
  const d = currentSlipData;
  const farm = appData.farmSettings;

  const box = document.getElementById('thermalReceiptBox');
  if (!box) return;
  box.innerHTML = `
    <div class="thermal-receipt-center">
      <div class="thermal-title">🥛 ${farm.farmName} 🥛</div>
      <div class="thermal-sub">दूध संकलन व टेस्टिंग पर्ची</div>
      <div class="thermal-sub">पर्ची नं: #${d.id.slice(-4)} | ${formatHindiDate(d.date)} (${d.shift})</div>
    </div>
    <div class="thermal-divider"></div>
    <div class="thermal-row">
      <span>पशु का नाम:</span>
      <strong>${d.name}</strong>
    </div>
    <div class="thermal-row">
      <span>दूध प्रकार:</span>
      <strong>${d.type === 'cow' ? '🐄 गाय' : '🐃 भैंस'}</strong>
    </div>
    <div class="thermal-row">
      <span>दूध मात्रा:</span>
      <strong>${d.litres.toFixed(1)} लीटर</strong>
    </div>
    <div class="thermal-divider"></div>
    <div class="thermal-row">
      <span>फैट (FAT):</span>
      <strong>${d.fat.toFixed(1)}%</strong>
    </div>
    <div class="thermal-row">
      <span>लैक्टोमीटर (CLR):</span>
      <strong>${d.clr.toFixed(1)}</strong>
    </div>
    <div class="thermal-row">
      <span>एस.एन.एफ (SNF):</span>
      <strong>${d.snf.toFixed(2)}%</strong>
    </div>
    <div class="thermal-row">
      <span>गुणवत्ता स्थिति:</span>
      <span>${d.quality}</span>
    </div>
    <div class="thermal-divider"></div>
    <div class="thermal-row">
      <span>दूध भाव (Rate):</span>
      <strong>₹${d.rate.toFixed(2)} / L</strong>
    </div>
    <div class="thermal-total-row">
      <span>कुल भुगतान:</span>
      <span>₹${d.total.toFixed(2)}</span>
    </div>
    <div class="thermal-footer">
      डेयरी मित्र (DairyMitra) द्वारा डिजिटल प्रमाणित<br>
      सम्पर्क: ${farm.ownerPhone || 'फार्म संचालक'}
    </div>
  `;

  document.getElementById('milkSlipModal').classList.remove('hidden');
}

function sendWhatsAppMilkSlip() {
  if (!currentSlipData) recalculateFatSlip();
  const d = currentSlipData;
  const farm = appData.farmSettings;

  const msg = `🥛 *${farm.farmName} - दूध संकलन पर्ची* 🥛\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📅 *दिनांक:* ${formatHindiDate(d.date)} (${d.shift})\n` +
    `🐾 *पशु का नाम:* ${d.name}\n` +
    `🥛 *दूध मात्रा:* ${d.litres.toFixed(1)} लीटर (${d.type === 'cow' ? 'गाय' : 'भैंस'})\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🧪 *फैट (FAT):* ${d.fat.toFixed(1)}%\n` +
    `🔬 *लैक्टो (CLR):* ${d.clr.toFixed(1)}\n` +
    `📊 *एस.एन.एफ (SNF):* ${d.snf.toFixed(2)}%\n` +
    `✨ *गुणवत्ता:* ${d.quality}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💰 *दूध का भाव:* ₹${d.rate.toFixed(2)}/लीटर\n` +
    `💵 *कुल भुगतान:* ₹${d.total.toFixed(2)}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `धन्यवाद! 🙏\n_${farm.farmName}_`;

  const encoded = encodeURIComponent(msg);

  let phone = '';
  const matchedCust = appData.customers.find(c => d.name.includes(c.name) || c.name.includes(d.name));
  if (matchedCust && matchedCust.phone) {
    phone = matchedCust.phone.replace(/[^0-9]/g, '');
  }

  const url = phone ? `https://wa.me/91${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  speakAudio('WhatsApp दूध पर्ची तैयार है');
  window.open(url, '_blank');
}

function saveMilkTestRecord() {
  if (!currentSlipData) recalculateFatSlip();
  if (!appData.milkTests) appData.milkTests = [];

  appData.milkTests.unshift(JSON.parse(JSON.stringify(currentSlipData)));
  if (appData.milkTests.length > 50) {
    appData.milkTests = appData.milkTests.slice(0, 50);
  }

  saveData();
  renderRecentTests();
  speakAudio(`${currentSlipData.name} का टेस्ट रिकॉर्ड सेव हो गया`);
  showAudioToast('✅ टेस्ट रिकॉर्ड सुरक्षित हो गया!');
}

function renderRecentTests() {
  const container = document.getElementById('recentTestsList');
  const countLabel = document.getElementById('testCountLabel');
  if (!container) return;

  const tests = (appData.milkTests || []).filter(t => t.date === currentDateKey);
  if (countLabel) countLabel.innerText = tests.length;
  container.innerHTML = '';

  if (tests.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 10px; font-size: 11px;">आज का कोई टेस्ट रिकॉर्ड नहीं है</div>`;
    return;
  }

  tests.forEach(t => {
    const item = document.createElement('div');
    item.className = 'recent-test-item';
    item.innerHTML = `
      <div class="recent-test-left">
        <span class="recent-test-name">${t.name} (${t.litres}L)</span>
        <span class="recent-test-meta">फैट: ${t.fat}% • SNF: ${t.snf}% • ${t.shift}</span>
      </div>
      <div class="recent-test-right">
        <span class="recent-test-total">₹${t.total.toFixed(0)}</span>
        <span class="recent-test-rate">₹${t.rate.toFixed(1)}/L</span>
      </div>
    `;
    item.style.cursor = 'pointer';
    item.title = 'पर्ची देखने के लिए दबाएं';
    item.addEventListener('click', () => {
      currentSlipData = t;
      generateMilkSlip();
    });
    container.appendChild(item);
  });
}

function copySlipToClipboard() {
  const el = document.getElementById('thermalReceiptBox');
  if (!el) return;
  const text = el.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showAudioToast('📋 दूध पर्ची कॉपी हो गई!');
    speakAudio('दूध पर्ची कॉपी हो गई');
  }).catch(() => {
    showAudioToast('कॉपी नहीं हो सकी');
  });
}

// ===================================================================
// RANK 3: CUSTOMER 30-DAY MILK CALENDAR, ATTENDANCE & EXCEL CONTROLLER
// ===================================================================

function openCustomerCalendarModal(custId, year, month) {
  selectedCalCustId = custId;
  selectedCalYear = year || currentKhataYear;
  selectedCalMonth = month || currentKhataMonth;
  renderCustomerCalendarView();
  document.getElementById('customerCalendarModal').classList.remove('hidden');
}

function renderCustomerCalendarView() {
  if (!selectedCalCustId) return;
  const cust = appData.customers.find(c => c.id === selectedCalCustId);
  if (!cust) return;

  const stats = getCustomerMonthlyStats(selectedCalCustId, selectedCalYear, selectedCalMonth);
  const monthName = getHindiMonthName(selectedCalMonth);

  // Customer header info
  const header = document.getElementById('calendarCustHeader');
  if (header) {
    header.innerHTML = `
      <div class="cust-avatar">
        ${getCustomerAvatarHtml(cust)}
      </div>
      <div class="calendar-cust-info">
        <div class="calendar-cust-name">${cust.name}</div>
        <div class="calendar-cust-meta">
          📱 ${cust.phone} • भाव: <strong>₹${cust.rate}/L</strong> • कोटा: ${(cust.quotaMorning + cust.quotaEvening).toFixed(1)} L/दिन (सुबह ${cust.quotaMorning}L + शाम ${cust.quotaEvening}L)
        </div>
      </div>
    `;
  }

  // Month Title
  const monthTitle = document.getElementById('calMonthTitle');
  if (monthTitle) {
    monthTitle.innerText = `${monthName} ${selectedCalYear}`;
  }

  // Stats Highlights
  document.getElementById('calStatTotalLitres').innerText = `${stats.totalLitres.toFixed(1)} L`;
  document.getElementById('calStatDeliveredDays').innerText = `${stats.deliveredDays} दिन`;
  document.getElementById('calStatNagaDays').innerText = `${stats.skippedDays} दिन`;
  document.getElementById('calStatMonthBill').innerText = `₹${stats.monthBill.toLocaleString('en-IN')}`;

  // Naga Alert Banner
  const nagaBanner = document.getElementById('calNagaAlertBanner');
  if (nagaBanner) {
    const today = new Date();
    const isFutureMonth = (selectedCalYear > today.getFullYear() || (selectedCalYear === today.getFullYear() && selectedCalMonth > (today.getMonth() + 1)));

    if (isFutureMonth) {
      nagaBanner.className = 'naga-alert-banner note-neutral';
      nagaBanner.innerHTML = `📅 <strong>${monthName} ${selectedCalYear}:</strong> यह आने वाला भविष्य का महीना है। हाज़िरी केवल वास्तविक दिनों पर ही दर्ज होती है।`;
    } else if (stats.skippedDays > 0) {
      nagaBanner.className = 'naga-alert-banner';
      nagaBanner.innerHTML = `❌ <strong>नागा अलर्ट:</strong> इस माह <strong>${stats.skippedDays} दिन</strong> दूध नहीं लिया गया (तारीख: <strong>${stats.nagaDates.join(', ')}</strong>)`;
    } else if (stats.deliveredDays > 0) {
      nagaBanner.className = 'naga-alert-banner all-ok';
      nagaBanner.innerHTML = `✨ <strong>कोई नागा नहीं:</strong> इस माह अब तक <strong>${stats.deliveredDays} दिन</strong> नियमित दूध सप्लाई रहा!`;
    } else {
      nagaBanner.className = 'naga-alert-banner note-neutral';
      nagaBanner.innerHTML = `📅 <strong>${monthName} ${selectedCalYear}:</strong> इस माह का कोई दूध रिकॉर्ड दर्ज नहीं है। तारीख पर क्लिक करके एंट्री कर सकते हैं।`;
    }
  }

  // 30-Day Grid
  renderCalendarGrid(stats);
}

function renderCalendarGrid(stats) {
  const grid = document.getElementById('calendarDaysGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // Get index of first day of month (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayIndex = new Date(stats.year, stats.month - 1, 1).getDay();

  // Empty cells for offset
  for (let i = 0; i < firstDayIndex; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day-cell cell-empty';
    grid.appendChild(empty);
  }

  // Day cells
  stats.daysArray.forEach(d => {
    const cell = document.createElement('div');
    cell.className = `cal-day-cell cell-${d.status}`;
    cell.setAttribute('data-datekey', d.dateKey);
    cell.setAttribute('data-daynum', d.dayNum);

    let badgeText = `${d.totalLitres} L`;
    let miniShifts = `🌅${d.morningQty} 🌆${d.eveningQty}`;

    if (d.isFuture) {
      badgeText = '-';
      miniShifts = '-';
    } else if (d.status === 'today_pending') {
      badgeText = 'आज चालू';
      miniShifts = 'प्रगति पर';
    } else if (d.status === 'unrecorded') {
      badgeText = '-';
      miniShifts = 'दर्ज नहीं';
    } else if (d.status === 'skipped') {
      badgeText = '0 L';
      miniShifts = '✕ नागा';
    }

    cell.innerHTML = `
      <span class="day-num">${d.dayNum}</span>
      <span class="day-shifts-mini">${miniShifts}</span>
      <span class="day-qty-badge">${badgeText}</span>
    `;

    if (!d.isFuture) {
      cell.title = `${d.dayNum} ${getHindiMonthName(stats.month)}: दूध बदलने या दर्ज करने के लिए क्लिक करें`;
      cell.addEventListener('click', () => {
        openDayEditModal(stats.custId, d.dateKey);
      });
    }

    grid.appendChild(cell);
  });
}

function openDayEditModal(custId, dateKey) {
  const cust = appData.customers.find(c => c.id === custId);
  if (!cust) return;

  const d = new Date(dateKey + 'T00:00:00');
  const dateFormatted = `${d.getDate()} ${getHindiMonthName(d.getMonth() + 1)} ${d.getFullYear()}`;

  document.getElementById('dayEditModalTitle').innerText = `✏️ ${cust.name}: ${dateFormatted} का दूध`;
  document.getElementById('dayEditCustId').value = custId;
  document.getElementById('dayEditDateKey').value = dateKey;

  // Reset scope to single date by default
  const scopeEl = document.getElementById('dayEditApplyScope');
  if (scopeEl) scopeEl.value = 'single';

  let mQty = (cust.quotaMorning !== undefined && cust.quotaMorning !== null) ? cust.quotaMorning : 1.0;
  let eQty = (cust.quotaEvening !== undefined && cust.quotaEvening !== null) ? cust.quotaEvening : 1.0;

  if (appData.dailyRecords[dateKey] && appData.dailyRecords[dateKey].delivery) {
    const m = appData.dailyRecords[dateKey].delivery.morning ? appData.dailyRecords[dateKey].delivery.morning[custId] : null;
    const e = appData.dailyRecords[dateKey].delivery.evening ? appData.dailyRecords[dateKey].delivery.evening[custId] : null;
    if (m !== undefined && m !== null) {
      mQty = parseFloat(m.litres);
      if (isNaN(mQty) || m.status === 'skipped') mQty = 0;
    }
    if (e !== undefined && e !== null) {
      eQty = parseFloat(e.litres);
      if (isNaN(eQty) || e.status === 'skipped') eQty = 0;
    }
  }

  const mStat = (mQty > 0) ? 'delivered' : 'skipped';
  const eStat = (eQty > 0) ? 'delivered' : 'skipped';

  // Set morning controls
  const mRadio = document.querySelector(`input[name="dayEditMorningStatus"][value="${mStat}"]`);
  if (mRadio) mRadio.checked = true;
  document.getElementById('dayEditMorningLitres').value = mQty;
  document.getElementById('dayEditMorningDisplay').innerText = `${mQty} L (${mStat === 'skipped' ? 'नागा' : 'दिया'})`;

  // Set evening controls
  const eRadio = document.querySelector(`input[name="dayEditEveningStatus"][value="${eStat}"]`);
  if (eRadio) eRadio.checked = true;
  document.getElementById('dayEditEveningLitres').value = eQty;
  document.getElementById('dayEditEveningDisplay').innerText = `${eQty} L (${eStat === 'skipped' ? 'नागा' : 'दिया'})`;

  document.getElementById('dayEditModal').classList.remove('hidden');
}

function saveDayEdit(e) {
  if (e) e.preventDefault();
  const custId = document.getElementById('dayEditCustId').value;
  const dateKey = document.getElementById('dayEditDateKey').value;
  const cust = appData.customers.find(c => c.id === custId);
  if (!cust || !dateKey) return;

  const mStatRadio = document.querySelector('input[name="dayEditMorningStatus"]:checked');
  let mStat = mStatRadio ? mStatRadio.value : 'delivered';
  let mQtyRaw = parseFloat(document.getElementById('dayEditMorningLitres').value);
  let mQty = isNaN(mQtyRaw) || mQtyRaw < 0 ? 0 : mQtyRaw;
  if (mStat === 'skipped' || mQty === 0) {
    mQty = 0;
    mStat = 'skipped';
  } else {
    mStat = 'delivered';
  }

  const eStatRadio = document.querySelector('input[name="dayEditEveningStatus"]:checked');
  let eStat = eStatRadio ? eStatRadio.value : 'delivered';
  let eQtyRaw = parseFloat(document.getElementById('dayEditEveningLitres').value);
  let eQty = isNaN(eQtyRaw) || eQtyRaw < 0 ? 0 : eQtyRaw;
  if (eStat === 'skipped' || eQty === 0) {
    eQty = 0;
    eStat = 'skipped';
  } else {
    eStat = 'delivered';
  }

  const scopeEl = document.getElementById('dayEditApplyScope');
  const scope = scopeEl ? scopeEl.value : 'single';

  const applyToDate = (targetDateKey) => {
    if (!appData.dailyRecords[targetDateKey]) {
      appData.dailyRecords[targetDateKey] = {
        milking: { morning: {}, evening: {} },
        delivery: { morning: {}, evening: {} }
      };
    }
    if (!appData.dailyRecords[targetDateKey].delivery) {
      appData.dailyRecords[targetDateKey].delivery = { morning: {}, evening: {} };
    }
    if (!appData.dailyRecords[targetDateKey].delivery.morning) {
      appData.dailyRecords[targetDateKey].delivery.morning = {};
    }
    if (!appData.dailyRecords[targetDateKey].delivery.evening) {
      appData.dailyRecords[targetDateKey].delivery.evening = {};
    }

    appData.dailyRecords[targetDateKey].delivery.morning[custId] = {
      status: mStat,
      litres: mQty
    };
    appData.dailyRecords[targetDateKey].delivery.evening[custId] = {
      status: eStat,
      litres: eQty
    };
  };

  if (scope === 'single') {
    applyToDate(dateKey);
  } else {
    const parts = dateKey.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const currentDay = parseInt(parts[2], 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = (today.getFullYear() === year && (today.getMonth() + 1) === month);
    const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;

    const todayKey = getTodayDateKey();
    const startDay = (scope === 'from_this_day') ? currentDay : 1;
    for (let d = startDay; d <= maxDay; d++) {
      const dK = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (dK > todayKey) continue;
      applyToDate(dK);
    }
  }

  saveData();
  document.getElementById('dayEditModal').classList.add('hidden');
  renderCustomerCalendarView();
  renderCustomerKhata();
  renderDeliveryCards();
  showAudioToast('💾 दूध रिकॉर्ड अपडेट हो गया!');
  speakAudio('तारीख का दूध अपडेट हो गया');
}

// ===================================================================
// RANK 4: ANIMAL 30-DAY MILK CALENDAR, AI ANALYTICS & EXCEL CONTROLLER
// ===================================================================

function openAnimalCalendarModal(animalId, year, month) {
  if (animalId) {
    selectedCalAnimalId = animalId;
  } else if (!selectedCalAnimalId) {
    selectedCalAnimalId = appData.animals[0] ? appData.animals[0].id : null;
  }
  selectedAnimalCalYear = year || selectedAnimalCalYear || currentKhataYear;
  selectedAnimalCalMonth = month || selectedAnimalCalMonth || currentKhataMonth;

  if (!selectedCalAnimalId) {
    showAudioToast('कृपया पहले कोई पशु जोड़ें!');
    return;
  }

  const animal = appData.animals.find(a => a.id === selectedCalAnimalId);
  if (!animal) return;

  // Populate animal dropdown selector
  const select = document.getElementById('animalCalSelect');
  if (select) {
    select.innerHTML = appData.animals.map(a => 
      `<option value="${a.id}" ${a.id === selectedCalAnimalId ? 'selected' : ''}>${a.type === 'cow' ? '🐄' : '🐃'} ${a.name} (${a.breed})</option>`
    ).join('');
  }

  // Update avatar
  const avatar = document.getElementById('animalCalAvatar');
  if (avatar) avatar.innerHTML = getAnimalAvatarHtml(animal);

  // Update Status Badge
  const statusBadge = document.getElementById('animalCalStatusBadge');
  if (statusBadge) {
    const isMilking = animal.status === 'milking';
    statusBadge.className = `cattle-badge ${isMilking ? 'badge-milking' : 'badge-dry'}`;
    statusBadge.innerText = isMilking ? '🥛 दूध दे रही' : (animal.status === 'pregnant' ? '🤰 गाभिन' : '🍂 सूखी (ड्राई)');
  }

  // Update Meta
  const meta = document.getElementById('animalCalMeta');
  if (meta) {
    meta.innerText = `नस्ल: ${animal.breed} | प्रकार: ${animal.type === 'cow' ? 'गाय' : 'भैंस'} | स्थिति: ${animal.status === 'milking' ? 'दूध चालू' : 'ड्राई'}`;
  }

  // Month Title
  const monthName = getHindiMonthName(selectedAnimalCalMonth);
  const titleEl = document.getElementById('animalCalMonthTitle');
  if (titleEl) titleEl.innerText = `${monthName} ${selectedAnimalCalYear}`;

  // Calculate monthly stats
  const stats = getAnimalMonthlyMilkingStats(selectedCalAnimalId, selectedAnimalCalYear, selectedAnimalCalMonth);

  // Update AI Stat Cards
  document.getElementById('animalCalStatAvg').innerText = `${stats.avgDailyMilk} L/दिन`;
  document.getElementById('animalCalStatTotal').innerText = `${stats.totalLitres.toFixed(1)} L`;
  document.getElementById('animalCalStatTrend').innerText = stats.trend;
  document.getElementById('animalCalStatShifts').innerText = `🌅 ${stats.morningTotal}L / 🌆 ${stats.eveningTotal}L`;
  document.getElementById('animalCalStatDays').innerText = `${stats.milkedDays} दिन`;
  document.getElementById('animalCalStatPeak').innerText = stats.highestYield.litres > 0 
    ? `${stats.highestYield.litres} L (${stats.highestYield.dayNum} ${monthName})` 
    : '-';

  // Render 30-Day Grid
  renderAnimalCalendarDays(stats);

  document.getElementById('animalCalendarModal').classList.remove('hidden');
}

function renderAnimalCalendarDays(stats) {
  const grid = document.getElementById('animalCalendarDaysGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const firstDayIndex = new Date(selectedAnimalCalYear, selectedAnimalCalMonth - 1, 1).getDay();

  // Empty offset cells
  for (let i = 0; i < firstDayIndex; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day-cell cell-empty';
    grid.appendChild(empty);
  }

  stats.daysArray.forEach(d => {
    const cell = document.createElement('div');
    cell.className = `cal-day-cell cell-${d.status}`;
    cell.setAttribute('data-aid', stats.animalId);
    cell.setAttribute('data-datekey', d.dateKey);

    let badgeText = `${d.totalLitres} L`;
    let subText = `🌅${d.morningQty} 🌆${d.eveningQty}`;

    if (d.isFuture) {
      badgeText = '-';
      subText = '-';
    } else if (d.status === 'today_pending') {
      badgeText = 'आज चालू';
      subText = 'प्रगति पर';
    } else if (d.status === 'unrecorded') {
      badgeText = '-';
      subText = 'दर्ज नहीं';
    } else if (d.totalLitres === 0) {
      badgeText = '0 L';
      subText = 'सूखा/0L';
    }

    const badgeStyle = (d.status === 'dry' && !d.isFuture) ? 'background: #dc2626; color: #fff;' : '';

    cell.innerHTML = `
      <span class="day-num">${d.dayNum}</span>
      <span class="day-shifts-mini" style="font-size: 8px;">${subText}</span>
      <span class="day-qty-badge" style="${badgeStyle}">${badgeText}</span>
    `;

    if (!d.isFuture) {
      cell.title = `${d.dayNum} ${getHindiMonthName(selectedAnimalCalMonth)}: दूध बदलने या दर्ज करने के लिए दबाएं`;
      cell.addEventListener('click', () => {
        openAnimalDayEditModal(stats.animalId, d.dateKey);
      });
    }

    grid.appendChild(cell);
  });
}

function openAnimalDayEditModal(animalId, dateKey) {
  const animal = appData.animals.find(a => a.id === animalId);
  if (!animal) return;

  const d = new Date(dateKey + 'T00:00:00');
  const dateFormatted = `${d.getDate()} ${getHindiMonthName(d.getMonth() + 1)} ${d.getFullYear()}`;

  document.getElementById('animalDayEditModalTitle').innerText = `✏️ ${animal.name}: ${dateFormatted} का दूध`;
  document.getElementById('animalDayEditAnimalId').value = animalId;
  document.getElementById('animalDayEditDateKey').value = dateKey;

  const scopeEl = document.getElementById('animalDayEditApplyScope');
  if (scopeEl) scopeEl.value = 'single';

  let mQty = 0;
  let eQty = 0;

  if (appData.dailyRecords[dateKey] && appData.dailyRecords[dateKey].milking) {
    mQty = parseFloat(appData.dailyRecords[dateKey].milking.morning ? appData.dailyRecords[dateKey].milking.morning[animalId] : 0) || 0;
    eQty = parseFloat(appData.dailyRecords[dateKey].milking.evening ? appData.dailyRecords[dateKey].milking.evening[animalId] : 0) || 0;
  }

  document.getElementById('animalDayEditMorningQty').value = mQty.toFixed(1);
  document.getElementById('animalDayEditMorningDisplay').innerText = `${mQty.toFixed(1)} L`;

  document.getElementById('animalDayEditEveningQty').value = eQty.toFixed(1);
  document.getElementById('animalDayEditEveningDisplay').innerText = `${eQty.toFixed(1)} L`;

  document.getElementById('animalDayEditModal').classList.remove('hidden');
}

function saveAnimalDayEdit(e) {
  if (e) e.preventDefault();
  const animalId = document.getElementById('animalDayEditAnimalId').value;
  const dateKey = document.getElementById('animalDayEditDateKey').value;
  const animal = appData.animals.find(a => a.id === animalId);
  if (!animal || !dateKey) return;

  let mQty = Math.max(0, parseFloat(document.getElementById('animalDayEditMorningQty').value) || 0);
  let eQty = Math.max(0, parseFloat(document.getElementById('animalDayEditEveningQty').value) || 0);
  mQty = Math.round(mQty * 10) / 10;
  eQty = Math.round(eQty * 10) / 10;

  const scopeEl = document.getElementById('animalDayEditApplyScope');
  const scope = scopeEl ? scopeEl.value : 'single';

  const applyToDate = (dK) => {
    if (!appData.dailyRecords[dK]) {
      appData.dailyRecords[dK] = {
        milking: { morning: {}, evening: {} },
        delivery: { morning: {}, evening: {} }
      };
    }
    if (!appData.dailyRecords[dK].milking) {
      appData.dailyRecords[dK].milking = { morning: {}, evening: {} };
    }
    if (!appData.dailyRecords[dK].milking.morning) appData.dailyRecords[dK].milking.morning = {};
    if (!appData.dailyRecords[dK].milking.evening) appData.dailyRecords[dK].milking.evening = {};

    appData.dailyRecords[dK].milking.morning[animalId] = mQty;
    appData.dailyRecords[dK].milking.evening[animalId] = eQty;
  };

  if (scope === 'single') {
    applyToDate(dateKey);
  } else {
    const parts = dateKey.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const currentDay = parseInt(parts[2], 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = (today.getFullYear() === year && (today.getMonth() + 1) === month);
    const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;

    const todayKey = getTodayDateKey();
    const startDay = (scope === 'from_this_day') ? currentDay : 1;
    for (let d = startDay; d <= maxDay; d++) {
      const dK = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (dK > todayKey) continue;
      applyToDate(dK);
    }
  }

  saveData();
  document.getElementById('animalDayEditModal').classList.add('hidden');
  openAnimalCalendarModal(animalId, selectedAnimalCalYear, selectedAnimalCalMonth);
  renderMilkingCards();
  renderCattleRegister();
  showAudioToast(`🥛 ${animal.name} का दूध रिकॉर्ड अपडेट हो गया!`);
  speakAudio('पशु का दूध रिकॉर्ड अपडेट हो गया');
}

// Genuine Excel (.xls) Export for Single Animal Milking
function exportAnimalMilkingExcel(animalId, year = selectedAnimalCalYear, month = selectedAnimalCalMonth) {
  const animal = appData.animals.find(a => a.id === animalId);
  if (!animal) return;
  const stats = getAnimalMonthlyMilkingStats(animalId, year, month);
  const monthName = getHindiMonthName(month);
  const farm = appData.farmSettings;

  let rowsHtml = '';
  stats.daysArray.forEach((d, idx) => {
    if (d.isFuture) {
      rowsHtml += `<tr><td style="text-align:center;">${idx + 1}</td><td style="text-align:center;">${d.dayNum} ${monthName}</td><td style="text-align:center;">-</td><td style="text-align:center;">-</td><td style="text-align:center;">-</td><td style="text-align:center;color:#94a3b8;">आने वाले दिन</td></tr>`;
    } else if (d.status === 'unrecorded') {
      const dateObj = new Date(d.dateKey + 'T00:00:00');
      const dayName = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'][dateObj.getDay()];
      rowsHtml += `<tr>
        <td style="text-align:center;border:1px solid #cbd5e1;">${idx + 1}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${d.dayNum} ${monthName} ${year}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${dayName}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;color:#94a3b8;">-</td>
        <td style="text-align:center;border:1px solid #cbd5e1;color:#94a3b8;">-</td>
        <td style="text-align:center;border:1px solid #cbd5e1;color:#94a3b8;">-</td>
      </tr>`;
    } else {
      const dateObj = new Date(d.dateKey + 'T00:00:00');
      const dayName = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'][dateObj.getDay()];
      const isDry = d.totalLitres === 0;
      const rowStyle = isDry ? 'background:#fee2e2;color:#991b1b;' : 'background:#ffffff;';

      rowsHtml += `<tr style="${rowStyle}">
        <td style="text-align:center;border:1px solid #cbd5e1;">${idx + 1}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${d.dayNum} ${monthName} ${year}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${dayName}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${d.morningQty} L</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${d.eveningQty} L</td>
        <td style="text-align:center;border:1px solid #cbd5e1;font-weight:bold;color:#047857;">${d.totalLitres} L</td>
      </tr>`;
    }
  });

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <style>
        body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #047857; color: #ffffff; border: 1px solid #065f46; padding: 6px; font-weight: bold; }
        td { border: 1px solid #cbd5e1; padding: 5px; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="6" style="font-size:16pt;font-weight:bold;color:#047857;text-align:center;padding:10px;">${farm.farmName} - पशु 30-दिन दूध दोहन व AI रिपोर्ट</td></tr>
        <tr><td colspan="6" style="font-size:11pt;color:#475569;text-align:center;">📱 सम्पर्क: ${farm.ownerPhone}</td></tr>
        <tr><td colspan="3" style="font-weight:bold;">पशु का नाम: ${animal.name} (${animal.type === 'cow' ? 'गाय' : 'भैंस'})</td><td colspan="3"><strong>माह:</strong> ${monthName} ${year}</td></tr>
        <tr><td colspan="3"><strong>नस्ल (Breed):</strong> ${animal.breed}</td><td colspan="3"><strong>स्थिति:</strong> ${animal.status === 'milking' ? 'दूध दे रही' : 'ड्राई/गाभिन'}</td></tr>
        <tr><td colspan="3" style="color:#047857;font-weight:bold;"><strong>🤖 AI औसत दैनिक दूध:</strong> ${stats.avgDailyMilk} L/दिन</td><td colspan="3"><strong>दूध ट्रेंड:</strong> ${stats.trend}</td></tr>
        <tr><td colspan="6"></td></tr>
        <tr>
          <th style="background:#047857;color:#fff;">क्र.सं.</th>
          <th style="background:#047857;color:#fff;">तारीख</th>
          <th style="background:#047857;color:#fff;">दिन</th>
          <th style="background:#047857;color:#fff;">🌅 सुबह दूध</th>
          <th style="background:#047857;color:#fff;">🌆 शाम दूध</th>
          <th style="background:#047857;color:#fff;">🥛 कुल दूध (दिन)</th>
        </tr>
        ${rowsHtml}
        <tr style="background:#fef3c7;font-weight:bold;">
          <td colspan="3" style="text-align:right;border:1px solid #cbd5e1;">कुल योग (Total Milk):</td>
          <td style="text-align:center;border:1px solid #cbd5e1;">${stats.morningTotal} L</td>
          <td style="text-align:center;border:1px solid #cbd5e1;">${stats.eveningTotal} L</td>
          <td style="text-align:center;border:1px solid #cbd5e1;color:#047857;font-size:12pt;">${stats.totalLitres.toFixed(1)} L</td>
        </tr>
        <tr><td colspan="6"></td></tr>
        <tr><td colspan="4" style="text-align:right;">दूध दोहन के सक्रिय दिन:</td><td colspan="2" style="font-weight:bold;">${stats.milkedDays} दिन</td></tr>
        <tr><td colspan="4" style="text-align:right;">सूखे/नागा दिन:</td><td colspan="2" style="font-weight:bold;color:#b91c1c;">${stats.dryDays} दिन</td></tr>
        <tr><td colspan="4" style="text-align:right;">सर्वश्रेष्ठ दिन का दूध (Peak Yield):</td><td colspan="2" style="font-weight:bold;color:#b45309;">${stats.highestYield.litres > 0 ? `${stats.highestYield.litres} L (${stats.highestYield.dayNum} ${monthName})` : '-'}</td></tr>
        <tr style="background:#f0fdf4;font-weight:bold;font-size:12pt;"><td colspan="4" style="text-align:right;">🤖 AI दैनिक औसत दूध:</td><td colspan="2" style="color:#047857;">${stats.avgDailyMilk} L/दिन</td></tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${animal.name}_Milking_Report_${monthName}_${year}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAudioToast(`📊 ${animal.name} की Excel (.xls) रिपोर्ट डाउनलोड हो गई!`);
  speakAudio(`${animal.name} की एक्सेल रिपोर्ट डाउनलोड हो गई`);
}

// 1-Click WhatsApp 30-Day Attendance & Naga Audit Statement
function sendWhatsAppCalendarStatement(custId, year, month) {
  const cust = appData.customers.find(c => c.id === custId);
  if (!cust) return;
  const stats = getCustomerMonthlyStats(custId, year, month);
  const farm = appData.farmSettings;
  const monthName = getHindiMonthName(month);

  const nagaText = stats.nagaDates.length > 0 
    ? `❌ *नागा (छुट्टी वाले दिन):* ${stats.skippedDays} दिन (तारीख: ${stats.nagaDates.join(', ')})`
    : `✨ *नागा (छुट्टी):* 0 दिन (पूरे माह नियमित दूध लिया)`;

  const msg = `🥛 *${farm.farmName} - 30-दिन दूध व हाज़िरी विवरण* 🥛\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 *ग्राहक:* ${cust.name}\n` +
    `📅 *महीना:* ${monthName} ${year}\n` +
    `🥛 *रोज़ाना कोटा:* ${(cust.quotaMorning + cust.quotaEvening).toFixed(1)} L (सुबह ${cust.quotaMorning}L + शाम ${cust.quotaEvening}L)\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `✅ *दूध दिया गया:* ${stats.deliveredDays} दिन\n` +
    `${nagaText}\n` +
    `🥛 *कुल दूध मात्रा:* ${stats.totalLitres.toFixed(1)} लीटर\n` +
    `💰 *दूध का भाव:* ₹${cust.rate}/लीटर\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💵 *इस माह का बिल:* ₹${stats.monthBill.toLocaleString('en-IN')}\n` +
    (cust.dues > 0 ? `➕ *पिछला बकाया:* ₹${(cust.dues).toLocaleString('en-IN')}\n` : '') +
    `🏷️ *कुल शुद्ध देय:* ₹${stats.totalPayable.toLocaleString('en-IN')}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📲 UPI ID: *${farm.upiId}*\n` +
    `_नागा या दूध मात्रा के मिलान हेतु यह आधिकारिक विवरण है।_\n` +
    `धन्यवाद! 🙏\n_${farm.farmName}_`;

  const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
  const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
  showAudioToast('💬 WhatsApp खुल रहा है! PDF जोड़ने के लिए 📎 पिन दबाएँ');
  speakAudio(`${cust.name} का 30-दिन WhatsApp विवरण तैयार है`);
  window.open(url, '_blank');
}

// Digital 30-Day Bill & PDF Statement Modal View (फोन में आसानी से खुलने वाली रसीद)
function openCustomerStatementModal(custId = selectedCalCustId, year = selectedCalYear, month = selectedCalMonth) {
  selectedCalCustId = custId || selectedCalCustId;
  selectedCalYear = year || selectedCalYear;
  selectedCalMonth = month || selectedCalMonth;

  const cust = appData.customers.find(c => c.id === selectedCalCustId);
  if (!cust) return;

  const stats = getCustomerMonthlyStats(selectedCalCustId, selectedCalYear, selectedCalMonth);
  const farm = appData.farmSettings;
  const monthName = getHindiMonthName(selectedCalMonth);

  const sheet = document.getElementById('customerStatementSheet');
  if (!sheet) return;

  let tableRows = '';
  stats.daysArray.forEach((d, idx) => {
    if (d.isFuture) {
      tableRows += `
        <tr style="opacity: 0.6; background: #f8fafc;">
          <td>${idx + 1}</td>
          <td>${d.dayNum} ${monthName}</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td><span style="font-size: 10px; color: #94a3b8;">आने वाले दिन</span></td>
          <td>-</td>
        </tr>
      `;
    } else if (d.status === 'unrecorded') {
      const dateObj = new Date(d.dateKey + 'T00:00:00');
      const dayName = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'][dateObj.getDay()];
      tableRows += `
        <tr style="color: #94a3b8; background: #ffffff;">
          <td><strong>${idx + 1}</strong></td>
          <td>${d.dayNum} ${monthName}</td>
          <td>${dayName}</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td><span style="font-size: 10px; color: #94a3b8; border: 1px dashed #cbd5e1; padding: 2px 6px; border-radius: 4px;">दर्ज नहीं</span></td>
          <td>₹0</td>
        </tr>
      `;
    } else if (d.status === 'today_pending') {
      const dateObj = new Date(d.dateKey + 'T00:00:00');
      const dayName = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'][dateObj.getDay()];
      tableRows += `
        <tr style="background: #eff6ff; color: #1d4ed8;">
          <td><strong>${idx + 1}</strong></td>
          <td>${d.dayNum} ${monthName}</td>
          <td>${dayName}</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td><span style="font-size: 10px; color: #1d4ed8; font-weight: bold;">आज चालू</span></td>
          <td>₹0</td>
        </tr>
      `;
    } else {
      const dateObj = new Date(d.dateKey + 'T00:00:00');
      const dayName = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'][dateObj.getDay()];
      const isSkip = d.status === 'skipped';
      const dayAmt = Math.round(d.totalLitres * cust.rate);

      tableRows += `
        <tr class="${isSkip ? 'row-skipped' : 'row-delivered'}">
          <td><strong>${idx + 1}</strong></td>
          <td>${d.dayNum} ${monthName}</td>
          <td>${dayName}</td>
          <td>${d.morningQty}</td>
          <td>${d.eveningQty}</td>
          <td><strong>${d.totalLitres} L</strong></td>
          <td>
            <span class="${isSkip ? 'stmt-badge-skip' : 'stmt-badge-ok'}">
              ${isSkip ? '✕ नागा' : '✔ दिया'}
            </span>
          </td>
          <td><strong>₹${dayAmt}</strong></td>
        </tr>
      `;
    }
  });

  sheet.innerHTML = `
    <div class="stmt-header">
      <div class="stmt-farm-name">🥛 ${farm.farmName} 🥛</div>
      <div class="stmt-farm-sub">30-दिन आधिकारिक दूध हाज़िरी व मासिक बिल स्टेटमेंट</div>
      <div class="stmt-farm-sub">📱 सम्पर्क: ${farm.ownerPhone || '-'} | 📲 UPI ID: <strong>${farm.upiId || '-'}</strong></div>
    </div>

    <div class="stmt-cust-box">
      <div class="stmt-cust-row">
        <span>👤 <strong>ग्राहक:</strong> ${cust.name}</span>
        <span>📅 <strong>बिलिंग माह:</strong> ${monthName} ${selectedCalYear}</span>
      </div>
      <div class="stmt-cust-row">
        <span>📱 <strong>मोबाइल:</strong> ${cust.phone}</span>
        <span>💰 <strong>दूध भाव:</strong> ₹${cust.rate} / लीटर</span>
      </div>
      <div class="stmt-cust-row">
        <span>🥛 <strong>दैनिक कोटा:</strong> ${(cust.quotaMorning + cust.quotaEvening).toFixed(1)} L/दिन (सुबह ${cust.quotaMorning}L + शाम ${cust.quotaEvening}L)</span>
        <span>🗓️ <strong>जारी दिनांक:</strong> ${formatHindiDate(getTodayDateKey())}</span>
      </div>
    </div>

    <div class="stmt-summary-grid">
      <div class="stmt-summary-cell highlight-green">
        <span class="stmt-summary-lbl">कुल दूध मात्रा</span>
        <span class="stmt-summary-val" style="color: #047857;">${stats.totalLitres.toFixed(1)} L</span>
      </div>
      <div class="stmt-summary-cell highlight-green">
        <span class="stmt-summary-lbl">दूध सप्लाई दिन</span>
        <span class="stmt-summary-val" style="color: #047857;">${stats.deliveredDays} दिन</span>
      </div>
      <div class="stmt-summary-cell highlight-red">
        <span class="stmt-summary-lbl">नागा (छुट्टी)</span>
        <span class="stmt-summary-val" style="color: #b91c1c;">${stats.skippedDays} दिन</span>
      </div>
      <div class="stmt-summary-cell highlight-gold">
        <span class="stmt-summary-lbl">इस माह का बिल</span>
        <span class="stmt-summary-val">₹${stats.monthBill.toLocaleString('en-IN')}</span>
      </div>
      <div class="stmt-summary-cell">
        <span class="stmt-summary-lbl">पिछला बकाया</span>
        <span class="stmt-summary-val" style="color: #b91c1c;">₹${(cust.dues || 0).toLocaleString('en-IN')}</span>
      </div>
      <div class="stmt-summary-cell highlight-gold" style="border: 2px solid #f59e0b;">
        <span class="stmt-summary-lbl">कुल शुद्ध देय</span>
        <span class="stmt-summary-val" style="font-size: 15px; color: #b45309;">₹${stats.totalPayable.toLocaleString('en-IN')}</span>
      </div>
    </div>

    ${stats.nagaDates.length > 0 ? `
      <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 6px 10px; border-radius: 6px; font-size: 11px; color: #991b1b; margin-bottom: 12px;">
        ❌ <strong>नागा तारीखें:</strong> इस माह तारीख <strong>${stats.nagaDates.join(', ')}</strong> को दूध नहीं लिया गया।
      </div>
    ` : ''}

    <div class="stmt-table-container">
      <table class="stmt-table">
        <thead>
          <tr>
            <th>क्र.</th>
            <th>दिनांक</th>
            <th>दिन</th>
            <th>🌅 सुबह</th>
            <th>🌆 शाम</th>
            <th>🥛 कुल</th>
            <th>स्थिति</th>
            <th>रकम (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
          <tr class="row-total">
            <td colspan="5" style="text-align: right; padding-right: 8px;"><strong>कुल योग (Total):</strong></td>
            <td><strong>${stats.totalLitres.toFixed(1)} L</strong></td>
            <td><strong>${stats.deliveredDays} दिन दिया</strong></td>
            <td style="color: #047857; font-size: 12px;"><strong>₹${stats.monthBill.toLocaleString('en-IN')}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="stmt-footer-note">
      <div>
        📲 <strong>ऑनलाइन पेमेंट (UPI ID):</strong> ${farm.upiId || 'फार्म पर उपलब्ध'}<br>
        <em>*नागा या दूध मात्रा के आधिकारिक मिलान हेतु यह मान्य डिजिटल पर्ची है।*</em>
      </div>
      <div class="stmt-signatures">
        हस्ताक्षर / मुहर<br>
        <strong>${farm.farmName}</strong>
      </div>
    </div>
  `;

  document.getElementById('customerStatementModal').classList.remove('hidden');
}

// Master Excel (.xls) Export for All Customers (Genuine Excel Workbook that opens perfectly on mobile & PC)
function exportAllMonthlyExcel(year = currentKhataYear, month = currentKhataMonth) {
  const monthName = getHindiMonthName(month);
  const farm = appData.farmSettings;
  const daysInMonth = new Date(year, month, 0).getDate();

  let grandTotalLitres = 0;
  let grandTotalBill = 0;
  let grandTotalDues = 0;
  let grandTotalPayable = 0;

  let dayHeaders = '';
  for (let d = 1; d <= daysInMonth; d++) {
    dayHeaders += `<th style="background:#047857;color:#fff;border:1px solid #cbd5e1;padding:6px;">${d}</th>`;
  }

  let rowsHtml = '';
  appData.customers.forEach((c, idx) => {
    const stats = getCustomerMonthlyStats(c.id, year, month);
    grandTotalLitres += stats.totalLitres;
    grandTotalBill += stats.monthBill;
    grandTotalDues += (c.dues || 0);
    grandTotalPayable += stats.totalPayable;

    let dayCells = '';
    stats.daysArray.forEach(d => {
      if (d.isFuture) {
        dayCells += `<td style="border:1px solid #cbd5e1;text-align:center;color:#94a3b8;">-</td>`;
      } else if (d.status === 'skipped') {
        dayCells += `<td style="border:1px solid #cbd5e1;text-align:center;background:#fee2e2;color:#b91c1c;font-weight:bold;">0</td>`;
      } else if (d.status === 'unrecorded') {
        dayCells += `<td style="border:1px solid #cbd5e1;text-align:center;color:#94a3b8;">-</td>`;
      } else {
        dayCells += `<td style="border:1px solid #cbd5e1;text-align:center;">${d.totalLitres}</td>`;
      }
    });

    rowsHtml += `
      <tr>
        <td style="border:1px solid #cbd5e1;text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #cbd5e1;font-weight:bold;">${c.name}</td>
        <td style="border:1px solid #cbd5e1;text-align:center;">${c.phone}</td>
        <td style="border:1px solid #cbd5e1;text-align:center;">${(c.quotaMorning + c.quotaEvening).toFixed(1)} L</td>
        <td style="border:1px solid #cbd5e1;text-align:center;">₹${c.rate}</td>
        ${dayCells}
        <td style="border:1px solid #cbd5e1;text-align:center;font-weight:bold;background:#ecfdf5;">${stats.totalLitres.toFixed(1)} L</td>
        <td style="border:1px solid #cbd5e1;text-align:center;color:#b91c1c;font-weight:bold;">${stats.skippedDays}</td>
        <td style="border:1px solid #cbd5e1;text-align:right;font-weight:bold;">₹${stats.monthBill}</td>
        <td style="border:1px solid #cbd5e1;text-align:right;color:#b91c1c;">₹${c.dues || 0}</td>
        <td style="border:1px solid #cbd5e1;text-align:right;font-weight:bold;color:#047857;background:#fef3c7;">₹${stats.totalPayable}</td>
      </tr>
    `;
  });

  const totalCols = 5 + daysInMonth;
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <style>
        body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #047857; color: #ffffff; border: 1px solid #065f46; padding: 6px; font-weight: bold; }
        td { border: 1px solid #cbd5e1; padding: 5px; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="${totalCols + 5}" style="font-size:16pt;font-weight:bold;color:#047857;text-align:center;padding:10px;">${farm.farmName} - मासिक दूध वितरण व हाज़िरी बहीखाता</td></tr>
        <tr><td colspan="${totalCols + 5}" style="font-size:11pt;color:#475569;text-align:center;">माह: ${monthName} ${year} | रिपोर्ट दिनांक: ${formatHindiDate(getTodayDateKey())} | संचालक: ${farm.ownerPhone}</td></tr>
        <tr><td colspan="${totalCols + 5}"></td></tr>
        <tr>
          <th style="background:#047857;color:#fff;border:1px solid #cbd5e1;">क्र.</th>
          <th style="background:#047857;color:#fff;border:1px solid #cbd5e1;">ग्राहक का नाम</th>
          <th style="background:#047857;color:#fff;border:1px solid #cbd5e1;">मोबाइल नंबर</th>
          <th style="background:#047857;color:#fff;border:1px solid #cbd5e1;">कोटा (L)</th>
          <th style="background:#047857;color:#fff;border:1px solid #cbd5e1;">भाव (₹)</th>
          ${dayHeaders}
          <th style="background:#065f46;color:#fff;border:1px solid #cbd5e1;">कुल दूध (L)</th>
          <th style="background:#991b1b;color:#fff;border:1px solid #cbd5e1;">नागा (दिन)</th>
          <th style="background:#065f46;color:#fff;border:1px solid #cbd5e1;">माह का बिल (₹)</th>
          <th style="background:#991b1b;color:#fff;border:1px solid #cbd5e1;">बकाया (₹)</th>
          <th style="background:#b45309;color:#fff;border:1px solid #cbd5e1;">कुल देय (₹)</th>
        </tr>
        ${rowsHtml}
        <tr style="background:#fef3c7;font-weight:bold;">
          <td colspan="${totalCols}" style="text-align:right;border:1px solid #cbd5e1;padding:8px;">कुल योग (GRAND TOTAL):</td>
          <td style="text-align:center;border:1px solid #cbd5e1;">${Math.round(grandTotalLitres * 10) / 10} L</td>
          <td style="text-align:center;border:1px solid #cbd5e1;">-</td>
          <td style="text-align:right;border:1px solid #cbd5e1;">₹${grandTotalBill}</td>
          <td style="text-align:right;border:1px solid #cbd5e1;color:#b91c1c;">₹${grandTotalDues}</td>
          <td style="text-align:right;border:1px solid #cbd5e1;color:#047857;font-size:12pt;">₹${grandTotalPayable}</td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DairyMitra_Monthly_Report_${monthName}_${year}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAudioToast(`📊 ${monthName} की एक्सेल (.xls) रिपोर्ट डाउनलोड हो गई!`);
  speakAudio(`${monthName} माह की एक्सेल फाइल डाउनलोड हो गई है`);
}

// Single Customer Genuine Excel (.xls) Export (Opens with colors & formatting in Excel / Google Sheets)
function exportSingleCustomerExcel(custId, year, month) {
  const cust = appData.customers.find(c => c.id === custId);
  if (!cust) return;
  const stats = getCustomerMonthlyStats(custId, year, month);
  const monthName = getHindiMonthName(month);
  const farm = appData.farmSettings;

  let rowsHtml = '';
  stats.daysArray.forEach((d, idx) => {
    if (d.isFuture) {
      rowsHtml += `<tr><td style="text-align:center;">${idx + 1}</td><td style="text-align:center;">${d.dayNum} ${monthName}</td><td style="text-align:center;">-</td><td style="text-align:center;">-</td><td style="text-align:center;">-</td><td style="text-align:center;">-</td><td style="text-align:center;color:#94a3b8;">आने वाले दिन</td><td style="text-align:right;">-</td></tr>`;
    } else {
      const dateObj = new Date(d.dateKey + 'T00:00:00');
      const dayName = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'][dateObj.getDay()];
      const isSkip = d.status === 'skipped';
      const statusText = isSkip ? 'नागा (0L)' : 'दूध दिया';
      const rowStyle = isSkip ? 'background:#fee2e2;color:#991b1b;font-weight:bold;' : 'background:#ffffff;';
      const dayAmt = Math.round(d.totalLitres * cust.rate);

      rowsHtml += `<tr style="${rowStyle}">
        <td style="text-align:center;border:1px solid #cbd5e1;">${idx + 1}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${d.dayNum} ${monthName} ${year}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${dayName}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${d.morningQty}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${d.eveningQty}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;font-weight:bold;">${d.totalLitres} L</td>
        <td style="text-align:center;border:1px solid #cbd5e1;">${statusText}</td>
        <td style="text-align:right;border:1px solid #cbd5e1;">₹${dayAmt}</td>
      </tr>`;
    }
  });

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <style>
        body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #047857; color: #ffffff; border: 1px solid #065f46; padding: 6px; font-weight: bold; }
        td { border: 1px solid #cbd5e1; padding: 5px; }
      </style>
    </head>
    <body>
      <table>
        <tr><td colspan="8" style="font-size:16pt;font-weight:bold;color:#047857;text-align:center;padding:10px;">${farm.farmName} - 30-दिन दूध हाज़िरी व बिल विवरण</td></tr>
        <tr><td colspan="8" style="font-size:11pt;color:#475569;text-align:center;">📱 सम्पर्क: ${farm.ownerPhone} | 📲 UPI ID: ${farm.upiId}</td></tr>
        <tr><td colspan="4" style="font-weight:bold;">ग्राहक का नाम: ${cust.name}</td><td colspan="4"><strong>माह:</strong> ${monthName} ${year}</td></tr>
        <tr><td colspan="4"><strong>मोबाइल:</strong> ${cust.phone}</td><td colspan="4"><strong>दूध भाव:</strong> ₹${cust.rate}/लीटर</td></tr>
        <tr><td colspan="4"><strong>दैनिक कोटा:</strong> ${(cust.quotaMorning + cust.quotaEvening).toFixed(1)} L (सुबह ${cust.quotaMorning}L + शाम ${cust.quotaEvening}L)</td><td colspan="4"><strong>जारी दिनांक:</strong> ${formatHindiDate(getTodayDateKey())}</td></tr>
        <tr><td colspan="8"></td></tr>
        <tr>
          <th style="background:#047857;color:#fff;">क्र.सं.</th>
          <th style="background:#047857;color:#fff;">दिनांक</th>
          <th style="background:#047857;color:#fff;">दिन</th>
          <th style="background:#047857;color:#fff;">सुबह दूध (L)</th>
          <th style="background:#047857;color:#fff;">शाम दूध (L)</th>
          <th style="background:#047857;color:#fff;">कुल दूध (L)</th>
          <th style="background:#047857;color:#fff;">स्थिति</th>
          <th style="background:#047857;color:#fff;">दैनिक रकम (₹)</th>
        </tr>
        ${rowsHtml}
        <tr style="background:#fef3c7;font-weight:bold;">
          <td colspan="5" style="text-align:right;border:1px solid #cbd5e1;">कुल योग (Total Milk):</td>
          <td style="text-align:center;border:1px solid #cbd5e1;">${stats.totalLitres.toFixed(1)} L</td>
          <td style="text-align:center;border:1px solid #cbd5e1;">माह का बिल:</td>
          <td style="text-align:right;border:1px solid #cbd5e1;color:#047857;">₹${stats.monthBill}</td>
        </tr>
        <tr><td colspan="8"></td></tr>
        <tr><td colspan="6" style="text-align:right;">दूध सप्लाई दिन:</td><td colspan="2" style="font-weight:bold;">${stats.deliveredDays} दिन</td></tr>
        <tr><td colspan="6" style="text-align:right;">नागा (छुट्टी वाले दिन):</td><td colspan="2" style="font-weight:bold;color:#b91c1c;">${stats.skippedDays} दिन ${stats.nagaDates.length > 0 ? '(तारीख: ' + stats.nagaDates.join(', ') + ')' : ''}</td></tr>
        <tr><td colspan="6" style="text-align:right;">इस माह का बिल:</td><td colspan="2" style="font-weight:bold;">₹${stats.monthBill}</td></tr>
        ${cust.dues > 0 ? `<tr><td colspan="6" style="text-align:right;">पिछला बकाया:</td><td colspan="2" style="font-weight:bold;color:#b91c1c;">₹${cust.dues}</td></tr>` : ''}
        <tr style="background:#fef3c7;font-weight:bold;font-size:12pt;"><td colspan="6" style="text-align:right;">कुल शुद्ध देय राशि (Net Payable):</td><td colspan="2" style="color:#047857;">₹${stats.totalPayable}</td></tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cust.name}_Milk_Report_${monthName}_${year}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAudioToast(`📊 ${cust.name} का Excel (.xls) डाउनलोड हो गया!`);
  speakAudio(`${cust.name} की एक्सेल फाइल डाउनलोड हो गई`);
}

// Single Customer CSV Export (Fallback for basic tools)
function exportSingleCustomerCsv(custId, year, month) {
  const cust = appData.customers.find(c => c.id === custId);
  if (!cust) return;
  const stats = getCustomerMonthlyStats(custId, year, month);
  const monthName = getHindiMonthName(month);
  const farm = appData.farmSettings;

  let csv = '\uFEFF';
  csv += `"${farm.farmName} - ग्राहक 30-दिन दूध हाज़िरी व बिल विवरण"\n`;
  csv += `"ग्राहक: ${cust.name}","मोबाइल: ${cust.phone}","माह: ${monthName} ${year}"\n`;
  csv += `"भाव: ₹${cust.rate}/लीटर","दैनिक कोटा: ${(cust.quotaMorning + cust.quotaEvening).toFixed(1)} L (सुबह ${cust.quotaMorning}L + शाम ${cust.quotaEvening}L)"\n\n`;

  csv += '"तारीख","दिन","सुबह दूध (L)","सुबह स्थिति","शाम दूध (L)","शाम स्थिति","कुल दूध (L)","भाव (₹)","दैनिक रकम (₹)"\n';

  stats.daysArray.forEach(d => {
    if (d.isFuture) {
      csv += `"${d.dayNum} ${monthName}","-","-","-","-","-","-","-","-"\n`;
    } else {
      const dateObj = new Date(d.dateKey + 'T00:00:00');
      const dayName = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'][dateObj.getDay()];
      const mStat = d.morningStatus === 'skipped' ? 'नागा' : 'दिया';
      const eStat = d.eveningStatus === 'skipped' ? 'नागा' : 'दिया';
      const dayAmt = Math.round(d.totalLitres * cust.rate);
      csv += `"${d.dayNum} ${monthName} ${year}","${dayName}","${d.morningQty}","${mStat}","${d.eveningQty}","${eStat}","${d.totalLitres}","${cust.rate}","${dayAmt}"\n`;
    }
  });

  csv += '\n';
  csv += `"कुल दूध मात्रा (लीटर)","${stats.totalLitres}"\n`;
  csv += `"कुल दूध सप्लाई दिन","${stats.deliveredDays}"\n`;
  csv += `"नागा (छुट्टी वाले दिन)","${stats.skippedDays}"\n`;
  csv += `"नागा तारीखें","${stats.nagaDates.length > 0 ? stats.nagaDates.join(', ') : 'कोई नागा नहीं'}"\n`;
  csv += `"इस माह का बिल","₹${stats.monthBill}"\n`;
  csv += `"पिछला बकाया","₹${stats.dues}"\n`;
  csv += `"कुल शुद्ध देय राशि","₹${stats.totalPayable}"\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cust.name}_Milk_Report_${monthName}_${year}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAudioToast(`📥 ${cust.name} की CSV रिपोर्ट डाउनलोड हो गई!`);
}
document.addEventListener('DOMContentLoaded', () => {
  // Open buttons
  const openFatBtn = document.getElementById('openFatCalcBtn');
  if (openFatBtn) openFatBtn.addEventListener('click', () => openFatCalcModal());

  const openFatMilkingBtn = document.getElementById('openFatCalcFromMilkingBtn');
  if (openFatMilkingBtn) openFatMilkingBtn.addEventListener('click', () => openFatCalcModal());

  // Close buttons
  const closeFatBtn = document.getElementById('closeFatCalcModalBtn');
  if (closeFatBtn) {
    closeFatBtn.addEventListener('click', () => {
      document.getElementById('fatCalcModal').classList.add('hidden');
    });
  }

  const closeSlipBtn = document.getElementById('closeMilkSlipModalBtn');
  if (closeSlipBtn) {
    closeSlipBtn.addEventListener('click', () => {
      document.getElementById('milkSlipModal').classList.add('hidden');
    });
  }

  // Stepper buttons for FAT
  const fatInput = document.getElementById('fatCalcInput');
  const fatMinusBtn = document.getElementById('fatMinusBtn');
  const fatPlusBtn = document.getElementById('fatPlusBtn');
  if (fatMinusBtn && fatInput) {
    fatMinusBtn.addEventListener('click', () => {
      fatInput.value = Math.max(1.0, (parseFloat(fatInput.value) || 6.5) - 0.1).toFixed(1);
      recalculateFatSlip();
    });
  }
  if (fatPlusBtn && fatInput) {
    fatPlusBtn.addEventListener('click', () => {
      fatInput.value = Math.min(15.0, (parseFloat(fatInput.value) || 6.5) + 0.1).toFixed(1);
      recalculateFatSlip();
    });
  }

  // Stepper buttons for CLR
  const clrInput = document.getElementById('clrCalcInput');
  const clrMinusBtn = document.getElementById('clrMinusBtn');
  const clrPlusBtn = document.getElementById('clrPlusBtn');
  if (clrMinusBtn && clrInput) {
    clrMinusBtn.addEventListener('click', () => {
      clrInput.value = Math.max(15.0, (parseFloat(clrInput.value) || 28.5) - 0.5).toFixed(1);
      recalculateFatSlip();
    });
  }
  if (clrPlusBtn && clrInput) {
    clrPlusBtn.addEventListener('click', () => {
      clrInput.value = Math.min(36.0, (parseFloat(clrInput.value) || 28.5) + 0.5).toFixed(1);
      recalculateFatSlip();
    });
  }

  // Stepper buttons for SNF
  const snfInput = document.getElementById('snfCalcInput');
  const snfMinusBtn = document.getElementById('snfMinusBtn');
  const snfPlusBtn = document.getElementById('snfPlusBtn');
  if (snfMinusBtn && snfInput) {
    snfMinusBtn.addEventListener('click', () => {
      snfInput.value = Math.max(5.0, (parseFloat(snfInput.value) || 8.8) - 0.05).toFixed(2);
      recalculateFatSlip();
    });
  }
  if (snfPlusBtn && snfInput) {
    snfPlusBtn.addEventListener('click', () => {
      snfInput.value = Math.min(12.0, (parseFloat(snfInput.value) || 8.8) + 0.05).toFixed(2);
      recalculateFatSlip();
    });
  }

  // Quick Chips for Fat
  document.querySelectorAll('.fat-chips .chip-sm').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.fat-chips .chip-sm').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      fatInput.value = chip.getAttribute('data-fat');
      recalculateFatSlip();
    });
  });

  // Quick Chips for CLR
  document.querySelectorAll('.clr-chips .chip-sm').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.clr-chips .chip-sm').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      clrInput.value = chip.getAttribute('data-clr');
      recalculateFatSlip();
    });
  });

  // Testing Method Toggles (CLR vs SNF)
  const methodClrBtn = document.getElementById('methodClrBtn');
  const methodSnfBtn = document.getElementById('methodSnfBtn');
  const clrContainer = document.getElementById('clrInputContainer');
  const snfContainer = document.getElementById('snfInputContainer');

  if (methodClrBtn && methodSnfBtn) {
    methodClrBtn.addEventListener('click', () => {
      methodClrBtn.classList.add('active');
      methodSnfBtn.classList.remove('active');
      clrContainer.classList.remove('hidden');
      snfContainer.classList.add('hidden');
      recalculateFatSlip();
    });

    methodSnfBtn.addEventListener('click', () => {
      methodSnfBtn.classList.add('active');
      methodClrBtn.classList.remove('active');
      snfContainer.classList.remove('hidden');
      clrContainer.classList.add('hidden');
      recalculateFatSlip();
    });
  }

  // Live Recalculate on input change
  ['fatCalcLitres', 'fatCalcInput', 'clrCalcInput', 'snfCalcInput', 'fatRateFactorInput', 'snfRateFactorInput'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', recalculateFatSlip);
      el.addEventListener('change', recalculateFatSlip);
    }
  });

  // Animal Selector change listener
  const fatCalcSel = document.getElementById('fatCalcSelect');
  if (fatCalcSel) {
    fatCalcSel.addEventListener('change', () => {
      syncMilkTypeFromSelection();
      recalculateFatSlip();
    });
  }

  document.querySelectorAll('input[name="fatMilkType"]').forEach(r => {
    r.addEventListener('change', recalculateFatSlip);
  });

  // Action Buttons
  const genSlipBtn = document.getElementById('generateSlipBtn');
  if (genSlipBtn) genSlipBtn.addEventListener('click', generateMilkSlip);

  const waSlipBtn = document.getElementById('sendWhatsAppSlipBtn');
  if (waSlipBtn) waSlipBtn.addEventListener('click', sendWhatsAppMilkSlip);

  const saveTestBtn = document.getElementById('saveTestRecordBtn');
  if (saveTestBtn) saveTestBtn.addEventListener('click', saveMilkTestRecord);

  const clearTestsBtn = document.getElementById('clearTestsBtn');
  if (clearTestsBtn) {
    clearTestsBtn.addEventListener('click', () => {
      if (confirm('क्या आप आज के सभी टेस्ट रिकॉर्ड हटाना चाहते हैं?')) {
        appData.milkTests = (appData.milkTests || []).filter(t => t.date !== currentDateKey);
        saveData();
        renderRecentTests();
      }
    });
  }

  const copySlipBtn = document.getElementById('copySlipTextBtn');
  if (copySlipBtn) copySlipBtn.addEventListener('click', copySlipToClipboard);

  const shareSlipBtn = document.getElementById('shareSlipWaBtn');
  if (shareSlipBtn) shareSlipBtn.addEventListener('click', sendWhatsAppMilkSlip);

  // =================================================================
  // RANK 3 LISTENERS: 30-DAY CALENDAR & EXCEL REPORTING
  // =================================================================

  // Month navigation in Khata
  const khataPrevBtn = document.getElementById('khataPrevMonthBtn');
  if (khataPrevBtn) {
    khataPrevBtn.addEventListener('click', () => {
      currentKhataMonth--;
      if (currentKhataMonth < 1) {
        currentKhataMonth = 12;
        currentKhataYear--;
      }
      renderCustomerKhata();
    });
  }
  const khataNextBtn = document.getElementById('khataNextMonthBtn');
  if (khataNextBtn) {
    khataNextBtn.addEventListener('click', () => {
      currentKhataMonth++;
      if (currentKhataMonth > 12) {
        currentKhataMonth = 1;
        currentKhataYear++;
      }
      renderCustomerKhata();
    });
  }

  // Master Excel Export buttons
  const expAllBtn = document.getElementById('exportAllMonthlyExcelBtn');
  if (expAllBtn) expAllBtn.addEventListener('click', () => exportAllMonthlyExcel(currentKhataYear, currentKhataMonth));
  const expAllBtn2 = document.getElementById('exportAllMonthlyExcelBtn2');
  if (expAllBtn2) expAllBtn2.addEventListener('click', () => exportAllMonthlyExcel(currentKhataYear, currentKhataMonth));

  // Month navigation inside Calendar Modal
  const calPrevBtn = document.getElementById('calPrevMonthBtn');
  if (calPrevBtn) {
    calPrevBtn.addEventListener('click', () => {
      selectedCalMonth--;
      if (selectedCalMonth < 1) {
        selectedCalMonth = 12;
        selectedCalYear--;
      }
      renderCustomerCalendarView();
    });
  }
  const calNextBtn = document.getElementById('calNextMonthBtn');
  if (calNextBtn) {
    calNextBtn.addEventListener('click', () => {
      selectedCalMonth++;
      if (selectedCalMonth > 12) {
        selectedCalMonth = 1;
        selectedCalYear++;
      }
      renderCustomerCalendarView();
    });
  }

  // Close Calendar Modal
  const closeCalBtn = document.getElementById('closeCustomerCalendarModalBtn');
  if (closeCalBtn) {
    closeCalBtn.addEventListener('click', () => {
      document.getElementById('customerCalendarModal').classList.add('hidden');
    });
  }

  // Calendar Modal Actions (WhatsApp Statement, Single CSV, XLS, Digital PDF Statement)
  const waCalBtn = document.getElementById('sendWaCalendarStatementBtn');
  if (waCalBtn) {
    waCalBtn.addEventListener('click', () => {
      if (selectedCalCustId) sendWhatsAppCalendarStatement(selectedCalCustId, selectedCalYear, selectedCalMonth);
    });
  }

  const openStmtPdfBtn = document.getElementById('openCustomerStatementPdfBtn');
  if (openStmtPdfBtn) {
    openStmtPdfBtn.addEventListener('click', () => {
      if (selectedCalCustId) openCustomerStatementModal(selectedCalCustId, selectedCalYear, selectedCalMonth);
    });
  }

  const dlCustXlsBtn = document.getElementById('downloadSingleCustXlsBtn');
  if (dlCustXlsBtn) {
    dlCustXlsBtn.addEventListener('click', () => {
      if (selectedCalCustId) exportSingleCustomerExcel(selectedCalCustId, selectedCalYear, selectedCalMonth);
    });
  }

  const dlCustCsvBtn = document.getElementById('downloadSingleCustCsvBtn');
  if (dlCustCsvBtn) {
    dlCustCsvBtn.addEventListener('click', () => {
      if (selectedCalCustId) exportSingleCustomerCsv(selectedCalCustId, selectedCalYear, selectedCalMonth);
    });
  }

  // Customer Statement Modal Listeners (Print, PDF, WhatsApp, XLS)
  const closeStmtModalBtn = document.getElementById('closeCustomerStatementModalBtn');
  if (closeStmtModalBtn) {
    closeStmtModalBtn.addEventListener('click', () => {
      document.getElementById('customerStatementModal').classList.add('hidden');
    });
  }

  const stmtSavePdfBtn = document.getElementById('statementSavePdfBtn');
  if (stmtSavePdfBtn) {
    stmtSavePdfBtn.addEventListener('click', () => {
      showAudioToast('📥 "Save as PDF" चुनकर फाइल सेव करें!');
      window.print();
    });
  }

  const stmtShareWaBtn = document.getElementById('statementShareWaBtn');
  if (stmtShareWaBtn) {
    stmtShareWaBtn.addEventListener('click', () => {
      if (selectedCalCustId) sendWhatsAppCalendarStatement(selectedCalCustId, selectedCalYear, selectedCalMonth);
    });
  }

  const stmtDownloadXlsBtn = document.getElementById('statementDownloadXlsBtn');
  if (stmtDownloadXlsBtn) {
    stmtDownloadXlsBtn.addEventListener('click', () => {
      if (selectedCalCustId) exportSingleCustomerExcel(selectedCalCustId, selectedCalYear, selectedCalMonth);
    });
  }

  const syncCalBtn = document.getElementById('syncCalQuotaBtn');
  if (syncCalBtn) {
    syncCalBtn.addEventListener('click', () => {
      if (!selectedCalCustId) return;
      const cust = appData.customers.find(c => c.id === selectedCalCustId);
      if (!cust) return;

      const mQ = cust.quotaMorning || 0;
      const eQ = cust.quotaEvening || 0;
      const confirmMsg = `क्या आप ${getHindiMonthName(selectedCalMonth)} ${selectedCalYear} माह के सभी दिनों में "${cust.name}" का तय कोटा (सुबह ${mQ}L + शाम ${eQ}L) लागू करना चाहते हैं?`;
      if (confirm(confirmMsg)) {
        syncCustomerMonthRecordsWithQuota(selectedCalCustId, selectedCalYear, selectedCalMonth);
        saveData();
        renderCustomerCalendarView();
        renderCustomerKhata();
        renderDeliveryCards();
        showAudioToast('⚡ माह के सभी दिनों में तय कोटा लागू हो गया!');
        speakAudio('कैलेंडर में तय कोटा लागू हो गया');
      }
    });
  }

  // Day Edit Modal Listeners
  const closeDayEditBtn = document.getElementById('closeDayEditModalBtn');
  if (closeDayEditBtn) closeDayEditBtn.addEventListener('click', () => document.getElementById('dayEditModal').classList.add('hidden'));
  const cancelDayEditBtn = document.getElementById('cancelDayEditBtn');
  if (cancelDayEditBtn) cancelDayEditBtn.addEventListener('click', () => document.getElementById('dayEditModal').classList.add('hidden'));
  const dayEditForm = document.getElementById('dayEditForm');
  if (dayEditForm) dayEditForm.addEventListener('submit', saveDayEdit);

  // Quick radio toggles & bidirectional input sync for Day Edit
  const morningLitresInput = document.getElementById('dayEditMorningLitres');
  const eveningLitresInput = document.getElementById('dayEditEveningLitres');

  document.querySelectorAll('input[name="dayEditMorningStatus"]').forEach(r => {
    r.addEventListener('change', () => {
      const custId = document.getElementById('dayEditCustId').value;
      const cust = appData.customers.find(c => c.id === custId);
      const defaultQuota = (cust && cust.quotaMorning > 0) ? cust.quotaMorning : 1.0;

      if (r.value === 'skipped') {
        morningLitresInput.value = 0;
        document.getElementById('dayEditMorningDisplay').innerText = '0 L (नागा)';
      } else {
        let val = parseFloat(morningLitresInput.value) || 0;
        if (val <= 0) val = defaultQuota;
        morningLitresInput.value = val;
        document.getElementById('dayEditMorningDisplay').innerText = `${val} L (दिया)`;
      }
    });
  });

  if (morningLitresInput) {
    morningLitresInput.addEventListener('input', () => {
      let val = parseFloat(morningLitresInput.value);
      if (isNaN(val) || val <= 0) {
        const skipRadio = document.querySelector('input[name="dayEditMorningStatus"][value="skipped"]');
        if (skipRadio) skipRadio.checked = true;
        document.getElementById('dayEditMorningDisplay').innerText = '0 L (नागा)';
      } else {
        const okRadio = document.querySelector('input[name="dayEditMorningStatus"][value="delivered"]');
        if (okRadio) okRadio.checked = true;
        document.getElementById('dayEditMorningDisplay').innerText = `${val} L (दिया)`;
      }
    });
  }

  document.querySelectorAll('input[name="dayEditEveningStatus"]').forEach(r => {
    r.addEventListener('change', () => {
      const custId = document.getElementById('dayEditCustId').value;
      const cust = appData.customers.find(c => c.id === custId);
      const defaultQuota = (cust && cust.quotaEvening > 0) ? cust.quotaEvening : 1.0;

      if (r.value === 'skipped') {
        eveningLitresInput.value = 0;
        document.getElementById('dayEditEveningDisplay').innerText = '0 L (नागा)';
      } else {
        let val = parseFloat(eveningLitresInput.value) || 0;
        if (val <= 0) val = defaultQuota;
        eveningLitresInput.value = val;
        document.getElementById('dayEditEveningDisplay').innerText = `${val} L (दिया)`;
      }
    });
  });

  if (eveningLitresInput) {
    eveningLitresInput.addEventListener('input', () => {
      let val = parseFloat(eveningLitresInput.value);
      if (isNaN(val) || val <= 0) {
        const skipRadio = document.querySelector('input[name="dayEditEveningStatus"][value="skipped"]');
        if (skipRadio) skipRadio.checked = true;
        document.getElementById('dayEditEveningDisplay').innerText = '0 L (नागा)';
      } else {
        const okRadio = document.querySelector('input[name="dayEditEveningStatus"][value="delivered"]');
        if (okRadio) okRadio.checked = true;
        document.getElementById('dayEditEveningDisplay').innerText = `${val} L (दिया)`;
      }
    });
  }

  // ===================================================================
  // Animal Milking Calendar & History Listeners
  // ===================================================================
  const openAnimalCalMilkingBtn = document.getElementById('openAnimalCalFromMilkingBtn');
  if (openAnimalCalMilkingBtn) {
    openAnimalCalMilkingBtn.addEventListener('click', () => openAnimalCalendarModal());
  }

  const openAnimalCalCattleBtn = document.getElementById('openAnimalCalFromCattleBtn');
  if (openAnimalCalCattleBtn) {
    openAnimalCalCattleBtn.addEventListener('click', () => openAnimalCalendarModal());
  }

  const closeAnimalCalBtn = document.getElementById('closeAnimalCalendarModalBtn');
  if (closeAnimalCalBtn) {
    closeAnimalCalBtn.addEventListener('click', () => {
      document.getElementById('animalCalendarModal').classList.add('hidden');
    });
  }

  const animalCalSelect = document.getElementById('animalCalSelect');
  if (animalCalSelect) {
    animalCalSelect.addEventListener('change', (e) => {
      openAnimalCalendarModal(e.target.value, selectedAnimalCalYear, selectedAnimalCalMonth);
    });
  }

  const animalCalPrevMonthBtn = document.getElementById('animalCalPrevMonthBtn');
  if (animalCalPrevMonthBtn) {
    animalCalPrevMonthBtn.addEventListener('click', () => {
      selectedAnimalCalMonth--;
      if (selectedAnimalCalMonth < 1) {
        selectedAnimalCalMonth = 12;
        selectedAnimalCalYear--;
      }
      openAnimalCalendarModal(selectedCalAnimalId, selectedAnimalCalYear, selectedAnimalCalMonth);
    });
  }

  const animalCalNextMonthBtn = document.getElementById('animalCalNextMonthBtn');
  if (animalCalNextMonthBtn) {
    animalCalNextMonthBtn.addEventListener('click', () => {
      selectedAnimalCalMonth++;
      if (selectedAnimalCalMonth > 12) {
        selectedAnimalCalMonth = 1;
        selectedAnimalCalYear++;
      }
      openAnimalCalendarModal(selectedCalAnimalId, selectedAnimalCalYear, selectedAnimalCalMonth);
    });
  }

  const dlAnimalCalXlsBtn = document.getElementById('downloadAnimalCalXlsBtn');
  if (dlAnimalCalXlsBtn) {
    dlAnimalCalXlsBtn.addEventListener('click', () => {
      if (selectedCalAnimalId) exportAnimalMilkingExcel(selectedCalAnimalId, selectedAnimalCalYear, selectedAnimalCalMonth);
    });
  }

  const printAnimalCalPdfBtn = document.getElementById('printAnimalCalPdfBtn');
  if (printAnimalCalPdfBtn) {
    printAnimalCalPdfBtn.addEventListener('click', () => {
      showAudioToast('🖨️ पशु दूध रिपोर्ट प्रिंट / PDF के लिए तैयार!');
      window.print();
    });
  }

  // Animal Day Edit Modal
  const closeAnimalDayEditBtn = document.getElementById('closeAnimalDayEditModalBtn');
  if (closeAnimalDayEditBtn) {
    closeAnimalDayEditBtn.addEventListener('click', () => {
      document.getElementById('animalDayEditModal').classList.add('hidden');
    });
  }

  const cancelAnimalDayEditBtn = document.getElementById('cancelAnimalDayEditBtn');
  if (cancelAnimalDayEditBtn) {
    cancelAnimalDayEditBtn.addEventListener('click', () => {
      document.getElementById('animalDayEditModal').classList.add('hidden');
    });
  }

  const animalDayEditForm = document.getElementById('animalDayEditForm');
  if (animalDayEditForm) {
    animalDayEditForm.addEventListener('submit', saveAnimalDayEdit);
  }

  // Steppers & Chips for Animal Day Edit
  const aDayMMinus = document.getElementById('animalDayEditMorningMinus');
  const aDayMPlus = document.getElementById('animalDayEditMorningPlus');
  const aDayMQty = document.getElementById('animalDayEditMorningQty');
  const aDayMDisp = document.getElementById('animalDayEditMorningDisplay');

  const aDayEMinus = document.getElementById('animalDayEditEveningMinus');
  const aDayEPlus = document.getElementById('animalDayEditEveningPlus');
  const aDayEQty = document.getElementById('animalDayEditEveningQty');
  const aDayEDisp = document.getElementById('animalDayEditEveningDisplay');

  if (aDayMMinus && aDayMQty) {
    aDayMMinus.addEventListener('click', () => {
      let val = Math.max(0, (parseFloat(aDayMQty.value) || 0) - 0.5);
      val = Math.round(val * 10) / 10;
      aDayMQty.value = val.toFixed(1);
      if (aDayMDisp) aDayMDisp.innerText = `${val.toFixed(1)} L`;
    });
  }
  if (aDayMPlus && aDayMQty) {
    aDayMPlus.addEventListener('click', () => {
      let val = (parseFloat(aDayMQty.value) || 0) + 0.5;
      val = Math.round(val * 10) / 10;
      aDayMQty.value = val.toFixed(1);
      if (aDayMDisp) aDayMDisp.innerText = `${val.toFixed(1)} L`;
    });
  }
  if (aDayMQty) {
    aDayMQty.addEventListener('input', () => {
      let val = Math.max(0, parseFloat(aDayMQty.value) || 0);
      if (aDayMDisp) aDayMDisp.innerText = `${val.toFixed(1)} L`;
    });
  }

  if (aDayEMinus && aDayEQty) {
    aDayEMinus.addEventListener('click', () => {
      let val = Math.max(0, (parseFloat(aDayEQty.value) || 0) - 0.5);
      val = Math.round(val * 10) / 10;
      aDayEQty.value = val.toFixed(1);
      if (aDayEDisp) aDayEDisp.innerText = `${val.toFixed(1)} L`;
    });
  }
  if (aDayEPlus && aDayEQty) {
    aDayEPlus.addEventListener('click', () => {
      let val = (parseFloat(aDayEQty.value) || 0) + 0.5;
      val = Math.round(val * 10) / 10;
      aDayEQty.value = val.toFixed(1);
      if (aDayEDisp) aDayEDisp.innerText = `${val.toFixed(1)} L`;
    });
  }
  if (aDayEQty) {
    aDayEQty.addEventListener('input', () => {
      let val = Math.max(0, parseFloat(aDayEQty.value) || 0);
      if (aDayEDisp) aDayEDisp.innerText = `${val.toFixed(1)} L`;
    });
  }

  document.querySelectorAll('#animalDayEditModal .quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const target = chip.getAttribute('data-target');
      const val = parseFloat(chip.getAttribute('data-val')) || 0;
      if (target === 'morning' && aDayMQty) {
        aDayMQty.value = val.toFixed(1);
        if (aDayMDisp) aDayMDisp.innerText = `${val.toFixed(1)} L`;
      } else if (target === 'evening' && aDayEQty) {
        aDayEQty.value = val.toFixed(1);
        if (aDayEDisp) aDayEDisp.innerText = `${val.toFixed(1)} L`;
      }
    });
  });

  // AI Voice Assistant Answer Card close button
  const closeAiVoiceReplyBtn = document.getElementById('closeAiVoiceReplyBtn');
  if (closeAiVoiceReplyBtn) {
    closeAiVoiceReplyBtn.addEventListener('click', () => {
      const card = document.getElementById('aiVoiceReplyCard');
      if (card) card.classList.add('hidden');
    });
  }

  // Reset Today's Counters Button (0 से शुरू करें)
  const resetTodayBtn = document.getElementById('resetTodayBtn');
  if (resetTodayBtn) {
    resetTodayBtn.addEventListener('click', () => {
      if (confirm('क्या आप आज के सभी दूध और डिलीवरी काउंटर 0 करके नया दिन शुरू करना चाहते हैं?\n\n(ध्यान दें: पुराना सारा रिकॉर्ड कैलेंडर व खाते में पूरी तरह सुरक्षित रहेगा)')) {
        resetTodayCounters();
      }
    });
  }

  // Automatic Day Rollover on App Focus / Resume
  window.addEventListener('focus', () => {
    const freshDate = getTodayDateKey();
    if (freshDate !== currentDateKey) {
      currentDateKey = freshDate;
      initTodayRecord();
      updateStatsHeader();
      renderMilkingCards();
      renderDeliveryCards();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const freshDate = getTodayDateKey();
      if (freshDate !== currentDateKey) {
        currentDateKey = freshDate;
        initTodayRecord();
        updateStatsHeader();
        renderMilkingCards();
        renderDeliveryCards();
      }
    }
  });
});

// ===================================================================
// TRENDING FEATURES v6.0: COMPLETE IMPLEMENTATION MODULE
// ===================================================================

let currentUpiCustState = null;
let currentFeedAnimalId = null;
let currentKundaliAnimalId = null;
let currentValuationAnimalId = null;

// -------------------------------------------------------------------
// 1. Instant Payment QR & WhatsApp Milk Slip (1-क्लिक UPI QR कोड)
// -------------------------------------------------------------------
function openUpiBillModal(custId, year, month) {
  const y = year || currentKhataYear;
  const m = month || currentKhataMonth;
  const cust = appData.customers.find(c => c.id === custId) || appData.customers[0];
  if (!cust) return;

  const stats = getCustomerMonthlyStats(cust.id, y, m);
  const monthName = getHindiMonthName(m);
  const totalAmount = Math.max(0, Math.round(stats.monthBill + (cust.dues > 0 ? (cust.dues - stats.monthBill > 0 ? cust.dues - stats.monthBill : 0) : 0)));
  const payableAmount = totalAmount > 0 ? totalAmount : (cust.dues || 0);

  const farmName = appData.farmSettings.farmName || 'श्री कृष्णा डेयरी फार्म';
  const upiId = appData.farmSettings.upiId || 'dairyfarm@upi';
  const billNote = `दूध बिल ${cust.name} ${monthName} ${y}`;
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(farmName)}&am=${payableAmount}&cu=INR&tn=${encodeURIComponent(billNote)}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayUrl)}`;

  // Populate UI
  const nameEl = document.getElementById('upiBillCustomerName');
  const monthEl = document.getElementById('upiBillMonthLabel');
  const milkEl = document.getElementById('upiBillTotalMilk');
  const rateEl = document.getElementById('upiBillMilkRate');
  const amtEl = document.getElementById('upiBillTotalAmount');
  const qrImg = document.getElementById('upiDynamicQrImg');
  const upiIdEl = document.getElementById('upiDisplayId');

  if (nameEl) nameEl.innerText = cust.name;
  if (monthEl) monthEl.innerText = `${monthName} ${y}`;
  if (milkEl) milkEl.innerText = `${stats.totalLitres.toFixed(1)} L (${stats.deliveredDays} दिन)`;
  if (rateEl) rateEl.innerText = `₹${cust.rate || appData.farmSettings.defaultRate || 60}/L`;
  if (amtEl) amtEl.innerText = `₹${payableAmount.toLocaleString('en-IN')}`;
  if (qrImg) qrImg.src = qrApiUrl;
  if (upiIdEl) upiIdEl.innerText = upiId;

  currentUpiCustState = {
    cust,
    stats,
    monthName,
    year: y,
    payableAmount,
    upiPayUrl,
    upiId
  };

  const modal = document.getElementById('upiBillModal');
  if (modal) modal.classList.remove('hidden');
}

function sendUpiWhatsAppBill() {
  if (!currentUpiCustState) return;
  const { cust, stats, monthName, year, payableAmount, upiPayUrl, upiId } = currentUpiCustState;
  const farmName = appData.farmSettings.farmName || 'श्री कृष्णा डेयरी फार्म';
  const ownerPhone = appData.farmSettings.ownerPhone || '';

  const msg = 
`🥛 *${farmName} - डिजिटल दूध पर्ची* 🧾
━━━━━━━━━━━━━━━━━━
👤 *ग्राहक:* ${cust.name}
📅 *माह:* ${monthName} ${year}
🥛 *कुल दूध:* ${stats.totalLitres.toFixed(1)} लीटर
📊 *दूध भाव:* ₹${cust.rate || 60}/लीटर
💵 *मासिक बिल:* ₹${stats.monthBill.toLocaleString('en-IN')}
${cust.dues > stats.monthBill ? `📌 *पिछला बकाया:* ₹${(cust.dues - stats.monthBill).toLocaleString('en-IN')}\n` : ''}💰 *कुल देय राशि:* *₹${payableAmount.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━
📲 *1-क्लिक UPI भुगतान लिंक:*
${upiPayUrl}

🏦 *UPI ID:* \`${upiId}\`
(PhonePe / GooglePay / Paytm से सीधे भुगतान करें)

📞 संपर्क: ${ownerPhone}
धन्यवाद! आपका दिन शुभ हो! 🙏`;

  const phone = (cust.phone || '').replace(/\D/g, '');
  const targetPhone = phone.length === 10 ? `91${phone}` : phone;
  const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

function openDirectUpiPayment() {
  if (!currentUpiCustState || !currentUpiCustState.upiPayUrl) return;
  window.location.href = currentUpiCustState.upiPayUrl;
}

// -------------------------------------------------------------------
// 2. Daily Expenses & Profit/Loss Tracker (खर्च व शुद्ध मुनाफा)
// -------------------------------------------------------------------
function calculateDailyProfit(dateKey) {
  const dKey = dateKey || currentDateKey;
  const record = appData.dailyRecords[dKey];
  const expenses = (record && record.expenses) ? record.expenses : { feed: 0, greenFodder: 0, dryFodder: 0, medical: 0, other: 0 };

  // Calculate milk revenue and quantities
  let totalMilkProduced = 0;
  let totalMilkSold = 0;
  let milkRevenue = 0;

  if (record) {
    if (record.milking) {
      const m = record.milking.morning || {};
      const e = record.milking.evening || {};
      Object.values(m).forEach(v => totalMilkProduced += (parseFloat(v) || 0));
      Object.values(e).forEach(v => totalMilkProduced += (parseFloat(v) || 0));
    }
    if (record.delivery) {
      const mDel = record.delivery.morning || {};
      const eDel = record.delivery.evening || {};
      appData.customers.forEach(c => {
        const rate = c.rate || appData.farmSettings.defaultRate || 60;
        const mItem = mDel[c.id];
        const eItem = eDel[c.id];
        if (mItem && (mItem.status === 'delivered' || mItem.litres > 0)) {
          const l = parseFloat(mItem.litres) || 0;
          totalMilkSold += l;
          milkRevenue += (l * rate);
        }
        if (eItem && (eItem.status === 'delivered' || eItem.litres > 0)) {
          const l = parseFloat(eItem.litres) || 0;
          totalMilkSold += l;
          milkRevenue += (l * rate);
        }
      });
    }
  }

  const feedCost = parseFloat(expenses.feed) || 0;
  const greenCost = parseFloat(expenses.greenFodder) || 0;
  const dryCost = parseFloat(expenses.dryFodder) || 0;
  const medCost = parseFloat(expenses.medical) || 0;
  const otherCost = parseFloat(expenses.other) || 0;

  const totalExpenses = feedCost + greenCost + dryCost + medCost + otherCost;
  const netProfit = Math.round(milkRevenue - totalExpenses);
  const homeMilk = Math.max(0, Math.round((totalMilkProduced - totalMilkSold) * 10) / 10);
  const costPerLitre = totalMilkProduced > 0 ? (totalExpenses / totalMilkProduced) : 0;
  const profitPerLitre = totalMilkSold > 0 ? (netProfit / totalMilkSold) : 0;

  return {
    dateKey: dKey,
    totalMilkProduced,
    totalMilkSold,
    homeMilk,
    revenue: Math.round(milkRevenue),
    expenses,
    totalExpenses,
    netProfit,
    costPerLitre,
    profitPerLitre
  };
}

function openExpenseProfitModal(targetDateKey) {
  const dKey = targetDateKey || currentDateKey;
  const dateInput = document.getElementById('expenseProfitDate');
  if (dateInput) dateInput.value = dKey;

  const prof = calculateDailyProfit(dKey);

  // Set inputs
  const expFeedEl = document.getElementById('expFeed');
  const expGreenEl = document.getElementById('expGreenFodder');
  const expDryEl = document.getElementById('expDryFodder');
  const expMedEl = document.getElementById('expMedical');
  const expOtherEl = document.getElementById('expOther');

  if (expFeedEl) expFeedEl.value = prof.expenses.feed || '';
  if (expGreenEl) expGreenEl.value = prof.expenses.greenFodder || '';
  if (expDryEl) expDryEl.value = prof.expenses.dryFodder || '';
  if (expMedEl) expMedEl.value = prof.expenses.medical || '';
  if (expOtherEl) expOtherEl.value = prof.expenses.other || '';

  updateExpenseProfitView(prof);

  const modal = document.getElementById('expenseProfitModal');
  if (modal) modal.classList.remove('hidden');
}

function updateExpenseProfitView(prof) {
  const soldEl = document.getElementById('expSummaryMilkSold');
  const revEl = document.getElementById('expSummaryMilkRevenue');
  const homeEl = document.getElementById('expSummaryMilkHome');
  const heroCard = document.getElementById('netProfitHeroCard');
  const valEl = document.getElementById('netProfitHeroVal');
  const subEl = document.getElementById('netProfitHeroSub');
  const costEl = document.getElementById('kpiCostPerLitre');
  const profLitreEl = document.getElementById('kpiProfitPerLitre');

  if (soldEl) soldEl.innerText = `${prof.totalMilkSold.toFixed(1)} L`;
  if (revEl) revEl.innerText = `₹${prof.revenue.toLocaleString('en-IN')}`;
  if (homeEl) homeEl.innerText = `${prof.homeMilk.toFixed(1)} L`;

  if (heroCard) {
    if (prof.netProfit < 0) {
      heroCard.classList.add('is-loss');
    } else {
      heroCard.classList.remove('is-loss');
    }
  }

  if (valEl) valEl.innerText = `₹${prof.netProfit.toLocaleString('en-IN')}`;
  if (subEl) subEl.innerText = `कुल आमदनी ₹${prof.revenue.toLocaleString('en-IN')} - कुल खर्च ₹${prof.totalExpenses.toLocaleString('en-IN')}`;
  if (costEl) costEl.innerText = `₹${prof.costPerLitre.toFixed(1)}/L`;
  if (profLitreEl) profLitreEl.innerText = `₹${prof.profitPerLitre.toFixed(1)}/L`;
}

function recalculateLiveExpenses() {
  const dKey = (document.getElementById('expenseProfitDate') || {}).value || currentDateKey;
  const feed = parseFloat((document.getElementById('expFeed') || {}).value) || 0;
  const green = parseFloat((document.getElementById('expGreenFodder') || {}).value) || 0;
  const dry = parseFloat((document.getElementById('expDryFodder') || {}).value) || 0;
  const med = parseFloat((document.getElementById('expMedical') || {}).value) || 0;
  const other = parseFloat((document.getElementById('expOther') || {}).value) || 0;

  const currentProf = calculateDailyProfit(dKey);
  const totalExpenses = feed + green + dry + med + other;
  const netProfit = Math.round(currentProf.revenue - totalExpenses);
  const costPerLitre = currentProf.totalMilkProduced > 0 ? (totalExpenses / currentProf.totalMilkProduced) : 0;
  const profitPerLitre = currentProf.totalMilkSold > 0 ? (netProfit / currentProf.totalMilkSold) : 0;

  updateExpenseProfitView({
    ...currentProf,
    totalExpenses,
    netProfit,
    costPerLitre,
    profitPerLitre
  });
}

function saveDailyExpenses() {
  const dKey = (document.getElementById('expenseProfitDate') || {}).value || currentDateKey;
  if (!appData.dailyRecords[dKey]) {
    appData.dailyRecords[dKey] = { milking: { morning: {}, evening: {} }, delivery: { morning: {}, evening: {} } };
  }

  appData.dailyRecords[dKey].expenses = {
    feed: parseFloat((document.getElementById('expFeed') || {}).value) || 0,
    greenFodder: parseFloat((document.getElementById('expGreenFodder') || {}).value) || 0,
    dryFodder: parseFloat((document.getElementById('expDryFodder') || {}).value) || 0,
    medical: parseFloat((document.getElementById('expMedical') || {}).value) || 0,
    other: parseFloat((document.getElementById('expOther') || {}).value) || 0
  };

  saveData();
  const prof = calculateDailyProfit(dKey);
  showAudioToast(`💾 आज का खर्च व मुनाफा सेव! शुद्ध लाभ: ₹${prof.netProfit}`);
  speakAudio(`आज का शुद्ध मुनाफा ₹${prof.netProfit} सुरक्षित कर लिया गया है।`);
}

function shareDailyProfitWhatsApp() {
  const dKey = (document.getElementById('expenseProfitDate') || {}).value || currentDateKey;
  const prof = calculateDailyProfit(dKey);
  const farmName = appData.farmSettings.farmName || 'श्री कृष्णा डेयरी फार्म';

  const msg = 
`📊 *${farmName} - दैनिक बैलेंस शीट* 💰
📅 *तारीख:* ${dKey}
━━━━━━━━━━━━━━━━━━
🥛 कुल दूध उत्पादन: ${prof.totalMilkProduced.toFixed(1)} L
🚚 दूध बिक्री: ${prof.totalMilkSold.toFixed(1)} L
🏡 घर में बचा: ${prof.homeMilk.toFixed(1)} L
💵 *कुल दूध आय (A):* *₹${prof.revenue.toLocaleString('en-IN')}*

🌾 *दैनिक पशु खर्च (B):*
• दाना / खल / चोकर: ₹${prof.expenses.feed || 0}
• हरा चारा: ₹${prof.expenses.greenFodder || 0}
• सूखा भूसा / पुआल: ₹${prof.expenses.dryFodder || 0}
• दवाई / मिनरल: ₹${prof.expenses.medical || 0}
• अन्य / मजदूरी: ₹${prof.expenses.other || 0}
🔻 *कुल खर्च:* *₹${prof.totalExpenses.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━
⭐ *दैनिक शुद्ध लाभ (Net Profit):*
👉 *₹${prof.netProfit.toLocaleString('en-IN')}* 👈
📊 1 लीटर दूध की उत्पादन लागत: ₹${prof.costPerLitre.toFixed(1)}
📈 1 लीटर पर शुद्ध मुनाफा: ₹${prof.profitPerLitre.toFixed(1)}
━━━━━━━━━━━━━━━━━━
डेयरी मित्र - स्मार्ट पशु बहीखाता द्वारा प्रमाणित ✨`;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// -------------------------------------------------------------------
// 3. AI Pashu Poshan & Feed Optimizer (आहार व पोषण अनुकूलक)
// -------------------------------------------------------------------
function calculateFeedRation(animal, weightKg = 450, dailyMilkL = 10, stage = 'milking_peak') {
  const isBuff = animal ? animal.type === 'buffalo' : false;
  const wt = parseFloat(weightKg) || 450;
  const milk = parseFloat(dailyMilkL) || 0;

  // NRC / ICAR Dairy Ration Norms
  const greenKg = Math.round(wt * 0.05); // ~20-25 kg
  const dryKg = Math.max(3.5, Math.round(wt * 0.012)); // ~4-5.5 kg

  let concMaintenance = isBuff ? 1.5 : 1.2; // kg
  if (stage === 'pregnant_dry') concMaintenance += 1.5; // Steaming up allowance

  const concProduction = milk * (isBuff ? 0.45 : 0.4); // 400-450g per kg milk
  const totalConc = Math.round((concMaintenance + concProduction) * 10) / 10;

  const mineralGrams = milk > 12 ? 70 : (milk > 6 ? 50 : 40);
  const saltGrams = 30;
  const sodaGrams = 30;
  const waterL = Math.round(wt * 0.1 + (milk * 3));

  return {
    animalName: animal ? animal.name : 'पशु',
    weight: wt,
    milk,
    greenFodder: `${greenKg - 2} से ${greenKg + 3} किग्रा`,
    dryFodder: `${dryKg} से ${dryKg + 1.5} किग्रा`,
    concentrate: `${totalConc} किग्रा`,
    mineral: `${mineralGrams} ग्राम`,
    salt: `${sodaGrams}g मीठा सोडा + ${saltGrams}g नमक`,
    water: `${waterL - 5} से ${waterL + 10} लीटर`
  };
}

function openFeedOptimizerModal(animalId) {
  const selectEl = document.getElementById('feedAnimalSelect');
  if (!selectEl) return;

  selectEl.innerHTML = '';
  appData.animals.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.innerText = `${a.name} (${a.breed || (a.type === 'cow' ? 'गाय' : 'भैंस')})`;
    selectEl.appendChild(opt);
  });

  const targetId = animalId || (appData.animals[0] ? appData.animals[0].id : null);
  if (targetId) selectEl.value = targetId;
  currentFeedAnimalId = targetId;

  const targetAnimal = appData.animals.find(a => a.id === targetId) || appData.animals[0];
  const wtInput = document.getElementById('feedAnimalWeight');
  const milkInput = document.getElementById('feedDailyMilk');
  const stageInput = document.getElementById('feedAnimalStage');

  if (targetAnimal) {
    if (wtInput) wtInput.value = targetAnimal.type === 'buffalo' ? 500 : 420;
    if (milkInput) milkInput.value = targetAnimal.expectedYield || 8;
    if (stageInput) stageInput.value = targetAnimal.status === 'pregnant' ? 'pregnant_dry' : (targetAnimal.status === 'milking' ? 'milking_peak' : 'dry');
  }

  updateFeedOptimizerView();

  const modal = document.getElementById('feedOptimizerModal');
  if (modal) modal.classList.remove('hidden');
}

function updateFeedOptimizerView() {
  const selectEl = document.getElementById('feedAnimalSelect');
  const aid = selectEl ? selectEl.value : currentFeedAnimalId;
  const animal = appData.animals.find(a => a.id === aid) || appData.animals[0];

  const wt = parseFloat((document.getElementById('feedAnimalWeight') || {}).value) || 450;
  const milk = parseFloat((document.getElementById('feedDailyMilk') || {}).value) || 8;
  const stage = (document.getElementById('feedAnimalStage') || {}).value || 'milking_peak';

  const ration = calculateFeedRation(animal, wt, milk, stage);

  const gEl = document.getElementById('rationGreenFodder');
  const dEl = document.getElementById('rationDryFodder');
  const cEl = document.getElementById('rationConcentrate');
  const mEl = document.getElementById('rationMineral');
  const sEl = document.getElementById('rationSalt');
  const wEl = document.getElementById('rationWater');

  if (gEl) gEl.innerText = ration.greenFodder;
  if (dEl) dEl.innerText = ration.dryFodder;
  if (cEl) cEl.innerText = ration.concentrate;
  if (mEl) mEl.innerText = ration.mineral;
  if (sEl) sEl.innerText = ration.salt;
  if (wEl) wEl.innerText = ration.water;
}

function speakFeedRationAudio() {
  const selectEl = document.getElementById('feedAnimalSelect');
  const aid = selectEl ? selectEl.value : currentFeedAnimalId;
  const animal = appData.animals.find(a => a.id === aid) || appData.animals[0];

  const wt = parseFloat((document.getElementById('feedAnimalWeight') || {}).value) || 450;
  const milk = parseFloat((document.getElementById('feedDailyMilk') || {}).value) || 8;
  const stage = (document.getElementById('feedAnimalStage') || {}).value || 'milking_peak';
  const ration = calculateFeedRation(animal, wt, milk, stage);

  const text = `${animal.name} के लिए आज का संतुलित आहार: ${ration.greenFodder} हरा चारा, ${ration.dryFodder} सूखा भूसा, ${ration.concentrate} संतुलित दाना, ${ration.mineral} मिनरल मिक्चर, मीठा सोडा और नमक, तथा ${ration.water} पीने का पानी। इससे दूध और फैट दोनों में बढ़त होगी!`;
  speakAudio(text);
  showAudioToast('🔊 आहार चार्ट बोलकर सुनाया जा रहा है!');
}

function shareFeedWhatsApp() {
  const selectEl = document.getElementById('feedAnimalSelect');
  const aid = selectEl ? selectEl.value : currentFeedAnimalId;
  const animal = appData.animals.find(a => a.id === aid) || appData.animals[0];

  const wt = parseFloat((document.getElementById('feedAnimalWeight') || {}).value) || 450;
  const milk = parseFloat((document.getElementById('feedDailyMilk') || {}).value) || 8;
  const stage = (document.getElementById('feedAnimalStage') || {}).value || 'milking_peak';
  const ration = calculateFeedRation(animal, wt, milk, stage);

  const msg = 
`🌾 *${animal.name} - AI संतुलित आहार चार्ट (Daily Ration)* 🥛
━━━━━━━━━━━━━━━━━━
🐮 *पशु:* ${animal.name} (${animal.breed || ''})
⚖️ *वजन:* ${wt} kg | 🥛 *दैनिक दूध:* ${milk} L

📋 *आज की संतुलित खुराक:*
🌿 *हरा चारा:* ${ration.greenFodder}
🍂 *सूखा भूसा:* ${ration.dryFodder}
🌾 *संतुलित दाना (खल+दलिया+चोकर):* *${ration.concentrate}*
⚪ *खनिज मिश्रण (Mineral):* ${ration.mineral}
🧂 *मीठा सोडा व नमक:* ${ration.salt}
💧 *ताजा पीने का पानी:* ${ration.water}
━━━━━━━━━━━━━━━━━━
🎯 *फायदे:*
• दूध में 1 से 1.5 लीटर की वृद्धि
• फैट में 0.3 से 0.5% का सुधार
• पशु का स्वास्थ्य व प्रजनन शक्ति मजबूत!
डेयरी मित्र - AI पशु पोषण विशेषज्ञ द्वारा प्रमाणित ✨`;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// -------------------------------------------------------------------
// 4. Digital Cattle Kundali & Health ID Card (पशु कुंडली)
// -------------------------------------------------------------------
function openAnimalKundaliModal(animalId) {
  const animal = appData.animals.find(a => a.id === animalId) || appData.animals[0];
  if (!animal) return;
  currentKundaliAnimalId = animal.id;

  const isCow = animal.type === 'cow';
  const stats = getAnimalMonthlyMilkingStats(animal.id, currentKhataYear, currentKhataMonth);
  const br = (appData.breedingRecords || []).find(b => b.animalId === animal.id && b.status === 'active');

  const nameEl = document.getElementById('kundaliAnimalName');
  const tagEl = document.getElementById('kundaliTagId');
  const breedEl = document.getElementById('kundaliBreed');
  const emojiEl = document.getElementById('kundaliAvatarEmoji');
  const lactEl = document.getElementById('kundaliLactation');
  const dailyEl = document.getElementById('kundaliDailyYield');
  const peakEl = document.getElementById('kundaliPeakYield');
  const statusEl = document.getElementById('kundaliCurrentStatus');
  const semenEl = document.getElementById('kundaliSemenRecord');

  if (nameEl) nameEl.innerText = animal.name;
  if (tagEl) tagEl.innerText = `टैग: #DM-${animal.id.toUpperCase()}`;
  if (breedEl) breedEl.innerText = `${animal.breed || (isCow ? 'देशी गोवंश' : 'मुर्राह नस्ल')}`;
  if (emojiEl) emojiEl.innerText = isCow ? '🐄' : '🦬';
  if (lactEl) lactEl.innerText = animal.type === 'buffalo' ? 'दूसरा ब्यात' : 'तीसरा ब्यात';
  if (dailyEl) dailyEl.innerText = `${stats.avgDailyMilk > 0 ? stats.avgDailyMilk : (animal.expectedYield || 8.0)} L/दिन`;
  if (peakEl) peakEl.innerText = `${((animal.expectedYield || 8.0) * 1.35).toFixed(1)} L/दिन`;
  if (statusEl) {
    statusEl.innerText = animal.status === 'milking' ? '🥛 दूध चालू' : (animal.status === 'pregnant' ? '🤰 गाभिन' : 'सूखी');
  }
  if (semenEl) {
    if (br) {
      semenEl.innerText = `${br.semenDetails || 'उच्च गुणवत्ता सीमेन'} (दिनांक: ${br.aiDate})`;
    } else {
      semenEl.innerText = 'प्रमाणित उच्च नस्ल बुल सीमेन रिकॉर्ड';
    }
  }

  const modal = document.getElementById('animalKundaliModal');
  if (modal) modal.classList.remove('hidden');
}

function shareKundaliWhatsApp() {
  const animal = appData.animals.find(a => a.id === currentKundaliAnimalId) || appData.animals[0];
  if (!animal) return;
  const isCow = animal.type === 'cow';
  const stats = getAnimalMonthlyMilkingStats(animal.id, currentKhataYear, currentKhataMonth);
  const farmName = appData.farmSettings.farmName || 'श्री कृष्णा डेयरी फार्म';

  const msg = 
`🪪 *${farmName} - डिजिटल पशु कुंडली व पासपोर्ट* ✨
━━━━━━━━━━━━━━━━━━
🏷️ *नाम:* ${animal.name} (टैग: #DM-${animal.id.toUpperCase()})
🧬 *प्रजाति:* ${isCow ? 'गाय (Cow)' : 'भैंस (Buffalo)'} | *नस्ल:* ${animal.breed || 'शुद्ध नस्ल'}
🥛 *वर्तमान दूध:* ${stats.avgDailyMilk > 0 ? stats.avgDailyMilk : (animal.expectedYield || 8.0)} लीटर/दिन
🏆 *अधिकतम रिकॉर्ड:* ${((animal.expectedYield || 8.0) * 1.35).toFixed(1)} लीटर/दिन
🤰 *स्थिति:* ${animal.status === 'milking' ? 'दूध चालू' : (animal.status === 'pregnant' ? 'गाभिन' : 'सूखी')}

💉 *टीकाकरण व स्वास्थ्य स्थिति:*
✅ FMD (खुरपका-मुंहपका) टीका: अपडेटेड
✅ HS / BQ (गलघोंटू) टीका: अपडेटेड
✅ पेट के कीड़े (Deworming): संपन्न
━━━━━━━━━━━━━━━━━━
डेयरी मित्र डिजिटल पशु कुंडली द्वारा प्रमाणित ⭐`;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// -------------------------------------------------------------------
// 5. AI Animal Market Valuation Calculator (बाजार भाव)
// -------------------------------------------------------------------
function calculateAnimalMarketValue(animal) {
  if (!animal) return { fair: 65000, low: 58000, high: 72000, factors: [] };

  const isBuff = animal.type === 'buffalo';
  const yieldL = parseFloat(animal.expectedYield) || 8.0;

  // Base price per litre
  const baseRatePerLitre = isBuff ? 6800 : 5400;
  let baseValue = yieldL * baseRatePerLitre;

  // Breed factor
  let breedBonus = 0;
  const b = (animal.breed || '').toLowerCase();
  if (b.includes('मुर्रा') || b.includes('murrah') || b.includes('गिर') || b.includes('gir') || b.includes('साहीवाल')) {
    breedBonus = baseValue * 0.15;
  }

  // Pregnancy bonus
  let pregBonus = 0;
  if (animal.status === 'pregnant') {
    pregBonus = 12000;
  }

  const fairVal = Math.round((baseValue + breedBonus + pregBonus) / 1000) * 1000;
  const lowVal = Math.round((fairVal * 0.9) / 1000) * 1000;
  const highVal = Math.round((fairVal * 1.12) / 1000) * 1000;

  const factors = [
    { icon: '🥛', text: `दैनिक दूध क्षमता ${yieldL} लीटर (मूल्य: ₹${Math.round(baseValue).toLocaleString('en-IN')})` },
    { icon: '🧬', text: `प्रमाणित नस्ल: ${animal.breed || (isBuff ? 'मुर्राह' : 'साहीवाल')} (+₹${Math.round(breedBonus).toLocaleString('en-IN')})` },
    { icon: '🤰', text: animal.status === 'pregnant' ? 'गाभिन स्थिति (+₹12,000 मूल्य वर्धन)' : 'वर्तमान में दूध चालू अवस्था' },
    { icon: '🏥', text: 'नियमित टीकाकरण व उत्कृष्ट स्वास्थ्य रिकॉर्ड' }
  ];

  return {
    fair: fairVal,
    low: lowVal,
    high: highVal,
    factors
  };
}

function openAnimalValuationModal(animalId) {
  const selectEl = document.getElementById('valuationAnimalSelect');
  if (!selectEl) return;

  selectEl.innerHTML = '';
  appData.animals.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.innerText = `${a.name} (${a.breed || (a.type === 'cow' ? 'गाय' : 'भैंस')})`;
    selectEl.appendChild(opt);
  });

  const targetId = animalId || (appData.animals[0] ? appData.animals[0].id : null);
  if (targetId) selectEl.value = targetId;
  currentValuationAnimalId = targetId;

  updateAnimalValuationView();

  const modal = document.getElementById('animalValuationModal');
  if (modal) modal.classList.remove('hidden');
}

function updateAnimalValuationView() {
  const selectEl = document.getElementById('valuationAnimalSelect');
  const aid = selectEl ? selectEl.value : currentValuationAnimalId;
  const animal = appData.animals.find(a => a.id === aid) || appData.animals[0];
  const val = calculateAnimalMarketValue(animal);

  const rangeEl = document.getElementById('valuationPriceRange');
  const fairEl = document.getElementById('valuationFairPrice');
  const listEl = document.getElementById('valuationFactorsList');

  if (rangeEl) rangeEl.innerText = `₹${val.low.toLocaleString('en-IN')} - ₹${val.high.toLocaleString('en-IN')}`;
  if (fairEl) fairEl.innerText = `₹${val.fair.toLocaleString('en-IN')}`;

  if (listEl) {
    listEl.innerHTML = '';
    val.factors.forEach(f => {
      const item = document.createElement('div');
      item.className = 'v-factor-item';
      item.innerHTML = `<span class="icon">${f.icon}</span> <span>${f.text}</span>`;
      listEl.appendChild(item);
    });
  }
}

function shareValuationWhatsApp() {
  const selectEl = document.getElementById('valuationAnimalSelect');
  const aid = selectEl ? selectEl.value : currentValuationAnimalId;
  const animal = appData.animals.find(a => a.id === aid) || appData.animals[0];
  const val = calculateAnimalMarketValue(animal);

  const msg = 
`🏷️ *AI पशु बाजार भाव व मूल्यांकन रिपोर्ट* 🐮
━━━━━━━━━━━━━━━━━━
पशु: *${animal.name}* (${animal.breed || ''})
दैनिक दूध: ${animal.expectedYield || 8} L/दिन

💰 *उचित बाजार मूल्य (Fair Price):* *₹${val.fair.toLocaleString('en-IN')}*
📊 *अनुमानित रेंज:* ₹${val.low.toLocaleString('en-IN')} से ₹${val.high.toLocaleString('en-IN')}

🔍 *मूल्य निर्धारण के मुख्य कारण:*
${val.factors.map(f => `${f.icon} ${f.text}`).join('\n')}
━━━━━━━━━━━━━━━━━━
डेयरी मित्र - AI पशु बाजार भाव कैलकुलेटर ✨`;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// -------------------------------------------------------------------
// 6. Smart Farm Routine & Voice Reminders (रूटीन व अलार्म)
// -------------------------------------------------------------------
function triggerRoutineAlarm(soundType) {
  // Web Audio API Synthesizer: plays a pleasant multi-tone chime
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Play 3 melodic bell tones (Chime: C5, E5, G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);
        gain.gain.setValueAtTime(0.3, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.85);
      });
    }
  } catch (e) {
    console.error('AudioContext alarm error:', e);
  }

  // Voice announcement after chime
  const soundPrompts = {
    morning_milking: 'डेयरी मित्र अलार्म: सुबह का दूध दोहन शुरू करने का समय हो गया है!',
    morning_delivery: 'डेयरी मित्र अलार्म: सुबह की दूध सप्लाई का समय हो गया है!',
    feed_time: 'डेयरी मित्र अलार्म: पशुओं को संतुलित सानी व दाना-पानी देने का समय!',
    water_rest: 'डेयरी मित्र अलार्म: पशुओं को ताजा पानी पिलाने और नहलाने का समय!',
    evening_milking: 'डेयरी मित्र अलार्म: शाम का दूध दोहन शुरू करने का समय हो गया है!',
    evening_delivery: 'डेयरी मित्र अलार्म: शाम की दूध सप्लाई का समय हो गया है!'
  };

  const textToSpeak = soundPrompts[soundType] || 'डेयरी मित्र अलार्म: फार्म रूटीन का समय हो गया है!';
  setTimeout(() => {
    speakAudio(textToSpeak);
    showAudioToast(`🔔 अलार्म: ${textToSpeak}`);
  }, 600);
}

function openFarmRoutineModal() {
  const modal = document.getElementById('farmRoutineModal');
  if (modal) modal.classList.remove('hidden');

  // Highlight active slot based on current hour
  const hour = new Date().getHours();
  const slots = document.querySelectorAll('.routine-timeline .timeline-slot');
  slots.forEach(s => s.classList.remove('active'));

  if (hour >= 4 && hour < 6 && slots[0]) slots[0].classList.add('active');
  else if (hour >= 6 && hour < 8 && slots[1]) slots[1].classList.add('active');
  else if (hour >= 8 && hour < 12 && slots[2]) slots[2].classList.add('active');
  else if (hour >= 12 && hour < 16 && slots[3]) slots[3].classList.add('active');
  else if (hour >= 16 && hour < 18 && slots[4]) slots[4].classList.add('active');
  else if (hour >= 18 && slots[5]) slots[5].classList.add('active');
}

// -------------------------------------------------------------------
// 7. 100% Purity Guarantee WhatsApp Poster (शुद्धता गारंटी पत्र)
// -------------------------------------------------------------------
function openPurityCertModal() {
  const phoneEl = document.getElementById('certOwnerPhone');
  if (phoneEl) {
    phoneEl.innerText = `📱 ${appData.farmSettings.ownerPhone || '98765 43210'}`;
  }
  const modal = document.getElementById('purityCertModal');
  if (modal) modal.classList.remove('hidden');
}

function sharePurityWhatsApp() {
  const farmName = appData.farmSettings.farmName || 'श्री कृष्णा डेयरी फार्म';
  const ownerPhone = appData.farmSettings.ownerPhone || '9876543210';

  const msg = 
`🥛 *${farmName} - 100% शुद्धता गारंटी पत्र* 🏅
━━━━━━━━━━━━━━━━━━
⭐ *शुद्धता हमारी पहचान • स्वास्थ्य आपका अधिकार* ⭐

🥛 *भैंस का दूध:* Fat 7.0% - 7.5% | SNF 9.0+ (गाढ़ा व मलाईदार)
🐄 *देसी गाय का दूध:* Fat 4.2% | A2 पौष्टिकता (सुपाच्य अमृत)

✅ 100% पानी व केमिकल मिलावट मुक्त
✅ बिना किसी ऑक्सीटोसिन / हार्मोनल इंजेक्शन
✅ स्वच्छ व आधुनिक दोहन पद्धति
✅ ताजा दूध सीधे फार्म से आपके घर तक!

📞 *घर पर ताजा दूध आर्डर करने हेतु संपर्क करें:*
📱 *${ownerPhone}*
━━━━━━━━━━━━━━━━━━
डेयरी मित्र द्वारा 100% शुद्धता प्रमाणित ✨`;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// -------------------------------------------------------------------
// 8. Digital Pashu Mela (पशु मेला - गाय/भैंस खरीद-बिक्री कार्ड)
// -------------------------------------------------------------------
let currentMelaAnimalId = null;

function openPashuMelaModal(animalId) {
  const selectEl = document.getElementById('melaAnimalSelect');
  if (!selectEl) return;

  selectEl.innerHTML = '';
  appData.animals.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    const saleTag = a.forSale ? ' [🔴 बिकाऊ]' : '';
    opt.innerText = `${a.name} (${a.breed || (a.type === 'cow' ? 'गाय' : 'भैंस')})${saleTag}`;
    selectEl.appendChild(opt);
  });

  const targetId = animalId || (appData.animals[0] ? appData.animals[0].id : null);
  if (targetId) selectEl.value = targetId;
  currentMelaAnimalId = targetId;

  // Pre-fill form from selected animal's data or smart defaults
  const animal = appData.animals.find(a => a.id === targetId) || appData.animals[0];
  if (animal) {
    const yieldInput = document.getElementById('melaMilkYield');
    if (yieldInput) yieldInput.value = animal.expectedYield || 10.0;

    const priceInput = document.getElementById('melaAskingPrice');
    const val = calculateAnimalMarketValue(animal);
    if (priceInput) priceInput.value = animal.salePrice || val.fair || 65000;

    const fairDisplay = document.getElementById('melaFairPriceDisplay');
    if (fairDisplay) fairDisplay.innerText = `₹${(val.fair || 65000).toLocaleString('en-IN')}`;

    const lactSelect = document.getElementById('melaLactationSelect');
    if (lactSelect) lactSelect.value = animal.saleLactation || '2nd ब्यात (दूसरा ब्यात)';

    const calfSelect = document.getElementById('melaCalfSelect');
    if (calfSelect) calfSelect.value = animal.saleCalf || 'बछड़ी साथ में (Female Calf)';

    const pregSelect = document.getElementById('melaPregnancySelect');
    if (pregSelect) pregSelect.value = animal.salePregnancy || (animal.status === 'pregnant' ? '3 माह की गाभिन' : 'खाली (ताजा दूध चालू)');

    const phoneInput = document.getElementById('melaSellerPhone');
    if (phoneInput) phoneInput.value = animal.salePhone || appData.farmSettings.ownerPhone || '9876543210';

    const locInput = document.getElementById('melaLocation');
    if (locInput) locInput.value = animal.saleLocation || 'गाँव-रामपुर, जिला-करनाल (हरियाणा)';

    const cb = document.getElementById('melaForSaleCheckbox');
    if (cb) cb.checked = (animal.forSale !== false);

    // Populate or reset tags
    const activeTags = (animal.saleTags && Array.isArray(animal.saleTags) && animal.saleTags.length > 0)
      ? animal.saleTags
      : ['बिल्कुल सीधी व शांत', 'हाथ व मशीन दोनों से दुहाई', 'दोनों समय की पक्की दुहाई', '100% स्वस्थ व एक्टिव'];

    document.querySelectorAll('#melaTagsCloud .mela-tag-chip').forEach(chip => {
      chip.classList.toggle('active', activeTags.includes(chip.getAttribute('data-tag')));
    });
  }

  updatePashuMelaView();

  const modal = document.getElementById('pashuMelaModal');
  if (modal) modal.classList.remove('hidden');
}

function updatePashuMelaView() {
  const selectEl = document.getElementById('melaAnimalSelect');
  const aid = selectEl ? selectEl.value : currentMelaAnimalId;
  const animal = appData.animals.find(a => a.id === aid) || appData.animals[0];
  if (!animal) return;

  const lactation = document.getElementById('melaLactationSelect')?.value || '2nd ब्यात';
  const calf = document.getElementById('melaCalfSelect')?.value || 'बछड़ी साथ में';
  const pregnancy = document.getElementById('melaPregnancySelect')?.value || 'खाली (दूध चालू)';
  const milkYield = parseFloat(document.getElementById('melaMilkYield')?.value) || (animal.expectedYield || 10.0);
  const askingPrice = parseInt(document.getElementById('melaAskingPrice')?.value, 10) || 65000;
  const nego = document.getElementById('melaNegotiableSelect')?.value || 'नेगोशिएबल (थोड़ी गुंजाइश)';
  const phone = document.getElementById('melaSellerPhone')?.value || appData.farmSettings.ownerPhone || '9876543210';
  const location = document.getElementById('melaLocation')?.value || 'हरियाणा';

  // Update AI Price display button
  const val = calculateAnimalMarketValue(animal);
  const fairDisplay = document.getElementById('melaFairPriceDisplay');
  if (fairDisplay) fairDisplay.innerText = `₹${(val.fair || 65000).toLocaleString('en-IN')}`;

  // Update Card Hero
  const titleEl = document.getElementById('melaCardTitle');
  const subEl = document.getElementById('melaCardSubtitle');
  const priceEl = document.getElementById('melaCardPrice');
  const negoEl = document.getElementById('melaCardNego');
  const avatarEl = document.getElementById('melaCardAvatar');

  if (titleEl) titleEl.innerText = `${animal.name} (${animal.breed || (animal.type === 'cow' ? 'गाय' : 'भैंस')})`;
  if (subEl) subEl.innerText = `${animal.type === 'cow' ? '🐄 देशी गाय' : '🐃 मुर्रा/देशी भैंस'} • ${lactation} • ${calf}`;
  if (priceEl) priceEl.innerText = `₹${askingPrice.toLocaleString('en-IN')}`;
  if (negoEl) negoEl.innerText = `(${nego.includes('नेगोशिएबल') ? 'नेगोशिएबल' : 'फिक्स भाव'})`;

  if (avatarEl) {
    if (animal.photo) {
      avatarEl.innerHTML = `<img src="${animal.photo}" alt="${animal.name}">`;
    } else {
      avatarEl.innerHTML = animal.type === 'cow' ? '🐄' : '🐃';
    }
  }

  // Update Specs Grid
  const milkCard = document.getElementById('melaCardMilk');
  const lactCard = document.getElementById('melaCardLactation');
  const calfCard = document.getElementById('melaCardCalf');
  const pregCard = document.getElementById('melaCardPregnancy');

  if (milkCard) milkCard.innerText = `${milkYield.toFixed(1)} L/दिन`;
  if (lactCard) lactCard.innerText = lactation;
  if (calfCard) calfCard.innerText = calf;
  if (pregCard) pregCard.innerText = pregnancy;

  // Update Tags Preview
  const tagsListEl = document.getElementById('melaCardTagsPreview');
  if (tagsListEl) {
    tagsListEl.innerHTML = '';
    document.querySelectorAll('#melaTagsCloud .mela-tag-chip.active').forEach(chip => {
      const span = document.createElement('span');
      span.className = 'tag-pill';
      span.innerText = chip.innerText;
      tagsListEl.appendChild(span);
    });
  }

  // Update Location and Phone
  const locEl = document.getElementById('melaCardLocationText');
  const phoneEl = document.getElementById('melaCardPhoneText');
  if (locEl) locEl.innerText = location;
  if (phoneEl) phoneEl.innerText = phone;
}

function getFormattedPashuMelaAdText() {
  const selectEl = document.getElementById('melaAnimalSelect');
  const aid = selectEl ? selectEl.value : currentMelaAnimalId;
  const animal = appData.animals.find(a => a.id === aid) || appData.animals[0];
  if (!animal) return '';

  const lactation = document.getElementById('melaLactationSelect')?.value || '2nd ब्यात';
  const calf = document.getElementById('melaCalfSelect')?.value || 'बछड़ी साथ में';
  const pregnancy = document.getElementById('melaPregnancySelect')?.value || 'खाली (दूध चालू)';
  const milkYield = parseFloat(document.getElementById('melaMilkYield')?.value) || (animal.expectedYield || 10.0);
  const askingPrice = parseInt(document.getElementById('melaAskingPrice')?.value, 10) || 65000;
  const nego = document.getElementById('melaNegotiableSelect')?.value || 'नेगोशिएबल (थोड़ी गुंजाइश)';
  const phone = (document.getElementById('melaSellerPhone')?.value || appData.farmSettings.ownerPhone || '9876543210').trim();
  const location = (document.getElementById('melaLocation')?.value || 'गाँव-रामपुर, जिला-करनाल (हरियाणा)').trim();

  const selectedTags = [];
  document.querySelectorAll('#melaTagsCloud .mela-tag-chip.active').forEach(chip => {
    selectedTags.push(chip.getAttribute('data-tag'));
  });

  const isCow = animal.type === 'cow';
  const animalTypeLabel = isCow ? 'गाय (Cow)' : 'भैंस (Buffalo)';
  const cleanPhone = phone.replace(/\D/g, '');
  const waTarget = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const chatUrl = `https://wa.me/${waTarget}?text=${encodeURIComponent(`नमस्ते जी! मुझे आपकी बिकाऊ ${animalTypeLabel} (${animal.name}) के बारे में बात करनी है। क्या यह अभी उपलब्ध है?`)}`;

  const msg = 
`🔴 *बिकाऊ है (FOR SALE) • डिजिटल पशु मेला* ${isCow ? '🐄' : '🐃'}
━━━━━━━━━━━━━━━━━━━━━━
📢 *पशु:* ${animal.name} (${animal.breed || 'शुद्ध नस्ल'} ${animalTypeLabel})
💰 *माँग कीमत:* *₹${askingPrice.toLocaleString('en-IN')}* (${nego})
🤝 *0% दलाली • सीधे किसान से खरीदें*
━━━━━━━━━━━━━━━━━━━━━━
📊 *पशु की मुख्य जानकारी:*
🥛 *दैनिक दूध क्षमता:* ${milkYield.toFixed(1)} लीटर/दिन (दोनों समय की पक्की दुहाई)
🍼 *ब्यात (Lactation):* ${lactation}
🐮 *बच्चा / स्थिति:* ${calf}
🤰 *गाभिन स्थिति:* ${pregnancy}
${animal.expectedYield ? `🏆 *अधिकतम रिकॉर्ड:* ${(animal.expectedYield * 1.3).toFixed(1)} लीटर/दिन\n` : ''}✨ *खासियत व स्वभाव:*
${selectedTags.map(t => `✅ ${t}`).join('\n')}

📍 *स्थान (पता):* ${location}
📞 *मालिक से सीधे संपर्क करें:* ${phone}
💬 *सीधा WhatsApp चैट लिंक:*
${chatUrl}
━━━━━━━━━━━━━━━━━━━━━━
✨ *डेयरी मित्र - डिजिटल पशु मेला* (किसान का अपना मंच)`;

  return msg;
}

function sharePashuMelaWhatsApp() {
  const msg = getFormattedPashuMelaAdText();
  if (!msg) return;

  savePashuMelaStatus(false);
  showAudioToast('📲 WhatsApp पशु मेला विज्ञापन खुल रहा है...');
  speakAudio('पशु मेला विज्ञापन तैयार है। WhatsApp पर शेयर करें।');
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function copyPashuMelaText() {
  const msg = getFormattedPashuMelaAdText();
  if (!msg) return;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(msg).then(() => {
      showAudioToast('📋 विज्ञापन कॉपी हो गया! WhatsApp ग्रुप में पेस्ट करें');
      speakAudio('विज्ञापन टेक्स्ट कॉपी हो गया');
    }).catch(() => {
      showAudioToast('📋 टेक्स्ट कॉपी किया गया');
    });
  } else {
    showAudioToast('📋 टेक्स्ट कॉपी किया गया');
  }
}

function savePashuMelaStatus(showFeedback = true) {
  const selectEl = document.getElementById('melaAnimalSelect');
  const aid = selectEl ? selectEl.value : currentMelaAnimalId;
  const animal = appData.animals.find(a => a.id === aid) || appData.animals[0];
  if (!animal) return;

  const forSale = document.getElementById('melaForSaleCheckbox')?.checked ?? true;
  const askingPrice = parseInt(document.getElementById('melaAskingPrice')?.value, 10) || 65000;
  const lactation = document.getElementById('melaLactationSelect')?.value || '2nd ब्यात';
  const calf = document.getElementById('melaCalfSelect')?.value || 'बछड़ी साथ में';
  const pregnancy = document.getElementById('melaPregnancySelect')?.value || 'खाली (दूध चालू)';
  const phone = document.getElementById('melaSellerPhone')?.value || appData.farmSettings.ownerPhone || '9876543210';
  const location = document.getElementById('melaLocation')?.value || 'हरियाणा';

  const selectedTags = [];
  document.querySelectorAll('#melaTagsCloud .mela-tag-chip.active').forEach(chip => {
    selectedTags.push(chip.getAttribute('data-tag'));
  });

  animal.forSale = forSale;
  animal.salePrice = askingPrice;
  animal.saleLactation = lactation;
  animal.saleCalf = calf;
  animal.salePregnancy = pregnancy;
  animal.salePhone = phone;
  animal.saleLocation = location;
  animal.saleTags = selectedTags;

  saveData();
  renderCattleRegister();

  if (showFeedback) {
    showAudioToast(`💾 ${animal.name} की बिकाऊ स्थिति फार्म पर सेव हो गई!`);
    speakAudio(`${animal.name} की स्थिति सुरक्षित हो गई`);
    const modal = document.getElementById('pashuMelaModal');
    if (modal) modal.classList.add('hidden');
  }
}

// ===================================================================
// FEATURE 9: DAIRYMITRA PRO SUBSCRIPTION & VIRAL REFERRAL SYSTEM
// ===================================================================

function playCelebrationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      // Fanfare: C5, E5, G5, C6
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.35, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.65);
      });
    }
  } catch (e) {
    console.error('Celebration audio error:', e);
  }
}

function isProMember() {
  if (!appData.farmSettings.isPro) return false;
  if (!appData.farmSettings.proValidUntil) return true;
  const exp = new Date(appData.farmSettings.proValidUntil);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return exp >= now;
}

function getProDaysRemaining() {
  if (!appData.farmSettings.isPro || !appData.farmSettings.proValidUntil) return 0;
  const exp = new Date(appData.farmSettings.proValidUntil);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function addProDays(days) {
  let baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  if (appData.farmSettings.isPro && appData.farmSettings.proValidUntil) {
    const existing = new Date(appData.farmSettings.proValidUntil);
    if (existing > baseDate) {
      baseDate = existing;
    }
  }
  baseDate.setDate(baseDate.getDate() + days);
  const validUntilStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;
  appData.farmSettings.isPro = true;
  appData.farmSettings.proValidUntil = validUntilStr;
  saveData();
  updateHeaderProBadge();
  updateProModalUI();
  return validUntilStr;
}

function openProSubscriptionModal() {
  updateProModalUI();
  const modal = document.getElementById('proSubscriptionModal');
  if (modal) modal.classList.remove('hidden');
}

function closeProSubscriptionModal() {
  const modal = document.getElementById('proSubscriptionModal');
  if (modal) modal.classList.add('hidden');
}

function updateProModalUI() {
  const isPro = isProMember();
  const daysLeft = getProDaysRemaining();
  const validUntil = appData.farmSettings.proValidUntil;

  // Status Card
  const card = document.getElementById('proCurrentStatusCard');
  const badge = document.getElementById('proStatusBadge');
  const expiry = document.getElementById('proExpiryDisplay');
  const desc = document.getElementById('proStatusDesc');

  if (card && badge && expiry && desc) {
    if (isPro) {
      card.classList.add('active-pro');
      badge.innerText = '👑 प्रो सदस्य सक्रिय (VIP)';
      const expDateObj = validUntil ? new Date(validUntil) : null;
      const formattedExp = expDateObj ? `${expDateObj.getDate()} ${getHindiMonthName(expDateObj.getMonth() + 1)} ${expDateObj.getFullYear()}` : 'आजीवन सक्रिय';
      expiry.innerText = `⏳ ${daysLeft} दिन शेष (${formattedExp} तक)`;
      desc.innerHTML = `बधाई! आपका फार्म <strong>डेयरी मित्र प्रो VIP</strong> पर सक्रिय है। असीमित रिकॉर्ड्स, ऑटो बैकअप व VIP पशु मेला सुविधाएं अनलॉक हैं।`;
    } else {
      card.classList.remove('active-pro');
      badge.innerText = '⚪ फ्री प्लान (सीमित)';
      expiry.innerText = 'अपग्रेड उपलब्ध';
      desc.innerHTML = `अभी आपका फार्म फ्री प्लान पर है। 1 मित्र को रेफर करें और <strong>1 महीना प्रो मुफ़्त</strong> पाएँ!`;
    }
  }

  // Personal Referral Code
  const myCodeEl = document.getElementById('myReferralCode');
  if (myCodeEl) {
    myCodeEl.innerText = appData.farmSettings.referralCode || 'DM-KRISHNA78';
  }

  const refCountEl = document.getElementById('refCountDisplay');
  const refEarnedEl = document.getElementById('refEarnedMonths');
  const count = appData.farmSettings.referralsCount || 0;
  if (refCountEl) refCountEl.innerText = count;
  if (refEarnedEl) refEarnedEl.innerText = count;

  // Redeem Input Box
  const inputCode = document.getElementById('inputReferralCode');
  const applyBtn = document.getElementById('btnApplyReferralCode');
  if (appData.farmSettings.hasUsedReferral) {
    if (inputCode) {
      inputCode.value = appData.farmSettings.referredBy || 'सफल';
      inputCode.disabled = true;
    }
    if (applyBtn) {
      applyBtn.innerText = '✓ लागू है';
      applyBtn.disabled = true;
      applyBtn.style.background = '#10b981';
      applyBtn.style.cursor = 'default';
    }
  } else {
    if (inputCode) {
      inputCode.disabled = false;
    }
    if (applyBtn) {
      applyBtn.innerText = 'लागू करें';
      applyBtn.disabled = false;
      applyBtn.style.background = '';
      applyBtn.style.cursor = 'pointer';
    }
  }
}

function updateHeaderProBadge() {
  const btn = document.getElementById('openProModalBtn');
  const btnText = document.getElementById('proBtnText');
  if (!btn) return;
  const isPro = isProMember();
  const daysLeft = getProDaysRemaining();

  if (isPro) {
    btn.classList.add('is-active-pro');
    if (btnText) {
      btnText.innerText = daysLeft > 0 ? `👑 VIP (${daysLeft}d)` : `👑 PRO VIP`;
    }
  } else {
    btn.classList.remove('is-active-pro');
    if (btnText) {
      btnText.innerText = `👑 प्रो • रेफर`;
    }
  }
}

function copyReferralCode() {
  const code = appData.farmSettings.referralCode || 'DM-KRISHNA78';
  const copyBtn = document.getElementById('btnCopyReferralCode');

  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => {
      if (copyBtn) {
        const orig = copyBtn.innerText;
        copyBtn.innerText = '✓ कॉपी हुआ!';
        setTimeout(() => { copyBtn.innerText = orig; }, 2000);
      }
      showAudioToast(`📋 रेफरल कोड ${code} कॉपी हो गया! दोस्तों को भेजें और 1 महीना प्रो मुफ़्त पाएँ!`);
      speakAudio('रेफरल कोड कॉपी हो गया');
    }).catch(() => {
      showAudioToast(`📋 रेफरल कोड: ${code}`);
    });
  } else {
    showAudioToast(`📋 रेफरल कोड: ${code}`);
  }
}

function shareReferralWhatsApp() {
  const code = appData.farmSettings.referralCode || 'DM-KRISHNA78';
  const appUrl = window.location.href.split('#')[0];
  const msg = 
`🥛 *डेयरी मित्र प्रो (DairyMitra Pro)* 👑
━━━━━━━━━━━━━━━━━━━━━━
नमस्ते किसान भाई! 🙏
मैं अपने डेयरी फार्म का पूरा दूध हिसाब, पशु रिकॉर्ड और 1-क्लिक WhatsApp पर्ची *डेयरी मित्र ऐप* से बहुत आसानी से चला रहा हूँ।

🎁 *आपके लिए खास 1 महीना प्रो मुफ़्त उपहार:*
ऐप में मेरा रेफरल कोड डालें और तुरंत पाएँ *1 महीना DairyMitra Pro VIP मुफ़्त!*

🔑 *रेफरल कोड:* *${code}*

📲 *डेयरी मित्र ऐप खोलें:*
${appUrl}

(कोड कॉपी करके ऐप के "प्रो • रेफर" बटन में डालें और 30 दिन का VIP आनंद लें!)
━━━━━━━━━━━━━━━━━━━━━━
डेयरी मित्र - किसान का अपना डिजिटल साथी ✨`;

  showAudioToast('📲 WhatsApp इनवाइट खुल रहा है...');
  speakAudio('WhatsApp इनवाइट तैयार है। अपने मित्रों को शेयर करें।');
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function applyReferralCode() {
  const input = document.getElementById('inputReferralCode');
  if (!input) return;
  const rawCode = input.value.trim().toUpperCase();

  if (!rawCode) {
    showAudioToast('⚠️ कृपया अपने मित्र का रेफरल कोड दर्ज करें!');
    return;
  }

  if (rawCode === (appData.farmSettings.referralCode || '').toUpperCase()) {
    showAudioToast('❌ आप अपना खुद का रेफरल कोड उपयोग नहीं कर सकते!');
    speakAudio('आप अपना खुद का रेफरल कोड उपयोग नहीं कर सकते');
    return;
  }

  if (appData.farmSettings.hasUsedReferral) {
    showAudioToast('ℹ️ आप पहले ही रेफरल बोनस प्राप्त कर चुके हैं!');
    return;
  }

  if (rawCode.length < 4) {
    showAudioToast('⚠️ अमान्य रेफरल कोड! कोड कम से कम 4 अक्षरों का होना चाहिए।');
    return;
  }

  // Grant 1 month (30 days) free Pro!
  appData.farmSettings.hasUsedReferral = true;
  appData.farmSettings.referredBy = rawCode;
  const expiryDateStr = addProDays(30);

  playCelebrationChime();
  showAudioToast(`🎉 बधाई हो! रेफरल कोड सफल! 1 महीना (30 दिन) प्रो मुफ़्त मिला! 👑`);
  speakAudio('बधाई हो! रेफरल कोड लागू हो गया है और आपको 1 महीना प्रो मुफ़्त मिला है।');

  updateProModalUI();
}

function simulateFriendJoined() {
  appData.farmSettings.referralsCount = (appData.farmSettings.referralsCount || 0) + 1;
  addProDays(30);
  playCelebrationChime();
  showAudioToast(`🎁 1 मित्र जुड़ा! आपके खाते में +30 दिन (1 महीना) प्रो मुफ़्त जुड़ गया! 👑`);
  speakAudio('बधाई हो! एक मित्र आपके रेफरल से जुड़ा है। आपके खाते में एक महीना प्रो मुफ़्त जुड़ गया है।');
  updateProModalUI();
}

function activateProSubscription(planType = 'monthly') {
  let days = 30;
  let label = 'मासिक (₹49)';
  if (planType === 'yearly') {
    days = 365;
    label = 'वार्षिक (₹399)';
  } else if (planType === 'instant') {
    days = 30;
    label = '30 दिन तुरंत एक्टिवेशन';
  }

  addProDays(days);
  playCelebrationChime();
  showAudioToast(`👑 बधाई हो! डेयरी मित्र प्रो (${label}) सक्रिय हो गया!`);
  speakAudio(`बधाई हो! आपका प्रो प्लान सक्रिय हो गया है।`);
  updateProModalUI();
}

function payProUpi() {
  const farmName = appData.farmSettings.farmName || 'श्री कृष्णा डेयरी फार्म';
  const upiId = appData.farmSettings.upiId || 'dairyfarm@upi';
  const note = encodeURIComponent(`DairyMitra Pro Annual VIP - ${farmName}`);
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(farmName)}&am=399&cu=INR&tn=${note}`;

  showAudioToast('⚡ UPI पेमेंट ऐप खुल रहा है (₹399)...');
  window.location.href = upiUrl;

  setTimeout(() => {
    if (confirm('क्या आपका UPI भुगतान पूरा हो गया है? तुरंत 1 वर्ष प्रो सक्रिय करें?')) {
      activateProSubscription('yearly');
    }
  }, 2500);
}

// -------------------------------------------------------------------
// TRENDING FEATURES EVENT LISTENERS INITIALIZATION
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // 1. Trending Action Shortcuts in Header
  const openExpBtn = document.getElementById('openExpenseProfitBtn');
  if (openExpBtn) {
    openExpBtn.addEventListener('click', () => openExpenseProfitModal());
  }

  const openRoutineBtn = document.getElementById('openFarmRoutineBtn');
  if (openRoutineBtn) {
    openRoutineBtn.addEventListener('click', () => openFarmRoutineModal());
  }

  const openPurityBtn = document.getElementById('openPurityCertBtn');
  if (openPurityBtn) {
    openPurityBtn.addEventListener('click', () => openPurityCertModal());
  }

  const openMelaBtn = document.getElementById('openPashuMelaBtn');
  if (openMelaBtn) {
    openMelaBtn.addEventListener('click', () => openPashuMelaModal());
  }

  const openMelaHeaderBtn = document.getElementById('openPashuMelaHeaderBtn');
  if (openMelaHeaderBtn) {
    openMelaHeaderBtn.addEventListener('click', () => openPashuMelaModal());
  }

  // 2. UPI Bill Modal
  const closeUpiBillBtn = document.getElementById('closeUpiBillBtn');
  if (closeUpiBillBtn) {
    closeUpiBillBtn.addEventListener('click', () => {
      document.getElementById('upiBillModal').classList.add('hidden');
    });
  }

  const btnSendUpiWhatsApp = document.getElementById('btnSendUpiWhatsApp');
  if (btnSendUpiWhatsApp) {
    btnSendUpiWhatsApp.addEventListener('click', sendUpiWhatsAppBill);
  }

  const btnOpenDirectUpi = document.getElementById('btnOpenDirectUpi');
  if (btnOpenDirectUpi) {
    btnOpenDirectUpi.addEventListener('click', openDirectUpiPayment);
  }

  const btnCopyUpiId = document.getElementById('btnCopyUpiId');
  if (btnCopyUpiId) {
    btnCopyUpiId.addEventListener('click', () => {
      const upiId = appData.farmSettings.upiId || 'dairyfarm@upi';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(upiId).then(() => {
          showAudioToast(`📋 UPI ID कॉपी कर लिया: ${upiId}`);
        }).catch(() => {});
      } else {
        showAudioToast(`UPI ID: ${upiId}`);
      }
    });
  }

  // 3. Expense & Profit Modal
  const closeExpBtn = document.getElementById('closeExpenseProfitBtn');
  if (closeExpBtn) {
    closeExpBtn.addEventListener('click', () => {
      document.getElementById('expenseProfitModal').classList.add('hidden');
    });
  }

  const expDateInput = document.getElementById('expenseProfitDate');
  if (expDateInput) {
    expDateInput.addEventListener('change', (e) => {
      openExpenseProfitModal(e.target.value);
    });
  }

  ['expFeed', 'expGreenFodder', 'expDryFodder', 'expMedical', 'expOther'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', recalculateLiveExpenses);
  });

  const btnSaveDailyExpenses = document.getElementById('btnSaveDailyExpenses');
  if (btnSaveDailyExpenses) {
    btnSaveDailyExpenses.addEventListener('click', saveDailyExpenses);
  }

  const btnShareProfitWhatsApp = document.getElementById('btnShareProfitWhatsApp');
  if (btnShareProfitWhatsApp) {
    btnShareProfitWhatsApp.addEventListener('click', shareDailyProfitWhatsApp);
  }

  // 4. Feed Optimizer Modal
  const closeFeedBtn = document.getElementById('closeFeedOptimizerBtn');
  if (closeFeedBtn) {
    closeFeedBtn.addEventListener('click', () => {
      document.getElementById('feedOptimizerModal').classList.add('hidden');
    });
  }

  const feedAnimalSelect = document.getElementById('feedAnimalSelect');
  if (feedAnimalSelect) {
    feedAnimalSelect.addEventListener('change', () => {
      const aid = feedAnimalSelect.value;
      const animal = appData.animals.find(a => a.id === aid);
      if (animal) {
        const wtInput = document.getElementById('feedAnimalWeight');
        const milkInput = document.getElementById('feedDailyMilk');
        const stageInput = document.getElementById('feedAnimalStage');
        if (wtInput) wtInput.value = animal.type === 'buffalo' ? 500 : 420;
        if (milkInput) milkInput.value = animal.expectedYield || 8;
        if (stageInput) stageInput.value = animal.status === 'pregnant' ? 'pregnant_dry' : (animal.status === 'milking' ? 'milking_peak' : 'dry');
      }
      updateFeedOptimizerView();
    });
  }

  ['feedAnimalWeight', 'feedDailyMilk', 'feedAnimalStage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateFeedOptimizerView);
      el.addEventListener('change', updateFeedOptimizerView);
    }
  });

  const btnSpeakFeedRation = document.getElementById('btnSpeakFeedRation');
  if (btnSpeakFeedRation) {
    btnSpeakFeedRation.addEventListener('click', speakFeedRationAudio);
  }

  const btnShareFeedWhatsApp = document.getElementById('btnShareFeedWhatsApp');
  if (btnShareFeedWhatsApp) {
    btnShareFeedWhatsApp.addEventListener('click', shareFeedWhatsApp);
  }

  // 5. Animal Kundali Modal
  const closeKundaliBtn = document.getElementById('closeAnimalKundaliBtn');
  if (closeKundaliBtn) {
    closeKundaliBtn.addEventListener('click', () => {
      document.getElementById('animalKundaliModal').classList.add('hidden');
    });
  }

  const btnShareKundaliWhatsApp = document.getElementById('btnShareKundaliWhatsApp');
  if (btnShareKundaliWhatsApp) {
    btnShareKundaliWhatsApp.addEventListener('click', shareKundaliWhatsApp);
  }

  const btnPrintKundali = document.getElementById('btnPrintKundali');
  if (btnPrintKundali) {
    btnPrintKundali.addEventListener('click', () => {
      showAudioToast('🖨️ पशु कुंडली प्रिंट / डाउनलोड के लिए तैयार!');
      window.print();
    });
  }

  // 6. Animal Valuation Modal
  const closeValBtn = document.getElementById('closeAnimalValuationBtn');
  if (closeValBtn) {
    closeValBtn.addEventListener('click', () => {
      document.getElementById('animalValuationModal').classList.add('hidden');
    });
  }

  const btnCloseValModal = document.getElementById('btnCloseValuationModal');
  if (btnCloseValModal) {
    btnCloseValModal.addEventListener('click', () => {
      document.getElementById('animalValuationModal').classList.add('hidden');
    });
  }

  const valAnimalSelect = document.getElementById('valuationAnimalSelect');
  if (valAnimalSelect) {
    valAnimalSelect.addEventListener('change', updateAnimalValuationView);
  }

  const btnShareValuationWhatsApp = document.getElementById('btnShareValuationWhatsApp');
  if (btnShareValuationWhatsApp) {
    btnShareValuationWhatsApp.addEventListener('click', shareValuationWhatsApp);
  }

  // 7. Farm Routine Modal
  const closeRoutineBtn = document.getElementById('closeFarmRoutineBtn');
  if (closeRoutineBtn) {
    closeRoutineBtn.addEventListener('click', () => {
      document.getElementById('farmRoutineModal').classList.add('hidden');
    });
  }

  const btnTestVoiceAlarm = document.getElementById('btnTestVoiceAlarm');
  if (btnTestVoiceAlarm) {
    btnTestVoiceAlarm.addEventListener('click', () => triggerRoutineAlarm('morning_milking'));
  }

  document.querySelectorAll('.btn-slot-alarm').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const soundType = btn.getAttribute('data-sound') || 'morning_milking';
      triggerRoutineAlarm(soundType);
    });
  });

  // 8. Purity Certificate Poster Modal
  const closePurityCertBtn = document.getElementById('closePurityCertBtn');
  if (closePurityCertBtn) {
    closePurityCertBtn.addEventListener('click', () => {
      document.getElementById('purityCertModal').classList.add('hidden');
    });
  }

  const btnClosePurityModal = document.getElementById('btnClosePurityModal');
  if (btnClosePurityModal) {
    btnClosePurityModal.addEventListener('click', () => {
      document.getElementById('purityCertModal').classList.add('hidden');
    });
  }

  const btnSharePurityWhatsApp = document.getElementById('btnSharePurityWhatsApp');
  if (btnSharePurityWhatsApp) {
    btnSharePurityWhatsApp.addEventListener('click', sharePurityWhatsApp);
  }

  // 9. Digital Pashu Mela Modal Listeners
  const closePashuMelaBtn = document.getElementById('closePashuMelaBtn');
  if (closePashuMelaBtn) {
    closePashuMelaBtn.addEventListener('click', () => {
      document.getElementById('pashuMelaModal').classList.add('hidden');
    });
  }

  const melaAnimalSelect = document.getElementById('melaAnimalSelect');
  if (melaAnimalSelect) {
    melaAnimalSelect.addEventListener('change', () => {
      openPashuMelaModal(melaAnimalSelect.value);
    });
  }

  ['melaLactationSelect', 'melaCalfSelect', 'melaPregnancySelect', 'melaMilkYield', 'melaAskingPrice', 'melaNegotiableSelect', 'melaSellerPhone', 'melaLocation', 'melaForSaleCheckbox'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updatePashuMelaView);
      el.addEventListener('change', updatePashuMelaView);
    }
  });

  document.querySelectorAll('#melaTagsCloud .mela-tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      updatePashuMelaView();
    });
  });

  const btnUseFairPrice = document.getElementById('btnUseFairPrice');
  if (btnUseFairPrice) {
    btnUseFairPrice.addEventListener('click', () => {
      const selectEl = document.getElementById('melaAnimalSelect');
      const aid = selectEl ? selectEl.value : currentMelaAnimalId;
      const animal = appData.animals.find(a => a.id === aid) || appData.animals[0];
      if (animal) {
        const val = calculateAnimalMarketValue(animal);
        const priceInput = document.getElementById('melaAskingPrice');
        if (priceInput && val.fair) {
          priceInput.value = val.fair;
          updatePashuMelaView();
          showAudioToast(`💡 AI उचित भाव ₹${val.fair.toLocaleString('en-IN')} भर दिया गया!`);
        }
      }
    });
  }

  const btnShareMelaWhatsApp = document.getElementById('btnShareMelaWhatsApp');
  if (btnShareMelaWhatsApp) {
    btnShareMelaWhatsApp.addEventListener('click', sharePashuMelaWhatsApp);
  }

  const btnCopyMelaText = document.getElementById('btnCopyMelaText');
  if (btnCopyMelaText) {
    btnCopyMelaText.addEventListener('click', copyPashuMelaText);
  }

  const btnSaveMelaStatus = document.getElementById('btnSaveMelaStatus');
  if (btnSaveMelaStatus) {
    btnSaveMelaStatus.addEventListener('click', () => savePashuMelaStatus(true));
  }

  // 10. DairyMitra Pro & Referral Program Listeners
  const openProModalBtn = document.getElementById('openProModalBtn');
  if (openProModalBtn) {
    openProModalBtn.addEventListener('click', openProSubscriptionModal);
  }

  const openProShortcutBtn = document.getElementById('openProShortcutBtn');
  if (openProShortcutBtn) {
    openProShortcutBtn.addEventListener('click', openProSubscriptionModal);
  }

  const closeProModalBtn = document.getElementById('closeProModalBtn');
  if (closeProModalBtn) {
    closeProModalBtn.addEventListener('click', closeProSubscriptionModal);
  }

  const btnCopyReferralCode = document.getElementById('btnCopyReferralCode');
  if (btnCopyReferralCode) {
    btnCopyReferralCode.addEventListener('click', copyReferralCode);
  }

  const btnSendReferralWhatsApp = document.getElementById('btnSendReferralWhatsApp');
  if (btnSendReferralWhatsApp) {
    btnSendReferralWhatsApp.addEventListener('click', shareReferralWhatsApp);
  }

  const btnTestAddReferral = document.getElementById('btnTestAddReferral');
  if (btnTestAddReferral) {
    btnTestAddReferral.addEventListener('click', simulateFriendJoined);
  }

  const btnApplyReferralCode = document.getElementById('btnApplyReferralCode');
  if (btnApplyReferralCode) {
    btnApplyReferralCode.addEventListener('click', applyReferralCode);
  }

  const btnSelectMonthlyPlan = document.getElementById('btnSelectMonthlyPlan');
  if (btnSelectMonthlyPlan) {
    btnSelectMonthlyPlan.addEventListener('click', () => activateProSubscription('monthly'));
  }

  const btnSelectYearlyPlan = document.getElementById('btnSelectYearlyPlan');
  if (btnSelectYearlyPlan) {
    btnSelectYearlyPlan.addEventListener('click', () => activateProSubscription('yearly'));
  }

  const btnPayProUpi = document.getElementById('btnPayProUpi');
  if (btnPayProUpi) {
    btnPayProUpi.addEventListener('click', payProUpi);
  }

  const btnInstantActivatePro = document.getElementById('btnInstantActivatePro');
  if (btnInstantActivatePro) {
    btnInstantActivatePro.addEventListener('click', () => activateProSubscription('instant'));
  }

  // Update Header Pro Badge on initial load
  updateHeaderProBadge();

  // Backdrop click to close modals
  ['upiBillModal', 'expenseProfitModal', 'feedOptimizerModal', 'animalKundaliModal', 'animalValuationModal', 'farmRoutineModal', 'purityCertModal', 'pashuMelaModal', 'proSubscriptionModal'].forEach(id => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    }
  });
});
