from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
import logging
import sys

from enrichment.enricher import ProspectEnricher
from database.db_manager import DatabaseManager
from triggers.trigger_engine import TriggerEngine
from scoring.scorer import LeadScorer
from api_clients.mock_api_client import MockAPIClient

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('enrichment_service.log')
    ]
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Baldwin Lead Enrichment Service",
    description="Microservice for enriching prospect data and scoring leads",
    version="1.0.0"
)

# Initialize components
db_manager = DatabaseManager()
enricher = ProspectEnricher()
trigger_engine = TriggerEngine()
scorer = LeadScorer()

# Pydantic models
class EnrichmentRequest(BaseModel):
    prospect_id: str
    data: Dict[str, Any]
    force: Optional[bool] = False

class EnrichmentResponse(BaseModel):
    prospect_id: str
    status: str
    message: str
    enrichment_data: Optional[Dict[str, Any]] = None
    score: Optional[int] = None

class HealthResponse(BaseModel):
    status: str
    timestamp: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/enrich", response_model=EnrichmentResponse)
async def enrich_prospect(request: EnrichmentRequest, background_tasks: BackgroundTasks):
    """
    Enrich a single prospect's data
    - Fetches data from external APIs
    - Calculates lead score
    - Triggers automated actions
    """
    try:
        logger.info(f"Starting enrichment for prospect {request.prospect_id}")
        
        # Check if prospect exists
        prospect = db_manager.get_prospect(request.prospect_id)
        if not prospect:
            raise HTTPException(status_code=404, detail="Prospect not found")
        
        # Skip if already enriched and not forcing
        if prospect.get('enrichment_data') and not request.force:
            logger.info(f"Prospect {request.prospect_id} already enriched, skipping")
            return EnrichmentResponse(
                prospect_id=request.prospect_id,
                status="skipped",
                message="Prospect already enriched. Use force=true to override."
            )
        
        # Perform enrichment
        logger.info(f"Fetching enrichment data for prospect {request.prospect_id}")
        enrichment_result = await enricher.enrich_prospect(request.data)
        
        if not enrichment_result:
            raise HTTPException(status_code=500, detail="Enrichment failed")
        
        # Calculate confidence score
        confidence_score = enrichment_result.get('confidence', 0.0)
        
        # Save enrichment data
        db_manager.save_enrichment(
            request.prospect_id,
            enrichment_result,
            confidence_score
        )
        
        # Calculate lead score
        logger.info(f"Calculating score for prospect {request.prospect_id}")
        lead_score = scorer.calculate_score(enrichment_result, request.data)
        
        # Save lead score
        db_manager.update_lead_score(request.prospect_id, lead_score)
        
        # Trigger automated actions (run in background)
        background_tasks.add_task(
            trigger_engine.process_triggers,
            request.prospect_id,
            lead_score,
            enrichment_result,
            prospect.get('status', 'pending')
        )
        
        logger.info(f"Completed enrichment for prospect {request.prospect_id}. Score: {lead_score}")
        
        return EnrichmentResponse(
            prospect_id=request.prospect_id,
            status="success",
            message="Enrichment completed successfully",
            enrichment_data=enrichment_result,
            score=lead_score
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enriching prospect {request.prospect_id}: {str(e)}")
        
        # Log enrichment failure
        db_manager.log_enrichment_attempt(
            request.prospect_id,
            'enrichment_service',
            {'error': str(e)},
            0.0,
            'failed'
        )
        
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {str(e)}")

@app.post("/enrich/batch")
async def enrich_batch(background_tasks: BackgroundTasks):
    """
    Enrich all pending prospects (triggered by scheduler)
    """
    try:
        logger.info("Starting batch enrichment for pending prospects")
        
        # Get all prospects without enrichment data
        pending_prospects = db_manager.get_pending_enrichments()
        
        if not pending_prospects:
            return {"message": "No pending prospects to enrich"}
        
        # Queue each prospect for enrichment
        enriched_count = 0
        for prospect in pending_prospects:
            try:
                background_tasks.add_task(
                    process_single_enrichment,
                    prospect['id'],
                    prospect['prospect_data']
                )
                enriched_count += 1
            except Exception as e:
                logger.error(f"Failed to queue prospect {prospect['id']}: {str(e)}")
        
        logger.info(f"Queued {enriched_count} prospects for enrichment")
        
        return {
            "message": f"Queued {enriched_count} prospects for enrichment",
            "count": enriched_count
        }
        
    except Exception as e:
        logger.error(f"Batch enrichment failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/enrich/status/{prospect_id}")
async def get_enrichment_status(prospect_id: str):
    """Get enrichment status for a prospect"""
    try:
        prospect = db_manager.get_prospect(prospect_id)
        if not prospect:
            raise HTTPException(status_code=404, detail="Prospect not found")
        
        enrichment_log = db_manager.get_enrichment_log(prospect_id)
        
        return {
            "prospect_id": prospect_id,
            "enriched": prospect.get('enrichment_data') is not None,
            "enrichment_data": prospect.get('enrichment_data'),
            "confidence": prospect.get('enrichment_confidence'),
            "score": prospect.get('opportunity_score'),
            "enrichment_history": enrichment_log
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching enrichment status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper function for background processing
async def process_single_enrichment(prospect_id: str, prospect_data: dict):
    """Process enrichment for a single prospect"""
    try:
        # Mock API client for development
        mock_client = MockAPIClient()
        
        # Perform enrichment
        enrichment_result = await enricher.enrich_prospect(prospect_data, mock_client)
        
        if enrichment_result:
            # Save enrichment data
            confidence = enrichment_result.get('confidence', 0.0)
            db_manager.save_enrichment(prospect_id, enrichment_result, confidence)
            
            # Calculate and save score
            lead_score = scorer.calculate_score(enrichment_result, prospect_data)
            db_manager.update_lead_score(prospect_id, lead_score)
            
            # Process triggers
            prospect = db_manager.get_prospect(prospect_id)
            await trigger_engine.process_triggers(
                prospect_id,
                lead_score,
                enrichment_result,
                prospect.get('status', 'pending')
            )
            
            logger.info(f"Background enrichment completed for {prospect_id}")
        
    except Exception as e:
        logger.error(f"Background enrichment failed for {prospect_id}: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    from datetime import datetime
    
    uvicorn.run(
        "main:app",
        host=os.getenv("ENRICHMENT_SERVICE_HOST", "0.0.0.0"),
        port=int(os.getenv("ENRICHMENT_SERVICE_PORT", "8000")),
        reload=os.getenv("ENVIRONMENT") == "development",
        log_level="info"
    )
else:
    from datetime import datetime