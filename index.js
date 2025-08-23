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
// --- Get Started Button Scroll Logic ---
$('.botn').on('click', function(event) {
  // Find the activities section, which has the class 'second'
  var activitiesSection = $('.second');

  // Animate the scroll to that section
  $('html, body').animate({
    scrollTop: activitiesSection.offset().top
  }, 800); // 800 is the scroll speed in milliseconds
});
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
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Prevent the default form submission

  // Collect all the data from the form
  const orderDetails = {
      packageName: modalPackageName.textContent,
      packagePrice: modalPackagePrice.textContent,
      customerName: document.getElementById('customer-name').value,
      customerEmail: document.getElementById('customer-email').value,
      customerAddress: document.getElementById('customer-address').value,
      customerCity: document.getElementById('customer-city').value,
      customerZip: document.getElementById('customer-zip').value,
  };

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
