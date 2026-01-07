from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid

db = SQLAlchemy()

class Genre(db.Model):
    __tablename__ = 'genres'
    
    genre_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    books = db.relationship('Book', back_populates='genre', lazy=True)

class Author(db.Model):
    __tablename__ = 'authors'
    
    author_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text)
    books = db.relationship('Book', backref='author_ref', lazy=True)
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class Book(db.Model):
    __tablename__ = 'books'
    
    book_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    stock_quantity = db.Column(db.Integer, nullable=False, default=0)
    author_id = db.Column(db.Integer, db.ForeignKey('authors.author_id'), nullable=False)
    genre_id = db.Column(db.Integer, db.ForeignKey('genres.genre_id'), nullable=False)
    isbn = db.Column(db.String(17), unique=True)
    published_date = db.Column(db.Date)
    image_url = db.Column(db.String(500), default='/static/images/book-placeholder.jpg', nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    author = db.relationship('Author', backref='book_list')
    genre = db.relationship('Genre', back_populates='books')
    
    @property
    def formatted_price(self):
        return f"€{self.price:.2f}"
    
    @property
    def in_stock(self):
        return self.stock_quantity > 0
    
    @property
    def stock_status(self):
        if self.stock_quantity > 10:
            return "In Stock"
        elif self.stock_quantity > 0:
            return f"Only {self.stock_quantity} left"
        else:
            return "Out of Stock"
            

class Customer(db.Model, UserMixin):
    __tablename__ = 'customers'
    
    customer_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    shipping_address = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    
    orders = db.relationship('Order', backref='customer', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_id(self):
        return self.customer_id

class Order(db.Model):
    __tablename__ = 'orders'
    
    order_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.customer_id'), nullable=False)
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default='pending')
    
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    order_item_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(36), db.ForeignKey('orders.order_id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('books.book_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    
    book = db.relationship('Book')

# Create tables if they don't exist
def init_db():
    
    db.create_all()
