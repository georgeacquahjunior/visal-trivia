import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload
from uuid import uuid4

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import require_google_admin
from app.models import Category, Player, PrizeCode, Question, QuizSession, QuizSetting, Score, UserLogin
from app.schemas.admin import AdminAnalytics, AdminQuestionImportResult, AdminUserLogin
from app.schemas.auth import AuthUser, GoogleAuthRequest, GoogleAuthResponse, NameAuthRequest
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.schemas.question import QuestionCreate, QuestionRead, QuestionUpdate
from app.schemas.prize_code import PrizeCodeClaimRequest, PrizeCodeCreate, PrizeCodeRead
from app.schemas.quiz import (
    AnswerCheckRequest,
    AnswerCheckResponse,
    QuizStartRequest,
    QuizStartResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
)
from app.schemas.score import LeaderboardEntry
from app.schemas.setting import QuizSettingRead, QuizSettingUpdate
from app.services.quiz_service import start_quiz, submit_quiz

router = APIRouter()


@router.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/auth/google", response_model=GoogleAuthResponse, tags=["auth"])
def verify_google_login(payload: GoogleAuthRequest, db: Session = Depends(get_db)) -> GoogleAuthResponse:
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google client ID is not configured",
        )

    try:
        id_info = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential",
        ) from exc

    if not id_info.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google email is not verified",
        )

    role = "admin" if id_info["email"].lower() in settings.admin_email_set else "player"
    try:
        db.add(
            UserLogin(
                google_sub=id_info["sub"],
                name=id_info.get("name") or id_info["email"],
                email=id_info["email"],
                role=role,
                picture=id_info.get("picture"),
            )
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()

    return GoogleAuthResponse(
        user=AuthUser(
            id=id_info["sub"],
            name=id_info.get("name") or id_info["email"],
            email=id_info["email"],
            role=role,
            picture=id_info.get("picture"),
        )
    )


@router.post("/auth/name", response_model=GoogleAuthResponse, tags=["auth"])
def verify_name_login(payload: NameAuthRequest) -> GoogleAuthResponse:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name is required")

    return GoogleAuthResponse(
        user=AuthUser(
            id=f"guest-{uuid4().hex}",
            name=name,
            email="",
            role="player",
            picture=None,
        )
    )


@router.get("/categories", response_model=list[CategoryRead], tags=["quiz"])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name)))


def get_or_create_quiz_settings(db: Session) -> QuizSetting:
    settings_row = db.get(QuizSetting, 1)
    if settings_row is None:
        settings_row = QuizSetting(
            id=1,
            question_limit=7,
            quiz_time_seconds=150,
            attempts_allowed=3,
            pass_percentage=70,
            prize_code="",
        )
        db.add(settings_row)
        db.commit()
        db.refresh(settings_row)
    return settings_row


@router.get("/quiz/settings", response_model=QuizSettingRead, tags=["quiz"])
def get_quiz_settings(db: Session = Depends(get_db)) -> QuizSetting:
    return get_or_create_quiz_settings(db)


@router.post("/quiz/start", response_model=QuizStartResponse, tags=["quiz"])
def create_quiz_session(payload: QuizStartRequest, db: Session = Depends(get_db)) -> QuizStartResponse:
    session, questions = start_quiz(db, payload.player_name, payload.category_id, payload.limit)
    return QuizStartResponse(session_id=session.id, player_id=session.player_id, questions=questions)


@router.post("/quiz/submit", response_model=QuizSubmitResponse, tags=["quiz"])
def submit_quiz_session(payload: QuizSubmitRequest, db: Session = Depends(get_db)) -> QuizSubmitResponse:
    answers = {answer.question_id: answer.answer for answer in payload.answers}
    score, results = submit_quiz(db, payload.session_id, answers, payload.completion_time_seconds)
    return QuizSubmitResponse(
        score=score.score,
        total_questions=score.total_questions,
        completion_time_seconds=score.completion_time_seconds,
        results=results,
    )


@router.post("/quiz/check-answer", response_model=AnswerCheckResponse, tags=["quiz"])
def check_answer(payload: AnswerCheckRequest, db: Session = Depends(get_db)) -> AnswerCheckResponse:
    question = db.get(Question, payload.question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    return AnswerCheckResponse(
        question_id=question.id,
        correct_answer=question.correct_answer,
        selected_answer=payload.answer,
        is_correct=payload.answer == question.correct_answer,
    )


@router.get("/leaderboard", response_model=list[LeaderboardEntry], tags=["leaderboard"])
def get_leaderboard(
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[LeaderboardEntry]:
    rows = db.execute(
        select(Score, QuizSession, Category)
        .join(QuizSession, Score.session_id == QuizSession.id)
        .outerjoin(Category, QuizSession.category_id == Category.id)
        .options(joinedload(Score.player))
        .order_by(Score.score.desc(), Score.completion_time_seconds.asc(), Score.created_at.asc())
        .limit(limit)
    ).all()

    return [
        LeaderboardEntry(
            id=score.id,
            player_name=score.player.name,
            score=score.score,
            total_questions=score.total_questions,
            completion_time_seconds=score.completion_time_seconds,
            category_name=category.name if category else None,
            created_at=score.created_at,
        )
        for score, _session, category in rows
    ]


@router.get("/admin/questions", response_model=list[QuestionRead], tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_list_questions(db: Session = Depends(get_db)) -> list[Question]:
    return list(db.scalars(select(Question).options(joinedload(Question.category)).order_by(Question.id.desc())))


@router.post(
    "/admin/questions",
    response_model=QuestionRead,
    status_code=status.HTTP_201_CREATED,
    tags=["admin"],
    dependencies=[Depends(require_google_admin)],
)
def admin_create_question(payload: QuestionCreate, db: Session = Depends(get_db)) -> Question:
    if payload.correct_answer not in payload.options:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Correct answer must be one of the options")
    question = Question(**payload.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.post(
    "/admin/questions/import-csv",
    response_model=AdminQuestionImportResult,
    tags=["admin"],
    dependencies=[Depends(require_google_admin)],
)
async def admin_import_questions_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> AdminQuestionImportResult:
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a CSV file.")

    raw_content = await file.read()
    try:
        text = raw_content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV must be UTF-8 encoded.") from exc

    reader = csv.DictReader(io.StringIO(text))
    required_columns = {"category", "prompt", "option_1", "option_2", "correct_answer"}
    fieldnames = set(reader.fieldnames or [])
    missing_columns = required_columns - fieldnames
    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Missing CSV columns: {missing}")

    categories_by_name = {
        category.name.strip().lower(): category
        for category in db.scalars(select(Category)).all()
    }
    created = 0
    skipped = 0
    errors: list[str] = []

    for row_number, row in enumerate(reader, start=2):
        category_name = (row.get("category") or "").strip()
        prompt = (row.get("prompt") or "").strip()
        options = [
            (row.get("option_1") or "").strip(),
            (row.get("option_2") or "").strip(),
            (row.get("option_3") or "").strip(),
            (row.get("option_4") or "").strip(),
            (row.get("option_5") or "").strip(),
            (row.get("option_6") or "").strip(),
        ]
        options = [option for option in options if option]
        correct_answer = (row.get("correct_answer") or "").strip()
        time_limit_value = (row.get("time_limit_seconds") or "20").strip()
        is_active_value = (row.get("is_active") or "true").strip().lower()

        if not category_name or not prompt:
            skipped += 1
            errors.append(f"Row {row_number}: category and prompt are required.")
            continue
        if len(options) < 2:
            skipped += 1
            errors.append(f"Row {row_number}: provide at least two options.")
            continue
        if correct_answer not in options:
            skipped += 1
            errors.append(f"Row {row_number}: correct_answer must match one option exactly.")
            continue

        try:
            time_limit_seconds = int(time_limit_value)
        except ValueError:
            skipped += 1
            errors.append(f"Row {row_number}: time_limit_seconds must be a number.")
            continue
        if time_limit_seconds < 5 or time_limit_seconds > 120:
            skipped += 1
            errors.append(f"Row {row_number}: time_limit_seconds must be between 5 and 120.")
            continue

        category_key = category_name.lower()
        category = categories_by_name.get(category_key)
        if category is None:
            category = Category(name=category_name)
            db.add(category)
            db.flush()
            categories_by_name[category_key] = category

        db.add(
            Question(
                category_id=category.id,
                prompt=prompt,
                options=options,
                correct_answer=correct_answer,
                time_limit_seconds=time_limit_seconds,
                is_active=is_active_value not in {"false", "0", "no", "n"},
            )
        )
        created += 1

    db.commit()
    return AdminQuestionImportResult(created=created, skipped=skipped, errors=errors[:25])


@router.put("/admin/questions/{question_id}", response_model=QuestionRead, tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_update_question(question_id: int, payload: QuestionUpdate, db: Session = Depends(get_db)) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    updates = payload.model_dump(exclude_unset=True)
    options = updates.get("options", question.options)
    correct_answer = updates.get("correct_answer", question.correct_answer)
    if correct_answer not in options:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Correct answer must be one of the options")

    for key, value in updates.items():
        setattr(question, key, value)
    db.commit()
    db.refresh(question)
    return question


@router.delete("/admin/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_delete_question(question_id: int, db: Session = Depends(get_db)) -> None:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    db.delete(question)
    db.commit()


@router.get("/admin/categories", response_model=list[CategoryRead], tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name)))


@router.get("/admin/analytics", response_model=AdminAnalytics, tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_get_analytics(db: Session = Depends(get_db)) -> AdminAnalytics:
    total_questions = db.scalar(select(func.count(Question.id))) or 0
    active_questions = db.scalar(select(func.count(Question.id)).where(Question.is_active.is_(True))) or 0
    inactive_questions = total_questions - active_questions
    total_players = db.scalar(select(func.count(Player.id))) or 0
    total_logins = db.scalar(select(func.count(UserLogin.id))) or 0
    total_sessions = db.scalar(select(func.count(QuizSession.id))) or 0
    completed_sessions = db.scalar(select(func.count(Score.id))) or 0
    average_score_percent = db.scalar(select(func.avg((Score.score * 100.0) / Score.total_questions))) or 0
    average_completion_time = db.scalar(select(func.avg(Score.completion_time_seconds))) or 0

    return AdminAnalytics(
        total_questions=total_questions,
        active_questions=active_questions,
        inactive_questions=inactive_questions,
        total_players=total_players,
        total_logins=total_logins,
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        average_score_percent=round(float(average_score_percent), 1),
        average_completion_time_seconds=round(float(average_completion_time)),
    )


@router.get("/admin/users", response_model=list[AdminUserLogin], tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_list_user_logins(db: Session = Depends(get_db)) -> list[AdminUserLogin]:
    return list(db.scalars(select(UserLogin).order_by(UserLogin.logged_in_at.desc())))


@router.post(
    "/admin/categories",
    response_model=CategoryRead,
    status_code=status.HTTP_201_CREATED,
    tags=["admin"],
    dependencies=[Depends(require_google_admin)],
)
def admin_create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> Category:
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/admin/categories/{category_id}", response_model=CategoryRead, tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/admin/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_delete_category(category_id: int, db: Session = Depends(get_db)) -> None:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    db.delete(category)
    db.commit()


@router.get("/admin/settings", response_model=QuizSettingRead, tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_get_settings(db: Session = Depends(get_db)) -> QuizSetting:
    return get_or_create_quiz_settings(db)


@router.get("/admin/prize-codes", response_model=list[PrizeCodeRead], tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_list_prize_codes(db: Session = Depends(get_db)) -> list[PrizeCode]:
    return list(db.scalars(select(PrizeCode).order_by(PrizeCode.is_used.asc(), PrizeCode.created_at.desc())))


@router.post("/admin/prize-codes", response_model=PrizeCodeRead, status_code=status.HTTP_201_CREATED, tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_create_prize_code(payload: PrizeCodeCreate, db: Session = Depends(get_db)) -> PrizeCode:
    code = payload.code.strip().upper()
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prize code is required")

    existing = db.scalar(select(PrizeCode).where(PrizeCode.code == code))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="That prize code already exists")

    prize_code = PrizeCode(code=code)
    db.add(prize_code)
    db.commit()
    db.refresh(prize_code)
    return prize_code


@router.delete("/admin/prize-codes/{prize_code_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_delete_prize_code(prize_code_id: int, db: Session = Depends(get_db)) -> None:
    prize_code = db.get(PrizeCode, prize_code_id)
    if prize_code is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prize code not found")
    db.delete(prize_code)
    db.commit()


@router.post("/quiz/claim-prize", response_model=PrizeCodeRead, tags=["quiz"])
def claim_prize_code(payload: PrizeCodeClaimRequest, db: Session = Depends(get_db)) -> PrizeCode:
    player_name = payload.player_name.strip()
    if not player_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Player name is required")

    existing_claim = db.scalar(
        select(PrizeCode).where(
            PrizeCode.is_used.is_(True),
            func.lower(PrizeCode.claimed_by) == player_name.lower(),
        )
    )
    if existing_claim is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You have already claimed a prize code.",
        )

    prize_code = db.scalar(select(PrizeCode).where(PrizeCode.is_used.is_(False)).order_by(PrizeCode.created_at.asc()))
    if prize_code is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No unused prize codes are available")

    prize_code.is_used = True
    prize_code.claimed_by = player_name
    prize_code.claimed_at = func.now()
    db.commit()
    db.refresh(prize_code)
    return prize_code


@router.put("/admin/settings", response_model=QuizSettingRead, tags=["admin"], dependencies=[Depends(require_google_admin)])
def admin_update_settings(payload: QuizSettingUpdate, db: Session = Depends(get_db)) -> QuizSetting:
    settings_row = get_or_create_quiz_settings(db)
    settings_row.question_limit = payload.question_limit
    settings_row.quiz_time_seconds = payload.quiz_time_seconds
    settings_row.attempts_allowed = payload.attempts_allowed
    settings_row.pass_percentage = payload.pass_percentage
    settings_row.prize_code = payload.prize_code.strip()
    db.commit()
    db.refresh(settings_row)
    return settings_row
