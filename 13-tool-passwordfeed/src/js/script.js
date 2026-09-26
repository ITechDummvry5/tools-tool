const pass = document.getElementById("password");
const bar = document.getElementById("bar");
const check = document.getElementById("checkBtn");
const strengthLabel = document.getElementById("strengthText");
const suggestion = document.getElementById("suggestion"); // get from HTML


function checkStrength() {
  const val = pass.value;
  let strength = 0;

  // Rules check
  const hasUpper = /[A-Z]/.test(val);
  const hasNumber = /[0-9]/.test(val);
  const hasSymbol = /[^A-Za-z0-9]/.test(val);
  const hasLength = val.length >= 8;

  // Count strength
  if (hasLength) strength++;
  if (hasUpper) strength++;
  if (hasNumber) strength++;
  if (hasSymbol) strength++;

  // Data for strength
  const levels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["#f00", "#ff7300", "#ffc107", "#00b86b"];
  const percent = (strength / 4) * 100;

  // Update bar
  bar.style.width = `${percent}%`;
  bar.style.background = colors[strength - 1] || "#333";
  strengthLabel.textContent = `Strength: ${levels[strength - 1] || "None"}`;

  // 🧠 Suggestion logic
  let missing = [];
  if (!hasLength) missing.push("use at least 8 characters");
  if (!hasUpper) missing.push("add uppercase letters");
  if (!hasNumber) missing.push("add numbers");
  if (!hasSymbol) missing.push("add symbols like !, @, #");

  if (strength === 4) {
    suggestion.textContent = " Great! Your password is strong.";
    suggestion.style.color = "#00b86b";
  } else if (val.length > 0) {
    suggestion.textContent = " Try to " + missing.join(", ") + ".";
    suggestion.style.color = "#ffc107";
  } else {
    suggestion.textContent = "";
  }
}

// Events
check.addEventListener("click", checkStrength);
pass.addEventListener("input", checkStrength);
