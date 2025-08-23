// --- Check Login Status on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:3000/auth/status', {
        credentials: 'include' // This tells the browser to send cookies
    })
    .then(res => res.json())
    .then(data => {
        const authButton = document.getElementById('auth-button');
        if (data.loggedIn) {
            authButton.textContent = `Logout`;
            authButton.href = "http://localhost:3000/logout";
        } else {
            authButton.textContent = 'Sign in with Google';
            authButton.href = 'http://localhost:3000/auth/google';
        }
    })
    .catch(error => console.error('Error checking auth status:', error));
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
    if (this.hash !== "") {
        event.preventDefault();
        var hash = this.hash;
        $('html, body').animate({
            scrollTop: $(hash).offset().top
        }, 800, function() {
            window.location.hash = hash;
        });
    }
});

// --- Checkout Modal and Payment Logic ---
const modal = document.getElementById('checkout-modal');
const closeBtn = modal.querySelector('.close-btn'); // Correctly scoped to modal
const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
const modalPackageName = document.getElementById('modal-package-name');
const modalPackagePrice = document.getElementById('modal-package-price');
const checkoutForm = document.getElementById('checkout-form');

// Function to open the modal
const openModal = (e) => {
    const packageName = e.target.getAttribute('data-package-name');
    const packagePrice = e.target.getAttribute('data-package-price');

    modalPackageName.textContent = packageName;
    modalPackagePrice.textContent = packagePrice;

    modal.classList.add('visible');
};

// Function to close the modal
const closeModal = () => {
    modal.classList.remove('visible');
};

// Add click event listeners to all "Checkout" buttons
addToCartButtons.forEach(button => {
    button.addEventListener('click', openModal);
});

// Add click event listener for the close button
closeBtn.addEventListener('click', closeModal);

// Close the modal if the user clicks anywhere on the overlay
window.addEventListener('click', (e) => {
    if (e.target == modal) {
        closeModal();
    }
});

// Handle form submission for payment
checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerName = document.getElementById('customer-name').value;
    const customerEmail = document.getElementById('customer-email').value;
    const packageName = modalPackageName.textContent;
    const packagePrice = modalPackagePrice.textContent;
    const orderAmount = parseFloat(packagePrice) * 100;

    try {
        const orderResponse = await fetch('http://localhost:3000/razorpay-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: orderAmount,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            }),
        });

        const orderData = await orderResponse.json();
        if (!orderData || !orderData.id) {
            alert('Error creating your order. Please try again.');
            return;
        }

        const options = {
            key: "rzp_test_R8ohlt9hI8cn2W", // Your Razorpay Key ID
            amount: orderData.amount,
            currency: orderData.currency,
            name: "GARVV Tours & Travels",
            description: `Payment for ${packageName}`,
            order_id: orderData.id,
            handler: function(response) {
                alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
                closeModal();
            },
            prefill: {
                name: customerName,
                email: customerEmail,
                method: "upi"
            },
            theme: {
                color: "#800080"
            }
        };

        const rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function(response) {
            alert('Payment failed: ' + response.error.description);
        });
        rzp1.open();
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('An error occurred. Please try again.');
    }
});
