const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get enrichment queue status
router.get('/queue', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    let whereClause = '';
    const params = [];

    if (status) {
      whereClause = 'WHERE p.status = $1';
      params.push(status);
    }

    const query = `
      SELECT 
        p.id,
        p.prospect_data->>'name' as name,
        p.opportunity_score,
        p.enrichment_confidence,
        p.status,
        COUNT(e.id) as enrichment_attempts,
        MAX(e.created_at) as last_enrichment_at
      FROM prospects p
      LEFT JOIN lead_enrichment_log e ON p.id = e.prospect_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1}
    `;

    params.push(limit);
    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching enrichment queue:', error);
    res.status(500).json({ error: 'Failed to fetch enrichment queue' });
  }
});

// Get enrichment stats
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_prospects,
        COUNT(CASE WHEN enrichment_data IS NOT NULL THEN 1 END) as enriched_count,
        COUNT(CASE WHEN enrichment_data IS NULL THEN 1 END) as pending_count,
        AVG(enrichment_confidence) as avg_confidence,
        MAX(enrichment_confidence) as max_confidence,
        MIN(enrichment_confidence) as min_confidence
      FROM prospects
      WHERE deleted_at IS NULL
    `;

    const apiStatsQuery = `
      SELECT 
        enrichment_source,
        COUNT(*) as total_calls,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
      FROM lead_enrichment_log
      GROUP BY enrichment_source
      ORDER BY total_calls DESC
    `;

    const statsResult = await pool.query(statsQuery);
    const apiStatsResult = await pool.query(apiStatsQuery);

    res.json({
      overall: statsResult.rows[0],
      api_breakdown: apiStatsResult.rows
    });
  } catch (error) {
    console.error('Error fetching enrichment stats:', error);
    res.status(500).json({ error: 'Failed to fetch enrichment stats' });
  }
});

// Manual re-enrichment trigger
router.post('/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.body;

    // Check if prospect exists
    const prospectQuery = 'SELECT * FROM prospects WHERE id = $1 AND deleted_at IS NULL';
    const prospectResult = await pool.query(prospectQuery, [id]);

    if (prospectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    const prospect = prospectResult.rows[0];

    // Only allow re-enrichment if not enriched or force flag is set
    if (prospect.enrichment_data && !force) {
      return res.status(400).json({ error: 'Prospect already enriched. Use force=true to override.' });
    }

    // Clear existing enrichment data if forcing
    if (force) {
      const clearQuery = `
        UPDATE prospects 
        SET enrichment_data = NULL, 
            enrichment_confidence = NULL, 
            opportunity_score = NULL
        WHERE id = $1
      `;
      await pool.query(clearQuery, [id]);
    }

    // Trigger enrichment service
    try {
      const axios = require('axios');
      await axios.post(`${process.env.ENRICHMENT_SERVICE_URL}/enrich`, {
        prospect_id: id,
        data: prospect.prospect_data,
        force: force
      });

      res.json({ message: 'Re-enrichment triggered successfully' });
    } catch (error) {
      console.error('Failed to trigger enrichment service:', error);
      res.status(500).json({ error: 'Failed to trigger enrichment service' });
    }
  } catch (error) {
    console.error('Error triggering re-enrichment:', error);
    res.status(500).json({ error: 'Failed to trigger re-enrichment' });
  }
});

// Get API quota usage (mock implementation)
router.get('/quota', async (req, res) => {
  try {
    // In production, this would fetch real quota data from API providers
    const mockQuota = {
      zillow: {
        daily_limit: 1000,
        used_today: 234,
        remaining: 766,
        reset_at: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      },
      data_axle: {
        daily_limit: 500,
        used_today: 145,
        remaining: 355,
        reset_at: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      },
      whitepages: {
        daily_limit: 200,
        used_today: 67,
        remaining: 133,
        reset_at: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      }
    };

    res.json(mockQuota);
  } catch (error) {
    console.error('Error fetching quota:', error);
    res.status(500).json({ error: 'Failed to fetch quota' });
  }
});

module.exports = router;
