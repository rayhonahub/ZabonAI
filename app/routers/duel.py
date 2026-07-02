from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps import get_db
from app import models
import asyncio, random, uuid
from datetime import datetime

router = APIRouter(prefix="/duel", tags=["Duel"])

# In-memory room storage
rooms = {}

WIN_REWARD = {"coins": 30, "xp": 20}
TIE_REWARD = {"coins": 10, "xp": 10}


def get_random_questions(db: Session, count: int = 5):
    questions = db.query(models.QuizQuestion).limit(100).all()
    if not questions:
        return []
    selected = random.sample(questions, min(count, len(questions)))
    return [
        {
            "id": q.id,
            "question": q.question,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c or "",
            "option_d": q.option_d or "",
            "correct_answer": q.correct_answer,
        }
        for q in selected
    ]


@router.post("/create")
def create_room(db: Session = Depends(get_db)):
    room_id = str(uuid.uuid4())[:8].upper()
    questions = get_random_questions(db, 5)
    rooms[room_id] = {
        "players": [],
        "player_names": {},
        "player_ids": [],
        "questions": questions,
        "scores": {},
        "current_question": 0,
        "answers_this_round": {},
        "status": "waiting",
        "created_at": datetime.utcnow().isoformat(),
    }
    return {"room_id": room_id, "total_questions": len(questions)}


@router.get("/rooms")
def list_rooms():
    available = []
    for rid, data in rooms.items():
        if len(data["players"]) < 2 and data["status"] == "waiting":
            available.append({
                "room_id": rid,
                "players": len(data["players"]),
                "created_at": data.get("created_at", ""),
            })
    return available


@router.get("/room/{room_id}")
def get_room(room_id: str):
    if room_id not in rooms:
        raise HTTPException(404, "Хона ёфт нашуд")
    room = rooms[room_id]
    return {
        "room_id": room_id,
        "player_count": len(room["players"]),
        "status": room["status"],
        "total_questions": len(room["questions"]),
    }


async def broadcast(room_id: str, message: dict):
    if room_id not in rooms:
        return
    dead = []
    for ws in rooms[room_id]["players"]:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in rooms[room_id]["players"]:
            rooms[room_id]["players"].remove(ws)


async def send_question(room_id: str):
    room = rooms[room_id]
    idx = room["current_question"]
    if idx >= len(room["questions"]):
        return
    q = room["questions"][idx]
    await broadcast(room_id, {
        "type": "question",
        "question_number": idx + 1,
        "total": len(room["questions"]),
        "id": q["id"],
        "question": q["question"],
        "option_a": q["option_a"],
        "option_b": q["option_b"],
        "option_c": q["option_c"],
        "option_d": q["option_d"],
    })


def _award(db: Session, user_id: str, coins: int, xp: int):
    try:
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        if user:
            user.coins = (user.coins or 0) + coins
            user.xp_points = (user.xp_points or 0) + xp
            db.commit()
    except Exception:
        db.rollback()


async def end_duel(room_id: str, db: Session):
    if room_id not in rooms:
        return
    room = rooms[room_id]
    room["status"] = "finished"
    scores = room["scores"]
    names = room["player_names"]

    if not scores:
        return

    max_score = max(scores.values())
    winners = [pid for pid, s in scores.items() if s == max_score]
    is_tie = len(winners) > 1

    winner_id = winners[0] if not is_tie else None
    winner_name = names.get(winner_id, "") if winner_id else ""

    if is_tie:
        for pid in winners:
            _award(db, pid, TIE_REWARD["coins"], TIE_REWARD["xp"])
        reward = TIE_REWARD
    else:
        _award(db, winner_id, WIN_REWARD["coins"], WIN_REWARD["xp"])
        reward = WIN_REWARD

    result = {
        "type": "duel_end",
        "scores": scores,
        "player_names": names,
        "winner_id": winner_id,
        "winner_name": winner_name,
        "is_tie": is_tie,
        "reward": reward,
    }
    await broadcast(room_id, result)

    await asyncio.sleep(5)
    if room_id in rooms:
        del rooms[room_id]


@router.websocket("/ws/{room_id}/{user_id}/{user_name}")
async def duel_ws(
    websocket: WebSocket,
    room_id: str,
    user_id: str,
    user_name: str,
    db: Session = Depends(get_db),
):
    await websocket.accept()

    if room_id not in rooms:
        await websocket.send_json({"type": "error", "message": "Хона ёфт нашуд"})
        await websocket.close()
        return

    room = rooms[room_id]

    if len(room["players"]) >= 2:
        await websocket.send_json({"type": "error", "message": "Хона пур аст"})
        await websocket.close()
        return

    room["players"].append(websocket)
    room["player_names"][user_id] = user_name
    room["scores"][user_id] = 0
    if user_id not in room["player_ids"]:
        room["player_ids"].append(user_id)

    player_count = len(room["players"])

    await websocket.send_json({
        "type": "joined",
        "room_id": room_id,
        "player_count": player_count,
        "your_id": user_id,
        "your_name": user_name,
    })

    if player_count == 2:
        room["status"] = "playing"
        await broadcast(room_id, {
            "type": "duel_start",
            "players": room["player_names"],
            "total_questions": len(room["questions"]),
            "message": "Бозӣ оғоз шуд!",
        })
        await asyncio.sleep(1.5)
        await send_question(room_id)
    else:
        await websocket.send_json({
            "type": "waiting",
            "message": "Мунтазири рақиб...",
        })

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=60.0)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
                continue

            if room_id not in rooms:
                break

            room = rooms[room_id]

            if data.get("type") == "answer":
                if user_id in room["answers_this_round"]:
                    continue  # Already answered

                q_idx = room["current_question"]
                if q_idx >= len(room["questions"]):
                    continue

                question = room["questions"][q_idx]
                user_answer = str(data.get("answer", "")).strip().lower()
                correct = question["correct_answer"].strip().lower()
                is_correct = user_answer == correct

                if is_correct:
                    room["scores"][user_id] = room["scores"].get(user_id, 0) + 1

                room["answers_this_round"][user_id] = {
                    "answer": user_answer,
                    "correct": is_correct,
                    "name": user_name,
                }

                await broadcast(room_id, {
                    "type": "player_answered",
                    "player_id": user_id,
                    "player_name": user_name,
                    "correct": is_correct,
                    "scores": room["scores"],
                })

                if len(room["answers_this_round"]) >= len(room["players"]):
                    await asyncio.sleep(1.2)

                    await broadcast(room_id, {
                        "type": "round_result",
                        "correct_answer": correct,
                        "answers": room["answers_this_round"],
                        "scores": room["scores"],
                        "player_names": room["player_names"],
                    })

                    await asyncio.sleep(1.5)

                    room["current_question"] += 1
                    room["answers_this_round"] = {}

                    if room["current_question"] < len(room["questions"]):
                        await send_question(room_id)
                    else:
                        await end_duel(room_id, db)
                        break

    except WebSocketDisconnect:
        if room_id in rooms:
            room = rooms[room_id]
            if websocket in room["players"]:
                room["players"].remove(websocket)

            remaining_id = next(
                (pid for pid in room["player_ids"] if pid != user_id), None
            )
            if room["status"] == "playing" and remaining_id and remaining_id in room["player_names"]:
                _award(db, remaining_id, WIN_REWARD["coins"], WIN_REWARD["xp"])
                await broadcast(room_id, {
                    "type": "opponent_left",
                    "message": "Рақиб бозиро тарк кард. Шумо ғалаба кардед!",
                    "winner_id": remaining_id,
                    "winner_name": room["player_names"].get(remaining_id, ""),
                    "scores": room["scores"],
                    "player_names": room["player_names"],
                    "reward": WIN_REWARD,
                })

            await asyncio.sleep(3)
            if room_id in rooms:
                del rooms[room_id]
    except Exception:
        pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
