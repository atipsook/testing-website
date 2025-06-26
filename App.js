import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [activeView, setActiveView] = useState('home');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => 'session_' + Math.random().toString(36).substr(2, 9));
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Hero banner images
  const heroBanners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1740377016263-88f2bec96f75',
      title: 'Mega Sale Event',
      subtitle: 'Up to 70% Off on All Products',
      buttonText: 'Shop Now'
    },
    {
      id: 2,
      image: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg',
      title: 'Black Friday Special',
      subtitle: 'Exclusive Deals Just for You',
      buttonText: 'Browse Deals'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1647221598398-934ed5cb0e4f',
      title: 'Gift Collection',
      subtitle: 'Perfect Gifts for Everyone',
      buttonText: 'Explore Gifts'
    }
  ];

  const [currentBanner, setCurrentBanner] = useState(0);

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Categories for home page
  const categories = [
    { name: 'Electronics', icon: '💻', color: 'bg-blue-100 text-blue-600' },
    { name: 'Beauty', icon: '💄', color: 'bg-pink-100 text-pink-600' },
    { name: 'Fashion', icon: '👕', color: 'bg-purple-100 text-purple-600' },
    { name: 'Home', icon: '🏠', color: 'bg-green-100 text-green-600' },
    { name: 'Sports', icon: '⚽', color: 'bg-orange-100 text-orange-600' },
  ];

  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  // Sample product images from vision_expert_agent
  const sampleImages = [
    'https://images.unsplash.com/photo-1629198688000-71f23e745b6e',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b',
    'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd',
    'https://images.pexels.com/photos/2536965/pexels-photo-2536965.jpeg',
    'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg',
    'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg',
    'https://images.unsplash.com/photo-1747915102147-d1ea81052a4c',
    'https://images.pexels.com/photos/953864/pexels-photo-953864.jpeg'
  ];

  // Admin form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    stock: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCart = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/cart/${sessionId}`);
      const data = await response.json();
      setCart(data.cart_items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/orders`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const createProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock)
        }),
      });

      if (response.ok) {
        setNewProduct({
          name: '',
          description: '',
          price: '',
          category: '',
          image_url: '',
          stock: ''
        });
        loadProducts();
        alert('Product created successfully!');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
          session_id: sessionId
        }),
      });

      if (response.ok) {
        loadCart();
        alert('Item added to cart!');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadCart();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const checkout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const email = prompt('Enter your email for order confirmation:');
    if (!email) return;

    try {
      const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
      
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart,
          total: total,
          customer_email: email,
          session_id: sessionId
        }),
      });

      if (response.ok) {
        alert('Order placed successfully!');
        setCart([]);
        loadCart();
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadProducts();
        alert('Product deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">🛒 EStore</h1>
            </div>
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveView('home')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeView === 'home'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveView('products')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeView === 'products'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Products ({products.length})
              </button>
              <button
                onClick={() => setActiveView('cart')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeView === 'cart'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Cart ({cart.length})
              </button>
              <button
                onClick={() => {
                  setActiveView('admin');
                  loadOrders();
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeView === 'admin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Categories Bar */}
      {activeView === 'products' && (
        <div className="bg-gray-100 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-6 overflow-x-auto pb-1">
              <button 
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  selectedCategory === 'All' 
                    ? 'text-white bg-blue-600 hover:bg-blue-700' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                All Products
              </button>
              <button 
                onClick={() => setSelectedCategory('Electronics')}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  selectedCategory === 'Electronics' 
                    ? 'text-white bg-blue-600 hover:bg-blue-700' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Electronics
              </button>
              <button 
                onClick={() => setSelectedCategory('Fashion')}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  selectedCategory === 'Fashion' 
                    ? 'text-white bg-blue-600 hover:bg-blue-700' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Fashion
              </button>
              <button 
                onClick={() => setSelectedCategory('Home')}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  selectedCategory === 'Home' 
                    ? 'text-white bg-blue-600 hover:bg-blue-700' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Home
              </button>
              <button 
                onClick={() => setSelectedCategory('Beauty')}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  selectedCategory === 'Beauty' 
                    ? 'text-white bg-blue-600 hover:bg-blue-700' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Beauty
              </button>
              <button 
                onClick={() => setSelectedCategory('Sports')}
                className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  selectedCategory === 'Sports' 
                    ? 'text-white bg-blue-600 hover:bg-blue-700' 
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Sports
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Home View */}
        {activeView === 'home' && (
          <div>
            {/* Hero Banner Section */}
            <div className="relative mb-12 rounded-2xl overflow-hidden shadow-2xl">
              <div className="relative h-96 md:h-[500px]">
                <img
                  src={heroBanners[currentBanner].image}
                  alt={heroBanners[currentBanner].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center text-white max-w-4xl px-4">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                      {heroBanners[currentBanner].title}
                    </h1>
                    <p className="text-xl md:text-2xl mb-8">
                      {heroBanners[currentBanner].subtitle}
                    </p>
                    <button
                      onClick={() => setActiveView('products')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-300 transform hover:scale-105"
                    >
                      {heroBanners[currentBanner].buttonText}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Banner Navigation Dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {heroBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBanner(index)}
                    className={`w-3 h-3 rounded-full transition duration-300 ${
                      index === currentBanner ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Categories Section */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Shop by Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      setActiveView('products');
                    }}
                    className="cursor-pointer group"
                  >
                    <div className={`${category.color} rounded-2xl p-8 text-center hover:shadow-lg transition duration-300 transform group-hover:scale-105`}>
                      <div className="text-4xl mb-3">{category.icon}</div>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Products Section */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
                <button
                  onClick={() => setActiveView('products')}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  View All →
                </button>
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-500 mb-6">Go to Admin panel to add your first product!</p>
                  <button
                    onClick={() => setActiveView('admin')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Go to Admin
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.slice(0, 4).map((product) => (
                    <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300 group">
                      <div className="relative">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                          {Math.floor(Math.random() * 50) + 10}% OFF
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-blue-600">${product.price}</span>
                          <span className="text-sm text-gray-400 line-through">${(product.price * 1.5).toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={product.stock === 0}
                          className={`w-full py-2 rounded-lg font-medium transition duration-200 ${
                            product.stock === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exclusive Deals Section */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Exclusive Deals</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center">
                  <h3 className="text-2xl font-bold mb-2">Free Shipping</h3>
                  <p className="mb-4">On orders over $50</p>
                  <button 
                    onClick={() => setActiveView('products')}
                    className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition duration-200"
                  >
                    Shop Now
                  </button>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 text-white text-center">
                  <h3 className="text-2xl font-bold mb-2">24/7 Support</h3>
                  <p className="mb-4">Customer service available</p>
                  <button className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition duration-200">
                    Contact Us
                  </button>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white text-center">
                  <h3 className="text-2xl font-bold mb-2">Money Back</h3>
                  <p className="mb-4">30-day return policy</p>
                  <button className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition duration-200">
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="bg-gray-900 rounded-2xl p-8 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
              <p className="text-gray-300 mb-6">Subscribe to get special offers, free giveaways, and deals!</p>
              <div className="flex max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-r-lg font-semibold transition duration-200">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products View */}
        {activeView === 'products' && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h2>
              <p className="text-lg text-gray-600">Discover amazing products at great prices</p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-500 mb-6">Go to Admin panel to add your first product!</p>
                <button
                  onClick={() => setActiveView('admin')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Go to Admin
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No products in this category</h3>
                <p className="text-gray-500 mb-6">Try selecting a different category or add products to this category.</p>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  View All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition duration-300">
                    <div className="aspect-w-1 aspect-h-1">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-blue-600">${product.price}</span>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                        <button
                          onClick={() => addToCart(product.id)}
                          disabled={product.stock === 0}
                          className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                            product.stock === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cart View */}
        {activeView === 'cart' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Add some products to get started!</p>
                <button
                  onClick={() => setActiveView('products')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Shop Now
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="space-y-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${item.subtotal.toFixed(2)}</p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${cart.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={checkout}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin View */}
        {activeView === 'admin' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h2>
            
            {/* Add Product Form */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h3 className="text-xl font-semibold mb-6">Add New Product</h3>
              <form onSubmit={createProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    required
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home">Home</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    required
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product description"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <select
                    required
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a sample image</option>
                    {sampleImages.map((url, index) => (
                      <option key={index} value={url}>Sample Image {index + 1}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">Or paste your own image URL</p>
                  <input
                    type="url"
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mt-2"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>

            {/* Products Management */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6">Manage Products ({products.length})</h3>
              
              {products.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products created yet. Use the form above to add your first product!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">Image</th>
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Category</th>
                        <th className="text-left py-3 px-4">Price</th>
                        <th className="text-left py-3 px-4">Stock</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          </td>
                          <td className="py-3 px-4 font-medium">{product.name}</td>
                          <td className="py-3 px-4">{product.category}</td>
                          <td className="py-3 px-4">${product.price}</td>
                          <td className="py-3 px-4">{product.stock}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;