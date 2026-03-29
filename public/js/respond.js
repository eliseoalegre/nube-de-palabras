const socket = io();

const questionText = document.getElementById('question-text');
const respondForm = document.getElementById('respond-form');
const answerInput = document.getElementById('answer-input');
const btnSend = document.getElementById('btn-send');
const feedback = document.getElementById('feedback');

let hasQuestion = false;

function showQuestion(question) {
  hasQuestion = true;
  questionText.textContent = question;
  respondForm.classList.remove('hidden');
  answerInput.focus();
}

function showWaiting() {
  hasQuestion = false;
  questionText.textContent = 'Esperando que el profesor configure la pregunta...';
  respondForm.classList.add('hidden');
}

function sendAnswer() {
  const answer = answerInput.value.trim();
  if (answer && hasQuestion) {
    socket.emit('submit-answer', answer);
    answerInput.value = '';
    answerInput.focus();

    // Feedback visual
    feedback.classList.remove('hidden');
    feedback.textContent = 'Enviado!';
    setTimeout(() => {
      feedback.classList.add('hidden');
    }, 1500);
  }
}

btnSend.addEventListener('click', sendAnswer);

answerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendAnswer();
  }
});

socket.on('current-state', (state) => {
  if (state.question) {
    showQuestion(state.question);
  } else {
    showWaiting();
  }
});

socket.on('new-question', (question) => {
  showQuestion(question);
});
