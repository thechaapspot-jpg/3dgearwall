const fs = require('fs');
const html = fs.readFileSync('collections.html', 'utf8');

// Match each product card
const cards = html.split('class="collection-card"');
const outOfStockIds = [];

for (let i = 1; i < cards.length; i++) {
  const card = cards[i];
  const idMatch = card.match(/product\/(\d+)\.html/);
  if (!idMatch) continue;
  const id = parseInt(idMatch[1], 10);
  if (card.includes('out-of-stock-badge') || card.includes('Out of Stock')) {
    outOfStockIds.push(id);
  }
}

console.log('Out of stock IDs from HTML:', outOfStockIds);
