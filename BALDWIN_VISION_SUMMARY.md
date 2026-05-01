# Baldwin Dashboard - Vision & Scope Summary

## What This System IS
- **Post-Sale Performance & Retention Platform** - NOT a CRM, NOT lead management
- Starts AFTER the sale is made
- Focuses on: Book Relevance, Agent Effectiveness, Promotion Framework

## What This System Is NOT
- NOT a CRM
- NOT a lead management tool
- NOT for pre-sale activities

## Three Core Modules

### 1. Business Clarity (Book Relevance)
- Real-time view of every policy, client, premium
- **Book Relevance Score** - measures strength/durability of agent's book
- Identifies agents building quality vs those at risk of attrition

### 2. Agent Behavior (Agent Effectiveness)
- Scores professional engagement & operational discipline
- **Agent Effectiveness Score** - independent of book quality
- Distinguishes "coasting" vs actively building agents

### 3. Promotion Framework
- Ties behavioral and clarity scores to visible promotion ladder
- Agents see exactly where they stand
- Shows specific habits/milestones needed to advance

## Key Design Principles
- Shape behavior as much as report on it
- Transparent scores
- Link to concrete inputs
- Real-time promotion progress
- Rewards: consistent engagement, thorough documentation, long-term book quality

## Data Model

### Client Record
- Created: Auto from OCR upload or pre-loaded from NAA/C3
- Master identity file - created once, never duplicated
- Links to: Policy Records, Emergency Connection Form, Family Fundamentals
- Required fields: First Name, Last Name, DOB, Phone, Address, City, State, Zip

### Policy Record
- Created exclusively through OCR upload (one screenshot per record)
- Screenshot stored permanently as source of truth
- Fields: Policy Number, Carrier, Monthly Premium, Face/Transfer Amount, Issue Date

## Scoring System

### Book Relevance Score
- Client Indicators (40%): Emergency Connection, Family Fundamentals, Opt-In Status
- Policy Mix (30%): Carrier diversity, premium distribution
- Retention Signals (30%): Policy age, client engagement

### Agent Effectiveness Score
- Activity Metrics (50%): Upload frequency, record completeness
- Professional Development (30%): Training completion, certifications
- Engagement (20%): Client communication, follow-up consistency

## Target Scale
- 100-500 agents
- 10,000-100,000 policies

## Platform Requirements
- Baldwin-owned cloud (sovereignty)
- Developer = technical custodian only
- All source code, schemas, scoring logic = exclusive property of Chris Baldwin
