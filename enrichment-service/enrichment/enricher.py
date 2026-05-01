import json
import asyncio
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime, timedelta
from api_clients.zillow_client import ZillowClient
from api_clients.data_axle_client import DataAxleClient
from api_clients.social_client import SocialClient
from api_clients.insurance_client import InsuranceClient
from api_clients.mock_api_client import MockAPIClient

logger = logging.getLogger(__name__)

class ProspectEnricher:
    """
    Enriches prospect data from multiple external sources
    Aggregates data and calculates confidence scores
    """
    
    def __init__(self):
        self.zillow_client = ZillowClient()
        self.data_axle_client = DataAxleClient()
        self.social_client = SocialClient()
        self.insurance_client = InsuranceClient()
        self.mock_client = MockAPIClient()
        
    async def enrich_prospect(
        self, 
        prospect_data: Dict[str, Any], 
        mock_client: Optional[MockAPIClient] = None
    ) -> Dict[str, Any]:
        """
        Enrich prospect data from all available sources
        
        Args:
            prospect_data: Basic prospect information
            mock_client: Optional mock client for testing
            
        Returns:
            Enriched data dictionary with confidence scores
        """
        try:
            logger.info(f"Starting enrichment for {prospect_data.get('name', 'Unknown')}")
            
            # Use mock client if provided or in development mode
            client_to_use = mock_client or self.mock_client
            if os.getenv("USE_MOCK_APIS") == "true":
                client_to_use = self.mock_client
            
            # Run all enrichment tasks concurrently
            tasks = [
                self._enrich_property_data(client_to_use, prospect_data),
                self._enrich_demographics(client_to_use, prospect_data),
                self._enrich_social_profiles(client_to_use, prospect_data),
                self._enrich_insurance_data(client_to_use, prospect_data),
                self._enrich_behavioral_data(client_to_use, prospect_data)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Aggregate results
            enrichment_data = {
                "enriched_at": datetime.utcnow().isoformat(),
                "sources": {},
                "property": {},
                "demographics": {},
                "social": {},
                "insurance": {},
                "behavioral": {},
                "life_events": {},
                "financial": {},
                "confidence": 0.0
            }
            
            confidence_scores = []
            success_count = 0
            
            # Process each result
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.warning(f"Enrichment task {i} failed: {str(result)}")
                    continue
                    
                if result and result.get("success"):
                    source_name = result.get("source")
                    enrichment_data["sources"][source_name] = result.get("confidence", 0.0)
                    enrichment_data.update(result.get("data", {}))
                    confidence_scores.append(result.get("confidence", 0.0))
                    success_count += 1
            
            # Calculate overall confidence
            if confidence_scores:
                enrichment_data["confidence"] = sum(confidence_scores) / len(confidence_scores)
            else:
                enrichment_data["confidence"] = 0.0
            
            # Detect life events
            self._detect_life_events(enrichment_data, prospect_data)
            
            logger.info(f"Enrichment completed. Sources: {success_count}, Confidence: {enrichment_data['confidence']:.2f}")
            
            return enrichment_data
            
        except Exception as e:
            logger.error(f"Enrichment failed: {str(e)}")
            raise
    
    async def _enrich_property_data(
        self, 
        client: Any, 
        prospect_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enrich property data from Zillow/similar services"""
        try:
            address = prospect_data.get("address")
            if not address:
                return {"success": False, "error": "No address provided"}
            
            property_data = await client.get_property_data(address)
            
            return {
                "success": True,
                "source": "property",
                "confidence": property_data.get("confidence", 0.8),
                "data": {
                    "property": property_data,
                    "financial": {
                        "property_value": property_data.get("estimated_value"),
                        "property_type": property_data.get("home_type"),
                        "year_built": property_data.get("year_built"),
                        "square_footage": property_data.get("square_footage")
                    }
                }
            }
            
        except Exception as e:
            logger.warning(f"Property enrichment failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _enrich_demographics(
        self, 
        client: Any, 
        prospect_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enrich demographic data from Data Axle/Whitepages"""
        try:
            name = prospect_data.get("name")
            address = prospect_data.get("address")
            
            if not name or not address:
                return {"success": False, "error": "Name and address required"}
            
            demo_data = await client.get_demographic_data(name, address)
            
            return {
                "success": True,
                "source": "demographics",
                "confidence": demo_data.get("confidence", 0.7),
                "data": {
                    "demographics": {
                        "age": demo_data.get("estimated_age"),
                        "age_range": demo_data.get("age_range"),
                        "family_size": demo_data.get("household_size"),
                        "household_income": demo_data.get("household_income"),
                        "income_range": demo_data.get("income_range")
                    },
                    "financial": {
                        "household_income": demo_data.get("household_income")
                    }
                }
            }
            
        except Exception as e:
            logger.warning(f"Demographics enrichment failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _enrich_social_profiles(
        self, 
        client: Any, 
        prospect_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enrich social profile data"""
        try:
            name = prospect_data.get("name")
            email = prospect_data.get("email")
            
            if not name or not email:
                return {"success": False, "error": "Name and email required"}
            
            social_data = await client.get_social_profiles(name, email)
            
            return {
                "success": True,
                "source": "social",
                "confidence": social_data.get("confidence", 0.6),
                "data": {
                    "social": social_data,
                    "behavioral": {
                        "linked_to_baldwin_agent": self._check_baldwin_connection(social_data)
                    }
                }
            }
            
        except Exception as e:
            logger.warning(f"Social enrichment failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _enrich_insurance_data(
        self, 
        client: Any, 
        prospect_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enrich insurance-related data"""
        try:
            name = prospect_data.get("name")
            address = prospect_data.get("address")
            
            if not name or not address:
                return {"success": False, "error": "Name and address required"}
            
            insurance_data = await client.get_insurance_data(name, address)
            
            # Combine with provided data
            current_carrier = prospect_data.get("current_carrier")
            current_premium = prospect_data.get("current_premium")
            
            if current_carrier:
                insurance_data["current_carrier"] = current_carrier
            if current_premium:
                insurance_data["current_premium"] = current_premium
            
            return {
                "success": True,
                "source": "insurance",
                "confidence": insurance_data.get("confidence", 0.75),
                "data": {
                    "insurance": insurance_data,
                    "risk": {
                        "has_life_insurance": insurance_data.get("has_life_insurance", False),
                        "coverage_gap_identified": insurance_data.get("coverage_gap", False)
                    },
                    "financial": {
                        "current_premium": current_premium
                    }
                }
            }
            
        except Exception as e:
            logger.warning(f"Insurance enrichment failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _enrich_behavioral_data(
        self, 
        client: Any, 
        prospect_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enrich behavioral data"""
        try:
            email = prospect_data.get("email")
            
            if not email:
                return {"success": False, "error": "Email required"}
            
            behavioral_data = await client.get_behavioral_data(email)
            
            return {
                "success": True,
                "source": "behavioral",
                "confidence": behavioral_data.get("confidence", 0.5),
                "data": {
                    "behavioral": behavioral_data
                }
            }
            
        except Exception as e:
            logger.warning(f"Behavioral enrichment failed: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _detect_life_events(
        self, 
        enrichment_data: Dict[str, Any], 
        prospect_data: Dict[str, Any]
    ):
        """Detect life events from enriched data"""
        life_events = {}
        
        # Check for recent marriage
        social = enrichment_data.get("social", {})
        if social.get("relationship_status") == "married":
            # Mock: check if recently married (within 2 years)
            life_events["recently_married"] = True
        
        # Check for new baby
        demo = enrichment_data.get("demographics", {})
        if demo.get("household_size", 0) > 2:
            # Mock: assume new baby if family size > 2
            life_events["new_baby"] = True
        
        # Check for home purchase
        prop = enrichment_data.get("property", {})
        if prop.get("last_sold_date"):
            last_sold = datetime.fromisoformat(prop.get("last_sold_date"))
            if datetime.utcnow() - last_sold < timedelta(days=548):  # 18 months
                life_events["home_purchase_last_18_months"] = True
        
        # Check for approaching retirement
        age = enrichment_data.get("demographics", {}).get("age")
        if age and 62 <= age <= 67:
            life_events["approaching_retirement"] = True
        
        enrichment_data["life_events"] = life_events
    
    def _check_baldwin_connection(self, social_data: Dict[str, Any]) -> bool:
        """Check if prospect is connected to Baldwin agents"""
        # Mock implementation - in reality, check connections
        connections = social_data.get("connections", [])
        for connection in connections:
            if "baldwin" in connection.get("company", "").lower():
                return True
        return False
    
    def _validate_enriched_data(self, data: Dict[str, Any]) -> bool:
        """Validate that enriched data meets minimum standards"""
        if not data:
            return False
        
        # At minimum, need some demographic or property data
        has_demographics = bool(data.get("demographics"))
        has_property = bool(data.get("property"))
        has_insurance = bool(data.get("insurance"))
        
        return has_demographics or has_property or has_insurance

import os