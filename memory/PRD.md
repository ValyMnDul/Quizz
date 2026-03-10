# Quiz Criticismul Junimist - PRD

## Original Problem Statement
Crearea unui site simplu de quiz despre "Criticismul Junimist" unde participantul introduce un nume și este testat pe baza unui document despre Junimea și Titu Maiorescu.

## User Personas
- Elevi/Studenți care învață despre literatura română
- Profesori care vor să testeze cunoștințele elevilor

## Core Requirements
- 15 întrebări (mix ABCD + Adevărat/Fals)
- Timp limitat per întrebare
- Leaderboard în timp real după fiecare întrebare
- Dark/Light mode (default dark)
- Fără autentificare - doar introducere nume

## Architecture
- **Frontend**: React + Shadcn UI + TailwindCSS
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB (quiz_sessions collection)

## What's Implemented (January 2026)
- ✅ Pagina de start cu introducere nume
- ✅ Quiz cu 15 întrebări din documentul Criticismul Junimist
- ✅ Timer pentru fiecare întrebare
- ✅ Feedback vizual pentru răspunsuri corecte/incorecte
- ✅ Leaderboard live după fiecare întrebare
- ✅ Dark/Light mode toggle
- ✅ Pagina de rezultate finale
- ✅ Sistem de punctaj cu bonus pentru răspunsuri rapide

## API Endpoints
- GET /api/questions - Lista întrebărilor
- POST /api/quiz/start - Început sesiune
- POST /api/quiz/answer - Trimite răspuns
- GET /api/leaderboard - Clasament

## Prioritized Backlog
- P0: Complet implementat
- P1: Export rezultate, statistici detaliate
- P2: Categorii de întrebări, dificultate variabilă

## Next Tasks
- Adăugare mai multe întrebări
- Statistici pentru profesori
