import requests
import uuid
import json
import time

class EcommerceAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session_id = f"test_session_{uuid.uuid4()}"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_product_id = None
        self.cart_item_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            print(f"URL: {url}")
            print(f"Status Code: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response: {response.text}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")

            return success, response
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

    def test_root_endpoint(self):
        """Test the root endpoint"""
        success, _ = self.run_test(
            "Root Endpoint",
            "GET",
            "api",
            200
        )
        return success

    def test_get_products(self):
        """Test getting all products"""
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "api/products",
            200
        )
        if success:
            try:
                data = response.json()
                print(f"Found {len(data.get('products', []))} products")
            except:
                print("Could not parse products response")
        return success

    def test_create_product(self):
        """Test creating a new product"""
        product_data = {
            "name": "Test Laptop",
            "description": "High-performance laptop",
            "price": 999.99,
            "category": "Electronics",
            "stock": 10,
            "image_url": "https://images.unsplash.com/photo-1629198688000-71f23e745b6e"
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "api/admin/products",
            200,
            data=product_data
        )
        
        if success:
            try:
                data = response.json()
                self.created_product_id = data.get('product', {}).get('id')
                print(f"Created product with ID: {self.created_product_id}")
            except:
                print("Could not parse create product response")
        
        return success

    def test_get_product(self):
        """Test getting a specific product"""
        if not self.created_product_id:
            print("❌ Cannot test get product - no product created")
            return False
            
        success, response = self.run_test(
            "Get Product",
            "GET",
            f"api/products/{self.created_product_id}",
            200
        )
        return success

    def test_add_to_cart(self):
        """Test adding a product to cart"""
        if not self.created_product_id:
            print("❌ Cannot test add to cart - no product created")
            return False
            
        cart_data = {
            "product_id": self.created_product_id,
            "quantity": 2,
            "session_id": self.session_id
        }
        
        success, response = self.run_test(
            "Add to Cart",
            "POST",
            "api/cart",
            200,
            data=cart_data
        )
        return success

    def test_get_cart(self):
        """Test getting cart contents"""
        success, response = self.run_test(
            "Get Cart",
            "GET",
            f"api/cart/{self.session_id}",
            200
        )
        
        if success:
            try:
                data = response.json()
                cart_items = data.get('cart_items', [])
                if cart_items:
                    self.cart_item_id = cart_items[0].get('id')
                    print(f"Found cart item with ID: {self.cart_item_id}")
            except:
                print("Could not parse cart response")
        
        return success

    def test_remove_from_cart(self):
        """Test removing an item from cart"""
        if not self.cart_item_id:
            print("❌ Cannot test remove from cart - no cart item found")
            return False
            
        success, _ = self.run_test(
            "Remove from Cart",
            "DELETE",
            f"api/cart/{self.cart_item_id}",
            200
        )
        return success

    def test_create_order(self):
        """Test creating an order"""
        # First add an item to cart
        self.test_add_to_cart()
        
        # Get cart to calculate total
        success, response = self.run_test(
            "Get Cart for Order",
            "GET",
            f"api/cart/{self.session_id}",
            200
        )
        
        if not success:
            return False
            
        try:
            data = response.json()
            cart_items = data.get('cart_items', [])
            total = data.get('total', 0)
            
            if not cart_items:
                print("❌ Cannot test create order - cart is empty")
                return False
                
            order_data = {
                "items": cart_items,
                "total": total,
                "customer_email": "test@example.com",
                "session_id": self.session_id
            }
            
            success, _ = self.run_test(
                "Create Order",
                "POST",
                "api/orders",
                200,
                data=order_data
            )
            return success
        except:
            print("Could not prepare order data")
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 50)
        print("STARTING ECOMMERCE API TESTS")
        print("=" * 50)
        
        # Test basic endpoints
        self.test_root_endpoint()
        self.test_get_products()
        
        # Test product creation and retrieval
        self.test_create_product()
        self.test_get_product()
        
        # Test cart functionality
        self.test_add_to_cart()
        self.test_get_cart()
        self.test_remove_from_cart()
        
        # Test order creation
        self.test_create_order()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"TESTS PASSED: {self.tests_passed}/{self.tests_run}")
        print("=" * 50)
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    # Get backend URL from frontend .env file
    BACKEND_URL = "https://d234d2a6-828a-4a8b-a1ae-4e60e1780990.preview.emergentagent.com"
    
    # Run tests
    tester = EcommerceAPITester(BACKEND_URL)
    tester.run_all_tests()