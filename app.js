const stateKey = "nova-state-v1";
const DAYS_IN_WEEK = 7;
const STUDENT_ROADMAP = `📍 HOZIRGI BOSQICH: Talaba

🔵 ZUDLIK BILAN (bu semestr):
• Ilmiy rahbar topib mini-research boshlash
• LinkedIn profilni to'ldirib 3 mentor bilan bog'lanish
• 1 ta hackathon yoki grantga topshirish

🟡 3-6 OY ICHIDA:
• Amaliyot (stajirovka) uchun 15ta target ro'yxat tuzish
• Portfolio: 2 ta real loyiha + GitHub case
• IELTS/CEFR yoki sohaga mos sertifikat boshlash

🟢 BITIRUV OLDIDAN:
• Erasmus+: https://erasmus-plus.ec.europa.eu/
• YSEALI: https://yseali.state.gov/
• Startup platformalar: https://www.ycombinator.com/

⚡ SALOHIYAT HISOBLASH:
Agar hozir bu 3 narsani qilsang — 2 yildan keyin stajirovka + xalqaro grant yo'nalishida kuchli profilga ega bo'lasan.`;
const WORKER_ROADMAP = `📊 KARYERA DIAGNOSTIKASI

🔴 HOZIRGI HOLAT:
Sen hozir o'sish fazasidasan. Bu sohadagi cho'qqiga odatda 5-8 yil ketadi — lekin tezlashtirilgan yo'l bor.

🟠 TEZLASHTIRILGAN YO'L (12 oy):
• 1 ta kuchli sertifikat + 2 ta yuqori talab skill
• Kompaniya ichida natijani o'lchab ko'rinish oshirish
• Har oy 3 ta senior bilan network suhbat
• Daromadni oshiradigan skill stack (analitika + AI + kommunikatsiya)

🔵 CHO'QQI MANZARA:
Yuqori lavozim: Lead/Head daraja — bozor oralig'i yuqori diapazonda.
Asosiy 3 bloker: noaniq brend, tor network, natija paketi yo'q.
Yechim: portfel, mentor feedback, aniq impact metrika.

⚡ MUHIM — ALTERNATIVA TAKLIFI:
Sening mavjud ko'nikmalaring Product, Data Ops, va Consulting yo'nalishlarida ham juda qimmat.
To'g'ri fokus bilan 12-18 oyda sezilarli sakrash qilish mumkin.`;

const defaultState = {
  messages: [],
  phase: "phase0",
  step: 0,
  role: "",
  recognition: { q1: "", q2: "", q3: "" },
  maslowChoice: "",
  maslowLevel: "",
  profile: {
    course: "",
    major: "",
    country: "",
    position: "",
    sector: "",
    experience: "",
    goal: "",
  },
  flowArea: "",
  todo: {
    must: "",
    should: [],
    bonus: "",
    doneCount: 0,
    totalCount: 4,
    lastUpdated: "",
  },
  week: {
    startDate: new Date().toISOString(),
    completed: 0,
  },
  overthinkCounter: {},
};

let state = loadState();

const chatEl = document.getElementById("chat");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("chat-input");
const choicesEl = document.getElementById("choices");
const dashboardEl = document.getElementById("dashboard");
const roadmapEl = document.getElementById("roadmap");
const feedEl = document.getElementById("progress-feed");
const notificationsEl = document.getElementById("notifications");
const timerLabelEl = document.getElementById("timer-label");
const startTimerBtn = document.getElementById("start-timer");
const resetTimerBtn = document.getElementById("reset-timer");

let timerSeconds = 25 * 60;
let timerId = null;

initialize();

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(stateKey) || "null");
    return parsed ? { ...defaultState, ...parsed } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(stateKey, JSON.stringify(state));
}

function addMessage(sender, text) {
  state.messages.push({ sender, text, ts: new Date().toISOString() });
  renderChat();
  saveState();
}

function renderChat() {
  chatEl.innerHTML = "";
  for (const msg of state.messages) {
    const div = document.createElement("div");
    div.className = `msg ${msg.sender}`;
    div.textContent = msg.text;
    chatEl.appendChild(div);
  }
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setChoices(choices = []) {
  choicesEl.innerHTML = "";
  for (const choice of choices) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.textContent = choice.label;
    btn.addEventListener("click", () => handleUserInput(choice.value));
    choicesEl.appendChild(btn);
  }
}

function initialize() {
  renderChat();
  renderDashboard();
  renderRoadmap();
  renderProgress();
  renderNotifications();
  renderTimer();

  if (state.messages.length === 0) {
    showPhase0();
  } else {
    setCurrentChoices();
  }
}

function showPhase0() {
  const opening = `Salom. Men NOVA — sening shaxsiy strategingman.

Ko'p o'ylaysan. Qayerdan boshlashni bilmaysan.
Lekin ichingda katta narsa bor — men uni ko'raman.

Bitta savoldan boshlaymiz:

👤 Hozir hayotingda qaysi roldasen?
   [A] 🎓 Universitetda o'qiyapman
   [B] 💼 Ishda ishlayapman
   [C] 🔍 Ikkalasi ham / Hali aniq emas`;
  addMessage("bot", opening);
  setChoices([
    { label: "A — Universitet", value: "A" },
    { label: "B — Ish", value: "B" },
    { label: "C — Ikkalasi ham / aniq emas", value: "C" },
  ]);
}

function resolveRole(text) {
  const mapping = {
    A: "student",
    B: "worker",
    C: "mixed",
    "A — Universitet": "student",
    "B — Ish": "worker",
  };
  const trimmed = text.trim();
  if (mapping[trimmed]) return mapping[trimmed];
  const upperFirst = trimmed.toUpperCase().charAt(0);
  if (mapping[upperFirst]) return mapping[upperFirst];
  return "mixed";
}

function getCurrentHourLabel() {
  return `${String(new Date().getHours()).padStart(2, "0")}:00`;
}

function getWeeklyProgressPercent() {
  return Math.min(100, Math.round((state.week.completed / DAYS_IN_WEEK) * 100));
}

function setCurrentChoices() {
  switch (state.phase) {
    case "phase0":
      setChoices([
        { label: "A — Universitet", value: "A" },
        { label: "B — Ish", value: "B" },
        { label: "C — Ikkalasi ham / aniq emas", value: "C" },
      ]);
      break;
    case "phase2":
      if (state.step === 0) {
        setChoices([
          { label: "A — Energiya/vaqt yo'q", value: "A" },
          { label: "B — Qayerdan boshlashni bilmayman", value: "B" },
          { label: "C — Motivatsiya tez tugaydi", value: "C" },
          { label: "D — Boshqalar tushunmaydi", value: "D" },
        ]);
      } else {
        setChoices([]);
      }
      break;
    case "phase4":
      if (state.step === 0) {
        setChoices([
          { label: `A — 10 daqiqa harakat`, value: "todoA" },
          { label: `B — 15 daqiqa harakat`, value: "todoB" },
          { label: `C — 5 daqiqa harakat`, value: "todoC" },
        ]);
      } else {
        setChoices([]);
      }
      break;
    default:
      setChoices([]);
  }
}

function lastBotMessageIncludes(str) {
  const bots = state.messages.filter((m) => m.sender === "bot");
  if (!bots.length) return false;
  return bots[bots.length - 1].text.includes(str);
}

function handleUserInput(raw) {
  const text = (raw || inputEl.value).trim();
  if (!text) return;

  addMessage("user", text);
  inputEl.value = "";
  trackOverthinking(text);

  if (shouldInterruptOverthinking(text)) {
    addMessage(
      "bot",
      "To'xta.\n\nSen hozir overthinking qilyapsan — bu sening miyaning himoya mexanizmi.\nU seni xatolardan saqlamoqchi.\n\nLekin haqiqat: Sen allaqachon yetarli bilasan.\n\nHozir bitta savol: Qaysi harakat seni maqsadga eng tez yaqinlashtiradi?\n\nFaqat o'sha — boshqa hech narsa."
    );
    setChoices([]);
    return;
  }

  if (state.phase === "phase0") return handlePhase0(text);
  if (state.phase === "phase1") return handlePhase1(text);
  if (state.phase === "phase2") return handlePhase2(text);
  if (state.phase === "phase3") return handlePhase3(text);
  if (state.phase === "phase4") return handlePhase4(text);

  addMessage("bot", "Davom etamiz. Hozir bitta aniq qadamni tanlaymizmi?");
}

function handlePhase0(text) {
  state.role = resolveRole(text);
  state.phase = "phase1";
  state.step = 0;
  saveState();

  addMessage(
    "bot",
    "Kun davomida nimaga ko'proq vaqt sarflaysan — fikirlar/rejalar o'ylashgami yoki ularni bajarishgami?"
  );
  setChoices([]);
}

function handlePhase1(text) {
  if (state.step === 0) {
    state.recognition.q1 = text;
    state.step = 1;
    saveState();
    addMessage(
      "bot",
      "Biron bir soha bor — masalan texnologiya, biznes, san'at, fan — qaysi birida bemalol soatlab yo'qolasan?"
    );
    return;
  }

  if (state.step === 1) {
    state.recognition.q2 = text;
    state.flowArea = text;
    state.step = 2;
    saveState();
    addMessage(
      "bot",
      "Keling, dürüst bo'lamiz: O'zingga baho ber — 1 dan 10 gacha. Hozirgi hayoting — o'z salohiyatingning necha foizi?"
    );
    return;
  }

  if (state.step === 2) {
    state.recognition.q3 = text;
    const recognition = `Sen. Men seni eshitdim.\n\nSening javobingga qaraganda, ko'proq ${state.recognition.q1} tomoni kuchli. ${state.recognition.q2}da soatlab qolishing — bu kuchli flow signali.\n\nBu kuchli narsa. Lekin hozir to'g'ri kanal yo'q shuning uchun energiya yo'qolayapti. Buni o'zgartiramiz.`;
    addMessage("bot", recognition);

    state.phase = "phase2";
    state.step = 0;
    saveState();

    addMessage(
      "bot",
      "Hozir seni eng ko'p to'xtatayotgan narsa nima —\n  [A] Energiya/vaqt yo'qligi\n  [B] Qayerdan boshlashni bilmaslik\n  [C] Motivatsiya tez tugaydi\n  [D] Boshqalar tushunmaydi / yolg'iz his qilaman"
    );
    setChoices([
      { label: "A — Energiya/vaqt yo'q", value: "A" },
      { label: "B — Qayerdan boshlashni bilmayman", value: "B" },
      { label: "C — Motivatsiya tez tugaydi", value: "C" },
      { label: "D — Boshqalar tushunmaydi", value: "D" },
    ]);
  }
}

function handlePhase2(text) {
  const code = text.trim().toUpperCase().charAt(0);
  const levelMap = {
    A: "Level 1 (Physiological)",
    B: "Level 5 (Self-Actualization)",
    C: "Level 4 (Esteem)",
    D: "Level 3 (Belonging)",
  };
  const descMap = {
    A: "Tana va energiya tiklanmasa, strategiya ishlamaydi.",
    B: "Yo'nalish aniq bo'lmasa, salohiyat tarqoq ketadi.",
    C: "Ichki ishonch beqaror bo'lsa, ritm uziladi.",
    D: "Qo'llab-quvvatlash bo'lmasa, yolg'iz kurash qiyinlashadi.",
  };

  state.maslowChoice = code;
  state.maslowLevel = levelMap[code] || "Level 4 (Esteem)";
  state.phase = "phase3";
  state.step = 0;
  saveState();

  addMessage(
    "bot",
    `Tushundim. Sen hozir ${state.maslowLevel} bosqichidasen.\n\nBu degani: ${descMap[code] || descMap.C}\n\nKo'pchilik bu bosqichda o'zini ayblaydi — lekin bu psixologik zaruriyat. Uni bartaraf qilish uchun aniq 3 qadam bor. Ko'rsataymi?`
  );

  addMessage(
    "bot",
    state.role === "student"
      ? "Qaysi kurs, mutaxassislik, mamlakatdasan? (bitta javobda yoz)"
      : "Lavozim, soha, tajriba yili, maqsading nima? (bitta javobda yoz)"
  );
  setChoices([]);
}

function handlePhase3(text) {
  if (state.role === "student") {
    state.profile.course = text;
    state.phase = "phase4";
    state.step = 0;
    buildDailyTodo();
    addMessage("bot", STUDENT_ROADMAP);
    addMessage("bot", flowProtocolMessage());
    promptTodayStep();
  } else {
    state.profile.position = text;
    state.phase = "phase4";
    state.step = 0;
    buildDailyTodo();
    addMessage("bot", WORKER_ROADMAP);
    addMessage("bot", flowProtocolMessage());
    promptTodayStep();
  }

  renderRoadmap();
  renderDashboard();
  renderNotifications();
  saveState();
}

function flowProtocolMessage() {
  const area = state.flowArea || "shu soha";
  return `${area} — bu sening zone'ing.\n\nFlow holati uchun protokol:\n  1. ${area}ga o'tirishdan oldin 2 daqiqa: hamma notificationni o'chir\n  2. Maqsad: natijaga emas, JARAYONGA fokuslash\n  3. Birinchi 10 daqiqa og'ir — o'tkazib yubor, keyin o'z-o'zidan tortadi\n\nBugun ${area}ga 25 daqiqa ajratmaysan?`;
}

function promptTodayStep() {
  const nowHour = getCurrentHourLabel();
  const must = state.todo.must || "MUST vazifani boshlash";
  const should = state.todo.should[0] || "SHOULD vazifani rejalash";
  const bonus = state.todo.bonus || "BONUS kontaktinga yozish";

  addMessage(
    "bot",
    `Katta rejalar zo'r. Lekin hozir — faqat bitta savol:\n\nBugun soat ${nowHour} bor.\nShu [X] daqiqada bitta ish qilsang — qaysi biri:\n\n  [A] 🔗 ${must} — 10 daqiqa\n  [B] 📝 ${should} — 15 daqiqa\n  [C] 📞 ${bonus} — 5 daqiqa\n\nTanlagan narsang — men kuzataman.`
  );

  setChoices([
    { label: "A — 10 daqiqa", value: "todoA" },
    { label: "B — 15 daqiqa", value: "todoB" },
    { label: "C — 5 daqiqa", value: "todoC" },
  ]);
}

function buildDailyTodo() {
  state.todo = {
    must: "🔴 MUST (25 daqiqa): Bugungi eng muhim bitta qadam",
    should: [
      "🟡 SHOULD (15 daqiqa): Portfolio/skill bo'yicha 1 mikrovazifa",
      "🟡 SHOULD (15 daqiqa): 1 mentor yoki hamkasbga yozish",
    ],
    bonus: "🟢 BONUS (10 daqiqa): Ertangi ustuvor vazifani tayyorlash",
    doneCount: 0,
    totalCount: 4,
    lastUpdated: new Date().toISOString(),
  };
}

function handlePhase4(text) {
  const choice = text.toLowerCase();
  let selected = "";
  if (choice.includes("a") || choice === "todoa") selected = "A";
  else if (choice.includes("b") || choice === "todob") selected = "B";
  else selected = "C";

  const taskMap = {
    A: "MUST taskdan 10 daqiqa boshlash",
    B: "SHOULD taskdan 15 daqiqa bajarish",
    C: "BONUS task uchun 1 qo'ng'iroq/xabar",
  };

  state.todo.doneCount = Math.min(state.todo.doneCount + 1, state.todo.totalCount);
  state.week.completed += 1;
  state.step = 1;
  saveState();

  addMessage(
    "bot",
    `✅ ${taskMap[selected]} — bajardingmi? Bu mayda ko'rinadi. Lekin bu katta maqsadga ${Math.round(
      (state.todo.doneCount / state.todo.totalCount) * 100
    )}% qadam.`
  );

  addMessage(
    "bot",
    `Ishonch formulasi: Sen bugun tanlov qilding. Bu degani keyingi katta qadamni ham qila olasan. Sababi: harakat ritmi odatdan quriladi.`
  );

  renderDashboard();
  renderProgress();
  renderNotifications();
  setChoices([]);
}

function renderDashboard() {
  dashboardEl.textContent = [
    state.todo.must || "🔴 MUST: Yo'l xaritadan keyin shakllanadi",
    ...(state.todo.should.length ? state.todo.should : ["🟡 SHOULD: —", "🟡 SHOULD: —"]),
    state.todo.bonus || "🟢 BONUS: —",
    "",
    `Bajarildi: ${state.todo.doneCount}/${state.todo.totalCount}`,
  ].join("\n");
}

function renderRoadmap() {
  if (!state.profile.course && !state.profile.position) {
    roadmapEl.textContent = "Roadmap onboarding tugagach avtomatik shakllanadi.";
    return;
  }
  roadmapEl.textContent = state.role === "student"
    ? "Talaba yo'l xaritasi yaratildi: semestr, 3-6 oy, bitiruv oldi bosqichlari mavjud."
    : "Ishchi yo'l xaritasi yaratildi: 12 oylik tezlashtirish va alternativ yo'nalishlar mavjud.";
}

function renderProgress() {
  const percent = Math.round((state.todo.doneCount / Math.max(state.todo.totalCount, 1)) * 100);
  const weekPercent = getWeeklyProgressPercent();
  const snapshot = `7 kun oldin sen yo'nalishni aniqlashga harakat qilayotganding.\nHozir esa ${state.week.completed} ta harakat qilding. Farqni ko'ryapsanmi? Bu sen.`;

  feedEl.textContent = `Haftalik progress: ${state.week.completed} ta task\nProgress: ${weekPercent}%\n\nBugungi progress: ${percent}%\n\n${snapshot}`;
}

function renderNotifications() {
  const must = state.todo.must || "Bugungi bitta aniq qadam";
  const morning = `07:00 — Bugungi bitta maqsad: ${must}\nBoshqalarning fikri emas — faqat bu.`;
  const night = state.todo.doneCount === 0
    ? "22:00 — Bugun task qilinmadi. Ertaga? Yoki qiyin bo'lganini ayt — o'zgartiramiz."
    : "22:00 — Bugungi ritm saqlandi. Ertaga ham shu usulni davom ettiramiz.";
  const weekly = `Yakshanba — Bu haftada ${state.week.completed} ta task bajarding. Bu ${getWeeklyProgressPercent()}% progress.`;

  notificationsEl.textContent = `${morning}\n\n${night}\n\n${weekly}`;
}

function renderTimer() {
  const m = Math.floor(timerSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (timerSeconds % 60).toString().padStart(2, "0");
  timerLabelEl.textContent = `${m}:${s}`;
}

startTimerBtn.addEventListener("click", () => {
  if (timerId) return;
  timerId = setInterval(() => {
    timerSeconds -= 1;
    if (timerSeconds <= 0) {
      clearInterval(timerId);
      timerId = null;
      timerSeconds = 0;
      addMessage("bot", "Flow sessiya tugadi. Endi 5 daqiqa tanaffus qilamizmi?");
    }
    renderTimer();
  }, 1000);
});

resetTimerBtn.addEventListener("click", () => {
  clearInterval(timerId);
  timerId = null;
  timerSeconds = 25 * 60;
  renderTimer();
});

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  handleUserInput(inputEl.value);
});

function trackOverthinking(text) {
  const normalized = text.toLowerCase();
  const key = ["lekin", "ammo", "nima bo'ladi agar", "what if"].find((k) => normalized.includes(k));
  if (!key) return;
  state.overthinkCounter[key] = (state.overthinkCounter[key] || 0) + 1;
  saveState();
}

function shouldInterruptOverthinking(text) {
  const normalized = text.toLowerCase();
  const hasSignal = ["lekin", "ammo", "nima bo'ladi agar", "what if"].some((k) => normalized.includes(k));
  if (!hasSignal) return false;
  const total = Object.values(state.overthinkCounter).reduce((a, b) => a + b, 0);
  return total >= 3;
}
