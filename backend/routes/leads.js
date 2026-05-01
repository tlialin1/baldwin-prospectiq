const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../server');
const axios = require('axios');

// Middleware to check JWT and role - assumes existing Baldwin auth middleware
const requireAuth = (req, res, next) => {
  // In production, use actual JWT verification
  // For now, assume req.user is set by upstream middleware
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Helper function to trigger enrichment service
const triggerEnrichment = async (prospectId, prospectData) => {
  try {
    await axios.post(`${process.env.ENRICHMENT_SERVICE_URL}/enrich`, {
      prospect_id: prospectId,
      data: prospectData
    });
  } catch (error) {
    console.error('Failed to trigger enrichment:', error.message);
  }
};

// Helper function to calculate lead score
const calculateLeadScore = (enrichmentData, baseData) => {
  let score = 0;
  const factors = [];

  if (!enrichmentData) return { score: 0, factors: [] };

  // Life Event Factors (30 points max)
  if (enrichmentData.life_events) {
    if (enrichmentData.life_events.recently_married) {
      score += 15;
      factors.push({ category: 'life_event', label: 'Recently married', points: 15 });
    }
    if (enrichmentData.life_events.new_baby) {
      score += 15;
      factors.push({ category: 'life_event', label: 'New baby', points: 15 });
    }
    if (enrichmentData.life_events.home_purchase_last_18_months) {
      score += 10;
      factors.push({ category: 'life_event', label: 'Recent home purchase', points: 10 });
    }
    if (enrichmentData.life_events.approaching_retirement) {
      score += 8;
      factors.push({ category: 'life_event', label: 'Approaching retirement', points: 8 });
    }
  }

  // Financial Factors (25 points max)
  if (enrichmentData.financial) {
    if (enrichmentData.financial.household_income > 75000) {
      score += 10;
      factors.push({ category: 'financial', label: 'High household income', points: 10 });
    }
    if (enrichmentData.financial.property_value > 300000) {
      score += 8;
      factors.push({ category: 'financial', label: 'High property value', points: 8 });
    }
  }
  if (baseData.current_premium && baseData.current_premium >= 200) {
    score += 7;
    factors.push({ category: 'financial', label: 'High current premium', points: 7 });
  }

  // Demographic Factors (20 points max)
  if (enrichmentData.demographics) {
    const age = enrichmentData.demographics.age;
    if (age >= 30 && age <= 50) {
      score += 10;
      factors.push({ category: 'demographic', label: 'Prime age range', points: 10 });
    }
    if (enrichmentData.demographics.family_size >= 3) {
      score += 10;
      factors.push({ category: 'demographic', label: 'Large family', points: 10 });
    }
  }

  // Behavioral Factors (15 points max)
  if (enrichmentData.behavioral) {
    if (enrichmentData.behavioral.multiple_quotes_requested) {
      score += 8;
      factors.push({ category: 'behavioral', label: 'Multiple quotes requested', points: 8 });
    }
    if (enrichmentData.behavioral.linked_to_baldwin_agent) {
      score += 7;
      factors.push({ category: 'behavioral', label: 'Linked to Baldwin agent', points: 7 });
    }
  }

  // Risk Factors (10 points max)
  if (enrichmentData.insurance) {
    if (!enrichmentData.insurance.has_life_insurance) {
      score += 10;
      factors.push({ category: 'risk', label: 'No current life insurance', points: 10 });
    }
    if (enrichmentData.insurance.coverage_gap_identified) {
      score += 5;
      factors.push({ category: 'risk', label: 'Coverage gap identified', points: 5 });
    }
  }

  return { score, factors };
};

// Get all prospects with filtering and sorting
router.get('/', requireAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString(),
  query('minScore').optional().isInt({ min: 0, max: 100 }),
  query('maxScore').optional().isInt({ min: 0, max: 100 }),
  query('state').optional().isString(),
  query('lifeEvent').optional().isString(),
  query('assignedTo').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { status, minScore, maxScore, state, lifeEvent, assignedTo } = req.query;

    // Build WHERE clause
    const conditions = ['deleted_at IS NULL'];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (minScore) {
      conditions.push(`opportunity_score >= $${paramIndex}`);
      params.push(minScore);
      paramIndex++;
    }

    if (maxScore) {
      conditions.push(`opportunity_score <= $${paramIndex}`);
      params.push(maxScore);
      paramIndex++;
    }

    if (assignedTo) {
      conditions.push(`assigned_agent_id = $${paramIndex}`);
      params.push(assignedTo);
      paramIndex++;
    }

    if (state) {
      conditions.push(`prospect_data->>'state' = $${paramIndex}`);
      params.push(state);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM prospects ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get prospects
    const query = `
      SELECT 
        p.*,
        a.name as assigned_agent_name
      FROM prospects p
      LEFT JOIN agents a ON p.assigned_agent_id = a.id
      ${whereClause}
      ORDER BY p.opportunity_score DESC NULLS LAST, p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    res.json({
      prospects: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
});

// Get prospect by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.*,
        a.name as assigned_agent_name,
        u.name as uploaded_by_name
      FROM prospects p
      LEFT JOIN agents a ON p.assigned_agent_id = a.id
      LEFT JOIN agents u ON p.agent_id = u.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    // Get enrichment log
    const enrichmentQuery = `
      SELECT * FROM lead_enrichment_log 
      WHERE prospect_id = $1 
      ORDER BY created_at DESC
    `;
    const enrichmentResult = await pool.query(enrichmentQuery, [id]);

    // Get trigger history
    const triggerQuery = `
      SELECT * FROM lead_triggers 
      WHERE prospect_id = $1 
      ORDER BY executed_at DESC
    `;
    const triggerResult = await pool.query(triggerQuery, [id]);

    const prospect = result.rows[0];
    prospect.enrichment_history = enrichmentResult.rows;
    prospect.trigger_history = triggerResult.rows;

    res.json(prospect);
  } catch (error) {
    console.error('Error fetching prospect:', error);
    res.status(500).json({ error: 'Failed to fetch prospect' });
  }
});

// Create single prospect
router.post('/', requireAuth, [
  body('name').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('address').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email, address, ...optionalData } = req.body;

    const prospectData = {
      name,
      phone,
      email,
      address,
      ...optionalData,
      created_by: req.user.id,
      created_at: new Date().toISOString()
    };

    const query = `
      INSERT INTO prospects (agent_id, prospect_data, source, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `;

    const result = await pool.query(query, [req.user.id, prospectData, 'manual']);
    const prospect = result.rows[0];

    // Trigger enrichment
    triggerEnrichment(prospect.id, prospectData);

    res.status(201).json(prospect);
  } catch (error) {
    console.error('Error creating prospect:', error);
    res.status(500).json({ error: 'Failed to create prospect' });
  }
});

// Update prospect
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Fetch current prospect
    const currentQuery = 'SELECT * FROM prospects WHERE id = $1 AND deleted_at IS NULL';
    const currentResult = await pool.query(currentQuery, [id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    const current = currentResult.rows[0];

    // Merge updates
    const updatedProspectData = {
      ...current.prospect_data,
      ...updates
    };

    const query = `
      UPDATE prospects 
      SET prospect_data = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, [updatedProspectData, id]);

    // Recalculate score if enrichment exists
    if (current.enrichment_data) {
      const { score } = calculateLeadScore(current.enrichment_data, updatedProspectData);
      
      const scoreQuery = `
        UPDATE prospects 
        SET opportunity_score = $1 
        WHERE id = $2
      `;
      await pool.query(scoreQuery, [score, id]);
      result.rows[0].opportunity_score = score;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating prospect:', error);
    res.status(500).json({ error: 'Failed to update prospect' });
  }
});

// Manual assignment
router.put('/:id/assign', requireAuth, requireRole(['admin', 'manager']), [
  body('agent_id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { agent_id } = req.body;

    const query = `
      UPDATE prospects 
      SET assigned_agent_id = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, [agent_id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning prospect:', error);
    res.status(500).json({ error: 'Failed to assign prospect' });
  }
});

// Delete prospect (soft delete)
router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE prospects 
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    res.json({ message: 'Prospect deleted successfully' });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    res.status(500).json({ error: 'Failed to delete prospect' });
  }
});

// Bulk actions
router.post('/bulk/assign', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { prospect_ids, agent_id } = req.body;

    if (!Array.isArray(prospect_ids) || prospect_ids.length === 0) {
      return res.status(400).json({ error: 'prospect_ids array is required' });
    }

    const query = `
      UPDATE prospects 
      SET assigned_agent_id = $1, updated_at = NOW()
      WHERE id = ANY($2) AND deleted_at IS NULL
      RETURNING id
    `;

    const result = await pool.query(query, [agent_id, prospect_ids]);

    res.json({
      message: `${result.rows.length} prospects assigned successfully`,
      assigned_count: result.rows.length
    });
  } catch (error) {
    console.error('Error bulk assigning prospects:', error);
    res.status(500).json({ error: 'Failed to bulk assign prospects' });
  }
});

module.exports = { router, calculateLeadScore };
