"""
Trigger Engine
Handles automated actions based on lead scores and conditions
"""

import asyncio
import logging
from typing import Dict, Any, List, Callable
from datetime import datetime, timedelta
import os
import requests

logger = logging.getLogger(__name__)

class TriggerEngine:
    """
    Event-driven trigger system that executes actions based on prospect conditions
    """
    
    def __init__(self):
        self.triggers = self._initialize_triggers()
        self.action_handlers = self._initialize_action_handlers()
        self.db_manager = None  # Will be set when needed
        
    def set_db_manager(self, db_manager):
        """Set database manager for persistence"""
        self.db_manager = db_manager
    
    def _initialize_triggers(self) -> List[Dict[str, Any]]:
        """Define all automated triggers and their conditions"""
        return [
            {
                "id": "hot_lead_assignment",
                "name": "Hot Lead Auto-Assignment",
                "description": "Automatically assign hot leads to top agents",
                "condition": self._check_hot_lead,
                "actions": [
                    "assign_to_top_agent",
                    "send_agent_notification",
                    "add_to_priority_queue",
                    "schedule_follow_up"
                ],
                "enabled": True
            },
            {
                "id": "new_homeowner_mortgage",
                "name": "New Homeowner - Mortgage Protection",
                "description": "Enroll new homeowners in mortgage protection campaign",
                "condition": self._check_new_homeowner,
                "actions": [
                    "enroll_mortgage_campaign",
                    "tag_mortgage_protection"
                ],
                "enabled": True
            },
            {
                "id": "senior_final_expense",
                "name": "Senior - Final Expense Planning",
                "description": "Trigger final expense planning for seniors",
                "condition": self._check_senior_prospect,
                "actions": [
                    "enroll_final_expense_campaign",
                    "schedule_senior_callback"
                ],
                "enabled": True
            },
            {
                "id": "low_confidence_review",
                "name": "Low Confidence Manual Review",
                "description": "Flag prospects with low enrichment confidence",
                "condition": self._check_low_confidence,
                "actions": [
                    "flag_manual_review",
                    "add_to_admin_queue"
                ],
                "enabled": True
            },
            {
                "id": "cold_lead_nurture",
                "name": "Cold Lead Educational Nurture",
                "description": "Add cold leads to educational newsletter",
                "condition": self._check_cold_lead,
                "actions": [
                    "add_to_newsletter",
                    "suppress_sales_outreach"
                ],
                "enabled": True
            }
        ]
    
    def _initialize_action_handlers(self) -> Dict[str, Callable]:
        """Map action names to handler functions"""
        return {
            "assign_to_top_agent": self._assign_to_top_agent,
            "send_agent_notification": self._send_agent_notification,
            "add_to_priority_queue": self._add_to_priority_queue,
            "schedule_follow_up": self._schedule_follow_up,
            "enroll_mortgage_campaign": self._enroll_mortgage_campaign,
            "tag_mortgage_protection": self._tag_mortgage_protection,
            "enroll_final_expense_campaign": self._enroll_final_expense_campaign,
            "schedule_senior_callback": self._schedule_senior_callback,
            "flag_manual_review": self._flag_manual_review,
            "add_to_admin_queue": self._add_to_admin_queue,
            "add_to_newsletter": self._add_to_newsletter,
            "suppress_sales_outreach": self._suppress_sales_outreach
        }
    
    async def process_triggers(
        self, 
        prospect_id: str, 
        score: int, 
        enrichment_data: Dict[str, Any], 
        status: str
    ):
        """
        Process all triggers for a prospect
        
        Args:
            prospect_id: Prospect UUID
            score: Calculated lead score (0-100)
            enrichment_data: Enriched prospect data
            status: Current prospect status
        """
        try:
            logger.info(f"Processing triggers for prospect {prospect_id} (score: {score})")
            
            triggered_actions = []
            
            # Check each trigger
            for trigger in self.triggers:
                if not trigger["enabled"]:
                    continue
                
                try:
                    # Check if trigger condition is met
                    if trigger["condition"](prospect_id, score, enrichment_data, status):
                        logger.info(f"Trigger {trigger['id']} activated for {prospect_id}")
                        
                        # Execute all actions for this trigger
                        for action_name in trigger["actions"]:
                            try:
                                handler = self.action_handlers.get(action_name)
                                if handler:
                                    result = await handler(prospect_id, score, enrichment_data)
                                    triggered_actions.append({
                                        "trigger_id": trigger["id"],
                                        "action": action_name,
                                        "result": result
                                    })
                                    
                                    # Log the triggered action
                                    if self.db_manager:
                                        self.db_manager.log_trigger_action(
                                            prospect_id,
                                            trigger["id"],
                                            {
                                                "action": action_name,
                                                "result": result,
                                                "score": score
                                            }
                                        )
                            except Exception as e:
                                logger.error(f"Action {action_name} failed: {str(e)}")
                                
                except Exception as e:
                    logger.error(f"Trigger {trigger['id']} check failed: {str(e)}")
            
            logger.info(f"Completed processing {len(triggered_actions)} actions for {prospect_id}")
            return triggered_actions
            
        except Exception as e:
            logger.error(f"Trigger processing failed for {prospect_id}: {str(e)}")
            raise
    
    # Trigger condition checkers
    def _check_hot_lead(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any], status: str) -> bool:
        """Check if prospect is a hot lead (score >= 75)"""
        return score >= 75 and status == "pending"
    
    def _check_new_homeowner(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any], status: str) -> bool:
        """Check if new homeowner with good score"""
        if score < 60:
            return False
        
        life_events = enrichment_data.get("life_events", {})
        return life_events.get("home_purchase_last_18_months", False)
    
    def _check_senior_prospect(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any], status: str) -> bool:
        """Check if senior prospect (age >= 60) with decent score"""
        if score < 50:
            return False
        
        demographics = enrichment_data.get("demographics", {})
        age = demographics.get("age", 0)
        return age >= 60
    
    def _check_low_confidence(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any], status: str) -> bool:
        """Check if enrichment confidence is low (< 0.7)"""
        confidence = enrichment_data.get("confidence", 0.0)
        return confidence < 0.7
    
    def _check_cold_lead(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any], status: str) -> bool:
        """Check if cold lead (score < 30) that was imported"""
        # Note: In production, check if source == 'upload'
        return score < 30
    
    # Action handlers
    async def _assign_to_top_agent(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assign prospect to top-performing agent"""
        try:
            logger.info(f"Assigning prospect {prospect_id} to top agent")
            
            if not self.db_manager:
                raise Exception("Database manager not configured")
            
            # Get top agents
            top_agents = self.db_manager.get_top_agents(limit=3)
            
            if not top_agents:
                # Fallback to round-robin
                agent_id = self.db_manager.get_next_agent_for_round_robin()
                if not agent_id:
                    raise Exception("No available agents")
            else:
                # Pick top agent with lowest recent load
                agent_id = top_agents[0]['id']
            
            # Assign prospect
            self.db_manager.assign_agent(prospect_id, agent_id)
            
            return {
                "success": True,
                "action": "assigned_to_agent",
                "agent_id": agent_id,
                "agent_name": top_agents[0]['name'] if top_agents else "Auto-assigned"
            }
            
        except Exception as e:
            logger.error(f"Failed to assign agent: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _send_agent_notification(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send SMS notification to assigned agent"""
        try:
            # Get prospect and agent details
            if not self.db_manager:
                raise Exception("Database manager not configured")
            
            prospect = self.db_manager.get_prospect(prospect_id)
            if not prospect:
                raise Exception("Prospect not found")
            
            agent_id = prospect.get('assigned_agent_id')
            if not agent_id:
                logger.warning(f"No agent assigned to {prospect_id}, skipping notification")
                return {"success": False, "error": "No agent assigned"}
            
            prospect_name = prospect['prospect_data'].get('name', 'Unknown')
            
            # In production, send actual SMS via Twilio
            sms_message = f"🚨 HOT LEAD ALERT! {prospect_name} - Score: {score}/100. Call within 24h!"
            
            # Mock SMS sending
            logger.info(f"SMS to agent {agent_id}: {sms_message}")
            
            # For demo, show how to call Twilio if configured
            if os.getenv("TWILIO_ENABLED") == "true":
                self._send_twilio_sms(agent_id, sms_message)
            
            return {
                "success": True,
                "action": "sms_sent",
                "message": sms_message
            }
            
        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _add_to_priority_queue(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add prospect to priority queue"""
        try:
            # Update prospect status to priority
            if self.db_manager:
                self.db_manager.update_prospect_status(prospect_id, "priority")
            
            # In production, add to priority queue system
            logger.info(f"Added prospect {prospect_id} to priority queue")
            
            return {
                "success": True,
                "action": "added_to_priority_queue",
                "score": score
            }
            
        except Exception as e:
            logger.error(f"Failed to add to priority queue: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _schedule_follow_up(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule follow-up reminder in CRM"""
        try:
            # In production, integrate with CRM system
            follow_up_date = datetime.utcnow() + timedelta(days=1)
            
            logger.info(f"Scheduled follow-up for {prospect_id} on {follow_up_date}")
            
            return {
                "success": True,
                "action": "follow_up_scheduled",
                "follow_up_date": follow_up_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to schedule follow-up: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _enroll_mortgage_campaign(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enroll in mortgage protection email campaign"""
        try:
            # In production, integrate with email marketing platform
            logger.info(f"Enrolled prospect {prospect_id} in mortgage protection campaign")
            
            # Update prospect tags/attributes
            if self.db_manager:
                # Would store campaign enrollment in database
                pass
            
            return {
                "success": True,
                "action": "enrolled_in_mortgage_campaign",
                "campaign": "mortgage_protection_7_email"
            }
            
        except Exception as e:
            logger.error(f"Failed to enroll in mortgage campaign: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _tag_mortgage_protection(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Tag prospect with mortgage protection interest"""
        try:
            logger.info(f"Tagged prospect {prospect_id} with mortgage_protection_interest")
            
            return {
                "success": True,
                "action": "tag_added",
                "tag": "mortgage_protection_interest"
            }
            
        except Exception as e:
            logger.error(f"Failed to add tag: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _enroll_final_expense_campaign(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enroll in final expense planning campaign"""
        try:
            logger.info(f"Enrolled prospect {prospect_id} in final expense campaign")
            
            return {
                "success": True,
                "action": "enrolled_in_final_expense_campaign",
                "campaign": "final_expense_senior_nurture"
            }
            
        except Exception as e:
            logger.error(f"Failed to enroll in final expense campaign: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _schedule_senior_callback(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule callback for senior prospect"""
        try:
            callback_date = datetime.utcnow() + timedelta(hours=48)
            
            logger.info(f"Scheduled senior callback for {prospect_id}: {callback_date}")
            
            return {
                "success": True,
                "action": "senior_callback_scheduled",
                "callback_date": callback_date.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to schedule senior callback: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _flag_manual_review(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Flag prospect for manual verification"""
        try:
            if self.db_manager:
                self.db_manager.update_prospect_status(prospect_id, "review_needed")
            
            logger.info(f"Flagged prospect {prospect_id} for manual review")
            
            return {
                "success": True,
                "action": "flagged_for_review",
                "reason": "low_enrichment_confidence"
            }
            
        except Exception as e:
            logger.error(f"Failed to flag for review: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _add_to_admin_queue(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add to admin review queue"""
        try:
            logger.info(f"Added prospect {prospect_id} to admin review queue")
            
            # In production, add to admin dashboard queue
            return {
                "success": True,
                "action": "added_to_admin_queue"
            }
            
        except Exception as e:
            logger.error(f"Failed to add to admin queue: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _add_to_newsletter(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add to educational newsletter list"""
        try:
            logger.info(f"Added prospect {prospect_id} to educational newsletter")
            
            # In production, integrate with email platform
            return {
                "success": True,
                "action": "added_to_newsletter",
                "list": "educational_monthly_newsletter"
            }
            
        except Exception as e:
            logger.error(f"Failed to add to newsletter: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _suppress_sales_outreach(self, prospect_id: str, score: int, enrichment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Suppress immediate sales outreach"""
        try:
            if self.db_manager:
                self.db_manager.update_prospect_status(prospect_id, "nurture")
            
            logger.info(f"Suppressed sales outreach for prospect {prospect_id}")
            
            return {
                "success": True,
                "action": "sales_outreach_suppressed"
            }
            
        except Exception as e:
            logger.error(f"Failed to suppress outreach: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _send_twilio_sms(self, agent_id: str, message: str):
        """Helper to send SMS via Twilio (mock implementation)"""
        try:
            # In production, use actual Twilio SDK
            account_sid = os.getenv("TWILIO_ACCOUNT_SID")
            auth_token = os.getenv("TWILIO_AUTH_TOKEN")
            from_number = os.getenv("TWILIO_FROM_NUMBER")
            
            logger.info(f"[TWILIO] SMS prepared: {message}")
            logger.info(f"[TWILIO] From: {from_number}, To Agent: {agent_id}")
            
            # Mock implementation
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Twilio SMS failed: {str(e)}")
            return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import asyncio
    
    async def test_trigger_engine():
        """Test the trigger engine"""
        
        # Create mock data
        enrichment_data = {
            "life_events": {
                "home_purchase_last_18_months": True
            },
            "demographics": {
                "age": 35,
                "household_size": 4
            },
            "confidence": 0.85
        }
        
        # Test trigger engine
        engine = TriggerEngine()
        
        # Test hot lead detection
        is_hot = engine._check_hot_lead("test-id", 80, enrichment_data, "pending")
        print(f"Hot lead detected: {is_hot}")
        
        is_new_homeowner = engine._check_new_homeowner("test-id", 65, enrichment_data, "pending")
        print(f"New homeowner detected: {is_new_homeowner}")
        
        print("\nAll triggers defined:")
        for trigger in engine.triggers:
            print(f"- {trigger['id']}: {trigger['description']}")
            print(f"  Actions: {', '.join(trigger['actions'])}")
            print()
    
    # Run test
    asyncio.run(test_trigger_engine())
