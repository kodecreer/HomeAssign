import pytest
import requests

#Simple test to make sure microservice is working

# Example "page text" – include description + reviews directly here
example_text = """
Welcome to Socalo Chocolates!
Our assorted chocolate truffle box includes creamy milk, dark, and white chocolate truffles.
Each truffle is handcrafted, beautifully packaged, and perfect for gifting.
Ingredients: cocoa butter, sugar, milk solids, natural flavors.

Customer Reviews:
- "These truffles are absolutely delicious and beautifully presented."
- "Great gift for holidays, but I wish shipping was faster."
- "Tasty, but packaging felt a little cheap for the price."
"""

choco = 'https://www.socolachocolates.com/collections/chocolate-truffles/products/assorted-chocolate-truffle-box'
def test_analyze_product_page_success():
    response = requests.post('http://localhost:8001/analyze/stream', json={'content': example_text, 'url': choco}, stream=True)
    
    assert response.status_code == 200
    
    print("Streaming analysis response:")
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            print(decoded_line)
    
test_analyze_product_page_success()