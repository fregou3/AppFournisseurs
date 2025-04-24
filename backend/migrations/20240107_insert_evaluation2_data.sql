-- Insertion des raisons d'entrer en relation
INSERT INTO eval2_raisons_relation (description, poids) VALUES
('Fournisseur stratégique', 5),
('Fournisseur critique', 4),
('Fournisseur important', 3),
('Fournisseur standard', 2),
('Fournisseur occasionnel', 1);

-- Insertion des critères de sélection
INSERT INTO criteres_selection (description, poids) VALUES
('Capacité technique', 4),
('Capacité de production', 4),
('Qualité', 5),
('Compétitivité des prix', 3),
('Solidité financière', 4),
('Respect des délais', 4),
('Service après-vente', 3),
('Innovation', 3),
('Conformité réglementaire', 5),
('Responsabilité sociétale', 4);
