const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const activeUsers = new Set();

io.on('connection', (socket) => {
    console.log('Nowe polaczenie:', socket.id);

    socket.on('check-nickname', (nickname, callback) => {
        const cleanNick = nickname ? nickname.trim() : '';
        if (!cleanNick) {
            return callback({ success: false, message: 'Nick nie moze byc pusty.' });
        }
        if (cleanNick.length > 20) {
            return callback({ success: false, message: 'Nick jest za dlugi (max 20 znakow).' });
        }

        const isTaken = Array.from(activeUsers).some(
            u => u.toLowerCase() === cleanNick.toLowerCase()
        );

        if (isTaken) {
            callback({ success: false, message: 'Ten nick jest juz zajety. Wybierz inny.' });
        } else {
            activeUsers.add(cleanNick);
            socket.data.nickname = cleanNick;
            callback({ success: true });
            
            io.emit('system-message', { text: `Uzytkownik ${cleanNick} dolaczyl do czatu.` });
            io.emit('user-list', Array.from(activeUsers));
        }
    });

    socket.on('chat-message', (msg) => {
        if (!socket.data.nickname) return;
        const cleanMsg = msg.trim();
        if (cleanMsg.length > 500) return;
        
        io.emit('chat-message', {
            sender: socket.data.nickname,
            text: cleanMsg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    socket.on('disconnect', () => {
        if (socket.data.nickname) {
            activeUsers.delete(socket.data.nickname);
            io.emit('system-message', { text: `Uzytkownik ${socket.data.nickname} opuscil czat.` });
            io.emit('user-list', Array.from(activeUsers));
            console.log(`Uzytkownik ${socket.data.nickname} rozlaczony.`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serwer dziala na http://localhost:${PORT}`);
});