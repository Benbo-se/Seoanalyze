// MOBILE OVERFLOW DEBUG SCRIPT
// Kör detta i browser console på mobiltelefonen för att hitta problemet

console.log('🔍 MOBILE OVERFLOW DEBUG - STARTING...');
console.log('Screen width:', window.innerWidth);

// 1. Find all elements that extend beyond viewport
const overflowingElements = [];
document.querySelectorAll('*').forEach(el => {
  const rect = el.getBoundingClientRect();
  if (rect.right > window.innerWidth + 1) {
    overflowingElements.push({
      element: el,
      tagName: el.tagName,
      className: el.className,
      id: el.id,
      width: rect.width,
      right: rect.right,
      overflow: rect.right - window.innerWidth,
      computedStyle: window.getComputedStyle(el)
    });
  }
});

console.log('📊 OVERFLOWING ELEMENTS FOUND:', overflowingElements.length);

// 2. Sort by worst overflow
overflowingElements.sort((a, b) => b.overflow - a.overflow);

// 3. Show top 10 worst offenders
console.log('🚨 TOP 10 WORST OVERFLOWING ELEMENTS:');
overflowingElements.slice(0, 10).forEach((item, index) => {
  console.log(`${index + 1}. ${item.tagName}.${item.className}`);
  console.log(`   Width: ${item.width}px, Overflow: +${item.overflow.toFixed(1)}px`);
  console.log(`   Element:`, item.element);
  console.log(`   Position: ${item.computedStyle.position}`);
  console.log(`   Margin: ${item.computedStyle.margin}`);
  console.log(`   Padding: ${item.computedStyle.padding}`);
  console.log(`   Max-width: ${item.computedStyle.maxWidth}`);
  console.log('---');
});

// 4. Check for problematic CSS properties
console.log('🔧 CHECKING FOR PROBLEMATIC PROPERTIES...');

// Check for elements with negative margins
document.querySelectorAll('*').forEach(el => {
  const style = window.getComputedStyle(el);
  const marginLeft = parseInt(style.marginLeft);
  const marginRight = parseInt(style.marginRight);

  if (marginLeft < 0 || marginRight < 0) {
    console.log('⚠️ NEGATIVE MARGIN FOUND:', el.tagName + '.' + el.className);
    console.log('   Margin-left:', marginLeft, 'Margin-right:', marginRight);
    console.log('   Element:', el);
  }
});

// Check for elements with width > 100vw
document.querySelectorAll('*').forEach(el => {
  const style = window.getComputedStyle(el);
  if (style.width.includes('vw') && parseInt(style.width) > 100) {
    console.log('⚠️ WIDTH > 100VW FOUND:', el.tagName + '.' + el.className);
    console.log('   Width:', style.width);
    console.log('   Element:', el);
  }
});

// 5. Check body scroll width vs client width
console.log('📏 BODY MEASUREMENTS:');
console.log('Body scrollWidth:', document.body.scrollWidth);
console.log('Body clientWidth:', document.body.clientWidth);
console.log('Window innerWidth:', window.innerWidth);
console.log('Horizontal overflow amount:', document.body.scrollWidth - window.innerWidth);

// 6. Highlight the worst offender
if (overflowingElements.length > 0) {
  const worst = overflowingElements[0];
  worst.element.style.outline = '3px solid red';
  worst.element.style.backgroundColor = 'rgba(255,0,0,0.2)';
  console.log('🎯 WORST OFFENDER HIGHLIGHTED IN RED:', worst.element);

  // Scroll to it
  worst.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

console.log('✅ DEBUG COMPLETE - Check the highlighted element and console output above');