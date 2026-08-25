const WebSocket = require('ws');
const crypto = require('crypto');
require('dotenv').config();

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ host: '0.0.0.0', port: PORT });

console.log(`[CleverDevs Transfer] Signaling Server running on port ${PORT}`);


const TURN_SECRET = process.env.TURN_SECRET; 

function getTurnCredentials() {
    const timestamp = Math.floor(Date.now() / 1000) + 3600;
    const username = `${timestamp}:clever_user`;
    
    const hmac = crypto.createHmac('sha1', TURN_SECRET);
    hmac.update(username);
    const credential = hmac.digest('base64');
    
    return { username, credential };
}


const rooms = new Map();

wss.on('connection', (ws) => {
    let currentRoom = null;

    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());


            if (msg.type === 'join') {
                const room = String(msg.room).trim();
                if (!room || room.length < 3) return;


                if (rooms.has(room) && rooms.get(room).size >= 2) {
                    ws.send(JSON.stringify({ type: 'error', message: 'room_full' }));
                    return;
                }


                if (currentRoom && rooms.has(currentRoom)) {
                    rooms.get(currentRoom).delete(ws);
                }

                currentRoom = room;
                if (!rooms.has(room)) rooms.set(room, new Set());
                rooms.get(room).add(ws);

                ws.send(JSON.stringify({ 
                    type: 'turn-auth', 
                    turn: getTurnCredentials() 
                }));


                const count = rooms.get(room).size;
                rooms.get(room).forEach(c => {
                    if (c.readyState === WebSocket.OPEN) {
                        c.send(JSON.stringify({ type: 'room-status', count }));
                    }
                });
                return;
            }


            if (currentRoom && rooms.has(currentRoom)) {
                rooms.get(currentRoom).forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(raw.toString());
                    }
                });
            }
        } catch (e) {
            console.error('Error:', e.message);
        }
    });


    ws.on('close', () => {
        if (currentRoom && rooms.has(currentRoom)) {
            const set = rooms.get(currentRoom);
            set.delete(ws);

            set.forEach(c => {
                if (c.readyState === WebSocket.OPEN) {
                    c.send(JSON.stringify({ type: 'room-status', count: set.size }));
                }
            });
            if (set.size === 0) rooms.delete(currentRoom);
        }
    });
});
