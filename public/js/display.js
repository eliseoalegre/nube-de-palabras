const socket = io();

// Elementos del DOM
const questionText = document.getElementById('question-text');
const btnNew = document.getElementById('btn-new');
const questionForm = document.getElementById('question-form');
const questionInput = document.getElementById('question-input');
const btnAccept = document.getElementById('btn-accept');
const btnCancel = document.getElementById('btn-cancel');
const mainContent = document.getElementById('main-content');
const qrContainer = document.getElementById('qr-container');
const qrCode = document.getElementById('qr-code');
const qrUrl = document.getElementById('qr-url');
const cloudContainer = document.getElementById('cloud-container');
const wordCloudCanvas = document.getElementById('word-cloud');

// Estado local
let answers = [];
let currentQuestion = null;

// Colores para la nube
const CLOUD_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
  '#F1948A', '#AED6F1', '#D7BDE2', '#A3E4D7'
];

// --- Nube de palabras ---

function countAnswers() {
  const counts = {};
  answers.forEach(a => {
    const key = a.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function renderCloud() {
  const counts = countAnswers();
  const entries = Object.entries(counts);

  if (entries.length === 0) return;

  // Ordenar por frecuencia para calcular escala
  entries.sort((a, b) => b[1] - a[1]);
  const maxCount = entries[0][1];
  const minSize = 18;
  const maxSize = Math.min(80, cloudContainer.clientWidth / 6);

  const wordList = entries.map(([word, count]) => {
    const size = minSize + ((count / maxCount) * (maxSize - minSize));
    return [word, size];
  });

  // Ajustar canvas al contenedor
  wordCloudCanvas.width = cloudContainer.clientWidth;
  wordCloudCanvas.height = cloudContainer.clientHeight;

  WordCloud(wordCloudCanvas, {
    list: wordList,
    gridSize: 8,
    weightFactor: 1,
    fontFamily: 'Inter, system-ui, sans-serif',
    color: () => CLOUD_COLORS[Math.floor(Math.random() * CLOUD_COLORS.length)],
    backgroundColor: 'transparent',
    rotateRatio: 0.3,
    rotationSteps: 2,
    shuffle: true,
    drawOutOfBound: false,
    shrinkToFit: true
  });
}

// --- QR Code ---

function generateQR() {
  const url = window.location.origin + '/respond';
  qrCode.innerHTML = '';
  new QRCode(qrCode, {
    text: url,
    width: 200,
    height: 200,
    colorDark: '#ffffff',
    colorLight: 'transparent',
    correctLevel: QRCode.CorrectLevel.M
  });
  qrUrl.textContent = url;
}

// --- UI States ---

function showForm(enableCancel) {
  questionForm.classList.remove('hidden');
  questionText.classList.add('hidden');
  btnNew.classList.add('hidden');
  btnCancel.disabled = !enableCancel;
  questionInput.value = '';
  questionInput.focus();
}

function showSession() {
  questionForm.classList.add('hidden');
  questionText.classList.remove('hidden');
  questionText.textContent = currentQuestion;
  btnNew.classList.remove('hidden');
  mainContent.classList.remove('hidden');
  generateQR();
  renderCloud();
}

// --- Eventos UI ---

btnNew.addEventListener('click', () => {
  showForm(true);
});

btnAccept.addEventListener('click', () => {
  const q = questionInput.value.trim();
  if (q) {
    socket.emit('new-question', q);
  }
});

btnCancel.addEventListener('click', () => {
  if (currentQuestion) {
    showSession();
  }
});

questionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    btnAccept.click();
  }
});

// --- Socket events ---

socket.on('current-state', (state) => {
  if (state.question) {
    currentQuestion = state.question;
    answers = state.answers || [];
    showSession();
  } else {
    showForm(false);
  }
});

socket.on('new-question', (question) => {
  currentQuestion = question;
  answers = [];
  showSession();
});

socket.on('new-answer', (answer) => {
  answers.push(answer);
  renderCloud();
});

// Re-renderizar al cambiar tamaño de ventana
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(renderCloud, 300);
});
