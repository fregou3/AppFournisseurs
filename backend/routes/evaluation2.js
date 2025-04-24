const express = require('express');
const router = express.Router();
const pool = require('../db');

// Récupérer les raisons d'entrer en relation
router.get('/raisons', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_raisons_relation ORDER BY poids DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les critères de sélection
router.get('/criteres-selection', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_criteres_selection ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les localisations
router.get('/localisations', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_localisation ORDER BY pays');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les régions d'intervention
router.get('/regions-intervention', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_region_intervention ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les pays d'intervention
router.get('/pays-intervention', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_pays_intervention ORDER BY pays');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les qualifications des tiers
router.get('/qualifications-tiers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_qualification_tiers ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les natures des tiers
router.get('/natures-tiers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_nature_tiers ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les catégorisations des tiers
router.get('/categorisations-tiers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_categorisation_tiers ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les natures des tiers (eval2)
router.get('/eval2_nature_tiers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_nature_tiers ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les catégorisations des tiers (eval2)
router.get('/eval2_categorisation_tiers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_categorisation_tiers ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les interventions d'autre partie (eval2)
router.get('/eval2_intervention_autre_partie', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_intervention_autre_partie ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les évaluations de risque (eval2)
router.get('/eval2_evaluation_risque', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_evaluation_risque ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les interactions tiers autre partie (eval2)
router.get('/eval2_interaction_tiers_autre_partie', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_interaction_tiers_autre_partie ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les encadrements de relation (eval2)
router.get('/eval2_encadrement_relation', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_encadrement_relation ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les flux financiers (eval2)
router.get('/eval2_flux_financier', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_flux_financier ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les modalités de paiement (eval2)
router.get('/eval2_modalites_paiement_reglement', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_modalites_paiement_reglement ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les niveaux de dépendance (eval2)
router.get('/eval2_niveau_dependance_tiers_vs_clarins', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_niveau_dependance_tiers_vs_clarins ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les niveaux de dépendance Clarins (eval2)
router.get('/eval2_niveau_dependance_clarins_vs_tiers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_niveau_dependance_clarins_vs_tiers ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les modalités de renouvellement du contrat (eval2)
router.get('/eval2_modalites_de_renouvellement_contrat', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_modalites_de_renouvellement_contrat ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les antécédents avec le tiers (eval2)
router.get('/eval2_antecedents_avec_le_tiers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_antecedents_avec_le_tiers ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer la durée envisagée de la relation contractuelle (eval2)
router.get('/eval2_duree_envisagee_de_la_relation_contractuelle', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM eval2_duree_envisagee_de_la_relation_contractuelle ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Récupérer les critères de sélection
router.get('/criteres', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM criteres_selection ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Créer une nouvelle évaluation
router.post('/evaluations', async (req, res) => {
    const { fournisseur_id, evaluateur, reponses, commentaires } = req.body;
    
    try {
        await pool.query('BEGIN');
        
        // Insérer l'évaluation
        const evalResult = await pool.query(
            'INSERT INTO evaluations_niveau2 (fournisseur_id, evaluateur, commentaires) VALUES ($1, $2, $3) RETURNING id',
            [fournisseur_id, evaluateur, commentaires]
        );
        
        const evaluation_id = evalResult.rows[0].id;
        
        // Insérer les réponses
        for (const reponse of reponses) {
            await pool.query(
                'INSERT INTO reponses_criteres (evaluation_id, critere_id, reponse, score, commentaire) VALUES ($1, $2, $3, $4, $5)',
                [evaluation_id, reponse.critere_id, reponse.reponse, reponse.score, reponse.commentaire]
            );
        }
        
        // Calculer et mettre à jour le score total
        const scoreResult = await pool.query(
            `SELECT SUM(rc.score * cs.poids) / SUM(cs.poids) as score_total
             FROM reponses_criteres rc
             JOIN criteres_selection cs ON cs.id = rc.critere_id
             WHERE rc.evaluation_id = $1`,
            [evaluation_id]
        );
        
        const score_total = scoreResult.rows[0].score_total;
        const statut = score_total >= 3 ? 'VALIDÉ' : 'NON VALIDÉ';
        
        await pool.query(
            'UPDATE evaluations_niveau2 SET score_total = $1, statut = $2 WHERE id = $3',
            [score_total, statut, evaluation_id]
        );
        
        await pool.query('COMMIT');
        
        res.json({ 
            id: evaluation_id,
            score_total,
            statut
        });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Récupérer une évaluation
router.get('/evaluations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const evaluation = await pool.query(
            'SELECT * FROM evaluations_niveau2 WHERE id = $1',
            [id]
        );
        
        const reponses = await pool.query(
            'SELECT * FROM reponses_criteres WHERE evaluation_id = $1',
            [id]
        );
        
        res.json({
            evaluation: evaluation.rows[0],
            reponses: reponses.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
