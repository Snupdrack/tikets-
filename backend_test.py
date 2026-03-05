import requests
import sys
import json
from datetime import datetime

class AsyncTicketAPITester:
    def __init__(self, base_url="https://ticket-generator-12.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_tickets = []  # Keep track of created tickets
        print(f"🔧 Testing AsyncTicket API at: {base_url}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Expected {expected_status}, got {response.status_code}")
                if response.headers.get('content-type', '').startswith('application/json'):
                    return True, response.json()
                else:
                    return True, response.text
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Network Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "/",
            200
        )
        return success

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        success, response = self.run_test(
            "Stats Endpoint", 
            "GET",
            "/stats",
            200
        )
        if success:
            expected_keys = ['total_tickets', 'today_tickets', 'today_revenue', 'week_revenue']
            for key in expected_keys:
                if key not in response:
                    print(f"❌ Missing key in stats: {key}")
                    return False
            print(f"   Stats: {response}")
        return success

    def test_get_all_tickets(self):
        """Test getting all tickets"""
        success, response = self.run_test(
            "Get All Tickets",
            "GET", 
            "/tickets",
            200
        )
        if success:
            print(f"   Found {len(response)} tickets")
            if response:
                # Test first ticket structure
                ticket = response[0]
                required_fields = ['id', 'public_id', 'receipt_number', 'customer', 'total']
                for field in required_fields:
                    if field not in ticket:
                        print(f"❌ Missing field in ticket: {field}")
                        return False
        return success

    def test_create_ticket(self):
        """Test creating a new ticket"""
        test_ticket = {
            "employee": "Test Employee",
            "tpv": "TPV Test",
            "customer": "Cliente de Prueba",
            "customer_phone": "5512345678",
            "payment_method": "Efectivo",
            "items": [
                {
                    "name": "Producto Test 1",
                    "qty": 2,
                    "unit_price": 25.50,
                    "line_total": 51.00
                },
                {
                    "name": "Producto Test 2", 
                    "qty": 1,
                    "unit_price": 15.75,
                    "line_total": 15.75
                }
            ],
            "discount": 5.00,
            "notes": "Ticket de prueba automatizado"
        }

        success, response = self.run_test(
            "Create New Ticket",
            "POST",
            "/tickets",
            200,
            data=test_ticket
        )
        
        if success:
            # Store created ticket for later tests
            self.created_tickets.append(response)
            print(f"   Created ticket: {response['receipt_number']}")
            print(f"   Ticket ID: {response['id']}")
            print(f"   Public ID: {response['public_id']}")
            
            # Verify calculations
            expected_subtotal = 66.75  # 51.00 + 15.75
            expected_total = 61.75     # 66.75 - 5.00
            
            if response['subtotal'] != expected_subtotal:
                print(f"❌ Incorrect subtotal: expected {expected_subtotal}, got {response['subtotal']}")
                return False
                
            if response['total'] != expected_total:
                print(f"❌ Incorrect total: expected {expected_total}, got {response['total']}")
                return False
                
            print(f"✅ Calculations correct - Subtotal: ${response['subtotal']}, Total: ${response['total']}")
            
        return success

    def test_get_ticket_by_id(self):
        """Test getting a specific ticket by ID"""
        if not self.created_tickets:
            print("❌ No tickets available to test - skipping")
            return False
            
        ticket_id = self.created_tickets[0]['id']
        
        success, response = self.run_test(
            f"Get Ticket by ID ({ticket_id})",
            "GET",
            f"/tickets/{ticket_id}",
            200
        )
        
        if success:
            if response['id'] != ticket_id:
                print(f"❌ Returned wrong ticket ID")
                return False
            print(f"   Retrieved ticket: {response['receipt_number']}")
            
        return success

    def test_get_ticket_by_public_id(self):
        """Test getting a ticket by public ID"""
        if not self.created_tickets:
            print("❌ No tickets available to test - skipping")
            return False
            
        public_id = self.created_tickets[0]['public_id']
        
        success, response = self.run_test(
            f"Get Ticket by Public ID ({public_id})",
            "GET", 
            f"/tickets/public/{public_id}",
            200
        )
        
        if success:
            if response['public_id'] != public_id:
                print(f"❌ Returned wrong public ID")
                return False
            print(f"   Retrieved public ticket: {response['receipt_number']}")
            
        return success

    def test_duplicate_ticket(self):
        """Test duplicating a ticket"""
        if not self.created_tickets:
            print("❌ No tickets available to duplicate - skipping")
            return False
            
        original_id = self.created_tickets[0]['id']
        
        success, response = self.run_test(
            f"Duplicate Ticket ({original_id})",
            "POST",
            f"/tickets/{original_id}/duplicate",
            200
        )
        
        if success:
            # Store duplicated ticket
            self.created_tickets.append(response)
            print(f"   Duplicated ticket: {response['receipt_number']}")
            
            # Verify it's different from original
            original = self.created_tickets[0]
            if response['id'] == original['id']:
                print(f"❌ Duplicate has same ID as original")
                return False
            if response['receipt_number'] == original['receipt_number']:
                print(f"❌ Duplicate has same receipt number as original")
                return False
                
            print(f"✅ Duplicate created with new IDs")
            
        return success

    def test_search_tickets(self):
        """Test ticket search functionality"""
        if not self.created_tickets:
            print("❌ No tickets available to search - skipping")
            return False
            
        # Search by customer name
        customer_name = self.created_tickets[0]['customer']
        
        success, response = self.run_test(
            f"Search Tickets by Customer ('{customer_name}')",
            "GET",
            f"/tickets?search={customer_name}",
            200
        )
        
        if success:
            found_ticket = False
            for ticket in response:
                if customer_name.lower() in ticket['customer'].lower():
                    found_ticket = True
                    break
            
            if not found_ticket:
                print(f"❌ Search didn't return expected ticket")
                return False
            
            print(f"   Found {len(response)} matching tickets")
            
        return success

    def test_filter_tickets_by_date(self):
        """Test ticket filtering by date"""
        # Test today filter
        success, response = self.run_test(
            "Filter Tickets - Today",
            "GET",
            "/tickets?filter_date=today",
            200
        )
        
        if success:
            print(f"   Today's tickets: {len(response)}")
            
        return success

    def test_pdf_generation(self):
        """Test PDF generation (should return PDF content)"""
        if not self.created_tickets:
            print("❌ No tickets available for PDF - skipping")
            return False
            
        ticket_id = self.created_tickets[0]['id']
        
        success, response = self.run_test(
            f"Generate PDF for Ticket ({ticket_id})",
            "GET",
            f"/tickets/{ticket_id}/pdf",
            200,
            headers={'Accept': 'application/pdf'}
        )
        
        if success:
            print(f"   PDF generated successfully (size: {len(str(response))} chars)")
            
        return success

    def test_public_ticket_view(self):
        """Test public ticket HTML view"""
        if not self.created_tickets:
            print("❌ No tickets available for public view - skipping")
            return False
            
        public_id = self.created_tickets[0]['public_id']
        
        success, response = self.run_test(
            f"Public Ticket View ({public_id})",
            "GET",
            f"/public/{public_id}",
            200,
            headers={'Accept': 'text/html'}
        )
        
        if success:
            if 'ASYNCTICKET' in str(response):
                print(f"   HTML view contains expected content")
            else:
                print(f"❌ HTML view missing expected content")
                return False
            
        return success

    def test_nonexistent_ticket(self):
        """Test accessing non-existent ticket (should return 404)"""
        fake_id = "nonexistent-ticket-id-12345"
        
        success, response = self.run_test(
            "Get Non-existent Ticket (should 404)",
            "GET",
            f"/tickets/{fake_id}",
            404
        )
        
        return success

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting AsyncTicket API Tests")
        print("=" * 50)
        
        # Test basic endpoints
        self.test_root_endpoint()
        self.test_stats_endpoint() 
        self.test_get_all_tickets()
        
        # Test ticket creation and manipulation
        self.test_create_ticket()
        self.test_get_ticket_by_id()
        self.test_get_ticket_by_public_id()
        self.test_duplicate_ticket()
        
        # Test search and filter
        self.test_search_tickets()
        self.test_filter_tickets_by_date()
        
        # Test content generation
        self.test_pdf_generation()
        self.test_public_ticket_view()
        
        # Test error cases
        self.test_nonexistent_ticket()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.created_tickets:
            print(f"\n📝 Created {len(self.created_tickets)} test tickets:")
            for ticket in self.created_tickets:
                print(f"   - {ticket['receipt_number']} (ID: {ticket['id']})")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"🎯 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            return 1

def main():
    tester = AsyncTicketAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())