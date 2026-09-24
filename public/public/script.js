const socket = io();

const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const loginForm = document.getElementById('login-form');
const nicknameInput = document.getElementById('nickname-input');
const errorMsg = document.getElementById('error-msg');

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');
const usersList = document.getElementById('users-list');
const userCount = document.getElementById('user-count');
const myNicknameSpan = document.getElementById('my-nickname');

let myNickname = '';

// Sprawdź czy zapamiętano nick w przeglądarce
const savedNick = localStorage.getItem('chat_nickname');
if (savedNick) {
    nicknameInput.value = savedNick;
    // Spróbuj automatycznie zalogować po odświeżeniu
    socket.emit('check-nickname', savedNick, (response) => {
        if (response.success) {
            myNickname = savedNick;
            myNicknameSpan.textContent = myNickname;
            loginContainer.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            messageInput.focus();
        } else {
            localStorage.removeItem('chat_nickname');
        }
    });
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = nicknameInput.value.trim();
    if (!nickname) return;

    socket.emit('check-nickname', nickname, (response) => {
        if (response.success) {
            myNickname = nickname;
            localStorage.setItem('chat_nickname', myNickname);
            myNicknameSpan.textContent = myNickname;
            loginContainer.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            messageInput.focus();
        } else {
            errorMsg.textContent = response.message;
        }
    });
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    socket.emit('chat-message', text);
    messageInput.value = {};
    messageInput.value = '';
});

socket.on('chat-message', (data) => {
    appendMessage(data);
});

socket.on('system-message', (data) => {
    appendSystemMessage(data.text);
});

socket.on('user-list', (users) => {
    usersList.innerHTML = '';
    userCount.textContent = users.length;
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user === myNickname ? `${user} (Ty)` : user;
        if (user === myNickname) {
            li.style.fontWeight = 'bold';
            li.style.color = '#38bdf8';
        }
        usersList.appendChild(li);
    });
});

function appendMessage(data) {
    const isOutgoing = data.sender === myNickname;
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', isOutgoing ? 'outgoing' : 'incoming');

    const header = document.createElement('div');
    header.classList.add('msg-header');
    header.innerHTML = `<span><strong>${isOutgoing ? 'Ty' : data.sender}</strong></span><span>${data.time}</span>`;
    msgDiv.appendChild(header);

    const text = document.createElement('div');
    text.textContent = data.text;
    msgDiv.appendChild(text);

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendSystemMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'system');
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}