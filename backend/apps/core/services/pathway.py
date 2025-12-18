from __future__ import annotations

from typing import Dict, Any, List

from apps.core.models import PathwayInputs, Learner


def calculate_pathway_score(inputs: PathwayInputs) -> int:
    """
    Calculate pathway score using the formula:
    0.4*Interest + 0.3*Skill + 0.2*Enjoyment + 0.1*Demand
    
    Returns score in 0-100 range.
    """
    score = (
        0.4 * inputs.interest_persistence
        + 0.3 * inputs.skill_readiness
        + 0.2 * inputs.enjoyment
        + 0.1 * inputs.local_demand
    )
    return int(round(max(0, min(100, score))))


def determine_gate(score: int, skill_readiness: int, has_positive_mood: bool = True) -> str:
    """
    Determine gate based on score, skill, and mood.
    
    GREEN: score >= 70 and skill >= 60 and positive mood
    AMBER: score >= 50
    RED: else
    """
    if score >= 70 and skill_readiness >= 60 and has_positive_mood:
        return "GREEN"
    elif score >= 50:
        return "AMBER"
    else:
        return "RED"


def recommend_next_moves(inputs: PathwayInputs, learner: Learner, gate: str) -> List[Dict[str, Any]]:
    """
    Recommend next moves based on priority order:
    1. BRIDGE if gate=Amber/Red
    2. SHOWCASE if 2+ artifacts and communication >= 60
    3. EXPLORE if breadth <= 2 and enjoyment >= 60
    4. DEEPEN if interest >= 70 and skill >= 70
    """
    recommendations: List[Dict[str, Any]] = []
    
    # Priority 1: BRIDGE if gate=Amber/Red
    if gate in ("AMBER", "RED"):
        recommendations.append({
            "type": "BRIDGE",
            "title": "Bridge the Gap",
            "description": "Focus on building foundational skills and addressing gaps",
        })
    
    # Priority 2: SHOWCASE if 2+ artifacts and communication >= 60
    artifact_count = learner.artifacts.count()
    # Note: communication score not in PathwayInputs model, using enjoyment as proxy
    if artifact_count >= 2 and inputs.enjoyment >= 60:
        recommendations.append({
            "type": "SHOWCASE",
            "title": "Showcase Your Work",
            "description": f"You have {artifact_count} artifacts ready to showcase",
        })
    
    # Priority 3: EXPLORE if breadth <= 2 and enjoyment >= 60
    if inputs.breadth <= 2 and inputs.enjoyment >= 60:
        recommendations.append({
            "type": "EXPLORE",
            "title": "Explore New Pathways",
            "description": "Try new modules and expand your interests",
        })
    
    # Priority 4: DEEPEN if interest >= 70 and skill >= 70
    if inputs.interest_persistence >= 70 and inputs.skill_readiness >= 70:
        recommendations.append({
            "type": "DEEPEN",
            "title": "Deepen Your Expertise",
            "description": "Build on your strong foundation with advanced work",
        })
    
    return recommendations[:2]  # Return top 2 recommendations

