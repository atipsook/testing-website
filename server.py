from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from datetime import datetime

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URL)
db = client.ecommerce

# Pydantic models
class Product(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    price: float
    category: str
    image_url: str
    stock: int = 0
    created_at: Optional[str] = None

class CartItem(BaseModel):
    id: Optional[str] = None
    product_id: str
    quantity: int
    session_id: str

class Order(BaseModel):
    id: Optional[str] = None
    items: List[dict]
    total: float
    customer_email: str
    status: str = "pending"
    created_at: Optional[str] = None

# Products endpoints
@app.get("/api/products")
async def get_products():
    try:
        products = list(db.products.find())
        for product in products:
            product['_id'] = str(product['_id'])
        return {"products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    try:
        product = db.products.find_one({"id": product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        product['_id'] = str(product['_id'])
        return product
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/products")
async def create_product(product: Product):
    try:
        product_dict = product.dict()
        product_dict['id'] = str(uuid.uuid4())
        product_dict['created_at'] = datetime.utcnow().isoformat()
        
        result = db.products.insert_one(product_dict)
        product_dict['_id'] = str(result.inserted_id)
        
        return {"message": "Product created successfully", "product": product_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/products/{product_id}")
async def update_product(product_id: str, product: Product):
    try:
        product_dict = product.dict()
        product_dict['id'] = product_id
        
        result = db.products.update_one(
            {"id": product_id},
            {"$set": product_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
            
        return {"message": "Product updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/products/{product_id}")
async def delete_product(product_id: str):
    try:
        result = db.products.delete_one({"id": product_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Cart endpoints
@app.get("/api/cart/{session_id}")
async def get_cart(session_id: str):
    try:
        cart_items = list(db.cart.find({"session_id": session_id}))
        
        # Get product details for each cart item
        cart_with_products = []
        total = 0
        
        for item in cart_items:
            product = db.products.find_one({"id": item["product_id"]})
            if product:
                cart_item = {
                    "id": item["id"],
                    "product": {
                        "id": product["id"],
                        "name": product["name"],
                        "price": product["price"],
                        "image_url": product["image_url"]
                    },
                    "quantity": item["quantity"],
                    "subtotal": product["price"] * item["quantity"]
                }
                cart_with_products.append(cart_item)
                total += cart_item["subtotal"]
        
        return {"cart_items": cart_with_products, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cart")
async def add_to_cart(cart_item: CartItem):
    try:
        # Check if item already in cart
        existing_item = db.cart.find_one({
            "product_id": cart_item.product_id,
            "session_id": cart_item.session_id
        })
        
        if existing_item:
            # Update quantity
            new_quantity = existing_item["quantity"] + cart_item.quantity
            db.cart.update_one(
                {"id": existing_item["id"]},
                {"$set": {"quantity": new_quantity}}
            )
        else:
            # Add new item
            cart_dict = cart_item.dict()
            cart_dict['id'] = str(uuid.uuid4())
            db.cart.insert_one(cart_dict)
        
        return {"message": "Item added to cart"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/cart/{item_id}")
async def remove_from_cart(item_id: str):
    try:
        result = db.cart.delete_one({"id": item_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Cart item not found")
        return {"message": "Item removed from cart"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Orders endpoint
@app.post("/api/orders")
async def create_order(order: Order):
    try:
        order_dict = order.dict()
        order_dict['id'] = str(uuid.uuid4())
        order_dict['created_at'] = datetime.utcnow().isoformat()
        
        result = db.orders.insert_one(order_dict)
        order_dict['_id'] = str(result.inserted_id)
        
        # Clear cart after order
        if order_dict.get('session_id'):
            db.cart.delete_many({"session_id": order_dict['session_id']})
        
        return {"message": "Order created successfully", "order": order_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/orders")
async def get_orders():
    try:
        orders = list(db.orders.find().sort("created_at", -1))
        for order in orders:
            order['_id'] = str(order['_id'])
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Ecommerce API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)