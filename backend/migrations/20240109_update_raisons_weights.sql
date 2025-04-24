BEGIN;

-- Mise à jour des poids pour chaque raison
UPDATE eval2_raisons_relation 
SET poids = CASE description
    WHEN 'Appel d''offres (UE)' THEN 0
    WHEN 'Appel d''offres (hors UE)' THEN 1
    WHEN 'Partenariat' THEN 1
    WHEN 'Prospection' THEN 1
    WHEN 'Action de sponsoring / mécénat' THEN 5
    WHEN 'Affaires courantes' THEN 0
END;

COMMIT;
