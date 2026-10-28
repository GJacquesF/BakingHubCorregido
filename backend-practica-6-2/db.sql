
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    imagen VARCHAR(255),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);


CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Puntos del mapa de entregas (los crea el administrador, el cliente elige uno en el checkout).
CREATE TABLE puntos_entrega (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    referencia VARCHAR(255),
    lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendiente',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    -- Pago (Mercado Pago): tarjeta | oxxo | spei | mercadopago
    metodo_pago VARCHAR(20),
    pago_id VARCHAR(100),
    pago_referencia VARCHAR(100),
    pago_url TEXT,
    pago_expira TIMESTAMPTZ,
    pagado_en TIMESTAMPTZ,
    -- Entrega: punto elegido y copia de sus datos al momento de comprar
    punto_entrega_id INT,
    entrega_nombre VARCHAR(100),
    entrega_direccion VARCHAR(255),
    entrega_referencia VARCHAR(255),
    entrega_lat DOUBLE PRECISION,
    entrega_lng DOUBLE PRECISION
);
-- status: pendiente | pagado | cancelado | expirado | reembolsado
ALTER TABLE pedidos ADD CONSTRAINT pedidos_punto_entrega_fk FOREIGN KEY (punto_entrega_id) REFERENCES puntos_entrega(id) ON DELETE SET NULL;
CREATE INDEX pedidos_pago_id_idx ON pedidos (pago_id);


CREATE TABLE pedido_productos (
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INT NOT NULL DEFAULT 1,
    PRIMARY KEY (pedido_id, producto_id)
);

insert into productos (nombre, precio, imagen, stock) values 
('Brownies de Chocolate', 45.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6Kr61VJfd31fTFkQuwtHNO5CZiGjKeWc4KTUn7dT3lyPUfDUoznk0DJ_7&s=10', 30),
('Galletas de Chispas', 20.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAoFTEn3AVTpsZtRpZiNMIkwfXVJk80gekiQ5cFq8hMcmuSHXiNOxsv-4&s=10', 50),
('Pastel de Zanahoria', 250.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDVGSdEX0hZa8MCoE2rUv2XUZIamDwBU4B6aPQm9DTQ8SYzaHCiCXxq1Vd&s=10', 8),
('Rol de Canela', 30.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-lRUUPAc3EBz-tqJktLtpjCqEBmIpIgw6aLf-eHPqUDmVMQZXbLEvr6EK&s=10', 25);


-- Punto de entrega de ejemplo (centro de CDMX). Bórralo o edítalo desde Admin > Entregas.
insert into puntos_entrega (nombre, direccion, referencia, lat, lng) values
('Sucursal Zócalo', 'Plaza de la Constitución s/n, Centro, CDMX', 'Frente a la Catedral', 19.432608, -99.133209);

-- ---------------------------------------------------------------------------------------
-- SUPABASE: activa Row Level Security en todas las tablas.
-- Supabase publica las tablas del esquema "public" mediante su API REST con la clave "anon"
-- (que es pública). Sin RLS, cualquiera podría leer usuarios.password_hash o editar productos.
-- Sin políticas, la API REST no ve nada. El backend sigue funcionando porque se conecta con
-- el usuario "postgres" por DATABASE_URL, que ignora RLS.
-- ---------------------------------------------------------------------------------------
ALTER TABLE productos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_productos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntos_entrega    ENABLE ROW LEVEL SECURITY;
