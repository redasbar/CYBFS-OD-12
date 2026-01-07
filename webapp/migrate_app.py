# webapp/migrate_app.py
from app import create_app, db  # import your Flask app factory
from flask_migrate import Migrate
#from app.models import db  # import your db object

app = create_app()
migrate = Migrate(app, db)
