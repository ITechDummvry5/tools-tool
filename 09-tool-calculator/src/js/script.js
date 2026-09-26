// === CALCULATOR SCRIPT ===

// Select elements
const display = document.querySelector(".calc-display");
const keys = document.querySelector(".calc-keys");

let currentInput = "";
let previousInput = "";
let operator = null;

// Handle key clicks
keys.addEventListener("click", (e) => {
  const button = e.target;
  const value = button.textContent;

  if (!button.matches("button")) return;

  // Number or decimal
  if (!isNaN(value) || value === ".") {
    handleNumber(value);
  }

  // Operators
  else if (["+", "-", "x", "/"].includes(value)) {
    handleOperator(value);
  }

  // Delete key
  else if (button.classList.contains("del")) {
    handleDelete();
  }

  // Reset key
  else if (button.classList.contains("reset")) {
    handleReset();
  }

  // Equal key
  else if (button.classList.contains("equal")) {
    handleEqual();
  }

  updateDisplay();
});

// === Functions ===
function handleNumber(value) {
  if (value === "." && currentInput.includes(".")) return;
  currentInput += value;
}

function handleOperator(value) {
  if (currentInput === "" && previousInput === "") return;
  if (previousInput && currentInput) handleEqual();
  operator = value;
  previousInput = currentInput;
  currentInput = "";
}

function handleDelete() {
  currentInput = currentInput.slice(0, -1);
}

function handleReset() {
  currentInput = "";
  previousInput = "";
  operator = null;
  display.textContent = "0";
}

function handleEqual() {
  if (previousInput === "" || currentInput === "" || !operator) return;

  const prev = parseFloat(previousInput);
  const curr = parseFloat(currentInput);
  let result;

  switch (operator) {
    case "+": result = prev + curr; break;
    case "-": result = prev - curr; break;
    case "x": result = prev * curr; break;
    case "/": result = curr === 0 ? "Error" : prev / curr; break;
  }

  currentInput = result.toString();
  operator = null;
  previousInput = "";
}

function updateDisplay() {
display.textContent = previousInput + (operator ? " " + operator + " " : "") + currentInput;

}
