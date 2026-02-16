import json
import base64
import openai
from PIL import Image
import io
import os
from typing import Dict, Any
from schemas import NutritionAnalysis

class MealAnalyzer:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def encode_image(self, image_path: str) -> str:
        """Encode image to base64 for OpenAI API"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def analyze_meal(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze meal image using GPT-4V and return nutrition data
        Returns dict with calories, macros, and itemized breakdown
        """
        try:
            # Encode the image
            base64_image = self.encode_image(image_path)
            
            # Craft the prompt for structured nutrition analysis
            prompt = """
            Analyze this meal photo and provide a detailed nutritional breakdown. 
            Focus on vegetarian/plant-based foods. Be precise but realistic with portion estimates.
            
            Return ONLY a valid JSON object with this exact structure:
            {
                "calories": 650,
                "protein_g": 25.5,
                "carbs_g": 80.0, 
                "fat_g": 20.0,
                "fibre_g": 12.0,
                "items": [
                    {"name": "Brown rice", "portion": "1 cup cooked", "calories": 220},
                    {"name": "Black beans", "portion": "0.5 cup", "calories": 115},
                    {"name": "Avocado", "portion": "0.5 medium", "calories": 160}
                ]
            }
            
            Guidelines:
            - Estimate realistic portion sizes based on visual cues
            - Include all visible food items
            - For mixed dishes, break down main components
            - Use standard portion descriptions (cups, oz, medium, large, etc.)
            - Total calories should equal sum of item calories
            - Prioritize protein-rich vegetarian foods in estimates
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0.1
            )
            
            # Parse the JSON response
            content = response.choices[0].message.content.strip()
            
            # Extract JSON if wrapped in markdown code blocks
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            nutrition_data = json.loads(content)
            
            # Validate the response structure
            required_fields = ["calories", "protein_g", "carbs_g", "fat_g", "fibre_g", "items"]
            for field in required_fields:
                if field not in nutrition_data:
                    raise ValueError(f"Missing required field: {field}")
            
            return nutrition_data
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON response from AI: {e}")
        except openai.APIError as e:
            raise RuntimeError(f"OpenAI API error: {e}")
        except Exception as e:
            raise RuntimeError(f"Analysis failed: {e}")
    
    def validate_analysis(self, data: dict) -> NutritionAnalysis:
        """Validate and convert raw analysis to schema"""
        try:
            return NutritionAnalysis(**data)
        except Exception as e:
            raise ValueError(f"Invalid analysis data: {e}")

# Global analyzer instance
meal_analyzer = MealAnalyzer()