-- Supabase Schema para CREO

-- Extensión para IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Sorteos
CREATE TABLE sorteos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    fecha_sorteo TIMESTAMPTZ NOT NULL,
    estado VARCHAR(50) DEFAULT 'activo' CHECK (estado IN ('activo', 'pausado', 'finalizado')),
    premio VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Participantes
CREATE TABLE participantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sorteo_id UUID REFERENCES sorteos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sorteo_id, email) -- Un registro por correo por sorteo
);

-- Tabla de Admins
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE
);

-- Row Level Security (RLS)
ALTER TABLE sorteos ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Políticas para Sorteos (Público puede leer, solo admin editar)
CREATE POLICY "Sorteos son públicos" ON sorteos FOR SELECT USING (true);
CREATE POLICY "Admins pueden modificar sorteos" ON sorteos FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM admins)
);

-- Políticas para Participantes (Público puede insertar, solo admin puede leer todos/editar)
CREATE POLICY "Cualquiera puede registrarse" ON participantes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins pueden ver participantes" ON participantes FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM admins)
);

-- Políticas para Admins
CREATE POLICY "Admins pueden ver admins" ON admins FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM admins)
);

-- Función para calcular el tiempo restante
CREATE OR REPLACE FUNCTION tiempo_restante(sorteo_id UUID)
RETURNS INTERVAL AS $$
DECLARE
    fecha TIMESTAMPTZ;
BEGIN
    SELECT fecha_sorteo INTO fecha FROM sorteos WHERE id = sorteo_id;
    IF fecha > NOW() THEN
        RETURN fecha - NOW();
    ELSE
        RETURN INTERVAL '0';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar estado automáticamente si la fecha llegó
CREATE OR REPLACE FUNCTION actualizar_estado_sorteos()
RETURNS void AS $$
BEGIN
    UPDATE sorteos
    SET estado = 'finalizado'
    WHERE fecha_sorteo <= NOW() AND estado = 'activo';
END;
$$ LANGUAGE plpgsql;

-- Habilitar Realtime
-- Para Supabase, es necesario habilitar realtime en la publicación
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE sorteos;
ALTER PUBLICATION supabase_realtime ADD TABLE participantes;
