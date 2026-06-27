from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, run_migrations
from app.routers import auth, courses, quiz, progress, ai, profile


Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(
    title="ZaboniAI",
    description="AI-powered English learning platform for Tajik speakers",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(quiz.router)
app.include_router(progress.router)
app.include_router(ai.router)
app.include_router(profile.router)


@app.get("/")
def root():
    return {"message": "ZaboniAI API is running 🚀"}