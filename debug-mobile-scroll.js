// Debug-kod för att hitta element som orsakar horizontal scroll
// Kör detta i browser console för att identifiera problemelement

function findOverflowElements() {
  const overflowing = [];
  
  [...document.querySelectorAll('*')].forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.right - window.innerWidth > 1) {
      overflowing.push({
        element: el,
        width: rect.width,
        right: rect.right,
        overflow: rect.right - window.innerWidth
      });
      console.log('Overflow detected:', el, 'Width:', rect.width, 'Overflow by:', rect.right - window.innerWidth);
    }
  });
  
  return overflowing;
}

// Kör funktionen
findOverflowElements();
