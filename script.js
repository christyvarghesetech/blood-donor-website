// Regional Data (Fetched from Supabase)
let regionData = {};

// Initialize Supabase Client
const SUPABASE_URL = "https://btbomnsmjzqcthdogmtp.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE"; // IMPORTANT: Replace this with your actual Anon Key!
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Active Donors State
let donorsData = [];

// Fetch Regions from Database
async function fetchRegions() {
  const { data, error } = await supabase.from('regions').select('*');
  if (error) {
    console.error("Error fetching regions:", error);
    return;
  }
  
  regionData = {};
  data.forEach(row => {
    regionData[row.district] = Array.isArray(row.cities) ? row.cities : [];
  });
}

// Fetch Donors from Database
async function fetchDonors() {
  const { data, error } = await supabase.from('donors').select('*');
  if (error) {
    console.error("Error fetching donors:", error);
    return;
  }
  // Map Supabase snake_case to app's camelCase structure
  donorsData = data.map(d => ({
    id: d.id,
    name: d.name,
    district: d.district,
    city: d.city,
    bloodType: d.blood_type,
    phone: d.phone,
    lastDonated: d.last_donated
  }));
}

// DOM Elements
const districtSelect = document.getElementById("district");
const citySelect = document.getElementById("city");
const bloodTypeSelect = document.getElementById("bloodtype");
const searchForm = document.getElementById("search-form");
const resultsSection = document.getElementById("results-section");
const donorsGrid = document.getElementById("donors-grid");
const emptyState = document.getElementById("empty-state");
const resultsCount = document.getElementById("results-count");

// Initialize Dropdowns
function initDropdowns() {
  // Populate District
  const districts = Object.keys(regionData).sort();
  districts.forEach(district => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    districtSelect.appendChild(option);
  });

  // Handle District Change
  districtSelect.addEventListener("change", function() {
    const selectedDistrict = this.value;
    
    // Clear City options
    citySelect.innerHTML = '<option value="" disabled selected>Select City</option>';
    
    if (selectedDistrict) {
      const cities = regionData[selectedDistrict].sort();
      cities.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
      citySelect.disabled = false;
    } else {
      citySelect.disabled = true;
    }
  });
}

// Render Donor Cards
function renderDonors(filteredDonors) {
  // Show results section
  resultsSection.classList.remove("hidden");
  
  // Update count
  resultsCount.textContent = `${filteredDonors.length} donor${filteredDonors.length !== 1 ? 's' : ''} found`;

  // Clear previous grid
  donorsGrid.innerHTML = "";

  if (filteredDonors.length === 0) {
    donorsGrid.classList.add("hidden");
    emptyState.classList.remove("hidden");
  } else {
    donorsGrid.classList.remove("hidden");
    emptyState.classList.add("hidden");

    filteredDonors.forEach(donor => {
      const card = document.createElement("div");
      card.className = "donor-card";
      
      card.innerHTML = `
        <div class="card-header">
          <h3 class="donor-name">${donor.name}</h3>
          <span class="blood-badge">${donor.bloodType}</span>
        </div>
        <ul class="donor-details">
          <li><strong>📍 Location:</strong> ${donor.city}, ${donor.district}</li>
          <li><strong>📅 Last Donated:</strong> ${donor.lastDonated}</li>
        </ul>
        <button class="btn-contact" onclick="alert('Contacting ${donor.name} at ${donor.phone}')">
          Contact Donor
        </button>
      `;
      
      donorsGrid.appendChild(card);
    });
  }
  
  // Smooth scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Handle Form Submit
searchForm.addEventListener("submit", function(e) {
  e.preventDefault();
  
  const district = districtSelect.value;
  const city = citySelect.value;
  const bloodType = bloodTypeSelect.value;

  // Filter Data
  const results = donorsData.filter(donor => {
    return donor.district === district && 
           donor.city === city && 
           donor.bloodType === bloodType;
  });

  renderDonors(results);
});

// Initialize on Load
window.addEventListener("DOMContentLoaded", async () => {
  // Fetch from Supabase
  await Promise.all([fetchRegions(), fetchDonors()]);
  initDropdowns();
  
  // Need to render if admin logged in and relies on async data
  if (sessionStorage.getItem("adminLoggedIn") === "true") {
    initAdminDropdowns();
    renderAdminDonors();
  }
});

// -----------------------------------------
// Admin Functionality
// -----------------------------------------
const adminLoginBtn = document.getElementById("admin-login-btn");
const adminLogoutBtn = document.getElementById("admin-logout-btn");
const adminModal = document.getElementById("admin-modal");
const closeModal = document.getElementById("close-modal");
const adminLoginForm = document.getElementById("admin-login-form");
const adminPassword = document.getElementById("admin-password");
const adminError = document.getElementById("admin-error");
const adminDashboard = document.getElementById("admin-dashboard");

// Admin List Donors
const adminDonorsList = document.getElementById("admin-donors-list");
const refreshDonorsBtn = document.getElementById("refresh-donors-btn");

// Admin New Donor Form
const addDonorForm = document.getElementById("add-donor-form");
const newDistrict = document.getElementById("new-district");
const newCity = document.getElementById("new-city");
const addSuccessMsg = document.getElementById("add-success-msg");

// Verify Login state from sessionStorage
if (sessionStorage.getItem("adminLoggedIn") === "true") {
  adminLoginBtn.classList.add("hidden");
  adminDashboard.classList.remove("hidden");
}

// Open Modal
adminLoginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  adminModal.classList.remove("hidden");
});

// Close Modal
closeModal.addEventListener("click", () => {
  adminModal.classList.add("hidden");
  adminError.classList.add("hidden");
  adminPassword.value = '';
});

// Handle Admin Login
adminLoginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (adminPassword.value === "admin123") {
    sessionStorage.setItem("adminLoggedIn", "true");
    adminModal.classList.add("hidden");
    adminLoginBtn.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    adminPassword.value = '';
    adminError.classList.add("hidden");
    initAdminDropdowns();
    renderAdminDonors();
  } else {
    adminError.classList.remove("hidden");
  }
});

// Handle Logout
adminLogoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("adminLoggedIn");
  adminDashboard.classList.add("hidden");
  adminLoginBtn.classList.remove("hidden");
});

// Initialize Admin Dropdowns
function initAdminDropdowns() {
  newDistrict.innerHTML = '<option value="" disabled selected>Select District</option>';
  const districts = Object.keys(regionData).sort();
  districts.forEach(district => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    newDistrict.appendChild(option);
  });

  newDistrict.addEventListener("change", function() {
    const selectedDistrict = this.value;
    newCity.innerHTML = '<option value="" disabled selected>Select City</option>';
    
    if (selectedDistrict) {
      const cities = regionData[selectedDistrict].sort();
      cities.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        newCity.appendChild(option);
      });
      newCity.disabled = false;
    } else {
      newCity.disabled = true;
    }
  });
}

// Handle Add Donor Submission
addDonorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("new-name").value;
  const phone = document.getElementById("new-phone").value;
  const district = newDistrict.value;
  const city = newCity.value;
  const bloodType = document.getElementById("new-bloodtype").value;
  
  const date = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;

// removed newDonor unused var since we define dbDonor directly

  // Add to Supabase
  const dbDonor = {
    name: name,
    district: district,
    city: city,
    blood_type: bloodType,
    phone: phone,
    last_donated: currentMonthYear
  };
  
  const { error } = await supabase.from('donors').insert([dbDonor]);
  
  if(error) {
    console.error("Error inserting donor:", error);
    alert("Could not save donor to database. Check console for error.");
    return;
  }
  
  await fetchDonors();

  // Show success and reset form
  addSuccessMsg.classList.remove("hidden");
  addDonorForm.reset();
  newCity.disabled = true;
  
  renderAdminDonors(); // refresh list

  setTimeout(() => {
    addSuccessMsg.classList.add("hidden");
  }, 3000);
});

// Render Admin Donors Table
function renderAdminDonors() {
  adminDonorsList.innerHTML = '';
  if(donorsData.length === 0) {
    adminDonorsList.innerHTML = '<tr><td colspan="6" style="text-align:center;">No donors found.</td></tr>';
    return;
  }
  
  donorsData.forEach(donor => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${donor.id}</td>
      <td><strong>${donor.name}</strong></td>
      <td><span class="blood-badge" style="font-size:12px; padding:4px 8px;">${donor.bloodType}</span></td>
      <td>${donor.city}, ${donor.district}</td>
      <td>${donor.phone}</td>
      <td>
        <button class="btn-delete" onclick="deleteDonor(${donor.id})">Delete</button>
      </td>
    `;
    adminDonorsList.appendChild(tr);
  });
}

// Delete Donor Function
window.deleteDonor = async function(id) {
  if (confirm("Are you sure you want to remove this donor?")) {
    const { error } = await supabase.from('donors').delete().eq('id', id);
    if(error) {
      console.error("Error deleting donor:", error);
      alert("Could not delete donor from database.");
      return;
    }

    await fetchDonors();
    renderAdminDonors(); // Refresh the table
    
    // Auto refresh search results if they are visible
    if(!resultsSection.classList.contains("hidden")) {
      searchForm.dispatchEvent(new Event('submit'));
    }
  }
};

// Refresh Button Listener
refreshDonorsBtn.addEventListener("click", renderAdminDonors);

// -----------------------------------------
// SPA Navigation & Public Form Logic
// -----------------------------------------
const navHome = document.getElementById("nav-home");
const navAbout = document.getElementById("nav-about");
const navRegister = document.getElementById("nav-register");

const homePage = document.getElementById("home-page");
const aboutPage = document.getElementById("about-page");
const registerPage = document.getElementById("register-page");

function switchPage(activeNav, activePage) {
  // Reset all nav items
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  activeNav.classList.add("active");
  
  // Hide all sections
  document.querySelectorAll(".view-section").forEach(sec => sec.classList.add("hidden"));
  activePage.classList.remove("hidden");
  
  // Also hide admin dashboard if navigating away
  adminDashboard.classList.add("hidden");
  if(sessionStorage.getItem("adminLoggedIn") === "true") {
    // keeping state, but hiding dashboard view
  } else {
    adminLoginBtn.classList.remove("hidden");
  }
}

navHome.addEventListener("click", (e) => { e.preventDefault(); switchPage(navHome, homePage); });
navAbout.addEventListener("click", (e) => { e.preventDefault(); switchPage(navAbout, aboutPage); });
navRegister.addEventListener("click", (e) => { 
  e.preventDefault(); 
  switchPage(navRegister, registerPage); 
  initPublicRegisterDropdowns();
});

// Admin Button behavior - return home and show dashboard
adminLoginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  switchPage(navHome, homePage);
  adminModal.classList.remove("hidden");
});
if(document.getElementById("admin-logout-btn")) {
  document.getElementById("admin-logout-btn").addEventListener("click", () => {
    switchPage(navHome, homePage);
  });
}

// Public Register Dropdowns
const pubDistrict = document.getElementById("pub-district");
const pubCity = document.getElementById("pub-city");
const pubRegisterForm = document.getElementById("public-register-form");
const pubSuccessMsg = document.getElementById("pub-success-msg");

function initPublicRegisterDropdowns() {
  if (pubDistrict.options.length > 1) return; // already initialized
  
  const districts = Object.keys(regionData).sort();
  districts.forEach(district => {
    const option = document.createElement("option");
    option.value = district;
    option.textContent = district;
    pubDistrict.appendChild(option);
  });

  pubDistrict.addEventListener("change", function() {
    const selectedDistrict = this.value;
    pubCity.innerHTML = '<option value="" disabled selected>Select City</option>';
    
    if (selectedDistrict) {
      const cities = regionData[selectedDistrict].sort();
      cities.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        pubCity.appendChild(option);
      });
      pubCity.disabled = false;
    } else {
      pubCity.disabled = true;
    }
  });
}

pubRegisterForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("pub-name").value;
  const phone = document.getElementById("pub-phone").value;
  const district = pubDistrict.value;
  const city = pubCity.value;
  const bloodType = document.getElementById("pub-bloodtype").value;
  
  const date = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;

  // Add to database
  const dbDonor = {
    name: name,
    district: district,
    city: city,
    blood_type: bloodType,
    phone: phone,
    last_donated: currentMonthYear
  };
  
  const { error } = await supabase.from('donors').insert([dbDonor]);
  if(error) {
    console.error("Error registering donor:", error);
    alert("There was an error completing your registration.");
    return;
  }

  await fetchDonors();

  pubSuccessMsg.classList.remove("hidden");
  pubRegisterForm.reset();
  pubCity.disabled = true;
  
  if(sessionStorage.getItem("adminLoggedIn") === "true") {
      renderAdminDonors();
  }

  setTimeout(() => {
    pubSuccessMsg.classList.add("hidden");
  }, 4000);
});
