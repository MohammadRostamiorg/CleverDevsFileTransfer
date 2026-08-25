# WebRTC P2P File Transfer ⚡

[فارسی (Persian) ](#توضیحات-فارسی) | [English](#english-description)

---

## English Description

A lightweight, blazing-fast, and secure peer-to-peer (P2P) file transfer application built with **WebRTC** and **Node.js**. 

This project allows two devices to connect directly via a shared room code and transfer files of any size without ever storing them on a central server. The Node.js backend solely acts as a Signaling Server (via WebSockets) to help peers discover each other.

### ✨ Features
*   **True P2P Architecture:** Files travel directly between browsers via WebRTC Data Channels.
*   **End-to-End Encrypted:** Built-in WebRTC security ensures your data cannot be intercepted.
*   **Zero Server Storage:** Files never touch the backend/VPS; complete privacy.
*   **Smart Memory Management:** Handles multi-gigabyte files gracefully by slicing them into `16KB` chunks and monitoring channel buffer limits (`bufferedAmountLowThreshold`).
*   **NAT Traversal:** Full support for custom STUN and TURN (Coturn) servers for complex networks.
*   **No Databases Required:** Rooms and signaling states are stored purely in RAM for maximum speed.

### 🛠️ Tech Stack
*   **Frontend:** Vanilla JavaScript, HTML5, CSS3
*   **Backend Signaling:** Node.js, `ws` (WebSocket), `dotenv`
*   **Network Protocols:** WebRTC, ICE, STUN/TURN

### 📁 Project Structure
```text
/
├── .env.example       # Example environment variables
├── .gitignore
├── package.json
├── server.js          # Signaling server logic
└── public/            # Frontend assets
    ├── index.html     
    ├── style.css      
    └── script.js      # WebRTC & WebSocket client logic

```

### 🚀 Getting Started (Local Development)

1. **Clone the repository:**
```bash
git clone [https://github.com/mohammadrostamiorg/CleverDevsFileTransfer.git](https://github.com/mohammadrostamiorg/cleverdevsfiletransfer.git)
cd CleverDevsFileTransfer

```


2. **Install dependencies:**
```bash
npm install

```


3. **Configure Environment Variables:**
Create a `.env` file in the root directory based on `.env.example`:
```env
TURN_SECRET=your_coturn_secret_key
PORT=8080
```


4. **Start the server:**
```bash
npm start
# The signaling server will run on http://localhost:8080

```



---

##  توضیحات فارسی

یک اپلیکیشن سبک، فوق‌العاده سریع و امن برای انتقال فایل به‌صورت نظیربه‌نظیر (P2P) که با **WebRTC** و **Node.js** توسعه داده شده است.

این پروژه به دو دستگاه اجازه می‌دهد از طریق یک کدِ اتاق مشترک به هم متصل شوند و فایل‌هایی با هر حجمی را بدون نیاز به آپلود در سرورهای واسطه جابه‌جا کنند. سرور بک‌اند (نودجی‌اس) در این معماری تنها نقش یک «مرکز تماس» (Signaling) را بازی می‌کند تا دستگاه‌ها آدرس شبکه‌ای یکدیگر را پیدا کنند.

### ✨ ویژگی‌های کلیدی

* **معماری کاملاً P2P:** انتقال مستقیم فایل بین دو مرورگر از طریق تونل WebRTC Data Channel.
* **رمزنگاری End-to-End:** امنیت ذاتی WebRTC تضمین می‌کند که داده‌ها در مسیر قابل شنود نیستند.
* **حفظ کامل حریم خصوصی:** هیچ فایلی روی سرور یا دیتابیس ذخیره نمی‌شود.
* **مدیریت هوشمند حافظه (RAM):** قابلیت انتقال فایل‌های چند گیگابایتی با تکه‌تکه کردن آن‌ها به قطعات `16 کیلوبایتی` و کنترل ترافیک لوله ارتباطی (`Buffer Management`).
* **عبور از فایروال (NAT Traversal):** پشتیبانی کامل از سرورهای اختصاصی STUN و TURN (مانند Coturn).
* **بدون نیاز به دیتابیس:** مدیریت اتاق‌ها تماماً روی RAM سرور انجام می‌شود تا سرعت به حداکثر برسد.

### 🛠️ تکنولوژی‌های استفاده شده

* **فرانت‌اند:** جاوااسکریپت خام (Vanilla JS)، HTML5 و CSS3
* **بک‌اند (سیگنالینگ):** Node.js، کتابخانه `ws` (وب‌سوکت)
* **پروتکل‌ها:** WebRTC, ICE, STUN/TURN

### 🚀 راه‌اندازی پروژه (روی سیستم شخصی)

۱. **دریافت کدها:**

```bash
git clone [https://github.com/MohammadRostamiOrg/CleverDevsFileTransfer.git](https://github.com/MohammadRostamiOrg/CleverDevsFileTransfer.git)
cd CleverDevsFileTransfer

```

۲. **نصب پیش‌نیازها:**

```bash
npm install

```

۳. **تنظیم متغیرهای محیطی:**
یک فایل با نام `.env` در روت پروژه بسازید و مقادیر زیر را در آن قرار دهید:

```env
PORT=8080
TURN_SECRET=رمز_سرور_ترن_شما

```

۴. **اجرای سرور:**

```bash
npm start
# سرور سیگنالینگ روی پورت 8080 اجرا خواهد شد

```

---

**Developed with ❤️ by [CleverDevs**](https://t.me/CleverDevs)
