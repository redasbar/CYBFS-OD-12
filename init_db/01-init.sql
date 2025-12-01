CREATE DATABASE LibraTech_db;
USE LibraTech_db;

CREATE TABLE genres (
    genre_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    PRIMARY KEY (genre_id)
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
    ('Voyages');

CREATE TABLE authors (
    author_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    bio TEXT,
    PRIMARY KEY (author_id)
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

CREATE TABLE books (
    book_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) UNSIGNED NOT NULL, -- Handles prices up to 99999999.99
    stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    author_id INT UNSIGNED NOT NULL,
    genre_id INT UNSIGNED NOT NULL,
    isbn VARCHAR(17) UNIQUE, -- e.g., 978-3-16-148410-0
    published_date DATE,
    PRIMARY KEY (book_id),
    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id) ON DELETE RESTRICT
);

INSERT INTO books (title, description, price, stock_quantity, author_id, genre_id, isbn, published_date) VALUES
    -- Roman Noir Littéraire
    ('Le Mystère de la Chambre Bleue', 'Un polar psychologique dans un manoir bourguignon, entre secrets familiaux et tableau maudit', 21.90, 12, 1, 16, '978-2-266-31234-5', '2021-03-18'),
    
    -- Littérature Contemporaine
    ('L''Étourdissement', 'Roman poétique sur un homme qui fuit Paris pour devenir gardien de phare en Bretagne', 19.50, 8, 2, 13, '978-2-07-046789-2', '2019-09-05'),
    
    -- Fiction Historique
    ('Le Cœur de la Louve', 'Saga familiale sur trois générations de femmes dans les Ardennes du 19ème siècle', 23.90, 15, 3, 10, '978-2-253-19876-3', '2020-01-15'),
    
    -- Roman Psychologique
    ('Portrait d''après blessure', 'Enquête intime sur un père disparu, entre photographie et mémoire trouée', 20.50, 11, 4, 13, '978-2-266-30128-6', '2022-08-25'),
    
    -- Roman Social
    ('L''Amour et les Forêts', 'Histoire d''une femme qui reconstruit sa vie après une relation toxique, entre forêt vosgienne et renaissance', 22.90, 18, 5, 18, '978-2-07-046543-0', '2022-01-06'),
    
    -- Récit Contemporain
    ('Un Monde à Portée de Main', 'Roman sur une jeune femme qui crée des décors de cinéma, entre art et précarité', 21.50, 9, 6, 13, '978-2-7578-7456-3', '2021-05-19'),
    
    -- Fiction Métaphysique
    ('Tiens Ferme Ta Couronne', 'Road-trip initiatique d''un scénariste à New York, entre quête artistique et amitié improbable', 24.50, 7, 7, 13, '978-2-07-046987-2', '2023-02-16'),
    
    -- Roman Social
    ('Connemara', 'Portrait d''une amitié entre deux quadragénaires dans l''est de la France, entre usine et rêves brisés', 19.90, 16, 9, 13, '978-2-330-13456-4', '2023-01-04'),
    
    -- Fiction Historique
    ('Nos Richesses', 'Hommage à une librairie algérienne mythique et à la résistance culturelle', 18.90, 14, 10, 10, '978-2-07-274794-3', '2021-11-03');



CREATE TABLE customers (
    customer_id BINARY(16) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Always store hashed passwords!
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id)
);

INSERT INTO customers (email, first_name, last_name, shipping_address)
VALUES
    ('john.doe@yahoo.com', 'John', 'DOE', 'Broadway Avenue, Hollywood CA'),
ON CONFLICT DO NOTHING; -- Prevents errors if run multiple times

CREATE TABLE orders (
    order_id BINARY(16) NOT NULL,
    customer_id BINARY(16) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) UNSIGNED NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    PRIMARY KEY (order_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE order_items (
    order_item_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BINARY(16) UNSIGNED NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) UNSIGNED NOT NULL, -- Snapshot of price at time of purchase
    PRIMARY KEY (order_item_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE RESTRICT
);

CREATE TABLE payments (
    payment_id BINARY(16) NOT NULL,
    order_id BINARY(16) NOT NULL,
    amount DECIMAL(10, 2) UNSIGNED NOT NULL, -- Amount charged for this payment (could be less than order total for partial payments/refunds)
    provider_payment_id VARCHAR(255) NOT NULL UNIQUE, -- The token/provider_reference_id from your Payment Service Provider (e.g., 'pi_3LN...' from Stripe)
    payment_gateway VARCHAR(50) NOT NULL, -- To track which gateway/processor you used (e.g., 'stripe', 'braintree')
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'other') NOT NULL, -- e.g., 'credit_card', 'paypal', 'bank_transfer'
    status VARCHAR(50) NOT NULL, -- e.g., 'succeeded', 'failed', 'pending', 'refunded'
    last_four_digits CHAR(4), -- The last 4 digits of the card for receipt/display purposes. This is PCI compliant.
    card_brand VARCHAR(20), -- The card brand (e.g., 'visa', 'mastercard'). Also PCI compliant.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL, -- Timestamp when the payment was processed by the gateway.
    PRIMARY KEY (payment_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE RESTRICT
);

-- Add an index for faster lookups by the provider's ID
CREATE INDEX idx_provider_payment_id ON payments(provider_payment_id);

CREATE TABLE users (
    user_id BINARY(16) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('manager', 'sales', 'supply', 'finance') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);




