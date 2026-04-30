document.addEventListener('DOMContentLoaded', function() {
  const calculator = document.getElementById('calculator');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsMenu = document.getElementById('settingsMenu');
  const colorPicker = document.getElementById('colorPicker');
  const shapeBtns = document.querySelectorAll('.shape-btn');
  const sciToggle = document.getElementById('sciToggle');
  const showHistoryBtn = document.getElementById('showHistoryBtn');
  const historyDrawer = document.getElementById('historyDrawer');
  const closeHistory = document.getElementById('closeHistory');
  const historyList = document.getElementById('historyList');

  const tabCalc = document.getElementById('tabCalc');
  const tabConv = document.getElementById('tabConv');
  const calcSection = document.getElementById('calcSection');
  const convSection = document.getElementById('convSection');

  tabCalc.addEventListener('click', () => {
    tabCalc.classList.add('active'); tabConv.classList.remove('active');
    calcSection.classList.remove('hidden-section'); convSection.classList.add('hidden-section');
  });

  tabConv.addEventListener('click', () => {
    tabConv.classList.add('active'); tabCalc.classList.remove('active');
    convSection.classList.remove('hidden-section'); calcSection.classList.add('hidden-section');
  });

  settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsMenu.classList.toggle('hidden'); });
  showHistoryBtn.addEventListener('click', () => { historyDrawer.classList.add('open'); });
  closeHistory.addEventListener('click', () => { historyDrawer.classList.remove('open'); });

  document.addEventListener('click', (e) => {
    if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) settingsMenu.classList.add('hidden');
  });

  const savedColor = localStorage.getItem('calcColor') || '#007aff';
  colorPicker.value = savedColor;
  document.documentElement.style.setProperty('--accent-color', savedColor);
  colorPicker.addEventListener('input', (e) => document.documentElement.style.setProperty('--accent-color', e.target.value));
  colorPicker.addEventListener('change', (e) => localStorage.setItem('calcColor', e.target.value));

  const savedTheme = localStorage.getItem('calcTheme') || 'neon';
  document.documentElement.setAttribute('data-theme', savedTheme);
  shapeBtns.forEach(btn => {
    if (btn.getAttribute('data-theme') === savedTheme) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('calcTheme', theme);
      shapeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const isScientific = localStorage.getItem('calcScientific') === 'true';
  sciToggle.checked = isScientific;
  if(isScientific) calculator.classList.add('scientific');
  sciToggle.addEventListener('change', (e) => {
    if(e.target.checked) calculator.classList.add('scientific');
    else calculator.classList.remove('scientific');
    localStorage.setItem('calcScientific', e.target.checked);
  });

  const conversionData = {
    length: { 'متر': 1, 'سنتيمتر': 100, 'كيلومتر': 0.001, 'بوصة': 39.3701, 'قدم': 3.28084 },
    weight: { 'كيلوجرام': 1, 'جرام': 1000, 'رطل': 2.20462, 'أوقية': 35.274 },
    data: { 'ميجابايت': 1, 'كيلوبايت': 1024, 'جيجابايت': 0.0009765625, 'بايت': 1048576 }
  };

  const convCategory = document.getElementById('convCategory');
  const convUnit1 = document.getElementById('convUnit1');
  const convUnit2 = document.getElementById('convUnit2');
  const convInput1 = document.getElementById('convInput1');
  const convInput2 = document.getElementById('convInput2');
  const convSwap = document.getElementById('convSwap');

  function populateUnits() {
    const cat = convCategory.value;
    const units = Object.keys(conversionData[cat]);
    convUnit1.innerHTML = ''; convUnit2.innerHTML = '';
    units.forEach((u, i) => {
      convUnit1.add(new Option(u, u, false, i===0));
      convUnit2.add(new Option(u, u, false, i===1 || (units.length > 1 ? false : true)));
    });
    if (units.length > 1) convUnit2.selectedIndex = 1;
    convert();
  }

  function convert() {
    const cat = convCategory.value;
    const val1 = parseFloat(convInput1.value);
    if(isNaN(val1)) { convInput2.value = ''; return; }
    const rate1 = conversionData[cat][convUnit1.value];
    const rate2 = conversionData[cat][convUnit2.value];
    const baseVal = val1 / rate1; 
    const finalVal = baseVal * rate2;
    convInput2.value = (Math.round(finalVal * 1000000) / 1000000).toString();
  }

  convCategory.addEventListener('change', populateUnits);
  convInput1.addEventListener('input', convert);
  convUnit1.addEventListener('change', convert);
  convUnit2.addEventListener('change', convert);
  convSwap.addEventListener('click', () => {
    const tempIndex = convUnit1.selectedIndex;
    convUnit1.selectedIndex = convUnit2.selectedIndex;
    convUnit2.selectedIndex = tempIndex;
    convert();
  });

  populateUnits();

  const displayInput = document.getElementById('result');
  const toast = document.getElementById('toast');
  displayInput.addEventListener('click', () => {
    if(displayInput.value && displayInput.value !== '0' && displayInput.value !== 'خطأ') {
      navigator.clipboard.writeText(displayInput.value);
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1500);
    }
  });

  let historyData = JSON.parse(localStorage.getItem('calcHistoryData')) || [];
  function saveToHistory(eq, res) {
    historyData.unshift({ eq, res });
    if (historyData.length > 20) historyData.pop();
    localStorage.setItem('calcHistoryData', JSON.stringify(historyData));
    renderHistory();
  }
  function renderHistory() {
    historyList.innerHTML = '';
    historyData.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `<div class="hist-eq">${item.eq}</div><div class="hist-res">${item.res}</div>`;
      div.addEventListener('click', () => {
        currentInput = item.res.toString();
        equation = '';
        updateScreen();
        historyDrawer.classList.remove('open');
        tabCalc.click(); 
      });
      historyList.appendChild(div);
    });
  }
  renderHistory();

  const display = document.getElementById('result');
  const historyHeader = document.getElementById('history');
  const buttons = document.querySelectorAll('.btn');
  
  let currentInput = '0';
  let equation = '';
  let shouldResetScreen = false;

  function advancedCalculate(expression) {
    let str = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
    let pos = 0;
    
    function parseExpression() {
      let num = parseTerm();
      while (pos < str.length && (str[pos] === '+' || str[pos] === '-')) {
        let op = str[pos++];
        let nextNum = parseTerm();
        if (op === '+') num += nextNum;
        else num -= nextNum;
      }
      return num;
    }
    
    function parseTerm() {
      let num = parseFactor();
      while (pos < str.length && (str[pos] === '*' || str[pos] === '/')) {
        let op = str[pos++];
        let nextNum = parseFactor();
        if (op === '*') num *= nextNum;
        else num /= nextNum;
      }
      return num;
    }
    
    function parseFactor() {
      let isNegative = false;
      if (str[pos] === '-') { isNegative = true; pos++; }
      
      let func = null;
      if (str.startsWith('sin', pos)) { func = 'sin'; pos += 3; }
      else if (str.startsWith('cos', pos)) { func = 'cos'; pos += 3; }
      else if (str.startsWith('tan', pos)) { func = 'tan'; pos += 3; }
      else if (str.startsWith('log', pos)) { func = 'log'; pos += 3; }
      else if (str.startsWith('√', pos)) { func = 'sqrt'; pos += 1; }

      let num = 0;
      if (str[pos] === '(') {
        pos++;
        num = parseExpression();
        if (pos < str.length && str[pos] === ')') pos++;
      } else {
        let start = pos;
        while (pos < str.length && /[0-9\.eπ]/.test(str[pos])) pos++;
        let numStr = str.substring(start, pos);
        if (numStr === 'π') num = Math.PI;
        else if (numStr === 'e') num = Math.E;
        else num = parseFloat(numStr);
        if (isNaN(num)) num = 0;
      }

      if (func === 'sin') num = Math.sin(num * Math.PI / 180);
      else if (func === 'cos') num = Math.cos(num * Math.PI / 180);
      else if (func === 'tan') num = Math.tan(num * Math.PI / 180);
      else if (func === 'log') num = Math.log10(num);
      else if (func === 'sqrt') num = Math.sqrt(num);

      if (isNegative) num = -num;

      if (pos < str.length && str[pos] === '^') {
        pos++;
        let power = parseFactor();
        num = Math.pow(num, power);
      }
      return num;
    }
    return parseExpression();
  }

  function handleAction(val, id, isOperator) {
    if (currentInput === 'خطأ') currentInput = '0';

    if (id === 'clear') {
      currentInput = '0'; equation = ''; updateScreen(); return;
    }

    if (id === 'equal' || val === '=') {
      if (equation || currentInput !== '0') {
        try {
          let evalStr = equation + currentInput;
          let result = advancedCalculate(evalStr);
          if (!isFinite(result) || isNaN(result)) throw new Error();
          
          result = Math.round(result * 100000000) / 100000000;
          let finalEq = equation + currentInput + ' =';
          
          historyHeader.innerText = finalEq;
          currentInput = result.toString();
          equation = '';
          shouldResetScreen = true;
          
          saveToHistory(finalEq, currentInput);
        } catch (e) {
          currentInput = 'خطأ';
        }
        display.value = currentInput;
      }
      return;
    }

    if (val === '+/-') { currentInput = (parseFloat(currentInput) * -1).toString(); updateScreen(); return; }
    if (val === '%') { currentInput = (parseFloat(currentInput) / 100).toString(); updateScreen(); return; }

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
        if (currentInput === '0' && !['.', '^', ')'].includes(val)) currentInput = val;
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
    historyHeader.innerText = equation;
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const val = button.getAttribute('data-val');
      const isOperator = button.classList.contains('operator') && button.id !== 'equal';
      handleAction(val, button.id, isOperator);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (!convSection.classList.contains('hidden-section')) return;

    const key = event.key;
    const code = event.code;
    if (document.activeElement === colorPicker || document.activeElement.tagName === 'INPUT') return;

    if (/[0-9\.\(\)\^]/.test(key)) { handleAction(key, null, false); }
    else if (['+', '-', '*', '/'].includes(key)) { handleAction(key, null, true); }
    else if (key === '%') { handleAction('%', null, false); }
    else if (key === 'Enter' || key === '=') { event.preventDefault(); handleAction(null, 'equal', false); }
    else if (code === 'KeyC' || key === 'Delete') { handleAction(null, 'clear', false); }
    else if (key === 'Backspace') {
      if (shouldResetScreen) { currentInput = '0'; shouldResetScreen = false; }
      else {
        if(currentInput.endsWith('sin(') || currentInput.endsWith('cos(') || currentInput.endsWith('tan(') || currentInput.endsWith('log(')) {
          currentInput = currentInput.slice(0, -4);
        } else {
          currentInput = currentInput.slice(0, -1);
        }
        if (currentInput === '' || currentInput === '-') currentInput = '0';
      }
      updateScreen();
    }
  });
});