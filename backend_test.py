#!/usr/bin/env python3
"""
Backend API Tests for Romanian Literature Quiz App
Tests all endpoints: /api/questions, /api/quiz/start, /api/quiz/answer, /api/leaderboard
"""

import requests
import sys
import json
from datetime import datetime
import time

class QuizAPITester:
    def __init__(self, base_url="https://maiorescu-challenge.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_id = None
        self.test_player_name = f"TestPlayer_{datetime.now().strftime('%H%M%S')}"
        self.tests_run = 0
        self.tests_passed = 0
        self.questions = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED {details}")
        else:
            print(f"❌ {name}: FAILED {details}")

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f" Message: {data.get('message', 'No message')}"
            self.log_test("API Root", success, details)
            return success
        except Exception as e:
            self.log_test("API Root", False, f"Error: {str(e)}")
            return False

    def test_get_questions(self):
        """Test GET /api/questions endpoint"""
        try:
            response = requests.get(f"{self.base_url}/questions", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.questions = data.get('questions', [])
                total = data.get('total', 0)
                
                # Validate questions structure
                if len(self.questions) == 15 and total == 15:
                    # Check first question structure
                    q = self.questions[0]
                    required_fields = ['id', 'question', 'type', 'options', 'time_limit']
                    has_all_fields = all(field in q for field in required_fields)
                    
                    if has_all_fields:
                        details = f"Status: {response.status_code}, Questions: {len(self.questions)}, Types: {set(q['type'] for q in self.questions)}"
                        self.log_test("GET Questions", True, details)
                        return True
                
            details = f"Status: {response.status_code}"
            self.log_test("GET Questions", False, details)
            return False
            
        except Exception as e:
            self.log_test("GET Questions", False, f"Error: {str(e)}")
            return False

    def test_start_quiz(self):
        """Test POST /api/quiz/start endpoint"""
        try:
            payload = {"player_name": self.test_player_name}
            response = requests.post(f"{self.base_url}/quiz/start", json=payload, timeout=10)
            
            success = response.status_code == 200
            if success:
                data = response.json()
                self.session_id = data.get('session_id')
                player_name = data.get('player_name')
                total_questions = data.get('total_questions')
                
                if self.session_id and player_name == self.test_player_name and total_questions == 15:
                    details = f"Status: {response.status_code}, Session ID: {self.session_id[:8]}..., Total Questions: {total_questions}"
                    self.log_test("POST Start Quiz", True, details)
                    return True
            
            details = f"Status: {response.status_code}"
            self.log_test("POST Start Quiz", False, details)
            return False
            
        except Exception as e:
            self.log_test("POST Start Quiz", False, f"Error: {str(e)}")
            return False

    def test_submit_answer(self):
        """Test POST /api/quiz/answer endpoint"""
        if not self.session_id or not self.questions:
            self.log_test("POST Submit Answer", False, "No session ID or questions available")
            return False
        
        try:
            # Test with first question, answer 0
            first_question = self.questions[0]
            payload = {
                "session_id": self.session_id,
                "question_id": first_question['id'],
                "answer": 0,
                "time_taken": 5.5
            }
            
            response = requests.post(f"{self.base_url}/quiz/answer", json=payload, timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                required_fields = ['is_correct', 'correct_answer', 'points_earned', 'total_score', 'completed']
                has_all_fields = all(field in data for field in required_fields)
                
                if has_all_fields:
                    details = f"Status: {response.status_code}, Correct: {data['is_correct']}, Points: {data['points_earned']}, Score: {data['total_score']}"
                    self.log_test("POST Submit Answer", True, details)
                    return True
            
            details = f"Status: {response.status_code}"
            self.log_test("POST Submit Answer", False, details)
            return False
            
        except Exception as e:
            self.log_test("POST Submit Answer", False, f"Error: {str(e)}")
            return False

    def test_get_leaderboard(self):
        """Test GET /api/leaderboard endpoint"""
        try:
            response = requests.get(f"{self.base_url}/leaderboard", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                leaderboard = data.get('leaderboard', [])
                
                # Check if our test player is in leaderboard
                our_player = next((entry for entry in leaderboard if entry.get('player_name') == self.test_player_name), None)
                
                if our_player:
                    details = f"Status: {response.status_code}, Total entries: {len(leaderboard)}, Our player found with score: {our_player.get('score')}"
                    self.log_test("GET Leaderboard", True, details)
                else:
                    details = f"Status: {response.status_code}, Total entries: {len(leaderboard)}, Our player not found"
                    self.log_test("GET Leaderboard", True, details)  # Still pass as API works
                return True
            
            details = f"Status: {response.status_code}"
            self.log_test("GET Leaderboard", False, details)
            return False
            
        except Exception as e:
            self.log_test("GET Leaderboard", False, f"Error: {str(e)}")
            return False

    def test_get_session(self):
        """Test GET /api/quiz/session/{session_id} endpoint"""
        if not self.session_id:
            self.log_test("GET Session", False, "No session ID available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/quiz/session/{self.session_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                player_name = data.get('player_name')
                current_question = data.get('current_question')
                score = data.get('score')
                
                if player_name == self.test_player_name:
                    details = f"Status: {response.status_code}, Player: {player_name}, Current Q: {current_question}, Score: {score}"
                    self.log_test("GET Session", True, details)
                    return True
            
            details = f"Status: {response.status_code}"
            self.log_test("GET Session", False, details)
            return False
            
        except Exception as e:
            self.log_test("GET Session", False, f"Error: {str(e)}")
            return False

    def test_invalid_requests(self):
        """Test error handling with invalid requests"""
        test_cases = [
            {
                "name": "Start Quiz - Empty Name",
                "method": "POST",
                "endpoint": "/quiz/start",
                "payload": {"player_name": ""},
                "expected_status": 400
            },
            {
                "name": "Submit Answer - Invalid Session",
                "method": "POST", 
                "endpoint": "/quiz/answer",
                "payload": {
                    "session_id": "invalid-session-id",
                    "question_id": 1,
                    "answer": 0,
                    "time_taken": 5.0
                },
                "expected_status": 404
            },
            {
                "name": "Get Session - Invalid ID",
                "method": "GET",
                "endpoint": "/quiz/session/invalid-session-id",
                "payload": None,
                "expected_status": 404
            }
        ]
        
        passed_invalid_tests = 0
        for test_case in test_cases:
            try:
                url = f"{self.base_url}{test_case['endpoint']}"
                
                if test_case['method'] == 'POST':
                    response = requests.post(url, json=test_case['payload'], timeout=10)
                else:
                    response = requests.get(url, timeout=10)
                
                success = response.status_code == test_case['expected_status']
                details = f"Expected: {test_case['expected_status']}, Got: {response.status_code}"
                
                self.log_test(test_case['name'], success, details)
                if success:
                    passed_invalid_tests += 1
                    
            except Exception as e:
                self.log_test(test_case['name'], False, f"Error: {str(e)}")
        
        return passed_invalid_tests == len(test_cases)

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🧪 Starting Backend API Tests for Romanian Literature Quiz")
        print(f"📡 Testing against: {self.base_url}")
        print(f"👤 Test player: {self.test_player_name}")
        print("=" * 60)
        
        # Test sequence - order matters for dependencies
        test_results = [
            self.test_api_root(),
            self.test_get_questions(), 
            self.test_start_quiz(),
            self.test_submit_answer(),
            self.test_get_leaderboard(),
            self.test_get_session(),
            self.test_invalid_requests()
        ]
        
        print("=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test runner"""
    tester = QuizAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())