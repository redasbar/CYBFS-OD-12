from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, g
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from .models import db, Book, Author, Genre, Customer, Order, OrderItem
from werkzeug.security import generate_password_hash, check_password_hash
#from werkzeug.utils import url_parse
import os
from datetime import datetime
from functools import wraps
from email_validator import validate_email, EmailNotValidError
from flask_migrate import Migrate

login_manager = LoginManager()


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Lax',
        SESSION_COOKIE_SECURE=False,  # True when HTTPS
        REMEMBER_COOKIE_HTTPONLY=True
    )    

    # Initialize extensions
    db.init_app(app)
    migrate = Migrate()
    login_manager.init_app(app)
    login_manager.login_view = 'login'

    @login_manager.user_loader
    def load_user(user_id):
        return Customer.query.get(user_id)

    @app.context_processor
    def inject_user():
        return dict(current_user=current_user)

    @app.before_request
    def before_request():
        g.genres = Genre.query.limit(10).all()

    @app.context_processor
    def inject_genres():
        genres = getattr(g, 'genres', [])
        return dict(genres=genres)

    @app.route('/')
    def index():
        # Get featured books
        featured_books = Book.query.order_by(Book.book_id.desc()).limit(8).all()
        
        return render_template('index.html', 
                            featured_books=featured_books)

    @app.route('/books')
    def books():
        page = request.args.get('page', 1, type=int)
        genre_id = request.args.get('genre', type=int)
        search = request.args.get('search', '')
        
        query = Book.query
        
        if genre_id:
            query = query.filter_by(genre_id=genre_id)
        
        if search:
            query = query.filter(Book.title.ilike(f'%{search}%'))
        
        books = query.order_by(Book.title).paginate(page=page, per_page=12)
        all_genres = Genre.query.all()
        
        return render_template('books.html', books=books, all_genres=all_genres, 
                            current_genre=genre_id, search=search)

    @app.route('/book/<int:book_id>')
    def book_detail(book_id):
        book = Book.query.get_or_404(book_id)
        related_books = Book.query.filter(
            Book.genre_id == book.genre_id,
            Book.book_id != book.book_id
        ).limit(4).all()
        
        return render_template('book_detail.html', book=book, related_books=related_books)

    @app.route('/api/books')
    def api_books():
        books = Book.query.limit(50).all()
        return jsonify([{
            'id': book.book_id,
            'title': book.title,
            'author': book.author.full_name,
            'price': float(book.price),
            'image': book.image_url,
            'in_stock': book.in_stock
        } for book in books])

    @app.route('/cart')
    @login_required
    def cart():
        return render_template('cart.html')

    @app.route('/api/cart/add', methods=['POST'])
    @login_required
    def api_add_to_cart():
        """Add item to cart in database"""
        try:
            data = request.get_json()
            book_id = data.get('book_id')
            quantity = data.get('quantity', 1)
            
            if not book_id:
                return jsonify({'error': 'Book ID required'}), 400
            
            book = Book.query.get(book_id)
            if not book:
                return jsonify({'error': 'Book not found'}), 404
            
            # Here you would add the book to the user's cart in the database
            # For now, we'll just return success
            # In a real app, you would have a Cart model and add items to it
            
            return jsonify({
                'success': True,
                'message': f'Added {book.title} to cart',
                'book': {
                    'id': book.book_id,
                    'title': book.title,
                    'price': float(book.price)
                }
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/cart/items')
    @login_required
    def api_cart_items():
        """Get cart items from database"""
        try:
            # For now, return empty - in production, fetch from database
            # cart_items = CartItem.query.filter_by(customer_id=current_user.customer_id).all()
            
            return jsonify({
                'items': [],
                'count': 0,
                'subtotal': 0
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/checkout')
    @login_required
    def checkout():
        return render_template('checkout.html')

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            
            customer = Customer.query.filter_by(email=email).first()
            
            if customer and customer.check_password(password):
                login_user(customer)
                flash('Logged in successfully!', 'success')
                next_page = request.args.get('next')
                if not next_page: #or url_parse(next_page).netloc != '':
                    next_page = url_for('index')
                return redirect(next_page)
            else:
                flash('Invalid email or password', 'error')
        
        return render_template('login.html')

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'POST':
            email = request.form.get('email', '').strip()
            password = request.form.get('password', '')
            first_name = request.form.get('first_name', '').strip()
            last_name = request.form.get('last_name', '').strip()
            
            # Validation
            errors = []
            if not email:
                errors.append('Email is required')
            else:
                try:
                    validate_email(email)
                except EmailNotValidError:
                    errors.append('Invalid email address')

            if Customer.query.filter_by(email=email).first():
                flash('Email already registered', 'error')
                return redirect(url_for('register'))
            
            if not password or len(password) < 8:
                errors.append('Password must be at least 8 characters')
            
            if not first_name:
                errors.append('First name is required')
            
            if not last_name:
                errors.append('Last name is required')
            
            if errors:
                for error in errors:
                    flash(error, 'error')
                return redirect(url_for('register'))
            
            try:
                customer = Customer(
                    email=email,
                    first_name=first_name,
                    last_name=last_name
                )
                customer.set_password(password)
                
                db.session.add(customer)
                db.session.commit()
                flash('Registration successful! Please login.', 'success')
                return redirect(url_for('login'))
                
            except Exception as e:
                db.session.rollback()
                app.logger.error(f'Registration error: {str(e)}')
                flash('An error occurred during registration. Please try again.', 'error')
                return redirect(url_for('register'))
            
        return render_template('register.html')

    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        flash('Logged out successfully', 'success')
        return redirect(url_for('index'))

    @app.route('/api/search')
    def search_books():
        query = request.args.get('q', '')
        if not query:
            return jsonify([])
        
        books = Book.query.filter(
            Book.title.ilike(f'%{query}%') |
            Book.description.ilike(f'%{query}%')
        ).limit(10).all()
        
        return jsonify([{
            'id': book.book_id,
            'title': book.title,
            'author': book.author.full_name,
            'price': float(book.price),
            'image': book.image_url
        } for book in books])

    return app
