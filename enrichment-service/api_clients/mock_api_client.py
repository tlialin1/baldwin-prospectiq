"""
Mock API Client for testing enrichment service without real API keys
Returns realistic mock data for all enrichment sources
"""

import random
import asyncio
from typing import Dict, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class MockAPIClient:
    """Mock API client that returns simulated enrichment data"""
    
    def __init__(self):
        self.mock_names = [
            "John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis",
            "Robert Wilson", "Lisa Anderson", "David Martinez", "Jennifer Taylor",
            "William Thomas", "Maria Garcia", "James Rodriguez", "Patricia Lewis",
            "Charles Lee", "Barbara Walker", "Joseph Hall", "Susan Allen"
        ]
        
        self.mock_addresses = [
            "123 Main St, Springfield, IL 62701",
            "456 Oak Ave, Riverside, CA 92501",
            "789 Pine Rd, Lakewood, CO 80215",
            "321 Elm St, Brookfield, WI 53005",
            "654 Maple Dr, Greenville, SC 29601",
            "987 Cedar Ln, Fairfield, CT 06824",
            "147 Birch St, Millbrook, AL 36054",
            "258 Spruce Ave, Roseville, MN 55113"
        ]
        
        self.mock_carriers = [
            "State Farm", "Allstate", "Geico", "Progressive",
            "Liberty Mutual", "Nationwide", "Farmers", "USAA"
        ]
        
        self.mock_occupations = [
            "Software Engineer", "Teacher", "Nurse", "Sales Manager",
            "Accountant", "Marketing Director", "Business Owner", "Consultant",
            "Project Manager", "Financial Analyst", "Doctor", "Attorney"
        ]
    
    async def get_property_data(self, address: str) -> Dict[str, Any]:
        """Mock property data from Zillow-like service"""
        await asyncio.sleep(random.uniform(0.1, 0.5))  # Simulate API delay
        
        # Extract state from address (simplified)
        state = address.split(",")[-1].strip()[:2] if "," in address else "CA"
        
        # Generate realistic property data
        base_value = random.randint(150000, 750000)
        if state in ["CA", "NY", "MA", "WA"]:
            base_value += random.randint(100000, 300000)
        
        return {
            "success": True,
            "confidence": random.uniform(0.75, 0.98),
            "estimated_value": base_value,
            "home_type": random.choice(["Single Family", "Condo", "Townhouse", "Multi Family"]),
            "year_built": random.randint(1950, 2022),
            "square_footage": random.randint(1200, 4500),
            "bedrooms": random.randint(2, 5),
            "bathrooms": random.randint(1, 4),
            "lot_size": random.randint(3000, 20000),
            "last_sold_date": (datetime.utcnow() - timedelta(days=random.randint(30, 600))).isoformat(),
            "last_sold_price": int(base_value * random.uniform(0.85, 1.15)),
            "zestimate": base_value,
            "zestimate_last_updated": datetime.utcnow().isoformat()
        }
    
    async def get_demographic_data(self, name: str, address: str) -> Dict[str, Any]:
        """Mock demographic data from Data Axle/Whitepages"""
        await asyncio.sleep(random.uniform(0.2, 0.6))
        
        # Generate age based on name (mock pattern)
        age_seed = sum(ord(c) for c in name) % 100
        age = max(25, min(75, age_seed + random.randint(-5, 5)))
        
        # Generate household income based on age and random factors
        base_income = 45000 + (age * 1500) + random.randint(-20000, 40000)
        household_income = max(35000, base_income)
        
        # Generate household size
        if age < 35:
            household_size = random.choice([1, 2, 3])
        elif age < 55:
            household_size = random.choice([2, 3, 4, 5])
        else:
            household_size = random.choice([1, 2])
        
        return {
            "success": True,
            "confidence": random.uniform(0.65, 0.85),
            "estimated_age": age,
            "age_range": f"{max(18, age - 5)}-{age + 5}",
            "household_size": household_size,
            "household_income": household_income,
            "income_range": f"${household_income - 10000:,}-${household_income + 15000:,}",
            "length_of_residence": random.randint(1, 20),
            "homeowner_status": random.choice(["Owner", "Renter", "Unknown"]),
            "educational_attainment": random.choice([
                "High School", "Some College", "Bachelor's Degree", 
                "Graduate Degree", "Associate Degree"
            ])
        }
    
    async def get_social_profiles(self, name: str, email: str) -> Dict[str, Any]:
        """Mock social profile data"""
        await asyncio.sleep(random.uniform(0.3, 0.7))
        
        # Mock LinkedIn data
        has_linkedin = random.random() > 0.4
        linkedin_data = None
        
        if has_linkedin:
            company = random.choice([
                "Tech Corp", "Finance Inc", "Healthcare Systems", "Education First",
                "Business Solutions", "Consulting Group", "Manufacturing Co"
            ])
            title = random.choice(self.mock_occupations)
            
            linkedin_data = {
                "profile_url": f"https://linkedin.com/in/{name.lower().replace(' ', '-')}",
                "headline": f"{title} at {company}",
                "industry": random.choice(["Technology", "Finance", "Healthcare", "Education"]),
                "connections": random.randint(50, 500)
            }
        
        # Mock relationship status
        age_factor = sum(ord(c) for c in email) % 100
        relationship_status = "Married" if age_factor > 60 else "Single"
        
        return {
            "success": True,
            "confidence": random.uniform(0.55, 0.75),
            "linkedin": linkedin_data,
            "relationship_status": relationship_status,
            "facebook_profile": random.random() > 0.6,
            "twitter_profile": random.random() > 0.7,
            "connections": self._generate_mock_connections(name)
        }
    
    async def get_insurance_data(self, name: str, address: str) -> Dict[str, Any]:
        """Mock insurance record data"""
        await asyncio.sleep(random.uniform(0.2, 0.5))
        
        # Mock scenarios - mix of insured and uninsured prospects
        if random.random() > 0.6:  # 40% chance of no life insurance
            has_life_insurance = False
n            coverage_gap = True
            current_carrier = random.choice(self.mock_carriers)
        else:
            has_life_insurance = True
            coverage_gap = random.random() > 0.7
            current_carrier = random.choice(self.mock_carriers)
        
        policy_types = []
        if has_life_insurance:
            if random.random() > 0.5:
                policy_types.append("Term Life")
            if random.random() > 0.7:
                policy_types.append("Whole Life")
            if random.random() > 0.8:
                policy_types.append("Universal Life")
        
        return {
            "success": True,
            "confidence": random.uniform(0.70, 0.90),
            "has_life_insurance": has_life_insurance,
            "current_carrier": current_carrier,
            "current_premium": random.randint(75, 450) if has_life_insurance else 0,
            "coverage_amount": random.randint(100000, 1000000) if has_life_insurance else 0,
            "policy_types": policy_types,
            "coverage_gap": coverage_gap,
            "years_with_current_carrier": random.randint(1, 15),
            "renewal_date": (datetime.utcnow() + timedelta(days=random.randint(30, 365))).isoformat()
        }
    
    async def get_behavioral_data(self, email: str) -> Dict[str, Any]:
        """Mock behavioral/engagement data"""
        await asyncio.sleep(random.uniform(0.1, 0.4))
        
        # Mock quote requests and engagement
        quote_requests = random.choice([0, 0, 1, 1, 2, 3])
        
        # Check if linked to Baldwin agent
        email_hash = sum(ord(c) for c in email)
        linked_to_baldwin = (email_hash % 10) > 7  # ~20% chance
        
        return {
            "success": True,
            "confidence": random.uniform(0.45, 0.65),
            "multiple_quotes_requested": quote_requests > 1,
            "quote_request_count": quote_requests,
            "linked_to_baldwin_agent": linked_to_baldwin,
            "email_opens": random.randint(0, 15),
            "website_visits": random.randint(0, 10),
            "last_activity": (datetime.utcnow() - timedelta(days=random.randint(1, 90))).isoformat(),
            "engagement_score": random.randint(1, 100)
        }
    
    def _generate_mock_connections(self, name: str) -> list:
        """Generate mock social connections"""
        num_connections = random.randint(3, 12)
        seed = sum(ord(c) for c in name)
        random.seed(seed)
        
        connections = []
        for i in range(num_connections):
            connection_seed = seed + i * 37
            random.seed(connection_seed)
            
            if connection_seed % 7 == 0:
                company = "Baldwin Insurance"
            else:
                company = random.choice([
                    "Tech Solutions", "Finance Corp", "Business Partners", 
                    "Professional Services", "Industry Colleagues"
                ])
            
            connections.append({
                "name": self.mock_names[connection_seed % len(self.mock_names)],
                "company": company,
                "connection_strength": random.choice(["strong", "medium", "weak"])
            })
        
        # Reset random seed
        random.seed()
        return connections
    
    def get_mock_enrichment_batch(self, count: int = 10) -> list:
        """Generate a batch of mock enrichment data for testing"""
        async def generate_batch():
            tasks = []
            for i in range(count):
                name = random.choice(self.mock_names)
                email = f"{name.lower().replace(' ', '.')}@gmail.com"
                address = random.choice(self.mock_addresses)
                
                prospect_data = {
                    "name": name,
                    "email": email,
                    "phone": f"{random.randint(200, 999)}-{random.randint(200, 999)}-{random.randint(1000, 9999)}",
                    "address": address,
                    "current_carrier": random.choice(self.mock_carriers),
                    "current_premium": random.randint(80, 500),
                    "occupation": random.choice(self.mock_occupations)
                }
                
                # Create enrichment task
                task = asyncio.gather(
                    self.get_property_data(address),
                    self.get_demographic_data(name, address),
                    self.get_social_profiles(name, email),
                    self.get_insurance_data(name, address),
                    self.get_behavioral_data(email)
                )
                tasks.append(task)
            
            return await asyncio.gather(*tasks)
        
        # Run async tasks
        return asyncio.run(generate_batch())

# Example usage
if __name__ == "__main__":
    import json
    
    async def test_enrichment():
        client = MockAPIClient()
        
        test_data = {
            "name": "John Smith",
            "email": "john.smith@email.com",
            "address": "123 Main St, Springfield, IL 62701",
            "phone": "555-123-4567",
            "current_carrier": "State Farm",
            "current_premium": 250
        }
        
        print("Testing property enrichment...")
        property_data = await client.get_property_data(test_data["address"])
        print(json.dumps(property_data, indent=2))
        
        print("\nTesting demographic enrichment...")
        demo_data = await client.get_demographic_data(test_data["name"], test_data["address"])
        print(json.dumps(demo_data, indent=2))
        
        print("\nTesting social enrichment...")
        social_data = await client.get_social_profiles(test_data["name"], test_data["email"])
        print(json.dumps(social_data, indent=2))
        
        print("\nTesting insurance enrichment...")
        insurance_data = await client.get_insurance_data(test_data["name"], test_data["address"])
        print(json.dumps(insurance_data, indent=2))
        
        print("\nTesting behavioral enrichment...")
        behavioral_data = await client.get_behavioral_data(test_data["email"])
        print(json.dumps(behavioral_data, indent=2))
    
    # Run tests
    asyncio.run(test_enrichment())
