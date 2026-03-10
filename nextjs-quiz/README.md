# Quiz Criticismul Junimist

Aplicatie de quiz despre societatea "Junimea" si Titu Maiorescu.

## Deploy pe Vercel

### 1. Setup MongoDB Atlas (gratuit)

1. Mergi la [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Creeaza un cont gratuit
3. Creeaza un cluster gratuit (M0)
4. In "Database Access" -> Add Database User (salveaza username si password)
5. In "Network Access" -> Add IP Address -> "Allow Access from Anywhere" (0.0.0.0/0)
6. In "Database" -> Connect -> "Connect your application" -> Copiaza connection string-ul

### 2. Deploy pe Vercel

1. Push codul pe GitHub
2. Mergi la [Vercel](https://vercel.com)
3. Import proiectul din GitHub
4. In "Environment Variables" adauga:
   - `MONGODB_URI` = connection string-ul de la MongoDB Atlas
   - Inlocuieste `<password>` cu parola ta
   
   Exemplu: `mongodb+srv://user:parola@cluster.mongodb.net/quiz_junimist?retryWrites=true&w=majority`

5. Click Deploy!

## Dezvoltare locala

```bash
cd nextjs-quiz
yarn install
yarn dev
```

Deschide http://localhost:3000

## Structura proiect

```
nextjs-quiz/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── questions/route.ts
│   │   │   ├── quiz/start/route.ts
│   │   │   ├── quiz/answer/route.ts
│   │   │   └── leaderboard/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/ui/
│   └── lib/
│       ├── mongodb.ts
│       ├── questions.ts
│       └── utils.ts
├── package.json
└── next.config.js
```
