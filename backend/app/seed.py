from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Category, Question, QuizSetting

CATEGORIES = [
    ("Technology", "Questions about software, devices, and digital culture."),
    ("Science", "Questions about nature, discovery, and experiments."),
    ("Sports", "Questions about games, teams, and sporting history."),
    ("Movies", "Questions about cinema, actors, and film trivia."),
    ("Geography", "Questions about countries, cities, and landmarks."),
    ("Business", "Questions about companies, brands, and commerce."),
    ("General Knowledge", "A mixed set of quick trivia questions."),
]

QUESTIONS = [
    ("Technology", "What does CPU stand for?", ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Control Processing User"], "Central Processing Unit"),
    ("Technology", "Which company created the React library?", ["Meta", "Google", "Microsoft", "Apple"], "Meta"),
    ("Science", "What planet is known as the Red Planet?", ["Mars", "Venus", "Jupiter", "Mercury"], "Mars"),
    ("Science", "What gas do plants absorb from the atmosphere?", ["Carbon dioxide", "Oxygen", "Hydrogen", "Nitrogen"], "Carbon dioxide"),
    ("Sports", "How many players are on a standard soccer team on the field?", ["11", "9", "10", "12"], "11"),
    ("Sports", "Which sport uses the term 'love' for a score of zero?", ["Tennis", "Golf", "Cricket", "Baseball"], "Tennis"),
    ("Movies", "Who directed the movie Jurassic Park?", ["Steven Spielberg", "James Cameron", "George Lucas", "Christopher Nolan"], "Steven Spielberg"),
    ("Movies", "Which movie features the line 'May the Force be with you'?", ["Star Wars", "The Matrix", "Avatar", "Interstellar"], "Star Wars"),
    ("Geography", "What is the capital city of Japan?", ["Tokyo", "Kyoto", "Osaka", "Seoul"], "Tokyo"),
    ("Geography", "Which river is the longest in the world?", ["Nile", "Amazon", "Yangtze", "Danube"], "Nile"),
    ("Business", "What does ROI stand for?", ["Return on Investment", "Rate of Income", "Revenue over Interest", "Result of Inventory"], "Return on Investment"),
    ("Business", "Which company is known for the iPhone?", ["Apple", "Samsung", "Sony", "Nokia"], "Apple"),
    ("General Knowledge", "How many continents are there?", ["7", "5", "6", "8"], "7"),
    ("General Knowledge", "What is the largest ocean on Earth?", ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], "Pacific Ocean"),
]


def seed() -> None:
    db = SessionLocal()
    try:
        categories_by_name = {}
        for name, description in CATEGORIES:
            category = db.scalar(select(Category).where(Category.name == name))
            if category is None:
                category = Category(name=name, description=description)
                db.add(category)
                db.flush()
            categories_by_name[name] = category

        for category_name, prompt, options, correct_answer in QUESTIONS:
            existing = db.scalar(select(Question).where(Question.prompt == prompt))
            if existing is not None:
                continue
            db.add(
                Question(
                    category_id=categories_by_name[category_name].id,
                    prompt=prompt,
                    options=options,
                    correct_answer=correct_answer,
                    time_limit_seconds=20,
                    is_active=True,
                )
            )
        if db.get(QuizSetting, 1) is None:
            db.add(QuizSetting(id=1, question_limit=7, quiz_time_seconds=150))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed data loaded.")
