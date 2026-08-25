   let socket;
    let pc = null;
    let dataChannel = null;
    let pendingCandidates = [];
    let activeFile = null;
    let transferTimeout = null;

    let rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    };

    function generateToken() {
        const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        let r = '';
        for(let i=0; i<6; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
        return r.slice(0,3) + '-' + r.slice(3);
    }

    let currentRoom = location.hash ? location.hash.substring(1) : generateToken();
    if (!location.hash) history.replaceState(null, '', `#${currentRoom}`);
    
    document.getElementById('roomDisplay').innerText = currentRoom;
    
    new QRCode(document.getElementById("qrcode"), {
        text: location.href, 
        width: 80, 
        height: 80, 
        colorDark: "#161618", 
        colorLight: "#ffffff"
    });

    function init() {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(`${protocol}//${location.host}/ws`);

        socket.onopen = () => {
            document.getElementById('statusText').innerText = 'در انتظار اتصال دستگاه دیگر...';
            socket.send(JSON.stringify({ type: 'join', room: currentRoom }));
        };

        socket.onclose = () => {
            document.getElementById('statusDot').className = 'status-dot error';
            document.getElementById('statusText').innerText = 'ارتباط با سرور قطع شد! ❌';
            document.getElementById('statusText').style.color = 'var(--danger)';
        };

        socket.onmessage = async (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'turn-auth') {
                rtcConfig.iceServers.push({
                    urls: 'turn:transfer.cleverdevs.ir:3478?transport=udp',
                    username: msg.turn.username,
                    credential: msg.turn.credential
                });
                rtcConfig.iceServers.push({
                    urls: 'turn:transfer.cleverdevs.ir:3478?transport=tcp',
                    username: msg.turn.username,
                    credential: msg.turn.credential
                });
            } else if (msg.type === 'error' && msg.message === 'room_full') {
                alert('این اتاق پر است. لطفاً لینک جدیدی بسازید.');
            } else if (msg.type === 'room-status') {
                const isReady = msg.count >= 2;
                document.getElementById('statusDot').className = isReady ? 'status-dot online' : 'status-dot';
                document.getElementById('statusText').innerText = isReady ? 'اتصال برقرار شد (آماده انتقال)' : 'در انتظار اتصال دستگاه دیگر...';
                if (isReady && activeFile) {
                    document.getElementById('sendBtn').disabled = false;
                }
            } else if (msg.type === 'offer') {
                createPeer();
                await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
                while (pendingCandidates.length) await pc.addIceCandidate(pendingCandidates.shift());
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(JSON.stringify({ type: 'answer', data: answer }));
            } else if (msg.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
                while (pendingCandidates.length) await pc.addIceCandidate(pendingCandidates.shift());
            } else if (msg.type === 'candidate') {
                const cand = new RTCIceCandidate(msg.data);
                if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                    await pc.addIceCandidate(cand).catch(e => console.warn(e));
                } else {
                    pendingCandidates.push(cand);
                }
            }
        };
    }

    function createPeer() {
        if (pc) return;
        pc = new RTCPeerConnection(rtcConfig);

        pc.onicecandidate = (e) => {
            if (e.candidate) socket.send(JSON.stringify({ type: 'candidate', data: e.candidate }));
        };

        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            if (state === 'failed' || state === 'disconnected') {
                document.getElementById('statusDot').className = 'status-dot error';
                document.getElementById('statusText').innerText = 'خطا در ارتباط شبکه ❌';
                document.getElementById('statusText').style.color = 'var(--danger)';
            }
        };

        let fileMeta = null;
        let received = 0;
        let chunks = [];

        pc.ondatachannel = (e) => {
            const channel = e.channel;
            channel.binaryType = 'arraybuffer';

            channel.onmessage = (event) => {
                if (typeof event.data === 'string') {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'file-offer') {
                        fileMeta = payload;
                        document.getElementById('consentBox').style.display = 'block';
                        document.getElementById('consentText').innerText = `دریافت فایل "${payload.name}" (${(payload.size/(1024*1024)).toFixed(2)} MB)`;
                        
                        window.acceptFile = () => {
                            document.getElementById('consentBox').style.display = 'none';
                            document.getElementById('recvProgressWrap').style.display = 'block';
                            channel.send(JSON.stringify({ type: 'consent-reply', accept: true }));
                            received = 0; chunks = [];
                        };

                        window.rejectFile = () => {
                            document.getElementById('consentBox').style.display = 'none';
                            channel.send(JSON.stringify({ type: 'consent-reply', accept: false }));
                        };
                    } 
                } else {
                    chunks.push(event.data);
                    received += event.data.byteLength;
                    const p = Math.round((received / fileMeta.size) * 100);
                    document.getElementById('recvProgFill').style.width = `${p}%`;
                    document.getElementById('recvMeta').innerText =`${p}% | ${fileMeta.name}`;

                    if (received >= fileMeta.size) {
                        const blob = new Blob(chunks);
                        const dl = document.getElementById('downloadBtn');
                        dl.href = URL.createObjectURL(blob);
                        dl.download = fileMeta.name;
                        dl.style.display = 'block';
                        document.getElementById('recvMeta').innerText = `کامل شد | ${fileMeta.name}`;
                    }
                }
            };
        };
    }

    function handleFile(input) {
        if (input.files[0]) {
            activeFile = input.files[0];
            document.getElementById('fileLabel').innerText = `${activeFile.name} (${(activeFile.size / (1024*1024)).toFixed(2)} MB)`;
            if (document.getElementById('statusDot').classList.contains('online')) {
                document.getElementById('sendBtn').disabled = false;
            }
        }
    }

    async function initiateTransfer() {
        if (!activeFile) return;
        createPeer();
        
        dataChannel = pc.createDataChannel('fileTransfer');
        dataChannel.binaryType = 'arraybuffer';

        // ⏱️ تایمر محافظ ۸ ثانیه‌ای
        transferTimeout = setTimeout(() => {
            if (dataChannel && dataChannel.readyState !== 'open') {
                alert(
                    "⚠️ خطا در برقراری تونل انتقال داده!\n\n" +
                    "دلیل: شبکه یا مرورگر مقصد اجازه عبور ترافیک را نمی‌دهد.\n" +
                    "💡 راه‌حل: در صورت استفاده از پروکسی یا VPN، لطفاً آن را موقتاً خاموش کنید."
                );
                document.getElementById('sendBtn').disabled = false;
                document.getElementById('sendBtn').innerText = 'ارسال به دستگاه مقابل';
                document.getElementById('sendProgressWrap').style.display = 'none';
                try { dataChannel.close(); } catch(e){}
            }
        }, 8000);

        dataChannel.onopen = () => {
            clearTimeout(transferTimeout);
            dataChannel.send(JSON.stringify({ 
                type: 'file-offer', 
                name: activeFile.name, 
                size: activeFile.size 
            }));
        };

        dataChannel.onmessage = (event) => {
            if (typeof event.data === 'string') {
                const payload = JSON.parse(event.data);
                if (payload.type === 'consent-reply') {
                    if (payload.accept) {
                        startChunking();
                    } else {
                        alert('دستگاه مقابل دریافت فایل را رد کرد.');
                        document.getElementById('sendBtn').innerText = 'درخواست رد شد (مجدد تلاش کنید)';
                        document.getElementById('sendBtn').disabled = false;
                    }
                }
            }
        };
        
        document.getElementById('sendBtn').disabled = true;
        document.getElementById('sendBtn').innerText = 'در حال برقراری تونل امن...';

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.send(JSON.stringify({ type: 'offer', data: offer }));
    }

    async function startChunking() {
        document.getElementById('sendBtn').innerText = 'در حال ارسال...';
        document.getElementById('sendProgressWrap').style.display = 'block';
        
        const chunkSize = 16384;
        const buffer = await activeFile.arrayBuffer();
        let offset = 0;

        const sendNext = () => {
            while (offset < buffer.byteLength) {
                if (dataChannel.bufferedAmount > 65536) {
                    dataChannel.onbufferedamountlow = () => {
                        dataChannel.onbufferedamountlow = null;
                        sendNext();
                    };
                    return;
                }
                dataChannel.send(buffer.slice(offset, offset + chunkSize));
                offset += chunkSize;
                const p = Math.round((offset / buffer.byteLength) * 100);
                document.getElementById('sendProgFill').style.width = `${p}%`;
                document.getElementById('sendMeta').innerText = `${p}% | ${activeFile.name}`;
            }
            document.getElementById('sendBtn').innerText = 'فایل کامل ارسال شد ✅';
        };
        sendNext();
    }

    function copyRoomCode() {
        navigator.clipboard.writeText(currentRoom);
        const el = document.getElementById('roomDisplay');
        const orig = el.innerText;
        el.innerText = 'کپی شد!';
        setTimeout(() => el.innerText = orig, 1500);
    }

    function joinManual() {
        const code = document.getElementById('manualCodeInput').value.trim();
        if (code.length >= 3) {
            location.hash = code;
            location.reload(); 
        } else {
            alert('لطفاً کد معتبر وارد کنید.');
        }
    }

    window.onload = init;
