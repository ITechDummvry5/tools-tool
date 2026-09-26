// ===================== Persona =====================
const persona = {
  name: "Nova",
  tone: "friendly",
  traits: ["helpful"],
  memory: [],
  maxMemory: 50 // store last 50 messages
};

// ===================== Voices =====================
let selectedVoice = null;
let voices = [];

// ===================== Cache DOM =====================
const inputBox = document.getElementById("textInput");
const responseBox = document.getElementById("responseBox");
const voiceSelect = document.getElementById("voiceSelect");
const suggestionsBox = document.getElementById("suggestions");

// ===================== Custom Q&A =====================
const QA = [
  { questions: ["hello", "hi", "hey"], response: "Hello! How can I assist you today?" },
  { questions: ["your name", "name"], response: `My name is ${persona.name}.` },
  { questions: ["how are you"], response: "I'm functioning perfectly!" },
  { questions: ["what is acadlinks", "acadlinks", "scholarship finder"], 
    response: "acadlinks is a web-based scholarship finder that helps students search and filter scholarships by keywords and academic strands. It uses HTML, CSS, and JavaScript with no backend required." },
  { questions: ["features", "acadlinks features", "what can acadlinks do"], 
    response: "acadlinks lets students search scholarships, filter by academic strand, view centralized scholarship listings, see scholarship cards with title, description, location, strand, and apply directly through official links. It also has loading animations, responsive design, and a bookmark feature." },
  { questions: ["tools page", "acadlinks tools", "acadlinkss intelligence"], 
    response: "The Tools section launches acadlinkss Intelligence, which currently helps users search, compare, and get recommendations for scholarships. It can connect to AI services like DeepSeek, OpenAI, Ollama, and Grok, and also supports local AI via Ollama." },
  { questions: ["purpose of the tool", "what does the tools do", "acadlinks tools purpose", "why use tools", "purpose"], 
    response: "The acadlinks Tools demonstrate how the system can be expanded to include AI-powered features, such as intelligent search, recommendations, or future chatbot assistance. It serves as a foundation for integrating real AI APIs into the system." },
  { questions: ["future improvements", "limitations", "next update"], 
    response: "Future improvements include connecting to a real scholarship API, saving favorite scholarships, adding user accounts and login, and creating an admin dashboard to manage scholarship listings and enable direct applications." },
  { questions: ["deployment", "how is it deployed", "where is acadlinks hosted"], 
    response: "acadlinks is deployed online using Vercel and GitHub, making it accessible directly from web browsers." },
  { questions: ["tech stack", "what technologies", "built with"], 
    response: "The project is built with HTML5, CSS3, JavaScript (vanilla), Font Awesome for icons, and runs on a computer or laptop with no backend needed." },
  { questions: ["advantages", "acadlinks advantages", "pros", "acadlinks pros", "benefits"], 
    response: "Advantages of acadlinks include: easy and centralized scholarship search, filtering by academic strand, responsive design, bookmark feature, direct application links, and AI tool integration." },
  { questions: ["disadvantages", "acadlinks disadvantages", "cons", "acadlinks cons", "limitations", "weaknesses"], 
    response: "Disadvantages of acadlinks include: currently no real scholarship API, no user accounts or login system, and external links only for applications rather than direct submissions." },
  { questions: ["how to search scholarships", "search scholarships", "find scholarships", "acadlinks search"], 
    response: "You can search scholarships by typing keywords related to the scholarship title, description, or academic strand. Matching results appear instantly." },
  { questions: ["how to use filters", "filter scholarships", "acadlinks filter", "apply filters"], 
    response: "Use the filter options to select your academic strand (STEM, ABM, HUMSS, TVL, GAS) or location. This helps you quickly find scholarships relevant to your profile." },
  { questions: ["how to bookmark", "save scholarships", "acadlinks bookmark", "bookmark feature"], 
    response: "Click the Bookmark icon next to a scholarship card to save it. You can view your saved scholarships later without searching again." }
];

// ===================== Generate Reply =====================
function generateReply(message) {
  // store user message
  persona.memory.push({ role: "user", content: message });
  if (persona.memory.length > persona.maxMemory) persona.memory.shift();

  const lower = message.toLowerCase();

  // exact match first
  let replyObj = QA.find(q => q.questions.some(keyword => lower === keyword));
  if (!replyObj) {
    // fallback to includes
    replyObj = QA.find(q => q.questions.some(keyword => lower.includes(keyword)));
  }

  let reply = replyObj?.response || "You said: " + message;

  // add smile image only for greetings
  const showSmile = QA[0].questions.some(greet => lower.includes(greet));
  if (showSmile) {
    reply = `<img src="assets/images/smile.png" alt="smile" style="width:20px; vertical-align:middle;"> ` + reply;
  }
  persona.memory.push({ role: "assistant", content: reply });
  return reply;
}

// ===================== Send Text =====================
function sendText() {
  const input = inputBox.value.trim();
  if (!input) return;

  const reply = generateReply(input);
  responseBox.innerHTML = reply;

  // speak
  const textOnly = reply.replace(/<[^>]+>/g, "");
  speak(textOnly);

  inputBox.value = "";
  suggestionsBox.innerHTML = "";
}

// ===================== Voice Input =====================
function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { alert("Speech recognition not supported."); return; }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";

  recognition.onresult = function(event) {
    inputBox.value = event.results[0][0].transcript;
    sendText();
  };

  recognition.start();
}

// ===================== Text-to-Speech =====================
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.pitch = 1.2;
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

// ===================== Load Voices =====================
function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  if (!voiceSelect) return;

  voiceSelect.innerHTML = '<option value="">Select Voice</option>';
  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

// ===================== Voice Change =====================
voiceSelect?.addEventListener("change", (e) => {
  selectedVoice = voices[e.target.value] || null;
});

// ===================== Init =====================
window.speechSynthesis.onvoiceschanged = loadVoices;
window.addEventListener("load", loadVoices);


// ===================== Autocomplete Suggestions =====================
inputBox.addEventListener("input", () => {
  const query = inputBox.value.toLowerCase().trim();
  suggestionsBox.innerHTML = "";

  if (!query) return;

  // filter questions that include the query
  const matches = QA.flatMap(q => q.questions)
                    .filter(q => q.toLowerCase().includes(query));

  // show top 5 suggestions
  matches.slice(0, 5).forEach(match => {
    const div = document.createElement("div");

    // find the QA object for this match
    const qaItem = QA.find(q => q.questions.includes(match.toLowerCase()));

    // start label with QA:
    let label = `${match}`;

    // if it's a greeting (first QA item), add smile
    if (qaItem === QA[0]) {
      label =  `${label}`;
    }

    div.innerHTML = label;

    // click behavior: fill input but DO NOT send
    div.addEventListener("click", () => {
      inputBox.value = match;
      suggestionsBox.innerHTML = "";
    });

    suggestionsBox.appendChild(div);
  });
});
