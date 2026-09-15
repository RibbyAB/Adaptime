# ADAPTIME

**Adaptive Energy-Based Smart Scheduling** — a web application that helps users organize tasks and automatically build a study/work schedule based on deadlines, task difficulty, available time, and personal energy levels.

ADAPTIME is designed to make planning more realistic. Instead of only placing tasks into empty time slots, the scheduler considers when the user has more energy and adjusts the schedule when tasks, fixed activities, or availability change.

---
🌐 **Live Demo:** https://adaptime-df1f2.web.app

## Key Features

- **Smart Task Scheduling** — automatically schedules tasks based on deadline, estimated duration, difficulty, and time preference.
- **Energy-Based Planning** — users can define their energy level for morning, afternoon, evening, and night.
- **Automatic Rescheduling** — the schedule is recalculated when tasks, fixed schedules, or energy settings change.
- **Task Management** — create, edit, track, and delete tasks with different statuses and priorities.
- **Fixed Schedule Management** — add recurring activities such as classes, meetings, or other commitments.
- **Calendar View** — view scheduled work sessions in a calendar-style layout.
- **Catch-Up Sessions** — unfinished past sessions can be moved to the next available time slot.
- **Work Capacity Control** — set a daily work-hour limit to prevent overloaded schedules.
- **Analytics & Insights** — monitor task and productivity information from the analytics page.
- **Authentication** — supports email/password and Google sign-in through Firebase Authentication.
- **Cloud Data Storage** — user tasks, schedules, preferences, and sessions are stored using Cloud Firestore.

---

## How It Works

1. The user adds tasks with information such as **deadline, estimated hours, difficulty, and preferred time**.
2. The user adds **fixed schedules** such as classes or meetings.
3. Energy levels are configured for different parts of the day: **morning, afternoon, evening, and night**.
4. ADAPTIME checks available time slots and daily work capacity.
5. The scheduling algorithm distributes task sessions into suitable slots while considering deadlines and energy levels.
6. When important task or schedule information changes, ADAPTIME automatically generates an updated schedule.
7. Completed sessions, notes, and checklists are preserved while the remaining work is reorganized.

---

## Tech Stack

| Technology | Usage |
|---|---|
| **React 18** | Frontend user interface |
| **JavaScript** | Application and scheduling logic |
| **CSS** | Styling and responsive interface |
| **Firebase Authentication** | Email/password and Google authentication |
| **Cloud Firestore** | User data and schedule storage |
| **Firebase Hosting** | Web application deployment |
| **GitHub Actions** | Automatic deployment workflow |

---

## Project Structure

```text
Adaptime-main/
├── .github/
│   └── workflows/
│       └── deploy.yaml
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth.jsx
│   │   ├── Badge.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── SchedModal.jsx
│   │   ├── SessionCard.jsx
│   │   ├── Sidebar.jsx
│   │   ├── TaskCard.jsx
│   │   ├── TaskModal.jsx
│   │   └── Toast.jsx
│   ├── data/
│   │   └── seed.js
│   ├── hooks/
│   │   └── useFirestore.js
│   ├── pages/
│   │   ├── Analytics.jsx
│   │   ├── CalendarView.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Energy.jsx
│   │   ├── Profile.jsx
│   │   ├── Schedule.jsx
│   │   └── Tasks.jsx
│   ├── utils/
│   │   ├── helpers.js
│   │   └── scheduler.js
│   ├── App.jsx
│   ├── firebase.js
│   ├── index.css
│   └── index.js
├── firebase.json
├── package.json
└── README.md
```

---

## Prerequisites

Make sure the following software is installed:

| Software | Recommended Version | Check with |
|---|---:|---|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |

A Firebase project is also required if you want to use your own authentication and database configuration.

---

## Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Adaptime-main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

The application uses Firebase Authentication and Cloud Firestore. Configure your Firebase project in:

```text
src/firebase.js
```

Enable the authentication methods you want to use in Firebase, including:

- Email/Password
- Google Sign-In

Also create a Cloud Firestore database for application data.

### 4. Start the Development Server

```bash
npm start
```

Open:

```text
http://localhost:3000
```

The page automatically reloads when you make changes to the source code.

---

## Production Build

Create an optimized production build with:

```bash
npm run build
```

The compiled application will be generated inside the `build/` directory.

---

## Firebase Deployment

The project includes Firebase Hosting configuration and a GitHub Actions deployment workflow.

To deploy manually:

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

The GitHub Actions workflow in `.github/workflows/deploy.yaml` can also automatically build and deploy the application when changes are pushed to the `main` branch. A valid `FIREBASE_TOKEN` must be configured in the repository secrets for the included workflow.

---

## Main Scheduling Parameters

The scheduling logic is located in:

```text
src/utils/scheduler.js
```

ADAPTIME divides the day into four scheduling periods:

| Period | Time |
|---|---|
| Morning | 06:00 – 12:00 |
| Afternoon | 12:00 – 17:00 |
| Evening | 17:00 – 20:00 |
| Night | 20:00 – 24:00 |

The scheduler considers factors including:

- Task deadline
- Estimated task duration
- Task difficulty
- Preferred working time
- User energy level
- Fixed schedules
- Existing work sessions
- Daily work capacity
- Overdue task priority
- Break/buffer time between sessions

---

## Available Pages

| Page | Description |
|---|---|
| **Dashboard** | Overview of tasks, schedules, and upcoming work |
| **Tasks** | Create and manage tasks |
| **Schedule** | Manage fixed weekly activities |
| **Calendar** | View generated sessions by date |
| **Energy** | Configure energy levels and work capacity |
| **Analytics** | View productivity information and insights |
| **Profile** | Manage account and scheduling preferences |

---

## Notes

- Scheduling is generated for a limited look-ahead period and can be recalculated as user data changes.
- Tasks that cannot fit into the available time before their deadlines may be marked as infeasible.
- The application can prioritize overdue or current tasks according to the user's scheduling preference.
- Firebase configuration should be replaced with your own project configuration when reusing or deploying the application independently.

---

## Future Improvements

Possible improvements for future development include smarter scheduling recommendations, richer productivity analytics, notification reminders, cross-device calendar integration, and additional personalization based on user activity patterns.

---

## License

This project was developed for educational and portfolio purposes.
