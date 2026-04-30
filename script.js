document.addEventListener('DOMContentLoaded', function() {
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsMenu = document.getElementById('settingsMenu');
  const colorPicker = document.getElementById('colorPicker');
  const shapeBtns = document.querySelectorAll('.shape-btn');

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
      settingsMenu.classList.add('hidden');
    }
  });

  const savedColor = localStorage.getItem('calcColor') || '#ff8a00';
  colorPicker.value = savedColor;
  document.documentElement.style.setProperty('--accent-color', savedColor);

  colorPicker.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--accent-color', e.target.value);
  });
  
  colorPicker.addEventListener('change', (e) => {
    localStorage.setItem('calcColor', e.target.value);
  });

  const savedTheme = localStorage.getItem('calcTheme') || 'glass';
  document.documentElement.setAttribute('data-theme', savedTheme);

  function updateActiveShapeBtn() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    shapeBtns.forEach(btn => {
      if (btn.getAttribute('data-theme') === currentTheme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  updateActiveShapeBtn();

  shapeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('calcTheme', theme);
      updateActiveShapeBtn();
    });
  });

  const display = document.getElementById('result');
  const historyDisplay = document.getElementById('history');
  const buttons = document.querySelectorAll('.btn');
  
  let currentInput = '0';
  let equation = '';
  let shouldResetScreen = false;

  function safeCalculate(expression) {
    const tokens = expression.trim().split(/\s+/);
    if (tokens.length === 0) return 0;

    let nextTokens = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '*' || tokens[i] === '/') {
        const operator = tokens[i];
        const prev = parseFloat(nextTokens.pop());
        const next = parseFloat(tokens[++i]);
        if (operator === '*') nextTokens.push(prev * next);
        if (operator === '/') nextTokens.push(prev / next);
      } else {
        nextTokens.push(tokens[i]);
      }
    }

    let result = parseFloat(nextTokens[0]);
    for (let i = 1; i < nextTokens.length; i += 2) {
      const operator = nextTokens[i];
      const next = parseFloat(nextTokens[i+1]);
      if (operator === '+') result += next;
      if (operator === '-') result -= next;
    }
    return result;
  }

  function handleAction(val, id, isOperator) {
    if (currentInput === 'خطأ') currentInput = '0';

    if (id === 'clear') {
      currentInput = '0';
      equation = '';
      updateScreen();
      return;
    }

    if (id === 'equal' || val === '=') {
      if (equation || currentInput !== '0') {
        try {
          let evalStr = equation + currentInput;
          evalStr = evalStr.replace(/×/g, '*').replace(/÷/g, '/');
          let result = safeCalculate(evalStr);
          if (!isFinite(result) || isNaN(result)) throw new Error();
          result = Math.round(result * 100000000) / 100000000;
          historyDisplay.innerText = equation + currentInput + ' =';
          currentInput = result.toString();
          equation = '';
          shouldResetScreen = true;
        } catch (e) {
          currentInput = 'خطأ';
        }
        display.value = currentInput;
      }
      return;
    }

    if (val === '+/-') {
      currentInput = (parseFloat(currentInput) * -1).toString();
      updateScreen();
      return;
    }

    if (val === '%') {
      currentInput = (parseFloat(currentInput) / 100).toString();
      updateScreen();
      return;
    }

    if (isOperator) {
      if (shouldResetScreen) shouldResetScreen = false;
      let displayOp = val === '*' ? '×' : (val === '/' ? '÷' : val);
      equation += currentInput + ' ' + displayOp + ' ';
      currentInput = '0';
      updateScreen();
      return;
    }

    if (val !== null) {
      if (shouldResetScreen) {
        currentInput = val;
        shouldResetScreen = false;
      } else {
        if (currentInput === '0' && val !== '.') currentInput = val;
        else {
          if (val === '.' && currentInput.includes('.')) return;
          currentInput += val;
        }
      }
      updateScreen();
    }
  }

  function updateScreen() {
    display.value = currentInput;
    historyDisplay.innerText = equation;
  }

  function animateButtonByValue(val) {
    const btn = document.querySelector(`.btn[data-val="${val}"]`) || 
                (val === 'Enter' ? document.getElementById('equal') : null) ||
                (val === 'Escape' || val === 'Delete' ? document.getElementById('clear') : null);
    if (btn) {
      btn.style.transform = 'scale(0.9)';
      btn.style.filter = 'brightness(1.5)';
      setTimeout(() => { btn.style.transform = ''; btn.style.filter = ''; }, 100);
    }
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const val = button.getAttribute('data-val');
      const isOperator = button.classList.contains('operator') && button.id !== 'equal';
      handleAction(val, button.id, isOperator);
    });
  });

  document.addEventListener('keydown', (event) => {
    const key = event.key;
    const code = event.code;

    if (document.activeElement === colorPicker) return;

    if (/[0-9\.]/.test(key)) {
      handleAction(key, null, false);
      animateButtonByValue(key);
    }
    else if (['+', '-', '*', '/'].includes(key)) {
      handleAction(key, null, true);
      animateButtonByValue(key);
    }
    else if (key === '%') {
      handleAction('%', null, false);
      animateButtonByValue('%');
    }
    else if (key === 'Enter' || key === '=') {
      event.preventDefault();
      handleAction(null, 'equal', false);
      animateButtonByValue('Enter');
    }
    else if (code === 'KeyC' || key === 'Delete') {
      handleAction(null, 'clear', false);
      animateButtonByValue('Delete');
    }
    else if (key === 'Backspace') {
      if (shouldResetScreen) { currentInput = '0'; shouldResetScreen = false; }
      else {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '' || currentInput === '-') currentInput = '0';
      }
      updateScreen();
    }
  });
});