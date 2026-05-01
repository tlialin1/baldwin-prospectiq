const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { Readable } = require('stream');
const AWS = require('aws-sdk');
const { pool } = require('../server');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
    }
  }
});

// Validate prospect data
const validateProspectData = (data) => {
  const errors = [];
  const warnings = [];
  
  // Required fields
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  if (!data.phone || data.phone.trim().length === 0) {
    errors.push('Phone is required');
  } else if (!/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
    warnings.push('Phone number format may be invalid');
  }
  
  if (!data.email || data.email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (!data.address || data.address.trim().length === 0) {
    errors.push('Address is required');
  }
  
  // Optional fields validation
  if (data.age && (isNaN(data.age) || data.age < 18 || data.age > 120)) {
    warnings.push('Age appears to be invalid');
  }
  
  if (data.current_premium && isNaN(data.current_premium)) {
    warnings.push('Current premium should be a number');
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};

// Process CSV file
const processCSV = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(fileBuffer);
    
    stream
      .pipe(csv())
      .on('data', (data) => {
        // Clean field names and data
        const cleaned = {};
        Object.keys(data).forEach(key => {
          const cleanKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          cleaned[cleanKey] = data[key]?.trim() || '';
        });
        results.push(cleaned);
      })
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Process Excel file
const processExcel = async (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
    defval: '', 
    raw: false,
    header: 1 // Get raw data first to find header row
  });
  
  if (jsonData.length === 0) {
    return [];
  }
  
  // Find header row (first row with at least 3 non-empty cells)
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const nonEmptyCells = jsonData[i].filter(cell => cell && cell.toString().trim() !== '');
    if (nonEmptyCells.length >= 3) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    throw new Error('Could not find header row in Excel file');
  }
  
  // Re-parse with header row
  const headers = jsonData[headerRowIndex].map(header => 
    header.toString().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  );
  
  const dataRows = jsonData.slice(headerRowIndex + 1);
  
  return dataRows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index]?.toString()?.trim() || '';
    });
    return obj;
  });
};

// Upload endpoint
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create upload record
    const uploadId = uuidv4();
    const uploadRecord = {
      id: uploadId,
      filename: req.file.originalname,
      uploaded_by: req.user ? req.user.id : null,
      status: 'processing',
      created_at: new Date()
    };

    // Save upload record to database
    const insertUploadQuery = `
      INSERT INTO uploads (id, uploaded_by, filename, status, total_records)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    await pool.query(insertUploadQuery, [
      uploadRecord.id,
      uploadRecord.uploaded_by,
      uploadRecord.filename,
      uploadRecord.status,
      0
    ]);

    // Upload to S3 (in background)
    const s3Key = `uploads/${uploadId}/${req.file.originalname}`;
    
    if (process.env.ENABLE_S3_UPLOAD === 'true') {
      s3.upload({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }, (error, data) => {
        if (error) {
          console.error('S3 upload error:', error);
        } else {
          console.log('File uploaded to S3:', data.Location);
        }
      });
    }

    // Process file
    let prospects = [];
    const filename = req.file.originalname.toLowerCase();
    
    if (filename.endsWith('.csv')) {
      prospects = await processCSV(req.file.buffer);
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      prospects = await processExcel(req.file.buffer);
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    if (prospects.length === 0) {
      return res.status(400).json({ error: 'No data found in file' });
    }

    // Validate and filter prospects
    const validProspects = [];
    const errors = [];
    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < prospects.length; i++) {
      const prospect = prospects[i];
      const rowNumber = i + 2; // +2 for header row and 1-based indexing
      
      const validation = validateProspectData(prospect);
      
      if (validation.isValid) {
        validProspects.push({
          ...prospect,
          age: prospect.age ? parseInt(prospect.age) : null,
          current_premium: prospect.current_premium ? parseFloat(prospect.current_premium) : null
        });
        processedCount++;
      } else {
        errorCount++;
        errors.push({
          row: rowNumber,
          errors: validation.errors,
          warnings: validation.warnings,
          data: prospect
        });
      }
    }

    // Update upload record with counts
    const updateUploadQuery = `
      UPDATE uploads 
      SET total_records = $1, processed_records = $2, error_records = $3, status = $4
      WHERE id = $5
    `;

    await pool.query(updateUploadQuery, [
      prospects.length,
      processedCount,
      errorCount,
      'completed',
      uploadId
    ]);

    // Create prospects in database
    const createdProspects = [];
    
    for (const prospect of validProspects) {
      try {
        const query = `
          INSERT INTO prospects (agent_id, prospect_data, enrichment_data, opportunity_score, status, source, upload_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const prospectData = {
          ...prospect,
          created_by: req.user ? req.user.id : null,
          created_at: new Date().toISOString()
        };

        const result = await pool.query(query, [
          req.user ? req.user.id : null,
          prospectData,
          null, // enrichment_data
          null, // opportunity_score - will be calculated after enrichment
          'pending',
          'upload',
          uploadId
        ]);

        createdProspects.push(result.rows[0]);

        // Trigger enrichment
        setImmediate(async () => {
          try {
            await axios.post(`${process.env.ENRICHMENT_SERVICE_URL}/enrich`, {
              prospect_id: result.rows[0].id,
              data: prospectData
            });
          } catch (error) {
            console.error('Failed to trigger enrichment:', error.message);
          }
        });

      } catch (error) {
        console.error('Error creating prospect:', error);
        errorCount++;
        errors.push({
          row: prospect.rowNumber,
          errors: ['Failed to save to database'],
          data: prospect
        });
      }
    }

    // Return final response
    res.json({
      message: 'File uploaded and processed successfully',
      upload_id: uploadId,
      total_records: prospects.length,
      processed: processedCount,
      errors: errorCount,
      error_details: errors.slice(0, 50), // Limit to first 50 errors
      prospects: createdProspects.slice(0, 10) // Return first 10 for preview
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

// Get upload history
router.get('/history', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.*,
        a.name as uploaded_by_name
      FROM uploads u
      LEFT JOIN agents a ON u.uploaded_by = a.id
      ORDER BY u.created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching upload history:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

// Get upload details
router.get('/history/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;

    const uploadQuery = `
      SELECT 
        u.*,
        a.name as uploaded_by_name
      FROM uploads u
      LEFT JOIN agents a ON u.uploaded_by = a.id
      WHERE u.id = $1
    `;

    const uploadResult = await pool.query(uploadQuery, [uploadId]);

    if (uploadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    const prospectsQuery = `
      SELECT id, prospect_data, status, opportunity_score, created_at
      FROM prospects 
      WHERE upload_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const prospectsResult = await pool.query(prospectsQuery, [uploadId]);

    res.json({
      upload: uploadResult.rows[0],
      prospects: prospectsResult.rows
    });
  } catch (error) {
    console.error('Error fetching upload details:', error);
    res.status(500).json({ error: 'Failed to fetch upload details' });
  }
});

module.exports = router;
