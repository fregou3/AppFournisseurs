-- Table pour les raisons d'entrer en relation
CREATE TABLE IF NOT EXISTS eval2_raisons_relation (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    poids INTEGER NOT NULL
);

-- Table pour les critères de sélection
CREATE TABLE IF NOT EXISTS criteres_selection (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    poids INTEGER NOT NULL
);

-- Table pour les évaluations de niveau 2
CREATE TABLE IF NOT EXISTS evaluations_niveau2 (
    id SERIAL PRIMARY KEY,
    fournisseur_id INTEGER REFERENCES fournisseurs(id),
    date_evaluation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evaluateur VARCHAR(100),
    score_total DECIMAL(10,2),
    statut VARCHAR(50),
    commentaires TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les réponses aux critères
CREATE TABLE IF NOT EXISTS reponses_criteres (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations_niveau2(id),
    critere_id INTEGER,
    reponse INTEGER,
    score DECIMAL(10,2),
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour le timestamp
CREATE TRIGGER update_evaluations_niveau2_updated_at
    BEFORE UPDATE ON evaluations_niveau2
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
