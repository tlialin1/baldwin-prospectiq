"""
Lead Scoring Algorithm
Calculates opportunity score (0-100) based on enriched data and prospect information
"""

import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class LeadScorer:
    """
    Calculates lead opportunity scores based on multiple factors
    Score ranges from 0-100 where higher scores indicate better opportunities
    """
    
    def __init__(self):
        self.max_total_score = 100
        
        # Define scoring categories with their maximum points
        self.category_weights = {
            "life_events": 30,      # Life Event Factors
            "financial": 25,        # Financial Factors
            "demographics": 20,     # Demographic Factors
            "behavioral": 15,       # Behavioral Factors
            "risk": 10              # Risk Factors
        }
        
        # Initialize scoring rules
        self._init_scoring_rules()
    
    def _init_scoring_rules(self):
        """Initialize detailed scoring rules"""
        
        # Life Event Factors (30 points max)
        self.life_event_rules = {
            "recently_married": {
                "points": 15,
                "description": "Recently married (last 2 years)",
                "condition": self._check_recently_married
            },
            "new_baby": {
                "points": 15,
                "description": "New baby/child in household",
                "condition": self._check_new_baby
            },
            "home_purchase_last_18_months": {
                "points": 10,
                "description": "Home purchase (last 18 months)",
                "condition": self._check_recent_home_purchase
            },
            "approaching_retirement": {
                "points": 8,
                "description": "Approaching retirement age (62-67)",
                "condition": self._check_approaching_retirement
            }
        }
        
        # Financial Factors (25 points max)
        self.financial_rules = {
            "high_household_income": {
                "points": 10,
                "description": "Household income > $75K",
                "condition": self._check_high_income
            },
            "high_property_value": {
                "points": 8,
                "description": "Property value > $300K",
                "condition": self._check_high_property_value
            },
            "high_current_premium": {
                "points": 7,
                "description": "Current premium $200+/month",
                "condition": self._check_high_premium
            }
        }
        
        # Demographics Factors (20 points max)
        self.demographic_rules = {
            "prime_age_range": {
                "points": 10,
                "description": "Age 30-50 (prime insurance years)",
                "condition": self._check_prime_age
            },
            "large_family": {
                "points": 10,
                "description": "Family size 3+ (more coverage needed)",
                "condition": self._check_large_family
            }
        }
        
        # Behavioral Factors (15 points max)
        self.behavioral_rules = {
            "multiple_quotes_requested": {
                "points": 8,
                "description": "Multiple insurance quotes requested",
                "condition": self._check_multiple_quotes
            },
            "linked_to_baldwin_agent": {
                "points": 7,
                "description": "Linked to existing Baldwin agent",
                "condition": self._check_baldwin_connection
            }
        }
        
        # Risk Factors (10 points max)
        self.risk_rules = {
            "no_life_insurance": {
                "points": 10,
                "description": "No current life insurance",
                "condition": self._check_no_life_insurance
            },
            "coverage_gap": {
                "points": 5,
                "description": "Current coverage gap identified",
                "condition": self._check_coverage_gap
            }
        }
    
    def calculate_score(
        self, 
        enrichment_data: Dict[str, Any], 
        base_data: Dict[str, Any]
    ) -> int:
        """
        Calculate overall lead score (0-100)
        
        Args:
            enrichment_data: Data from enrichment service
            base_data: Original prospect data
            
        Returns:
            Integer score from 0-100
        """
        try:
            logger.info("Starting lead score calculation")
            
            score = 0
            score_breakdown = {}
            positive_factors = []
            
            # Calculate each category score
            for category, max_points in self.category_weights.items():
                category_score = 0
                category_rules = getattr(self, f"{category}_rules", {})
                
                for rule_name, rule_config in category_rules.items():
                    if rule_config["condition"](enrichment_data, base_data):
                        rule_points = rule_config["points"]
                        category_score += rule_points
                        positive_factors.append({
                            "category": category,
                            "rule": rule_name,
                            "points": rule_points,
                            "description": rule_config["description"]
                        })
                
                # Cap category score at its maximum
                category_score = min(category_score, max_points)
                score += category_score
                score_breakdown[category] = {
                    "score": category_score,
                    "max": max_points,
                    "percentage": (category_score / max_points * 100) if max_points > 0 else 0
                }
            
            # Ensure total doesn't exceed 100
            final_score = min(score, self.max_total_score)
            
            # Round to nearest integer
            final_score = round(final_score)
            
            logger.info(f"Calculated score: {final_score}/100")
            logger.info(f"Score breakdown: {score_breakdown}")
            
            return final_score
            
        except Exception as e:
            logger.error(f"Error calculating score: {str(e)}")
            # Return 0 if calculation fails
            return 0
    
    def get_score_tier(self, score: int) -> str:
        """Get tier label based on score"""
        if score >= 75:
            return "HOT LEAD"
        elif score >= 50:
            return "WARM LEAD"
        elif score >= 25:
            return "COOL LEAD"
        else:
            return "COLD LEAD"
    
    def get_score_color(self, score: int) -> str:
        """Get color coding for score UI"""
        if score >= 75:
            return "red"      # Hot
        elif score >= 50:
            return "orange"   # Warm
        elif score >= 25:
            return "blue"     # Cool
        else:
            return "gray"     # Cold
    
    def calculate_score_factors(
        self, 
        enrichment_data: Dict[str, Any], 
        base_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate score and get detailed breakdown of all factors
        
        Returns:
            Dictionary with score, tier, color, breakdown, and factor list
        """
        score = self.calculate_score(enrichment_data, base_data)
        
        # Get all positive factors
        positive_factors = []
        
        for category, rules in [
            ("life_events", self.life_event_rules),
            ("financial", self.financial_rules),
            ("demographics", self.demographic_rules),
            ("behavioral", self.behavioral_rules),
            ("risk", self.risk_rules)
        ]:
            for rule_name, rule_config in rules.items():
                if rule_config["condition"](enrichment_data, base_data):
                    positive_factors.append({
                        "category": category,
                        "label": rule_config["description"],
                        "points": rule_config["points"]
                    })
        
        # Identify missing factors (opportunities for improvement)
        missing_factors = []
        
        if not self._check_recently_married(enrichment_data, base_data):
            missing_factors.append("Recently married (15 points)")
        
        if not self._check_high_income(enrichment_data, base_data):
            missing_factors.append("Household income > $75K (10 points)")
        
        if not self._check_prime_age(enrichment_data, base_data):
            missing_factors.append("Age 30-50 (10 points)")
        
        if not self._check_no_life_insurance(enrichment_data, base_data):
            missing_factors.append("No current life insurance (10 points)")
        
        return {
            "score": score,
            "tier": self.get_score_tier(score),
            "color": self.get_score_color(score),
            "factors": {
                "positive": positive_factors,
                "missing": missing_factors
            },
            "recommendations": self._generate_recommendations(
                score, enrichment_data, base_data
            )
        }
    
    def _generate_recommendations(
        self, 
        score: int, 
        enrichment_data: Dict[str, Any], 
        base_data: Dict[str, Any]
    ) -> List[str]:
        """Generate sales recommendations based on score and data"""
        recommendations = []
        
        if score >= 75:
            recommendations.append("Contact within 24 hours - HOT lead")
            recommendations.append("Prepare multiple product options")
            recommendations.append("Focus on immediate needs")
        elif score >= 50:
            recommendations.append("Contact within 48-72 hours")
            recommendations.append("Emphasize value and coverage gaps")
            recommendations.append("Schedule follow-up sequence")
        elif score >= 25:
            recommendations.append("Add to nurture campaign")
            recommendations.append("Educational content approach")
            recommendations.append("Check back in 30 days")
        else:
            recommendations.append("Long-term nurture - monthly touchpoints")
            recommendations.append("Focus on brand awareness")
        
        # Life event specific recommendations
        if self._check_recently_married(enrichment_data, base_data):
            recommendations.append("Emphasize family protection products")
        
        if self._check_new_baby(enrichment_data, base_data):
            recommendations.append("Discuss college planning and child protection")
        
        if self._check_approaching_retirement(enrichment_data, base_data):
            recommendations.append("Focus on retirement and estate planning")
            recommendations.append("Discuss final expense coverage")
        
        # Coverage gap specific
        if self._check_no_life_insurance(enrichment_data, base_data):
            recommendations.append("Start with basic term life education")
        
        if self._check_high_premium(enrichment_data, base_data):
            recommendations.append("Potential for policy upgrade discussion")
        
        return recommendations
    
    # Condition checking methods
    def _check_recently_married(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if recently married"""
        # Mock: Use social data and age to determine
        social = enrichment_data.get("social", {})
        demo = enrichment_data.get("demographics", {})
        
        age = demo.get("age", 0)
        relationship_status = social.get("relationship_status")
        
        # Simple heuristic
        if relationship_status == "Married" and 25 <= age <= 50:
            return random.random() > 0.3  # 70% chance for married in prime age
        return False
    
    def _check_new_baby(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if has new baby"""
        demo = enrichment_data.get("demographics", {})
        household_size = demo.get("household_size", 1)
        
        return household_size >= 3  # Simplified: 3+ people likely includes children
    
    def _check_recent_home_purchase(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if recent home purchase"""
        prop = enrichment_data.get("property", {})
        last_sold_date = prop.get("last_sold_date")
        
        if last_sold_date:
            try:
                sold_date = datetime.fromisoformat(last_sold_date)
                days_since_sold = (datetime.utcnow() - sold_date).days
                return days_since_sold <= 548  # 18 months
            except:
                pass
        return False
    
    def _check_approaching_retirement(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if approaching retirement age"""
        demo = enrichment_data.get("demographics", {})
        age = demo.get("age", 0)
        
        return 62 <= age <= 67
    
    def _check_high_income(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if household income > $75K"""
        demo = enrichment_data.get("demographics", {})
        income = demo.get("household_income", 0)
        
        return income > 75000
    
    def _check_high_property_value(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if property value > $300K"""
        financial = enrichment_data.get("financial", {})
        property_value = financial.get("property_value", 0)
        
        return property_value > 300000
    
    def _check_high_premium(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if current premium $200+/month"""
        insurance = enrichment_data.get("insurance", {})
        premium = base_data.get("current_premium") or insurance.get("current_premium", 0)
        
        return premium >= 200
    
    def _check_prime_age(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if age 30-50"""
        demo = enrichment_data.get("demographics", {})
        age = demo.get("age", 0)
        
        return 30 <= age <= 50
    
    def _check_large_family(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if family size 3+"""
        demo = enrichment_data.get("demographics", {})
        family_size = demo.get("household_size", 1)
        
        return family_size >= 3
    
    def _check_multiple_quotes(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if multiple quotes requested"""
        behavioral = enrichment_data.get("behavioral", {})
        quote_count = behavioral.get("quote_request_count", 0)
        
        return quote_count > 1
    
    def _check_baldwin_connection(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if linked to Baldwin agent"""
        behavioral = enrichment_data.get("behavioral", {})
        
        return behavioral.get("linked_to_baldwin_agent", False)
    
    def _check_no_life_insurance(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if no current life insurance"""
        insurance = enrichment_data.get("insurance", {})
        
        return not insurance.get("has_life_insurance", True)
    
    def _check_coverage_gap(self, enrichment_data: Dict[str, Any], base_data: Dict[str, Any]) -> bool:
        """Check if coverage gap identified"""
        insurance = enrichment_data.get("insurance", {})
        
        return insurance.get("coverage_gap", False)

if __name__ == "__main__":
    import json
    
    # Test the scoring algorithm
    def test_scoring():
        scorer = LeadScorer()
        
        # Mock enrichment data
        test_enrichment = {
            "property": {
                "estimated_value": 450000,
                "home_type": "Single Family",
                "year_built": 2015
            },
            "demographics": {
                "age": 35,
                "household_income": 95000,
                "household_size": 4
            },
            "social": {
                "relationship_status": "Married",
                "linkedin": {
                    "industry": "Technology"
                }
            },
            "insurance": {
                "has_life_insurance": False,
                "current_carrier": "State Farm",
                "current_premium": 250,
                "coverage_gap": True
            },
            "behavioral": {
                "quote_request_count": 2,
                "linked_to_baldwin_agent": True,
                "website_visits": 5
            }
        }
        
        test_base_data = {
            "name": "John Smith",
            "age": 35,
            "current_premium": 250
        }
        
        # Calculate score
        score = scorer.calculate_score(test_enrichment, test_base_data)
        score_details = scorer.calculate_score_factors(test_enrichment, test_base_data)
        
        print(f"Lead Score: {score}/100")
        print(f"Tier: {score_details['tier']}")
        print(f"Color: {score_details['color']}")
        print("\nPositive Factors:")
        for factor in score_details['factors']['positive']:
            print(f"  +{factor['points']} points: {factor['label']}")
        
        print("\nRecommendations:")
        for rec in score_details['recommendations']:
            print(f"  - {rec}")
        
        print("\nFull Breakdown:")
        print(json.dumps(score_details, indent=2))
    
    test_scoring()
