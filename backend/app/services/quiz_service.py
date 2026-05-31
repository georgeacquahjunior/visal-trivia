from datetime import UTC, datetime
from random import shuffle

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models import Player, Question, QuizSession, Score
from app.schemas.question import QuizQuestion
from app.schemas.quiz import AnswerResult


def start_quiz(db: Session, player_name: str, category_id: int | None, limit: int) -> tuple[QuizSession, list[QuizQuestion]]:
    player = Player(name=player_name.strip())
    db.add(player)
    db.flush()

    statement = select(Question).options(joinedload(Question.category)).where(Question.is_active.is_(True))
    if category_id:
        statement = statement.where(Question.category_id == category_id)
    statement = statement.order_by(func.random()).limit(limit)

    questions = list(db.scalars(statement))
    if not questions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active questions found")

    session = QuizSession(
        player_id=player.id,
        category_id=category_id,
        total_questions=len(questions),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    public_questions = []
    for question in questions:
        options = list(question.options)
        shuffle(options)
        public_questions.append(
            QuizQuestion(
                id=question.id,
                category=question.category.name,
                prompt=question.prompt,
                options=options,
                time_limit_seconds=question.time_limit_seconds,
            )
        )
    return session, public_questions


def submit_quiz(db: Session, session_id: int, answers: dict[int, str], completion_time_seconds: int) -> tuple[Score, list[AnswerResult]]:
    session = db.get(QuizSession, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz session not found")
    if session.score is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz session already submitted")

    question_ids = list(answers.keys())
    questions = list(db.scalars(select(Question).where(Question.id.in_(question_ids))))
    question_by_id = {question.id: question for question in questions}

    results: list[AnswerResult] = []
    score_value = 0
    for question_id, selected_answer in answers.items():
        question = question_by_id.get(question_id)
        if question is None:
            continue
        is_correct = selected_answer == question.correct_answer
        score_value += 1 if is_correct else 0
        results.append(
            AnswerResult(
                question_id=question_id,
                correct_answer=question.correct_answer,
                selected_answer=selected_answer,
                is_correct=is_correct,
            )
        )

    session.completed_at = datetime.now(UTC)
    score = Score(
        player_id=session.player_id,
        session_id=session.id,
        score=score_value,
        total_questions=session.total_questions,
        completion_time_seconds=completion_time_seconds,
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    return score, results
