-- Début de la transaction
BEGIN;

-- Vérifier si l'ancienne table existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'raisons_relation') THEN
        -- Créer la nouvelle table si elle n'existe pas
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'eval2_raisons_relation') THEN
            CREATE TABLE eval2_raisons_relation (
                id SERIAL PRIMARY KEY,
                description TEXT NOT NULL,
                poids INTEGER NOT NULL
            );
        END IF;

        -- Copier les données de l'ancienne table vers la nouvelle
        INSERT INTO eval2_raisons_relation (description, poids)
        SELECT description, poids
        FROM raisons_relation
        ON CONFLICT DO NOTHING;

        -- Supprimer l'ancienne table
        DROP TABLE raisons_relation;
        
        RAISE NOTICE 'Migration completed: Table raisons_relation renamed to eval2_raisons_relation';
    ELSE
        -- Si l'ancienne table n'existe pas, créer directement la nouvelle
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'eval2_raisons_relation') THEN
            CREATE TABLE eval2_raisons_relation (
                id SERIAL PRIMARY KEY,
                description TEXT NOT NULL,
                poids INTEGER NOT NULL
            );
            
            -- Insérer les données par défaut
            INSERT INTO eval2_raisons_relation (description, poids) VALUES
            ('Appel d''offres (UE)', 5),
            ('Appel d''offres (hors UE)', 4),
            ('Partenariat', 3),
            ('Prospection', 2),
            ('Action de sponsoring / mécénat', 2),
            ('Affaires courantes', 1);
            
            RAISE NOTICE 'New table eval2_raisons_relation created with default data';
        ELSE
            RAISE NOTICE 'Table eval2_raisons_relation already exists';
        END IF;
    END IF;
END $$;

-- Vérifier que la nouvelle table existe et contient des données
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM eval2_raisons_relation) = 0 THEN
        -- Insérer les données par défaut si la table est vide
        INSERT INTO eval2_raisons_relation (description, poids) VALUES
        ('Appel d''offres (UE)', 5),
        ('Appel d''offres (hors UE)', 4),
        ('Partenariat', 3),
        ('Prospection', 2),
        ('Action de sponsoring / mécénat', 2),
        ('Affaires courantes', 1);
        
        RAISE NOTICE 'Default data inserted into eval2_raisons_relation';
    END IF;
END $$;

-- Vérifier les contraintes et index
DO $$
BEGIN
    -- Ajouter un index sur la description si nécessaire
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'eval2_raisons_relation' 
        AND indexname = 'eval2_raisons_relation_description_idx'
    ) THEN
        CREATE INDEX eval2_raisons_relation_description_idx ON eval2_raisons_relation(description);
    END IF;
END $$;

COMMIT;
