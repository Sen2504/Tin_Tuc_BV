from flask import Flask, app
from app.config import Config
from app.extensions import db, login_manager, mail
from flask_cors import CORS
from app.extensions import db, migrate
from flask import send_from_directory, current_app


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/api/*": {"origins": ["http://127.0.0.1:5173"]},
            r"/auth/*": {"origins": ["http://127.0.0.1:5173"]},
        },
    )

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    mail.init_app(app)

    login_manager.login_view = "auth.login"
    login_manager.login_message = "Vui lòng đăng nhập để tiếp tục."

    from app.models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    from app.routes.auth_routes import auth_bp
    from app.routes.user_routes import user_bp
    from app.routes.category_routes import category_bp
    from app.routes.subcategory_routes import subcategory_bp
    from app.routes.media_routes import media_bp
    from app.routes.post_routes import post_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(subcategory_bp)
    app.register_blueprint(media_bp)
    app.register_blueprint(post_bp)

    return app