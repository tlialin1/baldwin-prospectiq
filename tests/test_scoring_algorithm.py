"""
Unit tests for the Lead Scoring Algorithm
Tests all scoring scenarios and edge cases
"""

import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'enrichment-service'))

from scoring.scorer import LeadScorer

class TestLeadScorer:
    """Test suite for LeadScorer class"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.scorer = LeadScorer()
        
        # Base prospect data
        self.base_data = {
            "name": "John Smith",
            "email": "john.smith@email.com",
            "phone": "555-123-4567",
            "address": "123 Main St, Springfield, IL 62701"
        }
        
        # Enrichment data with all positive factors
        self.full_enrichment_data = {
            "demographics": {
                "age": 35,
                "household_size": 4,
                "household_income": 95000
            },
            "property": {
                "estimated_value": 450000,
                "home_type": "Single Family",
                "last_sold_date": "2023-06-15T00:00:00"
            },
            "insurance": {
                "has_life_insurance": False,
                "current_carrier": "State Farm",
                "current_premium": 250,
                "coverage_gap": True
            },
            "life_events": {
                "recently_married": True,
                "new_baby": True,
                "home_purchase_last_18_months": True,
                "approaching_retirement": False
            },
            "behavioral": {
                "quote_request_count": 2,
                "linked_to_baldwin_agent": True
            },
            "confidence": 0.85
        }
    
    def test_perfect_score_scenario(self):
        """Test prospect with all positive factors should score near perfect"""
        score = self.scorer.calculate_score(self.full_enrichment_data, self.base_data)
        
        # With all positive factors, should approach 100
        assert score >= 85, f"Expected score >= 85, got {score}"
        assert score <= 100, f"Score should not exceed 100, got {score}"
        assert score == 100, f"Perfect scenario should score 100, got {score}"
    
    def test_married_couple_scenario(self):
        """Test recently married couple with good income"""
        enrichment_data = {
            "demographics": {
                "age": 32,
                "household_size": 2,
                "household_income": 85000
            },
            "property": {
                "estimated_value": 350000
            },
            "insurance": {
                "has_life_insurance": False,
                "current_premium": 180
            },
            "life_events": {
                "recently_married": True
            },
            "behavioral": {
                "quote_request_count": 1
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should be in WARM range (50-74)
        assert 50 <= score <= 85, f"Married couple should score 50-85, got {score}"
    
    def test_young_family_scenario(self):
        """Test young family with kids"""
        enrichment_data = {
            "demographics": {
                "age": 28,
                "household_size": 4,
                "household_income": 65000
            },
            "life_events": {
                "new_baby": True
            },
            "insurance": {
                "has_life_insurance": False
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should score well due to new baby and family size
        assert score >= 25, f"Young family should score at least 25, got {score}"
        assert score <= 100, f"Score should not exceed 100, got {score}"
    
    def test_senior_scenario(self):
        """Test senior approaching retirement"""
        enrichment_data = {
            "demographics": {
                "age": 65,
                "household_size": 2,
                "household_income": 55000
            },
            "life_events": {
                "approaching_retirement": True
            },
            "property": {
                "estimated_value": 280000
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should score moderately due to retirement factor
        assert score >= 25, f"Senior should score at least 25, got {score}"
        assert score <= 100, f"Score should not exceed 100, got {score}"
    
    def test_low_potential_scenario(self):
        """Test prospect with minimal positive factors"""
        enrichment_data = {
            "demographics": {
                "age": 25,
                "household_size": 1,
                "household_income": 40000
            },
            "insurance": {
                "has_life_insurance": True
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should score low (0-24 range)
        assert 0 <= score <= 24, f"Low potential should score 0-24, got {score}"
    
    def test_no_enrichment_data(self):
        """Test with no enrichment data"""
        score = self.scorer.calculate_score(None, self.base_data)
        assert score == 0, f"No enrichment data should score 0, got {score}"
        
        score = self.scorer.calculate_score({}, self.base_data)
        assert score == 0, f"Empty enrichment data should score 0, got {score}"
    
    def test_high_income_scoring(self):
        """Test high income bonus points"""
        enrichment_data = {
            "demographics": {
                "age": 40,
                "household_size": 3,
                "household_income": 80000  # Above $75K threshold
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should get +10 points for high income
        assert score >= 10, f"High income should add at least 10 points, got {score}"
        assert score <= 100, f"Score should not exceed 100, got {score}"
    
    def test_high_property_value_scoring(self):
        """Test high property value bonus"""
        enrichment_data = {
            "property": {
                "estimated_value": 350000  # Above $300K threshold
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should get +8 points for high property value
        assert score >= 8, f"High property value should add at least 8 points, got {score}"
    
    def test_multiple_quotes_bonus(self):
        """Test multiple quotes requested"""
        enrichment_data = {
            "behavioral": {
                "quote_request_count": 3  # Multiple quotes
            },
            "insurance": {
                "has_life_insurance": False
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should get behavioral points
        assert score >= 8, f"Multiple quotes should add behavioral points, got {score}"
    
    def test_prime_age_scoring(self):
        """Test prime age range (30-50)"""
        enrichment_data = {
            "demographics": {
                "age": 40  # Right in prime range
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should get +10 points for prime age
        assert score >= 10, f"Prime age should add 10 points, got {score}"
    
    def test_no_life_insurance_bonus(self):
        """Test no current life insurance"""
        enrichment_data = {
            "insurance": {
                "has_life_insurance": False  # Big opportunity
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should get +10 points for no insurance (highest risk factor)
        assert score >= 10, f"No life insurance should add 10 points, got {score}"
    
    def test_category_max_limits(self):
        """Test that category scores don't exceed maximums"""
        # Life events category (max 30 points)
        enrichment_data = {
            "life_events": {
                "recently_married": True,  # 15 points
                "new_baby": True,          # 15 points
                "home_purchase_last_18_months": True,  # 10 points (but should be capped)
                "approaching_retirement": True  # 8 points (but should be capped)
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Life events should cap at 30 points max
        assert score <= 30, f"Life events should cap at 30 points max, got {score}"
    
    def test_get_score_tier(self):
        """Test tier classification"""
        assert self.scorer.get_score_tier(85) == "HOT LEAD"
        assert self.scorer.get_score_tier(70) == "WARM LEAD"
        assert self.scorer.get_score_tier(40) == "COOL LEAD"
        assert self.scorer.get_score_tier(15) == "COLD LEAD"
        assert self.scorer.get_score_tier(75) == "HOT LEAD"  # Boundary
        assert self.scorer.get_score_tier(50) == "WARM LEAD"  # Boundary
        assert self.scorer.get_score_tier(25) == "COOL LEAD"  # Boundary
    
    def test_get_score_color(self):
        """Test color coding for scores"""
        assert self.scorer.get_score_color(85) == "red"     # Hot
        assert self.scorer.get_score_color(70) == "orange"  # Warm
        assert self.scorer.get_score_color(40) == "blue"    # Cool
        assert self.scorer.get_score_color(15) == "gray"    # Cold
    
    def test_calculate_score_factors(self):
        """Test detailed score breakdown"""
        result = self.scorer.calculate_score_factors(self.full_enrichment_data, self.base_data)
        
        assert "score" in result
        assert "tier" in result
        assert "color" in result
        assert "factors" in result
        assert "recommendations" in result
        
        # Should have positive factors
        assert len(result["factors"]["positive"]) > 0, "Should have positive factors"
        assert len(result["recommendations"]) > 0, "Should have recommendations"
        
        # Score should match calculate_score
        direct_score = self.scorer.calculate_score(self.full_enrichment_data, self.base_data)
        assert result["score"] == direct_score, "Scores should match"
    
    def test_large_family_bonus(self):
        """Test family size 3+ bonus"""
        enrichment_data = {
            "demographics": {
                "household_size": 5  # Large family
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should get +10 points for large family
        assert score >= 10, f"Large family should add 10 points, got {score}"
    
    def test_baldwin_connection_bonus(self):
        """Test linked to Baldwin agent"""
        enrichment_data = {
            "behavioral": {
                "linked_to_baldwin_agent": True
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should get +7 points for Baldwin connection
        assert score >= 7, f"Baldwin connection should add 7 points, got {score}"
    
    def test_coverage_gap_bonus(self):
        """Test coverage gap identified"""
        enrichment_data = {
            "insurance": {
                "coverage_gap": True
            }
        }
        
        score = self.scorer.calculate_score(enrichment_data, self.base_data)
        
        # Should get +5 points for coverage gap
        assert score >= 5, f"Coverage gap should add 5 points, got {score}"
    
    def test_recommendations_generation(self):
        """Test recommendations based on score"""
        # Hot lead - should have immediate action recommendations
        result = self.scorer.calculate_score_factors(self.full_enrichment_data, self.base_data)
        recs = result["recommendations"]
        
        assert any("24 hours" in rec for rec in recs), "Hot lead should have 24h recommendation"
        assert any("immediate" in rec.lower() for rec in recs), "Hot lead should have immediate action"
        
        # Cold lead - should have nurture recommendations
        cold_enrichment = {
            "demographics": {
                "age": 22,
                "household_size": 1,
                "household_income": 35000
            }
        }
        
        cold_result = self.scorer.calculate_score_factors(cold_enrichment, self.base_data)
        cold_recs = cold_result["recommendations"]
        
        assert any("nurture" in rec.lower() for rec in cold_recs), "Cold lead should have nurture recommendation"
        assert any("long-term" in rec.lower() for rec in cold_recs), "Cold lead should have long-term recommendation"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
