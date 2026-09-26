// ===================== Persona =====================
const persona = {
  name: `MAXIMUS`,
  tone: "friendly",
  traits: ["helpful"],
  memory: [],
  maxMemory: 50
};

// ===================== Voices =====================
let selectedVoice = null;
let voices = [];

// ===================== Cache DOM =====================
const inputBox = document.getElementById("textInput");
const responseBox = document.getElementById("responseBox");
const voiceSelect = document.getElementById("voiceSelect");
const suggestionsBox = document.getElementById("suggestions");
const chatbotOptions = document.querySelectorAll(".chatbot-options button");

// ===================== Disable input initially =====================
inputBox.disabled = true;

// ===================== Custom Q&A =====================
const QA = [

  { questions: ["hello"], response: "Hello! How can I assist you today?" },
  { questions: ["your name"], response: `My name is ${persona.name}.` },
  { questions: ["how are you"], response: "I'm functioning perfectly!" },

  // 🔹 GENERAL SYSTEM QUESTIONS
  {
    questions: ["what is acadlink"],
    response: "ACADLINK is a web-based scholarship finder that helps students search and filter scholarships by keywords, academic strand, and location."
  },
  {
    questions: ["what does acadlink do"],
    response: "ACADLINK allows students to search scholarships, filter by strand, view deadlines, bookmark opportunities, and access official scholarship websites."
  },
  {
    questions: ["is acadlink free"],
    response: "Yes, ACADLINK is completely free and accessible online."
  },
  {
    questions: ["do i need an account"],
    response: "No account is required. Students can search and explore scholarships directly."
  },

  // 🔹 SEARCH & FILTER QUESTIONS
  {
    questions: ["how do i search for scholarships"],
    response: "Type keywords like STEM, IT, or ORG in the search bar and the system will instantly show matching scholarships."
  },
  {
    questions: ["can i filter scholarships by strand"],
    response: "Yes, you can filter by strands such as STEM, ABM, HUMSS, TVL, and GAS."
  },
  {
    questions: ["can i filter by location"],
    response: "Yes, the system allows filtering scholarships based on location."
  },
  {
    questions: ["what happens if no results are found"],
    response: "The system will display a message indicating that no scholarships match your search."
  },

  // 🔹 SCHOLARSHIP DETAILS
  {
    questions: ["what information is shown in each scholarship card"],
    response: "Each card shows the title, description, location, applicable strand, deadline, status (Open or Closed), and official application link."
  },
  {
    questions: ["what does open or closed mean"],
    response: "Open means the scholarship is currently accepting applications. Closed means the deadline has passed."
  },
  {
    questions: ["how do i apply"],
    response: "Click the Apply button to visit the official scholarship website."
  },

  // 🔹 BOOKMARK FEATURE
  {
    questions: ["how do i save a scholarship"],
    response: "Click the Bookmark icon beside the Apply button to save it for later."
  },
  {
    questions: ["where can i see my bookmarked scholarships"],
    response: "Bookmarked scholarships are saved locally and can be viewed within the system."
  },

  // 🔹 CHATBOT QUESTIONS
  {
    questions: ["what can the chatbot help me with"],
    response: "The chatbot can guide you in   GENERAL SYSTEM QUESTIONS, SEARCH & FILTER QUESTIONS, BOOKMARK FEATURE, TOOLS PAGE / AI, FUTURE FEATURES, TECHNICAL QUESTIONS, FREQUENTLY ASKED QUESTIONS (FAQ) THESIS  ."
  },
  {
    questions: ["can the chatbot apply for me"],
    response: "No, the chatbot provides guidance only. Applications are done through official scholarship websites."
  },

  // 🔹 TOOLS PAGE / AI
  {
    questions: ["what is acadlinks intelligence"],
    response: "ACADLINKS Intelligence is a tool that prepares the system for AI-powered features like smart search and recommendations."
  },
  {
    questions: ["what ai services can acadlink connect to"],
    response: "The system can connect to cloud AI services like OpenAI, DeepSeek, xAI, and local AI tools like Ollama."
  },
  {
    questions: ["does acadlink currently use real ai"],
    response: "The system is prepared for AI integration. Local AI like Ollama can be connected for development purposes."
  },
  {
    questions: ["what is ollama"],
    response: "Ollama is a local AI runtime that allows you to run models like Llama directly on your computer."
  },

  // 🔹 FUTURE FEATURES
  {
    questions: ["will acadlink have user accounts"],
    response: "Yes, future updates may include user login and account systems."
  },
  {
    questions: ["will students apply directly inside acadlink"],
    response: "In the future, an admin dashboard and centralized application form may be added."
  },
  {
    questions: ["will acadlink connect to a real scholarship api"],
    response: "Future versions aim to connect to a real scholarship API if available."
  },

  // 🔹 TECHNICAL QUESTIONS
  {
    questions: ["what technologies were used to build acadlink"],
    response: "ACADLINK was built using HTML5, CSS3, Vanilla JavaScript, and Font Awesome."
  },
  {
    questions: ["does acadlink require a backend server"],
    response: "No, it currently runs as a static web-based system."
  },
  {
    questions: ["where can acadlink be deployed"],
    response: "It can be deployed using platforms like Vercel and GitHub."
  },

// 🔹 FREQUENTLY ASKED QUESTIONS (FAQ) THESIS

{
  questions: ["who can use acadlink"],
  response: "ACADLINK is designed for senior high school and college students who are looking for scholarship opportunities based on their academic strand and location."
},
{
  questions: ["what problem does acadlink solve"],
  response: "ACADLINK solves the problem of students spending too much time searching different websites for scholarships by centralizing scholarship listings in one platform."
},
{
  questions: ["why did you create acadlink"],
  response: "ACADLINK was created to simplify scholarship searching and make opportunities more accessible, organized, and easier to compare."
},
{
  questions: ["how is acadlink different from other websites"],
  response: "Unlike general search engines, ACADLINK focuses specifically on scholarships and allows filtering by academic strand, location, and application status in one clean interface."
},
{
  questions: ["is the scholarship information updated"],
  response: "ACADLINK provides direct links to official scholarship websites to ensure students access the most accurate and updated application details."
},
{
  questions: ["does acadlink store user data"],
  response: "No, ACADLINK currently does not store personal user data since it does not require account registration."
},
{
  questions: ["can acadlink guarantee scholarship approval"],
  response: "No, ACADLINK only provides scholarship listings and official links. Approval depends on the scholarship provider's requirements and evaluation process."
},
{
  questions: ["what are the strengths of acadlink"],
  response: "The strengths of ACADLINK include centralized listings, strand-based filtering, keyword search, bookmark feature, deadline tracking, and AI integration readiness."
},
{
  questions: ["what are the limitations of acadlink"],
  response: "The limitations include no official scholarship API integration, no built-in application submission system yet, and no user account management."
},
{
  questions: ["what is the scope of acadlink"],
  response: "The scope of ACADLINK focuses on scholarship searching and filtering for senior high school and college students using a web-based platform without backend integration."
}
];

// ===================== Generate Reply =====================
function generateReply(message) {
  persona.memory.push({ role: "user", content: message });
  if (persona.memory.length > persona.maxMemory) persona.memory.shift();

  const lower = message.toLowerCase();
  let replyObj = QA.find(q => q.questions.some(k => lower === k));

  if (!replyObj) {
    replyObj = QA.find(q => q.questions.some(k => lower.includes(k)));
  }

  let reply = replyObj?.response || "You said: " + message;

  // Greeting smile icon
  const showSmile = QA[0].questions.some(greet => lower.includes(greet));
  if (showSmile) {
    reply = `<img src="core/assets/images/Logo/favicon.ico" alt="smile" style="width:20px; vertical-align:middle;"> ${reply}`;
  }

  persona.memory.push({ role: "assistant", content: reply });
  return reply;
}

// ===================== Send Text =====================
function sendText() {
  if (inputBox.disabled) return; // Prevent bypass
  const input = inputBox.value.trim();
  if (!input) return;

  // User bubble
  const userBubble = document.createElement("div");
  userBubble.className = "response-bubble user";
  userBubble.innerHTML = `<span>${input}</span>`;
  responseBox.appendChild(userBubble);

  // Bot reply
  const reply = generateReply(input);
  const botBubble = document.createElement("div");
  botBubble.className = "response-bubble assistant";
  botBubble.innerHTML = `<img src="core/assets/images/Logo/favicon.ico"><span>${reply}</span>`;
  responseBox.appendChild(botBubble);

  speak(reply.replace(/<[^>]+>/g, ""));
  inputBox.value = "";
  suggestionsBox.innerHTML = "";
  responseBox.scrollTop = responseBox.scrollHeight;
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
  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}
voiceSelect?.addEventListener("change", e => selectedVoice = voices[e.target.value] || null);
window.speechSynthesis.onvoiceschanged = loadVoices;
window.addEventListener("load", loadVoices);

// ===================== Autocomplete Suggestions =====================
inputBox.addEventListener("input", () => {
  const query = inputBox.value.toLowerCase().trim();
  suggestionsBox.innerHTML = "";
  if (!query) return;

  const matches = QA.flatMap(q => q.questions).filter(q => q.toLowerCase().includes(query));
  matches.slice(0, 10).forEach(match => {
    const div = document.createElement("div");
    div.textContent = match;
    div.addEventListener("click", () => {
      inputBox.value = match;
      suggestionsBox.innerHTML = "";
    });
    suggestionsBox.appendChild(div);
  });
});

// ===================== Chatbot Agree Buttons =====================
chatbotOptions.forEach(btn => {
  btn.addEventListener("click", () => {
    const choice = btn.textContent.trim();
    if (choice === "Learn More") {
      addBotMessage("By agreeing to the terms, you accept that the chatbot will guide you based on our system rules. You can still ask questions freely.");
    } else if (choice === "No, I don't") {
      chatbotOptions.forEach(b => b.disabled = true);
      inputBox.disabled = true;
      addBotMessage("You cannot use the chatbot without agreeing to the terms.");
    } else if (choice === "Yes, I agree") {
      chatbotOptions.forEach(b => b.style.display = "none");
      inputBox.disabled = false;
      inputBox.focus();
      addBotMessage("Thank you for agreeing! You can now use the chatbot.");
    }
  });
});

// ===================== Helper to Add Bot Messages =====================
function addBotMessage(msg) {
  const botBubble = document.createElement("div");
  botBubble.className = "response-bubble assistant";
  botBubble.innerHTML = `<img src="core/assets/images/Logo/favicon.ico"><span>${msg}</span>`;
  responseBox.appendChild(botBubble);
  speak(msg);
  responseBox.scrollTop = responseBox.scrollHeight;
}
