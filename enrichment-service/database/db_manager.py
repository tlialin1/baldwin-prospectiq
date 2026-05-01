"""
Database Manager for Enrichment Service
Handles database operations for prospects, enrichment logs, and triggers
"""

import os
import psycopg2
import psycopg2.extras
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages database connections and operations for enrichment service"""
    
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(
                host=os.getenv("DB_HOST", "localhost"),
                database=os.getenv("DB_NAME", "baldwin_insurance"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", ""),
                port=os.getenv("DB_PORT", "5432")
            )
            self.connection.autocommit = False
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
    
    def get_prospect(self, prospect_id: str) -> Optional[Dict[str, Any]]:
        """Get prospect by ID"""
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                query = """
                    SELECT * FROM prospects 
                    WHERE id = %s AND deleted_at IS NULL
                """
                cursor.execute(query, (prospect_id,))
                result = cursor.fetchone()
                return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error fetching prospect {prospect_id}: {str(e)}")
            return None
    
    def get_pending_enrichments(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get prospects pending enrichment"""
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                query = """
                    SELECT id, prospect_data 
                    FROM prospects 
                    WHERE enrichment_data IS NULL 
                    AND deleted_at IS NULL
                    ORDER BY created_at ASC
                    LIMIT %s
                """
                cursor.execute(query, (limit,))
                results = cursor.fetchall()
                return [dict(row) for row in results]
        except Exception as e:
            logger.error(f"Error fetching pending enrichments: {str(e)}")
            return []
    
    def save_enrichment(
        self, 
        prospect_id: str, 
        enrichment_data: Dict[str, Any], 
        confidence: float
    ):
        """Save enrichment data to prospect record"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                    UPDATE prospects 
                    SET enrichment_data = %s, 
                        enrichment_confidence = %s,
                        updated_at = NOW()
                    WHERE id = %s
                """
                cursor.execute(
                    query, 
                    (psycopg2.extras.Json(enrichment_data), confidence, prospect_id)
                )
                self.connection.commit()
                logger.info(f"Saved enrichment data for prospect {prospect_id}")
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error saving enrichment for {prospect_id}: {str(e)}")
            raise
    
    def update_lead_score(self, prospect_id: str, score: int):
        """Update prospect's lead score"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                    UPDATE prospects 
                    SET opportunity_score = %s,
                        updated_at = NOW()
                    WHERE id = %s
                """
                cursor.execute(query, (score, prospect_id))
                self.connection.commit()
                logger.info(f"Updated lead score for {prospect_id}: {score}")
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error updating score for {prospect_id}: {str(e)}")
            raise
    
    def log_enrichment_attempt(
        self,
        prospect_id: str,
        enrichment_source: str,
        data_fetched: Dict[str, Any],
        confidence: float,
        status: str = 'success'
    ):
        """Log enrichment attempt to audit trail"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                    INSERT INTO lead_enrichment_log 
                    (prospect_id, enrichment_source, data_fetched, confidence, status)
                    VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(
                    query,
                    (
                        prospect_id,
                        enrichment_source,
                        psycopg2.extras.Json(data_fetched),
                        confidence,
                        status
                    )
                )
                self.connection.commit()
                logger.debug(f"Logged enrichment attempt for {prospect_id}")
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error logging enrichment for {prospect_id}: {str(e)}")
    
    def get_enrichment_log(self, prospect_id: str) -> List[Dict[str, Any]]:
        """Get enrichment history for a prospect"""
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                query = """
                    SELECT * FROM lead_enrichment_log 
                    WHERE prospect_id = %s 
                    ORDER BY created_at DESC
                """
                cursor.execute(query, (prospect_id,))
                results = cursor.fetchall()
                return [dict(row) for row in results]
        except Exception as e:
            logger.error(f"Error fetching enrichment log for {prospect_id}: {str(e)}")
            return []
    
    def log_trigger_action(
        self,
        prospect_id: str,
        trigger_type: str,
        action_taken: Dict[str, Any],
        status: str = 'completed'
    ):
        """Log triggered action"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                    INSERT INTO lead_triggers 
                    (prospect_id, trigger_type, action_taken, status)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(
                    query,
                    (
                        prospect_id,
                        trigger_type,
                        psycopg2.extras.Json(action_taken),
                        status
                    )
                )
                self.connection.commit()
                logger.info(f"Logged trigger action for {prospect_id}: {trigger_type}")
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error logging trigger for {prospect_id}: {str(e)}")
    
    def get_trigger_history(self, prospect_id: str) -> List[Dict[str, Any]]:
        """Get trigger history for a prospect"""
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                query = """
                    SELECT * FROM lead_triggers 
                    WHERE prospect_id = %s 
                    ORDER BY executed_at DESC
                """
                cursor.execute(query, (prospect_id,))
                results = cursor.fetchall()
                return [dict(row) for row in results]
        except Exception as e:
            logger.error(f"Error fetching trigger history for {prospect_id}: {str(e)}")
            return []
    
    def assign_agent(self, prospect_id: str, agent_id: str):
        """Assign prospect to agent"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                    UPDATE prospects 
                    SET assigned_agent_id = %s,
                        status = 'assigned',
                        updated_at = NOW()
                    WHERE id = %s
                """
                cursor.execute(query, (agent_id, prospect_id))
                self.connection.commit()
                logger.info(f"Assigned prospect {prospect_id} to agent {agent_id}")
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error assigning agent for {prospect_id}: {str(e)}")
            raise
    
    def get_top_agents(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top performing agents for lead assignment"""
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                query = """
                    SELECT 
                        a.id,
                        a.name,
                        COALESCE(AVG(s.sale_amount), 0) as avg_sale_amount,
                        COUNT(s.id) as total_sales,
                        COALESCE(AVG(s.customer_satisfaction), 0) as avg_satisfaction
                    FROM agents a
                    LEFT JOIN sales_records s ON a.id = s.agent_id
                    WHERE a.active = true
                    GROUP BY a.id
                    ORDER BY avg_sale_amount DESC, total_sales DESC
                    LIMIT %s
                """
                cursor.execute(query, (limit,))
                results = cursor.fetchall()
                return [dict(row) for row in results]
        except Exception as e:
            logger.error(f"Error fetching top agents: {str(e)}")
            return []
    
    def get_next_agent_for_round_robin(self) -> Optional[str]:
        """Get next agent for round-robin assignment"""
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                query = """
                    SELECT id 
                    FROM agents 
                    WHERE active = true AND role = 'agent'
                    ORDER BY last_assigned_at ASC NULLS FIRST
                    LIMIT 1
                """
                cursor.execute(query)
                result = cursor.fetchone()
                
                if result:
                    agent_id = result['id']
                    
                    # Update last_assigned_at
                    update_query = """
                        UPDATE agents 
                        SET last_assigned_at = NOW()
                        WHERE id = %s
                    """
                    cursor.execute(update_query, (agent_id,))
                    self.connection.commit()
                    
                    return agent_id
                
                return None
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error getting round-robin agent: {str(e)}")
            return None
    
    def update_prospect_status(self, prospect_id: str, status: str):
        """Update prospect status"""
        try:
            with self.connection.cursor() as cursor:
                query = """
                    UPDATE prospects 
                    SET status = %s,
                        updated_at = NOW()
                    WHERE id = %s
                """
                cursor.execute(query, (status, prospect_id))
                self.connection.commit()
                logger.info(f"Updated prospect {prospect_id} status to {status}")
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error updating status for {prospect_id}: {str(e)}")
            raise
    
    def get_prospects_by_score_range(self, min_score: int, max_score: int) -> List[Dict[str, Any]]:
        """Get prospects within a score range"""
        try:
            with self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                query = """
                    SELECT * FROM prospects 
                    WHERE opportunity_score BETWEEN %s AND %s
                    AND enrichment_data IS NOT NULL
                    AND deleted_at IS NULL
                    ORDER BY opportunity_score DESC
                """
                cursor.execute(query, (min_score, max_score))
                results = cursor.fetchall()
                return [dict(row) for row in results]
        except Exception as e:
            logger.error(f"Error fetching prospects by score range: {str(e)}")
            return []

if __name__ == "__main__":
    # Test database connection
    db = DatabaseManager()
    
    # Test fetching pending enrichments
    pending = db.get_pending_enrichments(10)
    print(f"Found {len(pending)} prospects pending enrichment")
    
    # Test getting a prospect
    if pending:
        prospect_id = pending[0]['id']
        prospect = db.get_prospect(prospect_id)
        print(f"Sample prospect: {prospect}")
    
    db.close()
