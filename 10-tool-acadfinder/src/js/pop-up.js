// ================= CHATBOT POPUP CONTROL =================
const chatbotBtn = document.getElementById("chatbotCircleBtn"); // floating button
const chatbotPopup = document.getElementById("chatbotPopup");
const closeChatbot = document.getElementById("closeChatbot");

// OPEN / TOGGLE CHATBOT
chatbotBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent the window click from immediately closing it
  chatbotPopup.classList.toggle("active");
});

// CLOSE CHATBOT BUTTON
closeChatbot.addEventListener("click", (e) => {
  e.stopPropagation();
  chatbotPopup.classList.remove("active");
});

// CLOSE WHEN CLICKING OUTSIDE THE CHATBOX
window.addEventListener("click", (e) => {
  if (!chatbotPopup.contains(e.target) && e.target !== chatbotBtn) {
    chatbotPopup.classList.remove("active");
  }
});

// OPTIONAL: stop clicks inside the popup from closing it
chatbotPopup.addEventListener("click", (e) => {
  e.stopPropagation();
});