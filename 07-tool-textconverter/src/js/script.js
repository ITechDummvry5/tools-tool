const textarea = document.querySelector("textarea");
const listenBtn = document.querySelector(".listen-btn");
const voiceSelect = document.querySelector("select");

// Populate available voices
let voices = [];

function loadVoices() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.textContent = `${voice.name} (${voice.lang})`;
    option.value = voice.name;
    voiceSelect.appendChild(option);
  });
}

speechSynthesis.onvoiceschanged = loadVoices;

// When the button is clicked
listenBtn.addEventListener("click", () => {
  const text = textarea.value.trim();
  if (!text) return alert("Please enter text first!");

  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = voices.find(v => v.name === voiceSelect.value);
  if (selectedVoice) utterance.voice = selectedVoice;

  speechSynthesis.speak(utterance);
});
