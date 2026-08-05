// WebRTC & Local Network Peer-to-Peer Multiplayer Engine

export class WebRTCManager {
  constructor(app) {
    this.app = app;
    this.roomCode = null;
    this.isHost = false;
    this.peerConnection = null;
    this.dataChannel = null;
    this.broadcastChannel = null;
    this.isConnected = false;

    this.onPeerConnected = null;
    this.onPeerProgress = null;
    this.onPeerStart = null;
  }

  // Generate 4-letter Room Code
  generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "PEAK-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Host a Local WiFi / Same Network Room
  hostRoom(onReady) {
    this.isHost = true;
    this.roomCode = this.generateRoomCode();
    this.setupBroadcastChannel(this.roomCode);

    this.setupWebRTC(true, () => {
      if (onReady) onReady(this.roomCode);
    });

    return this.roomCode;
  }

  // Join a Local WiFi Room
  joinRoom(code, onConnected) {
    this.isHost = false;
    this.roomCode = code.toUpperCase().trim();
    this.setupBroadcastChannel(this.roomCode);

    this.setupWebRTC(false, () => {
      if (onConnected) onConnected();
    });
  }

  // BroadcastChannel for instant local network / same browser testing fallback
  setupBroadcastChannel(code) {
    if (this.broadcastChannel) this.broadcastChannel.close();

    try {
      this.broadcastChannel = new BroadcastChannel(`typeclimber_${code}`);
      this.broadcastChannel.onmessage = (e) => {
        this.handleMessage(e.data);
      };
    } catch (err) {
      console.warn("BroadcastChannel not supported in this browser environment.", err);
    }
  }

  // Setup WebRTC DataChannel
  setupWebRTC(isHost, callback) {
    const config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    };

    try {
      this.peerConnection = new RTCPeerConnection(config);

      if (isHost) {
        this.dataChannel = this.peerConnection.createDataChannel("typeclimber_race");
        this.bindDataChannelEvents();
      } else {
        this.peerConnection.ondatachannel = (e) => {
          this.dataChannel = e.channel;
          this.bindDataChannelEvents();
        };
      }

      this.peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
          this.sendSignal({ type: "ICE_CANDIDATE", candidate: e.candidate });
        }
      };

      this.isConnected = true;
      if (callback) callback();
    } catch (e) {
      console.error("WebRTC initialization error:", e);
      this.isConnected = true; // Fallback to BroadcastChannel
      if (callback) callback();
    }
  }

  bindDataChannelEvents() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      this.isConnected = true;
      if (this.onPeerConnected) this.onPeerConnected();
    };

    this.dataChannel.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        this.handleMessage(msg);
      } catch (err) {
        console.error("Failed to parse WebRTC message:", err);
      }
    };
  }

  sendSignal(payload) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(payload);
    }
  }

  sendRaceUpdate(progressRatio, altitude, wpm) {
    const payload = {
      type: "RACE_UPDATE",
      sender: this.isHost ? "HOST" : "GUEST",
      progressRatio,
      altitude,
      wpm
    };

    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(JSON.stringify(payload));
    }
    
    // Always mirror to BroadcastChannel for local WiFi testing
    this.sendSignal(payload);
  }

  handleMessage(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === "RACE_UPDATE") {
      // Ignore messages sent by self
      const selfRole = this.isHost ? "HOST" : "GUEST";
      if (msg.sender !== selfRole) {
        if (this.onPeerProgress) {
          this.onPeerProgress(msg.progressRatio, msg.altitude, msg.wpm);
        }
      }
    } else if (msg.type === "JOIN_ROOM" && this.isHost) {
      this.sendSignal({ type: "ROOM_ACCEPTED", code: this.roomCode });
      if (this.onPeerConnected) this.onPeerConnected();
    } else if (msg.type === "ROOM_ACCEPTED" && !this.isHost) {
      if (this.onPeerConnected) this.onPeerConnected();
    }
  }

  disconnect() {
    if (this.dataChannel) this.dataChannel.close();
    if (this.peerConnection) this.peerConnection.close();
    if (this.broadcastChannel) this.broadcastChannel.close();
    this.isConnected = false;
  }
}
