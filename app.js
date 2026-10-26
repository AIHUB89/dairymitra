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
    audioFeedback: true
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

function initTodayRecord() {
  if (!appData.dailyRecords[currentDateKey]) {
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

    // Pre-populate milking defaults for lactating animals
    appData.animals.forEach(a => {
      if (a.status === 'milking') {
        const halfYield = Math.round((a.expectedYield / 2) * 10) / 10;
        appData.dailyRecords[currentDateKey].milking.morning[a.id] = halfYield;
        appData.dailyRecords[currentDateKey].milking.evening[a.id] = halfYield;
      } else {
        appData.dailyRecords[currentDateKey].milking.morning[a.id] = 0;
        appData.dailyRecords[currentDateKey].milking.evening[a.id] = 0;
      }
    });

    // Pre-populate delivery defaults
    appData.customers.forEach(c => {
      const mQ = (c.quotaMorning !== undefined && c.quotaMorning !== null) ? c.quotaMorning : 1.0;
      const eQ = (c.quotaEvening !== undefined && c.quotaEvening !== null) ? c.quotaEvening : 1.0;
      appData.dailyRecords[currentDateKey].delivery.morning[c.id] = {
        status: mQ > 0 ? 'delivered' : 'skipped',
        litres: mQ
      };
      appData.dailyRecords[currentDateKey].delivery.evening[c.id] = {
        status: eQ > 0 ? 'delivered' : 'skipped',
        litres: eQ
      };
    });

    saveData();
  }
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

// Speak aloud (Text-to-Speech)
function speakAudio(text) {
  if (!appData.farmSettings.audioFeedback) return;
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hi-IN';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  showAudioToast(text);
  window.speechSynthesis.speak(utterance);
}

function showAudioToast(text) {
  const toast = document.getElementById('audioToast');
  const toastText = document.getElementById('audioToastText');
  if (toast && toastText) {
    toastText.innerText = text;
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

function processVoiceCommand(rawText) {
  const text = rawText.toLowerCase();

  // Navigation Commands
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

  // Animal Milking Commands
  for (let animal of appData.animals) {
    const cleanName = animal.name.split(' ')[0].toLowerCase();
    if (text.includes(cleanName)) {
      const litres = parseHindiNumbers(text);
      if (litres !== null) {
        setAnimalMilk(animal.id, litres);
        const shiftLabel = currentShift === 'morning' ? 'सुबह' : 'शाम';
        speakAudio(`${animal.name} का ${shiftLabel} का ${litres} लीटर दर्ज हो गया!`);
        document.getElementById('voiceResult').innerText = `✅ ${animal.name}: ${litres} L दर्ज`;
        return;
      }
    }
  }

  // Customer Delivery Commands
  for (let customer of appData.customers) {
    const cleanCust = customer.name.split(' ')[0].toLowerCase();
    if (text.includes(cleanCust)) {
      if (text.includes('नागा') || text.includes('नहीं') || text.includes('छुट्टी')) {
        setCustomerDeliveryStatus(customer.id, 'skipped', 0);
        speakAudio(`${customer.name} का आज नागा दर्ज किया गया!`);
        return;
      }

      const litres = parseHindiNumbers(text);
      if (litres !== null) {
        setCustomerDeliveryStatus(customer.id, 'custom', litres);
        speakAudio(`${customer.name} को ${litres} लीटर दर्ज हो गया!`);
        return;
      } else {
        const defaultLitres = currentShift === 'morning' ? customer.quotaMorning : customer.quotaEvening;
        setCustomerDeliveryStatus(customer.id, 'delivered', defaultLitres);
        speakAudio(`${customer.name} को ${defaultLitres} लीटर दूध दिया गया!`);
        return;
      }
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
    if (entry && entry.status !== 'skipped') {
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

function setAnimalMilk(animalId, litres) {
  initTodayRecord();
  appData.dailyRecords[currentDateKey].milking[currentShift][animalId] = litres;
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
    const entry = shiftDelivery[cust.id] || { status: shiftQuota > 0 ? 'delivered' : 'skipped', litres: shiftQuota };
    const isDelivered = entry.status === 'delivered' || entry.status === 'custom';
    const isSkipped = entry.status === 'skipped';
    if (isDelivered && entry.litres > 0) deliveredCount++;

    const card = document.createElement('div');
    card.className = `delivery-card ${isDelivered && entry.litres > 0 ? 'delivered' : ''} ${isSkipped || entry.litres === 0 ? 'skipped' : ''}`;
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
            ${entry.litres} L
          </div>
        </div>
      </div>

      <div class="delivery-actions-row">
        <button class="btn-delivery-action btn-deliver-ok ${isDelivered && entry.litres > 0 ? 'active' : ''}" data-id="${cust.id}">
          ✔ दिया (${entry.litres}L)
        </button>
        <button class="btn-delivery-action btn-deliver-skip ${isSkipped || entry.litres === 0 ? 'active' : ''}" data-id="${cust.id}">
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

function setCustomerDeliveryStatus(custId, status, litres) {
  initTodayRecord();
  appData.dailyRecords[currentDateKey].delivery[currentShift][custId] = {
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
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = (today.getFullYear() === year && (today.getMonth() + 1) === month);
  const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;

  for (let day = 1; day <= maxDay; day++) {
    const dKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!appData.dailyRecords[dKey]) {
      appData.dailyRecords[dKey] = {
        milking: { morning: {}, evening: {} },
        delivery: { morning: {}, evening: {} }
      };

      appData.customers.forEach(c => {
        // Sample realistic naga days for initial demo only
        const isSkipDemo = (c.id === 'c1' && (day === 5 || day === 14)) || 
                           (c.id === 'c2' && day === 10) || 
                           (c.id === 'c4' && day === 8);
        
        const mQ = (c.quotaMorning !== undefined && c.quotaMorning !== null) ? c.quotaMorning : 1.0;
        const eQ = (c.quotaEvening !== undefined && c.quotaEvening !== null) ? c.quotaEvening : 1.0;
        const mSkip = isSkipDemo || mQ === 0;
        const eSkip = isSkipDemo || eQ === 0;

        appData.dailyRecords[dKey].delivery.morning[c.id] = {
          status: mSkip ? 'skipped' : 'delivered',
          litres: mSkip ? 0 : mQ
        };
        appData.dailyRecords[dKey].delivery.evening[c.id] = {
          status: eSkip ? 'skipped' : 'delivered',
          litres: eSkip ? 0 : eQ
        };
      });
    } else {
      if (!appData.dailyRecords[dKey].delivery) {
        appData.dailyRecords[dKey].delivery = { morning: {}, evening: {} };
      }
      if (!appData.dailyRecords[dKey].delivery.morning) {
        appData.dailyRecords[dKey].delivery.morning = {};
      }
      if (!appData.dailyRecords[dKey].delivery.evening) {
        appData.dailyRecords[dKey].delivery.evening = {};
      }
      appData.customers.forEach(c => {
        const mQ = (c.quotaMorning !== undefined && c.quotaMorning !== null) ? c.quotaMorning : 1.0;
        const eQ = (c.quotaEvening !== undefined && c.quotaEvening !== null) ? c.quotaEvening : 1.0;
        if (!appData.dailyRecords[dKey].delivery.morning[c.id]) {
          const mSkip = mQ === 0;
          appData.dailyRecords[dKey].delivery.morning[c.id] = { 
            status: mSkip ? 'skipped' : 'delivered', 
            litres: mSkip ? 0 : mQ 
          };
        }
        if (!appData.dailyRecords[dKey].delivery.evening[c.id]) {
          const eSkip = eQ === 0;
          appData.dailyRecords[dKey].delivery.evening[c.id] = { 
            status: eSkip ? 'skipped' : 'delivered', 
            litres: eSkip ? 0 : eQ 
          };
        }
      });
    }
  }
}

// Ensure animal monthly milking records exist
function ensureMonthlyMilkingRecords(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = (today.getFullYear() === year && (today.getMonth() + 1) === month);
  const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;

  for (let day = 1; day <= maxDay; day++) {
    const dKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!appData.dailyRecords[dKey]) {
      appData.dailyRecords[dKey] = {
        milking: { morning: {}, evening: {} },
        delivery: { morning: {}, evening: {} }
      };
    }
    if (!appData.dailyRecords[dKey].milking) {
      appData.dailyRecords[dKey].milking = { morning: {}, evening: {} };
    }
    if (!appData.dailyRecords[dKey].milking.morning) {
      appData.dailyRecords[dKey].milking.morning = {};
    }
    if (!appData.dailyRecords[dKey].milking.evening) {
      appData.dailyRecords[dKey].milking.evening = {};
    }

    appData.animals.forEach(a => {
      if (a.status === 'milking') {
        if (appData.dailyRecords[dKey].milking.morning[a.id] === undefined) {
          let baseM = 3.5, baseE = 3.5;
          if (a.id === 'a1') { baseM = 4.0; baseE = 4.0; }
          else if (a.id === 'a2') { baseM = 3.5; baseE = 3.5; }
          else if (a.id === 'a3') { baseM = 3.2; baseE = 3.3; }
          const varM = ((day * 7) % 5 - 2) * 0.1;
          const varE = ((day * 3) % 5 - 2) * 0.1;
          appData.dailyRecords[dKey].milking.morning[a.id] = Math.max(0, Math.round((baseM + varM) * 10) / 10);
          appData.dailyRecords[dKey].milking.evening[a.id] = Math.max(0, Math.round((baseE + varE) * 10) / 10);
        }
      } else {
        if (appData.dailyRecords[dKey].milking.morning[a.id] === undefined) {
          appData.dailyRecords[dKey].milking.morning[a.id] = 0;
          appData.dailyRecords[dKey].milking.evening[a.id] = 0;
        }
      }
    });
  }
}

// AI Smart Calculation of Animal Daily Milk Stats & Analytics
function getAnimalMonthlyMilkingStats(animalId, year = currentKhataYear, month = currentKhataMonth) {
  ensureMonthlyMilkingRecords(year, month);
  const animal = appData.animals.find(a => a.id === animalId);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = (today.getFullYear() === year && (today.getMonth() + 1) === month);
  const todayDateNum = today.getDate();

  let totalLitres = 0;
  let morningTotal = 0;
  let eveningTotal = 0;
  let milkedDays = 0;
  let dryDays = 0;
  let highestYield = { dayNum: 0, dateKey: '', litres: 0 };
  const daysArray = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isFuture = isCurrentMonth && day > todayDateNum;

    let mQty = 0;
    let eQty = 0;

    if (!isFuture && appData.dailyRecords[dKey] && appData.dailyRecords[dKey].milking) {
      mQty = parseFloat(appData.dailyRecords[dKey].milking.morning ? appData.dailyRecords[dKey].milking.morning[animalId] : 0) || 0;
      eQty = parseFloat(appData.dailyRecords[dKey].milking.evening ? appData.dailyRecords[dKey].milking.evening[animalId] : 0) || 0;
    }

    const dayTotal = Math.round((mQty + eQty) * 10) / 10;
    let status = 'milking';

    if (isFuture) {
      status = 'future';
    } else {
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
      isFuture
    });
  }

  totalLitres = Math.round(totalLitres * 10) / 10;
  morningTotal = Math.round(morningTotal * 10) / 10;
  eveningTotal = Math.round(eveningTotal * 10) / 10;
  const avgDailyMilk = milkedDays > 0 ? (totalLitres / milkedDays).toFixed(1) : '0.0';

  // Calculate recent 7 days average to determine trend
  let recent7Sum = 0;
  let recent7Days = 0;
  const pastDays = daysArray.filter(d => !d.isFuture);
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
  if (diff >= 0.3) {
    trend = `↗️ बढ़ रहा है (+${diff}L)`;
  } else if (diff <= -0.3) {
    trend = `↘️ घट रहा है (${diff}L)`;
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

  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = (today.getFullYear() === year && (today.getMonth() + 1) === month);
  const maxDay = isCurrentMonth ? today.getDate() : daysInMonth;

  const mQ = (cust.quotaMorning !== undefined && cust.quotaMorning !== null) ? cust.quotaMorning : 0;
  const eQ = (cust.quotaEvening !== undefined && cust.quotaEvening !== null) ? cust.quotaEvening : 0;

  for (let day = 1; day <= maxDay; day++) {
    const dKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
  ensureMonthlyDeliveryRecords(year, month);
  const cust = appData.customers.find(c => c.id === custId);
  const rate = cust ? cust.rate : (appData.farmSettings.defaultRate || 60);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = (today.getFullYear() === year && (today.getMonth() + 1) === month);
  const todayDateNum = today.getDate();

  let totalLitres = 0;
  let deliveredDays = 0;
  let skippedDays = 0;
  const nagaDates = [];
  const daysArray = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isFuture = isCurrentMonth && day > todayDateNum;
    
    let morningQty = 0;
    let morningStatus = 'delivered';
    let eveningQty = 0;
    let eveningStatus = 'delivered';

    if (!isFuture && appData.dailyRecords[dKey] && appData.dailyRecords[dKey].delivery) {
      const mEntry = appData.dailyRecords[dKey].delivery.morning ? appData.dailyRecords[dKey].delivery.morning[custId] : null;
      const eEntry = appData.dailyRecords[dKey].delivery.evening ? appData.dailyRecords[dKey].delivery.evening[custId] : null;

      morningQty = mEntry ? (parseFloat(mEntry.litres) || 0) : 0;
      morningStatus = mEntry ? mEntry.status : (morningQty > 0 ? 'delivered' : 'skipped');
      if (morningQty === 0) morningStatus = 'skipped';

      eveningQty = eEntry ? (parseFloat(eEntry.litres) || 0) : 0;
      eveningStatus = eEntry ? eEntry.status : (eveningQty > 0 ? 'delivered' : 'skipped');
      if (eveningQty === 0) eveningStatus = 'skipped';
    }

    const dayTotal = Math.round((morningQty + eveningQty) * 10) / 10;
    
    let status = 'delivered';
    if (isFuture) {
      status = 'future';
    } else if (dayTotal === 0 || (morningStatus === 'skipped' && eveningStatus === 'skipped')) {
      status = 'skipped';
      skippedDays++;
      nagaDates.push(day);
    } else {
      const defaultDaily = (cust ? ((cust.quotaMorning || 0) + (cust.quotaEvening || 0)) : 0);
      if (Math.abs(dayTotal - defaultDaily) > 0.05) {
        status = 'custom';
      }
      deliveredDays++;
      totalLitres += dayTotal;
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
      isFuture: isFuture
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

  ensureMonthlyDeliveryRecords(currentKhataYear, currentKhataMonth);

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

    card.innerHTML = `
      <div class="cattle-main-row">
        <div class="cattle-icon-large ${isCow ? 'cow' : 'buffalo'}" data-edit-animal="${animal.id}" title="फोटो या नाम बदलने के लिए दबाएं">
          ${getAnimalAvatarHtml(animal)}
        </div>
        <div class="cattle-info">
          <div class="cattle-title-row">
            <div class="animal-name">
              ${animal.name}
              <button class="btn-edit-badge" data-edit-animal="${animal.id}">✏️ नाम/फोटो</button>
            </div>
            <div class="cattle-actions">
              ${badgeHtml}
            </div>
          </div>
          <div class="animal-breed">नस्ल: ${animal.breed} • ${avgYieldDisplay}</div>
        </div>
      </div>
      <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
        <button type="button" class="btn-card-action btn-animal-cal-card" data-aid="${animal.id}">
          📅 30-दिन दूध कैलेंडर व AI रिकॉर्ड
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

  let foundAnswer = null;
  for (let key in AI_KNOWLEDGE_BASE) {
    if (query.includes(key)) {
      foundAnswer = AI_KNOWLEDGE_BASE[key];
      break;
    }
  }

  if (!foundAnswer) {
    foundAnswer = `💡 **पशु मित्र का सुझाव:**\n\nआपके सवाल *" ${query} "* के लिए:\n- पशु को हमेशा सूखा और हवादार जगह पर रखें।\n- रोजाना 50 ग्राम नमक और 50 ग्राम मिनरल मिक्सचर दें।\n- यदि पशु चारा नहीं खा रहा है या बुखार है, तो तुरंत नजदीकी पशु डॉक्टर से संपर्क करें।`;
  }

  answerBody.innerHTML = foundAnswer.replace(/\n/g, '<br>');
  answerCard.classList.remove('hidden');

  speakAudio('सलाह नीचे लिखी गई है, आप सुन भी सकते हैं');
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

function setShift(shift) {
  currentShift = shift;
  document.getElementById('shiftMorningBtn').classList.toggle('active', shift === 'morning');
  document.getElementById('shiftEveningBtn').classList.toggle('active', shift === 'evening');
  updateStatsHeader();
  renderMilkingCards();
  renderDeliveryCards();
  speakAudio(shift === 'morning' ? 'सुबह की शिफ्ट चुनी गई' : 'शाम की शिफ्ट चुनी गई');
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
  document.getElementById('aiAskBtn').addEventListener('click', () => {
    const q = document.getElementById('aiQuestionInput').value.trim();
    if (q) handleAiQuestion(q);
  });

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
    if (stats.skippedDays > 0) {
      nagaBanner.className = 'naga-alert-banner';
      nagaBanner.innerHTML = `❌ <strong>नागा अलर्ट:</strong> इस माह <strong>${stats.skippedDays} दिन</strong> दूध नहीं लिया गया (तारीख: <strong>${stats.nagaDates.join(', ')}</strong>)`;
    } else {
      nagaBanner.className = 'naga-alert-banner all-ok';
      nagaBanner.innerHTML = `✨ <strong>कोई नागा नहीं:</strong> इस माह पूरे <strong>${stats.deliveredDays} दिन</strong> नियमित दूध सप्लाई रहा!`;
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
      cell.title = `${d.dayNum} ${getHindiMonthName(stats.month)}: बदलने के लिए क्लिक करें`;
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

    const startDay = (scope === 'from_this_day') ? currentDay : 1;
    for (let d = startDay; d <= maxDay; d++) {
      const dK = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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
    } else if (d.totalLitres === 0) {
      badgeText = '0 L';
      subText = 'सूखा/नागा';
    }

    cell.innerHTML = `
      <span class="day-num">${d.dayNum}</span>
      <span class="day-shifts-mini" style="font-size: 8px;">${subText}</span>
      <span class="day-qty-badge" style="${d.totalLitres === 0 && !d.isFuture ? 'background: #dc2626;' : ''}">${badgeText}</span>
    `;

    if (!d.isFuture) {
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

    const startDay = (scope === 'from_this_day') ? currentDay : 1;
    for (let d = startDay; d <= maxDay; d++) {
      const dK = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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
  ensureMonthlyDeliveryRecords(year, month);
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
});

