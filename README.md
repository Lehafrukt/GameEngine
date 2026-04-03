# GameEngine

Серверная часть игрового движка на TypeScript.

**NestJS** (REST API, Auth, WebSocket Gateway) + **Colyseus** (game state sync) + **miniplex** (ECS) + **MongoDB** (persistence) + **Redis** (in-memory cache).

## Архитектура

```text
src/
  main.ts                            # Точка входа — запускает NestJS + Colyseus
  
  api/                               # NestJS — REST API и WebSocket Gateway
    app.module.ts                    # Корневой модуль (Mongoose, Auth, Gateway)
    auth/
      auth.module.ts                 # JWT + Passport модуль
      auth.service.ts                # Регистрация / логин (bcrypt)
      auth.controller.ts             # POST /auth/register, /auth/login, GET /auth/profile
      jwt.strategy.ts                # Passport JWT стратегия
    gateway/
      app.gateway.ts                 # Socket.IO Gateway (чат, лобби, уведомления)
      gateway.module.ts
    models/
      schemas.ts                     # Mongoose модели: User, PlayerSave
    services/
      redis.service.ts               # In-Memory кеш (ioredis)
      player.service.ts              # In-Memory First: Redis → MongoDB
  
  game/                              # Colyseus + miniplex ECS
    rooms/
      game.room.ts                   # Colyseus Room (join/leave, message handlers, NPC spawn)
    systems/
      game-loop.ts                   # Оркестратор ECS систем (AI → Combat → Movement → Sync)
      movement.system.ts             # Обновление позиций по velocity
      npc-ai.system.ts               # FSM: idle → wander → chase → attack → return_home
      combat.system.ts               # Расчёт урона
      sync.system.ts                 # ECS World → Colyseus Schema (delta-sync клиентам)
    components/
      schemas.ts                     # Colyseus Schema (PlayerSchema, NpcSchema, GameRoomState)
      entity.ts                      # ECS Entity (Transform, Health, Npc, Player, Combat)
  
  shared/
    types.ts                         # Общие типы для фронтенда и бэкенда
```

### Как это работает

| Слой     | Порт    | Назначение                                       |
|----------|---------|--------------------------------------------------|
| NestJS   | `:3000` | REST API (auth), Socket.IO gateway (чат, лобби)  |
| Colyseus | `:2567` | Game state sync (комнаты, delta-сериализация)    |

- **ECS (miniplex)** — авторитарное серверное состояние
- **Colyseus Schema** — delta-сжатая проекция ECS для клиентов
- **In-Memory First** — game loop пишет в Redis, `PlayerService` периодически сбрасывает в MongoDB
- **Game Loop** (20 Hz): AI → Combat → Movement → Sync

## Требования

- **Node.js** >= 18
- **MongoDB** — запущен на `localhost:27017`
- **Redis** — запущен на `localhost:6379`

### Установка MongoDB и Redis (Ubuntu/Debian)

```bash
# MongoDB
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# Redis
sudo apt install -y redis-server
sudo systemctl enable --now redis-server
```

### Установка MongoDB

```bash
sudo apt-get install gnupg curl
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
  --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
 | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt upgrade
sudo apt update && sudo apt upgrade
sudo apt install mongodb-org-tools
```

## Установка

```bash
npm install
```

Скопируйте `.env.example` в `.env` и при необходимости измените значения:

```bash
cp .env.example .env
```

## Команды

| Команда | Описание |
| --------- | ---------- |
| `npm run dev` | Запуск в режиме разработки (ts-node-dev, hot reload) |
| `npm run build` | Компиляция TypeScript → `dist/` |
| `npm start` | Запуск скомпилированной версии (`dist/main.js`) |

### Разработка

```bash
npm run dev
```

Сервер запустится на двух портах:

- API: `http://localhost:3000`
- Game: `ws://localhost:2567`

### Продакшен

```bash
npm run build
npm start
```

## API Endpoints

| Метод | Путь | Описание | Auth |
| ------- | ------ | ---------- | ------ |
| POST | `/auth/register` | Регистрация `{ username, password, email }` | — |
| POST | `/auth/login` | Логин `{ username, password }` → JWT token | — |
| GET | `/auth/profile` | Данные текущего пользователя | Bearer token |

## Переменные окружения

| Переменная | По умолчанию | Описание |
| ------------ | ------------- | ---------- |
| `MONGO_URI` | `mongodb://localhost:27017/game-engine` | MongoDB connection string |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_SECRET` | `change-me-in-production` | Секрет для JWT токенов |
| `API_PORT` | `3000` | Порт NestJS API |
| `GAME_PORT` | `2567` | Порт Colyseus |
| `GAME_TICK_RATE` | `20` | Частота game loop (Hz) |
