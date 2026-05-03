chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'welcome.html' });
  }

  chrome.contextMenus.create({
    id: "calcSelection",
    title: "احسب: '%s'",
    contexts: ["selection"]
  });
});

function backgroundCalculate(expression) {
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "calcSelection") {
    try {
      let result = backgroundCalculate(info.selectionText);
      result = Math.round(result * 100000000) / 100000000;
      
      chrome.tabs.sendMessage(tab.id, {
        action: "showPopup",
        text: `${info.selectionText} = ${result}`,
        isError: false
      }, () => {
        if (chrome.runtime.lastError) {}
      });
    } catch(e) {
      chrome.tabs.sendMessage(tab.id, {
        action: "showPopup",
        text: "لم يتم التعرف على المعادلة الرياضية.",
        isError: true
      }, () => {
        if (chrome.runtime.lastError) {}
      });
    }
  }
});