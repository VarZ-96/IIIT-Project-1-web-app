// --- Check Login Status & Fetch Cart on Page Load ---
let cart = []; // This will be populated from the database
let isLoggedIn = false;

document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:3000/auth/status', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
        const authButton = document.getElementById('auth-button');
        if (data.loggedIn) {
            isLoggedIn = true;
            authButton.textContent = `Logout`;
            authButton.href = "http://localhost:3000/logout";
            fetchCart(); // Fetch the user's cart now that we know they're logged in
        } else {
            isLoggedIn = false;
            authButton.textContent = 'Sign in with Google';
            authButton.href = 'http://localhost:3000/auth/google';
        }
    });
});

// --- Header Scroll Effect ---
window.onscroll = () => {
    if (window.scrollY > 0) {
        document.querySelector('.header').classList.add('active');
    } else {
        document.querySelector('.header').classList.remove('active');
    }
};
window.onload = () => {
    if (window.scrollY > 0) {
        document.querySelector('.header').classList.add('active');
    } else {
        document.querySelector('.header').classList.remove('active');
    }
};

// --- "Get Started" Button Scroll Logic ---
$('.botn').on('click', function(event) {
    var activitiesSection = $('.second');
    $('html, body').animate({
        scrollTop: activitiesSection.offset().top
    }, 800);
});

// --- Navbar Smooth Scroll Logic ---
$('.navbar a').on('click', function(event) {
    if (this.hash !== "" && this.id !== "cart-btn") {
        event.preventDefault();
        var hash = this.hash;
        $('html, body').animate({
            scrollTop: $(hash).offset().top
        }, 800, function() {
            window.location.hash = hash;
        });
    }
});

// --- NEW DATABASE-DRIVEN CART LOGIC ---
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const cartItemsList = document.getElementById('cart-items-list');
const cartTotalSpan = document.getElementById('cart-total');
const cartCounterSpan = document.getElementById('cart-counter');
const cartCheckoutForm = document.getElementById('cart-checkout-form');
const closeCartModalBtn = cartModal.querySelector('.close-btn');
const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

async function fetchCart() {
    if (!isLoggedIn) return;
    try {
        const response = await fetch('http://localhost:3000/cart', { credentials: 'include' });
        if (response.ok) {
            cart = await response.json();
            updateCartCounter();
        }
    } catch (error) {
        console.error('Error fetching cart:', error);
    }
}

async function addToCart(event) {
    if (!isLoggedIn) {
        alert('Please sign in to add items to your cart.');
        return;
    }
    const button = event.target;
    const name = button.dataset.packageName;
    const price = parseFloat(button.dataset.packagePrice);

    try {
        const response = await fetch('http://localhost:3000/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, price })
        });
        if (response.ok) {
            await fetchCart(); // Re-fetch the cart from the DB to have the latest data
            alert(`"${name}" has been added to your cart!`);
        } else {
            alert('Failed to add item. Please try again.');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

function updateCartCounter() {
    cartCounterSpan.textContent = cart.length;
}

function displayCart() {
    cartItemsList.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsList.innerHTML = '<li>Your cart is empty.</li>';
    } else {
        cart.forEach(item => {
            const li = document.createElement('li');
            const itemTotal = Number(item.price) * item.quantity; // Calculate total for this line item
            
            // Display the name, quantity, and total for the item
            li.innerHTML = `
                <span>${item.package_name} (x${item.quantity})</span>
                <span>
                    ₹${itemTotal.toFixed(2)}
                    <button class="remove-item-btn" data-item-id="${item.id}" style="margin-left: 15px; color: red; border: none; background: none; cursor: pointer;">&times;</button>
                </span>
            `;
            cartItemsList.appendChild(li);
            total += itemTotal; // Add the line item total to the grand total
        });
    }

    cartTotalSpan.textContent = total.toFixed(2);
    cartModal.classList.add('visible');
}
// Handle clicks on the remove item button
cartItemsList.addEventListener('click', async (event) => {
    if (event.target.classList.contains('remove-item-btn')) {
        const itemId = event.target.dataset.itemId;
        
        try {
            const response = await fetch(`http://localhost:3000/cart/item/${itemId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                // If successful, refresh the cart from the server and re-display it
                await fetchCart();
                displayCart();
            } else {
                alert('Failed to remove item. Please try again.');
            }
        } catch (error) {
            console.error('Error removing item:', error);
        }
    }
});
// Event Listeners for Cart
addToCartButtons.forEach(button => button.addEventListener('click', addToCart));
cartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isLoggedIn) return alert('Please sign in to view your cart.');
    displayCart();
});
closeCartModalBtn.addEventListener('click', () => cartModal.classList.remove('visible'));
window.addEventListener('click', (e) => {
    if (e.target == cartModal) cartModal.classList.remove('visible');
});

// Final Checkout and Payment Logic
cartCheckoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const totalAmount = parseFloat(cartTotalSpan.textContent);
    if (totalAmount <= 0) return alert("Cannot checkout with an empty cart!");

    const customerName = document.getElementById('cart-customer-name').value;
    const customerEmail = document.getElementById('cart-customer-email').value;
    const orderAmountInPaise = totalAmount * 100;

    try {
        const orderResponse = await fetch('http://localhost:3000/razorpay-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount: orderAmountInPaise, currency: 'INR', receipt: `receipt_cart_${Date.now()}` }),
        });
        const orderData = await orderResponse.json();
        
        const options = {
            key: "rzp_test_R8ohlt9hI8cn2W", // Add your key
            amount: orderData.amount,
            currency: "INR",
            name: "GARVV Tours & Travels",
            description: "Payment for tour packages",
            order_id: orderData.id,
            handler: async function (response) {
                alert('Payment successful!');
                await fetch('http://localhost:3000/cart/clear', { method: 'DELETE', credentials: 'include' });
                cart = [];
                updateCartCounter();
                cartModal.classList.remove('visible');
            },
            prefill: { name: customerName, email: customerEmail },
            theme: { color: "#800080" }
        };

        const rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', (response) => alert('Payment failed: ' + response.error.description));
        rzp1.open();
    } catch (error) {
        console.error('Checkout Error:', error);
    }
});