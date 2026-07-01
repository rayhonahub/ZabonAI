from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.deps import get_db
from app import models
import json, asyncio, random, uuid

router = APIRouter(prefix="/duel", tags=["Duel"])

# In-memory room manager
rooms = {}  # room_id: {players, player_names, questions, scores, ...}


def generate_duel_questions(db: Session):
    questions = db.query(models.QuizQuestion).limit(100).all()
    selected = random.sample(questions, min(10, len(questions)))
    return [
        {
            "id": q.id,
            "question": q.question,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_answer": q.correct_answer,
        }
        for q in selected
    ]


@router.get("/rooms")
def get_available_rooms():
    return [
        {"room_id": rid, "players": len(data["players"])}
        for rid, data in rooms.items()
        if len(data["players"]) < 2
    ]


@router.post("/create")
def create_room(db: Session = Depends(get_db)):
    room_id = str(uuid.uuid4())[:8].upper()
    questions = generate_duel_questions(db)
    rooms[room_id] = {
        "players": [],
        "player_names": {},
        "questions": questions,
        "scores": {},
        "current_question": 0,
        "answers_this_round": {},
        "status": "waiting",
    }
    return {"room_id": room_id}


@router.websocket("/ws/{room_id}/{user_id}/{user_name}")
async def duel_websocket(
    websocket: WebSocket,
    room_id: str,
    user_id: int,
    user_name: str,
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
    room["player_names"][str(user_id)] = user_name
    room["scores"][str(user_id)] = 0

    player_count = len(room["players"])
    await websocket.send_json({
        "type": "joined",
        "room_id": room_id,
        "player_count": player_count,
        "your_id": str(user_id),
    })

    if player_count == 2:
        room["status"] = "playing"
        start_msg = {
            "type": "duel_start",
            "players": room["player_names"],
            "total_questions": len(room["questions"]),
        }
        for ws in room["players"]:
            await ws.send_json(start_msg)
        await asyncio.sleep(2)
        await send_question(room, 0)
    else:
        await websocket.send_json({"type": "waiting", "message": "Мунтазири рақиб..."})

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "answer":
                q_idx = room["current_question"]
                if q_idx >= len(room["questions"]):
                    continue

                question = room["questions"][q_idx]
                is_correct = data["answer"].lower() == question["correct_answer"].lower()

                if is_correct:
                    room["scores"][str(user_id)] += 1

                room["answers_this_round"][str(user_id)] = {
                    "answer": data["answer"],
                    "correct": is_correct,
                    "name": user_name,
                }

                for ws in room["players"]:
                    await ws.send_json({
                        "type": "player_answered",
                        "player_id": str(user_id),
                        "player_name": user_name,
                        "correct": is_correct,
                    })

                if len(room["answers_this_round"]) == len(room["players"]):
                    await asyncio.sleep(1.5)
                    room["current_question"] += 1
                    room["answers_this_round"] = {}

                    if room["current_question"] < len(room["questions"]):
                        await send_question(room, room["current_question"])
                    else:
                        scores = room["scores"]
                        winner_id = max(scores, key=scores.get)
                        winner_name = room["player_names"].get(winner_id, "Номаълум")
                        end_msg = {
                            "type": "duel_end",
                            "scores": scores,
                            "player_names": room["player_names"],
                            "winner_id": winner_id,
                            "winner_name": winner_name,
                        }
                        for ws in room["players"]:
                            await ws.send_json(end_msg)
                        if room_id in rooms:
                            del rooms[room_id]

    except WebSocketDisconnect:
        if websocket in room["players"]:
            room["players"].remove(websocket)
        for ws in room["players"]:
            try:
                await ws.send_json({
                    "type": "opponent_left",
                    "message": "Рақиб бозиро тарк кард",
                })
            except Exception:
                pass
        if not room["players"] and room_id in rooms:
            del rooms[room_id]


async def send_question(room, idx):
    q = room["questions"][idx]
    msg = {
        "type": "question",
        "question_number": idx + 1,
        "total": len(room["questions"]),
        **q,
    }
    for ws in room["players"]:
        await ws.send_json(msg)
