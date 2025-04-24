// --- Modal & Navigation Logic ---
function openInterestsModal() {
  document.getElementById('interestsModal').classList.remove('hidden');
  document.getElementById('modalBackdrop').classList.remove('hidden');
}
function closeInterestsModal() {
  document.getElementById('interestsModal').classList.add('hidden');
  document.getElementById('modalBackdrop').classList.add('hidden');
}
document.getElementById('modalBackdrop').onclick = closeInterestsModal;
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeInterestsModal();
});

function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// --- Interests & Personalization ---
function saveInterests() {
  const checked = Array.from(document.querySelectorAll('#interestsForm input[name="interest"]:checked'));
  const interests = checked.map(cb => cb.value);
  localStorage.setItem('explorely_interests', JSON.stringify(interests));
  closeInterestsModal();
  loadEvents();
}
function getUserInterests() {
  try {
    return JSON.parse(localStorage.getItem('explorely_interests')) || [];
  } catch { return []; }
}

// --- Points & Drops System ---
function getPoints() {
  return parseInt(localStorage.getItem('explorely_points') || '0', 10);
}
function setPoints(points) {
  localStorage.setItem('explorely_points', points);
  updatePointsUI();
}
function addPoints(pts) {
  setPoints(getPoints() + pts);
}
function updatePointsUI() {
  const points = getPoints();
  document.getElementById('pointsDisplay').textContent = `Points: ${points}`;
  document.getElementById('pointsBar').value = points % 100;
  if (points > 0 && points % 100 === 0) {
    document.getElementById('dropMsg').textContent = '🎉 You unlocked a Drop! Check your email for a special opportunity.';
  } else {
    document.getElementById('dropMsg').textContent = `${100 - (points % 100)} points to your next Drop!`;
  }
}

// --- Event Scraping & Rendering ---
async function fetchEvents() {
  const proxyUrl = 'https://corsproxy.io/?';
  const targetUrl = 'https://engage.nyu.edu/events';
  try {
    const res = await fetch(proxyUrl + encodeURIComponent(targetUrl));
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const cards = [...doc.querySelectorAll('.card')];
    // Extract more info for keyword matching
    return cards.map(card => {
      const title = card.querySelector('.card-title')?.innerText || 'Untitled';
      const date = card.querySelector('.card-date')?.innerText || 'Date TBD';
      const link = card.querySelector('a')?.href || '#';
      const desc = card.querySelector('.card-text')?.innerText || '';
      return { name: title, date, websiteUrl: link, desc };
    });
  } catch (error) {
    console.error('Failed to scrape events:', error);
    return [];
  }
}

function matchInterest(event, interests) {
  if (!interests || interests.length === 0) return false;
  const text = (event.name + ' ' + event.desc).toLowerCase();
  return interests.some(i => text.includes(i.toLowerCase()));
}

async function loadEvents() {
  const container = document.getElementById('eventsList');
  container.innerHTML = '<div style="text-align:center;">Loading events...</div>';
  const interests = getUserInterests();
  let events = await fetchEvents();
  if (events.length === 0) {
    container.innerHTML = '<p>No live events available right now. Try again later!</p>';
    return;
  }
  container.innerHTML = '';
  events.slice(0, 16).forEach(event => {
    const item = document.createElement('div');
    const isMatch = matchInterest(event, interests);
    item.className = 'card' + (isMatch ? ' highlight' : '');
    item.innerHTML = `
      <strong>${event.name}</strong><br>
      <span>${event.date}</span><br>
      <small>${event.desc.substring(0, 80)}${event.desc.length > 80 ? '...' : ''}</small><br>
      <button class="cta mini" style="margin-top:1rem">View Details</button>
      ${isMatch && interests.length > 0 ? '<span class="match-badge">Matched to your interests!</span>' : ''}
    `;
    item.onclick = e => {
      if (e.target.tagName === 'BUTTON') {
        window.open(event.websiteUrl, '_blank');
        addPoints(15);
      }
    };
    container.appendChild(item);
  });
}

// --- On Load ---
document.addEventListener('DOMContentLoaded', function() {
  updatePointsUI();
  loadEvents();
});
