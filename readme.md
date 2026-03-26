# ⚡ NexusPulse — Real-Time Notification System

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black.svg)](https://socket.io/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A production-grade real-time notification system with WebSocket support, featuring multiple notification types, room-based messaging, live user tracking, and a stunning interactive globe background.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Method Choice: WebSockets vs SSE](#method-choice-websockets-vs-sse)
- [Real-Time Communication Flow](#real-time-communication-flow)
- [API Overview](#api-overview)
- [WebSocket Events](#websocket-events)
- [Testing](#testing)
- [Deployment](#deployment)
- [Potential Improvements](#potential-improvements)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## 🎯 Project Overview

**NexusPulse** is a full-stack real-time notification system that enables instant server-to-client updates without page refresh. Built with **Node.js + Socket.IO** backend and **React** frontend, it demonstrates production-ready real-time communication patterns.

### Core Requirements Met

| Requirement | Status | Implementation |
|------------|--------|----------------|
| ✅ Establish WebSocket Connection | Complete | Socket.IO with auto-reconnection |
| ✅ Auto Notifications Every 10s | Complete | Scheduler with weighted message pool |
| ✅ Client Display (Toast/UI) | Complete | react-hot-toast + notification feed |
| ✅ Connection Tracking | Complete | Map-based tracking with stats |
| ✅ Disconnect Handling | Complete | Clean removal + count updates |
| ✅ Reconnection Support | Complete | Socket.IO built-in with exponential backoff |

---

## ✨ Features

### Core Features
- 🔌 **Real-time WebSocket Connection** - Instant bidirectional communication
- 📢 **Auto Notifications** - Server sends notifications every 10 seconds
- 👥 **Live User Count** - Real-time active client tracking
- 🔄 **Auto-Reconnection** - Seamless reconnection with exponential backoff

### Notification Types
- 📢 **Broadcast** - Send to all connected clients
- 🎯 **Targeted** - Send to specific user by ID
- 👥 **Group/Room** - Send to specific rooms (general, custom rooms)
- ⏰ **Scheduled** - Delay delivery (1ms - 24 hours)
- ⚡ **Event-Triggered** - Quick triggers (user_joined, alert, deploy, backup)

### Visual Styling
- 🔵 **Info** - Blue (#3b82f6) - General information
- 🟢 **Success** - Green (#10b981) - Success confirmations
- 🟡 **Warning** - Yellow (#f59e0b) - Caution alerts
- 🔴 **Error** - Red (#ef4444) - Error messages

### Dashboard Features
- 📊 **Live Stats** - Active users, total notifications, server uptime, active rooms
- 📝 **Notification History** - Last 50 notifications with type filtering
- 👤 **Connected Users List** - See all active clients with timestamps
- 🏠 **Room Management** - Create, join, leave rooms with member counts
- 🎨 **Vanta.js Globe** - Interactive 3D background

### Security
- 🔒 **XSS Protection** - HTML entity encoding, script tag removal
- 📏 **Message Length Limit** - Max 200 characters, auto-truncation
- 🛡️ **Input Sanitization** - All user inputs sanitized
- ✅ **Room Validation** - Existence check before operations

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | JavaScript runtime |
| Express | 4.18.2 | Web framework |
| Socket.IO | 4.5.4 | WebSocket server |
| UUID | 9.0.0 | Unique ID generation |
| Winston | 3.8.2 | Structured logging |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| Socket.IO Client | 4.5.4 | WebSocket client |
| Axios | 1.4.0 | HTTP client |
| react-hot-toast | 2.4.0 | Toast notifications |
| Lucide React | 0.263.1 | Icon library |
| date-fns | 2.30.0 | Date formatting |
| Vanta.js | 0.5.24 | 3D globe background |
| Three.js | r134 | 3D graphics |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v14 or higher
- npm v6 or higher
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Sanskar225/notification_dashboard-
# Install backend dependencies
cd backend
npm i
npm run dev

# Install frontend dependencies
cd ../frontend
npm i
npm run dev

🏗 Architecture
text
┌─────────────────────────────────────────────────────────────────┐
│                      Client (React App)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Dashboard │ │SendPanel │ │Feed      │ │RoomsPanel│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│         ↓           ↓           ↓           ↓                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │           useSocket.js (Socket.IO Client)        │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ WebSocket (ws://)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Socket.IO Server                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Socket Handler                         │  │
│  │  • Connection management  • Room management              │  │
│  │  • Event routing          • Error handling               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬───────────────────┐
        ▼                 ▼                 ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Connection   │  │ Notification │  │ Room         │  │   Logger     │
│ Manager      │  │ Service      │  │ Manager      │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
🔌 Method Choice: WebSockets vs SSE
Why WebSockets (Socket.IO) Over Server-Sent Events (SSE)
Aspect	WebSockets (Socket.IO)	Server-Sent Events (SSE)
Direction	Bidirectional (client ↔ server)	Unidirectional (server → client only)
Protocol	ws:// / wss://	HTTP
Reconnection	✅ Built-in with exponential backoff	❌ Manual implementation needed
Rooms/Groups	✅ Native support	❌ Not supported
Message Types	Text, binary, custom events	Text only
Fallback	✅ Long-polling when WebSocket blocked	❌ No fallback
Use Cases	Chat, notifications, live dashboards	News feeds, stock tickers
Key Reasons for WebSocket Choice
Bidirectional Communication Required - Users need to send notifications, not just receive

Room-Based Pub/Sub - Group notifications require native room support

Built-in Reconnection - Critical for production reliability

Event-Based Architecture - Clean, organized event handling

Fallback Transports - Works even when WebSocket is blocked

🔄 Real-Time Communication Flow
Connection Lifecycle
text
1. Client connects via Socket.IO
   ↓
2. Server generates unique USER_id
   ↓
3. Client auto-joins "general" room
   ↓
4. Server sends 'welcome' event
   ↓
5. Server broadcasts 'clients-update' to all users
Auto-Notification Flow (Every 10 Seconds)
text
Timer triggers every 10 seconds
   ↓
Server checks active clients
   ↓
If clients > 0:
   ├─ Select random message from weighted pool
   ├─ Create notification with metadata
   ├─ Broadcast via io.emit('notification')
   ├─ Log: "⏱ AUTO TRIGGER: timestamp"
   └─ All clients receive and show toast
Manual Notification Flow
text
User clicks "Send" button
   ↓
Frontend emits appropriate event
   ↓
Server validates and sanitizes message
   ↓
Server creates notification with metadata
   ↓
Server delivers via appropriate method
   ↓
Target clients receive 'notification' event
   ↓
Frontend shows toast and adds to history