CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

CREATE TABLE IF NOT EXISTS genres (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO genres (name) VALUES
    ('Arts & Photographie'),
    ('Biographies & Mémoires'),
    ('Business & Finance'),
    ('Livres pour enfants'),
    ('Bandes dessinées & Romans graphiques'),
    ('Informatique & Technologie'),
    ('Livres de cuisine, Gastronomie & Vin'),
    ('Loisirs créatifs, Passe-temps & Maison'),
    ('Éducation & Enseignement'),
    ('Santé, Forme & Régimes'),
    ('Histoire'),
    ('Humour & Divertissement'),
    ('Apprentissage & Éducation'),
    ('Littérature & Fiction'),
    ('Livres médicaux'),
    ('Policier, Thriller & Suspense'),
    ('Manuels scolaires (neufs, d''occasion & en location)'),
    ('Parentalité & Relations'),
    ('Politique & Sciences sociales'),
    ('Religion & Spiritualité'),
    ('Romance'),
    ('Sciences & Mathématiques'),
    ('Science-fiction & Fantasy'),
    ('Développement personnel'),
    ('Sports & Plein air'),
    ('Voyages')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS authors (
    author_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    bio TEXT
);

INSERT INTO authors (first_name, last_name, bio) VALUES
    ('Virginie', 'Grange', 'Auteure française de romans noirs et psychologiques, lauréate de plusieurs prix littéraires'),
    ('Joël', 'Egloff', 'Écrivain français discret mais très apprécié pour son style poétique et mélancolique'),
    ('Caroline', 'Martinez', 'Romancière française au style baroque et aux univers oniriques'),
    ('Hélène', 'Gestern', 'Auteure française explorant la mémoire et les secrets familiaux avec une écriture raffinée'),
    ('Éric', 'Reinhardt', 'Écrivain français connu pour ses romans sur le monde du travail et les dysfonctionnements sociaux'),
    ('Maylis', 'de Kerangal', 'Auteure française au style très littéraire, entre reportage et fiction'),
    ('Yannick', 'Haenel', 'Écrivain français aux romans exigeants mêlant histoire et métaphysique'),
    ('Nicolas', 'Mathieu', 'Prix Goncourt 2018 pour ses romans sur la France périurbaine'),
    ('Kaouther', 'Adimi', 'Écrivaine algérienne francophone primée pour ses romans sur l''héritage culturel');

CREATE TABLE IF NOT EXISTS books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    author_id INTEGER NOT NULL,
    genre_id INTEGER NOT NULL,
    isbn VARCHAR(17) UNIQUE,
    published_date DATE,
    image_url VARCHAR(500) DEFAULT '/static/images/book-placeholder.jpg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE RESTRICT
);

INSERT INTO books (title, description, price, stock_quantity, author_id, genre_id, isbn, published_date) VALUES
    ('Le Mystère de la Chambre Bleue', 'Un polar psychologique dans un manoir bourguignon, entre secrets familiaux et tableau maudit', 21.90, 12, 1, 16, '978-2-266-31234-5', '2021-03-18'),
    ('L''Étourdissement', 'Roman poétique sur un homme qui fuit Paris pour devenir gardien de phare en Bretagne', 19.50, 8, 2, 13, '978-2-07-046789-2', '2019-09-05'),
    ('Le Cœur de la Louve', 'Saga familiale sur trois générations de femmes dans les Ardennes du 19ème siècle', 23.90, 15, 3, 10, '978-2-253-19876-3', '2020-01-15'),
    ('Portrait d''après blessure', 'Enquête intime sur un père disparu, entre photographie et mémoire trouée', 20.50, 11, 4, 13, '978-2-266-30128-6', '2022-08-25'),
    ('L''Amour et les Forêts', 'Histoire d''une femme qui reconstruit sa vie après une relation toxique, entre forêt vosgienne et renaissance', 22.90, 18, 5, 18, '978-2-07-046543-0', '2022-01-06'),
    ('Un Monde à Portée de Main', 'Roman sur une jeune femme qui crée des décors de cinéma, entre art et précarité', 21.50, 9, 6, 13, '978-2-7578-7456-3', '2021-05-19'),
    ('Tiens Ferme Ta Couronne', 'Road-trip initiatique d''un scénariste à New York, entre quête artistique et amitié improbable', 24.50, 7, 7, 13, '978-2-07-046987-2', '2023-02-16'),
    ('Connemara', 'Portrait d''une amitié entre deux quadragénaires dans l''est de la France, entre usine et rêves brisés', 19.90, 16, 8, 13, '978-2-330-13456-4', '2023-01-04'),
    ('Nos Richesses', 'Hommage à une librairie algérienne mythique et à la résistance culturelle', 18.90, 14, 9, 10, '978-2-07-274794-3', '2021-11-03')
ON CONFLICT (isbn) DO NOTHING;

-- Create ENUM types first
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_method_type AS ENUM ('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'other');
CREATE TYPE user_role AS ENUM ('manager', 'sales', 'supply', 'finance');

-- Note: Fixed author_id values in books (8, 9 instead of 9, 10)
-- Note: Using UUID instead of BINARY(16)
CREATE TABLE IF NOT EXISTS customers (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO customers (customer_id, email, password_hash, first_name, last_name, shipping_address) VALUES
    (gen_random_uuid(), 'john.doe@yahoo.com', 'hashed_password_here', 'John', 'DOE', 'Broadway Avenue, Hollywood CA')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    status order_status DEFAULT 'pending',
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL,
    book_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    provider_payment_id VARCHAR(255) NOT NULL UNIQUE,
    payment_gateway VARCHAR(50) NOT NULL,
    payment_method payment_method_type NOT NULL,
    status VARCHAR(50) NOT NULL,
    last_four_digits CHAR(4),
    card_brand VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_provider_payment_id ON payments(provider_payment_id);

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




