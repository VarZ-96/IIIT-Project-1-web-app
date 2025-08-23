// --- Check Login Status on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:3000/auth/status', {
    credentials: 'include' // This tells the browser to send cookies
    })
        .then(res => res.json())
        .then(data => {
            const authButton = document.getElementById('auth-button');
            if (data.loggedIn) {
                // User is logged in, change the button to a Logout link
                authButton.textContent = `Logout`;
                authButton.href = "http://localhost:3000/logout";
            }else {
                // User is not logged in, keep the button as is
                authButton.textContent = 'Sign in with Google';
                authButton.href = 'http://localhost:3000/auth/google';
            }
        })
        .catch(error => console.error('Error checking auth status:', error));
});
window.onscroll=()=>{
    if(window.scrollY>0){
        document.querySelector('.header').classList.add('active');
    }
    else{
        document.querySelector('.header').classList.remove('active');
    }
};
window.onload=()=>{
    if(window.scrollY>0){
        document.querySelector('.header').classList.add('active');
    }else{
        document.querySelector('.header').classList.remove('active');
    }
};

$('.botn').on('click', function(event) {
  // Find the activities section, which has the class 'second'
  var activitiesSection = $('.second');

  // Animate the scroll to that section
  $('html, body').animate({
    scrollTop: activitiesSection.offset().top
  }, 800); // 800 is the scroll speed in milliseconds
// --- NEW Smooth Scroll Logic ---
$('.navbar a').on('click', function(event) {
  // Make sure this.hash has a value before overriding default behavior
  if (this.hash !== "") {
    // Prevent default anchor click behavior
    event.preventDefault();

    // Store hash
    var hash = this.hash;

    // Animate the scroll
    $('html, body').animate({
      scrollTop: $(hash).offset().top
    }, 800, function(){ // 800 is the speed of the scroll in milliseconds
      // Add hash (#) to URL when done scrolling (default click behavior)
      window.location.hash = hash;
    });
  } 
});

// --- Updated Modal Logic ---

const modal = document.getElementById('checkout-modal');
const closeBtn = document.querySelector('.close-btn');
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
  
  // Instead of changing style, we add a class
  modal.classList.add('visible');
};

// Function to close the modal
const closeModal = () => {
  // Instead of changing style, we remove the class
  modal.classList.remove('visible');
};

// Add click event listeners to all "Add to Cart" buttons
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

// The checkoutForm event listener remains the same
checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerName = document.getElementById('customer-name').value;
    const customerEmail = document.getElementById('customer-email').value;
    const packageName = modalPackageName.textContent;
    const packagePrice = modalPackagePrice.textContent;
    const orderAmount = parseFloat(packagePrice) * 100;

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
        handler: function (response) {
            alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
            // After success, you can optionally save the final details
            // to your database using the '/create-order' endpoint.
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
    rzp1.on('payment.failed', function (response) {
        alert('Payment failed: ' + response.error.description);
    });
    rzp1.open();
});

  // --- THIS IS THE NEW PART ---
  // Send the collected data to your backend endpoint
  fetch('http://localhost:3000/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderDetails)
  })
  .then(res => res.json())
  .then(data => {
      console.log('Success:', data);
      alert('Order submitted successfully!');
  })
  .catch((error) => {
      console.error('Error:', error);
      alert('There was an error submitting your order.');
  });
  
  closeModal();
});
