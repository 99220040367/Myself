// Temporary "database" using localStorage
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}
if (!localStorage.getItem('loanRequests')) {
    localStorage.setItem('loanRequests', JSON.stringify([]));
}
if (!localStorage.getItem('loans')) {
    localStorage.setItem('loans', JSON.stringify([]));
}

// Current user session
let currentUser = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
        window.location.href = 'dashboard.html';
    } else if (!loggedInUser && !(window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
        window.location.href = 'index.html';
    }
    
    // Initialize the current page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        initLoginPage();
    } else if (window.location.pathname.endsWith('dashboard.html')) {
        initDashboardPage();
    }
});

// Login Page Functions
function initLoginPage() {
    // Toggle between login and register forms
    document.getElementById('showRegister').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    });
    
    document.getElementById('showLogin').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    });
    
    // User type selection
    const userTypeBtns = document.querySelectorAll('.user-type-btn');
    userTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            userTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('userType').value = this.dataset.type;
        });
    });
    
    // Login form submission
    document.getElementById('login').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            alert('Invalid email or password');
        }
    });
    
    // Register form submission
    document.getElementById('register').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const phone = document.getElementById('regPhone').value;
        const aadhaar = document.getElementById('regAadhaar').value;
        const type = document.getElementById('userType').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users'));
        
        if (users.some(u => u.email === email)) {
            alert('Email already registered');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            phone,
            aadhaar,
            type,
            cibilScore: null
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        alert('Registration successful! Please login.');
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').value = '';
    });
}

// Dashboard Page Functions
function initDashboardPage() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set user name in dashboard
    document.getElementById('userName').textContent = currentUser.name;
    
    // Show appropriate section based on user type
    if (currentUser.type === 'borrower') {
        document.getElementById('borrowerSection').style.display = 'block';
        initBorrowerSection();
    } else {
        document.getElementById('lenderSection').style.display = 'block';
        initLenderSection();
    }
    
    // Navigation links
    document.getElementById('logoutLink').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

// Borrower Functions
function initBorrowerSection() {
    // Check CIBIL button
    document.getElementById('checkCibil').addEventListener('click', function() {
        const cibilScore = Math.floor(Math.random() * (900 - 300 + 1)) + 300; // Random score between 300-900
        currentUser.cibilScore = cibilScore;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update users array with new CIBIL score
        const users = JSON.parse(localStorage.getItem('users'));
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].cibilScore = cibilScore;
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        const cibilResult = document.getElementById('cibilResult');
        cibilResult.style.display = 'block';
        cibilResult.innerHTML = `
            <h3>Your CIBIL Score: ${cibilScore}</h3>
            <p>Status: ${getCibilStatus(cibilScore)}</p>
        `;
        
        if (cibilScore >= 650) {
            document.getElementById('loanApplicationSection').style.display = 'block';
            cibilResult.innerHTML += `<p class="status-approved">You qualify for a loan!</p>`;
        } else {
            cibilResult.innerHTML += `<p class="status-rejected">Your CIBIL score is too low for loan approval at this time.</p>`;
        }
    });
    
    // Loan application form
    document.getElementById('loanApplication').addEventListener('submit', function(e) {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('loanAmount').value);
        const purpose = document.getElementById('loanPurpose').value;
        const tenure = parseInt(document.getElementById('loanTenure').value);
        
        const loanRequest = {
            id: Date.now(),
            borrowerId: currentUser.id,
            borrowerName: currentUser.name,
            amount,
            purpose,
            tenure,
            cibilScore: currentUser.cibilScore,
            status: 'pending',
            date: new Date().toISOString()
        };
        
        const loanRequests = JSON.parse(localStorage.getItem('loanRequests'));
        loanRequests.push(loanRequest);
        localStorage.setItem('loanRequests', JSON.stringify(loanRequests));
        
        alert('Loan application submitted successfully!');
        this.reset();
    });
    
    // Display active loans
    displayBorrowerLoans();
}

function getCibilStatus(score) {
    if (score >= 800) return 'Excellent';
    if (score >= 750) return 'Very Good';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    if (score >= 600) return 'Poor';
    return 'Very Poor';
}

function displayBorrowerLoans() {
    const loans = JSON.parse(localStorage.getItem('loans'));
    const borrowerLoans = loans.filter(loan => loan.borrowerId === currentUser.id);
    
    if (borrowerLoans.length > 0) {
        const activeLoansList = document.getElementById('activeLoansList');
        activeLoansList.innerHTML = '';
        document.getElementById('activeLoansSection').style.display = 'block';
        
        borrowerLoans.forEach(loan => {
            const loanDiv = document.createElement('div');
            loanDiv.className = 'loan-card';
            loanDiv.innerHTML = `
                <h3>₹${loan.amount} - ${loan.purpose}</h3>
                <p>Status: <span class="status-${loan.status}">${loan.status}</span></p>
                <p>Tenure: ${loan.tenure} months</p>
                <p>Interest Rate: ${loan.interestRate}%</p>
                <button class="view-repayment" data-loan-id="${loan.id}">View Repayment Schedule</button>
            `;
            activeLoansList.appendChild(loanDiv);
        });
        
        // Add event listeners to repayment buttons
        document.querySelectorAll('.view-repayment').forEach(btn => {
            btn.addEventListener('click', function() {
                showRepaymentSchedule(this.dataset.loanId);
            });
        });
    }
}

function showRepaymentSchedule(loanId) {
    const loans = JSON.parse(localStorage.getItem('loans'));
    const loan = loans.find(l => l.id === parseInt(loanId));
    
    if (!loan) return;
    
    // Calculate EMI and repayment schedule
    const monthlyInterest = loan.interestRate / 12 / 100;
    const emi = loan.amount * monthlyInterest * Math.pow(1 + monthlyInterest, loan.tenure) / 
                (Math.pow(1 + monthlyInterest, loan.tenure) - 1);
    
    let balance = loan.amount;
    const today = new Date();
    let scheduleHTML = `
        <div class="repayment-schedule">
            <h3>Repayment Schedule for ₹${loan.amount}</h3>
            <table class="repayment-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Due Date</th>
                        <th>EMI (₹)</th>
                        <th>Principal (₹)</th>
                        <th>Interest (₹)</th>
                        <th>Balance (₹)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    for (let i = 1; i <= loan.tenure; i++) {
        const interest = balance * monthlyInterest;
        const principal = emi - interest;
        balance -= principal;
        
        const dueDate = new Date(today.setMonth(today.getMonth() + 1));
        
        scheduleHTML += `
            <tr>
                <td>${i}</td>
                <td>${dueDate.toLocaleDateString()}</td>
                <td>${emi.toFixed(2)}</td>
                <td>${principal.toFixed(2)}</td>
                <td>${interest.toFixed(2)}</td>
                <td>${balance > 0 ? balance.toFixed(2) : '0.00'}</td>
                <td class="status-pending">Pending</td>
            </tr>
        `;
    }
    
    scheduleHTML += `
                </tbody>
            </table>
            <button class="close-schedule">Close</button>
        </div>
    `;
    
    // Create a modal to display the schedule
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = scheduleHTML;
    document.body.appendChild(modal);
    
    // Close button
    modal.querySelector('.close-schedule').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
}

// Lender Functions
function initLenderSection() {
    // Apply filters button
    document.getElementById('applyFilters').addEventListener('click', function() {
        displayLoanRequests();
    });
    
    // Display loan requests and offered loans
    displayLoanRequests();
    displayOfferedLoans();
}

function displayLoanRequests() {
    const minCibil = parseInt(document.getElementById('minCibil').value) || 650;
    const maxAmount = parseInt(document.getElementById('maxAmount').value) || 100000;
    
    const loanRequests = JSON.parse(localStorage.getItem('loanRequests'));
    const filteredRequests = loanRequests.filter(
        req => req.cibilScore >= minCibil && 
              req.amount <= maxAmount &&
              req.status === 'pending'
    );
    
    const loanRequestsList = document.getElementById('loanRequestsList');
    loanRequestsList.innerHTML = '';
    
    if (filteredRequests.length === 0) {
        loanRequestsList.innerHTML = '<p>No loan requests match your filters.</p>';
        return;
    }
    
    filteredRequests.forEach(request => {
        const requestDiv = document.createElement('div');
        requestDiv.className = 'loan-card';
        requestDiv.innerHTML = `
            <h3>₹${request.amount} - ${request.purpose}</h3>
            <p>Requested by: ${request.borrowerName}</p>
            <p>CIBIL Score: ${request.cibilScore} (${getCibilStatus(request.cibilScore)})</p>
            <p>Tenure: ${request.tenure} months</p>
            <button class="offer-loan" data-request-id="${request.id}">Offer Loan</button>
        `;
        loanRequestsList.appendChild(requestDiv);
    });
    
    // Add event listeners to offer buttons
    document.querySelectorAll('.offer-loan').forEach(btn => {
        btn.addEventListener('click', function() {
            offerLoan(this.dataset.requestId);
        });
    });
}

function offerLoan(requestId) {
    const loanRequests = JSON.parse(localStorage.getItem('loanRequests'));
    const requestIndex = loanRequests.findIndex(req => req.id === parseInt(requestId));
    
    if (requestIndex === -1) return;
    
    // For simplicity, we'll auto-generate loan terms
    const request = loanRequests[requestIndex];
    const interestRate = calculateInterestRate(request.cibilScore);
    
    const newLoan = {
        id: Date.now(),
        requestId: request.id,
        borrowerId: request.borrowerId,
        lenderId: currentUser.id,
        amount: request.amount,
        purpose: request.purpose,
        tenure: request.tenure,
        interestRate,
        status: 'active',
        date: new Date().toISOString()
    };
    
    // Update request status
    loanRequests[requestIndex].status = 'approved';
    localStorage.setItem('loanRequests', JSON.stringify(loanRequests));
    
    // Add to loans
    const loans = JSON.parse(localStorage.getItem('loans'));
    loans.push(newLoan);
    localStorage.setItem('loans', JSON.stringify(loans));
    
    alert(`Loan offered successfully at ${interestRate}% interest rate`);
    displayLoanRequests();
    displayOfferedLoans();
}

function calculateInterestRate(cibilScore) {
    // Simple interest rate calculation based on CIBIL score
    if (cibilScore >= 800) return 8.5;
    if (cibilScore >= 750) return 10.0;
    if (cibilScore >= 700) return 12.5;
    if (cibilScore >= 650) return 15.0;
    return 18.0; // Shouldn't happen since we filter by min score
}

function displayOfferedLoans() {
    const loans = JSON.parse(localStorage.getItem('loans'));
    const offeredLoans = loans.filter(loan => loan.lenderId === currentUser.id);
    
    if (offeredLoans.length > 0) {
        const offeredLoansList = document.getElementById('offeredLoansList');
        offeredLoansList.innerHTML = '';
        document.getElementById('offeredLoansSection').style.display = 'block';
        
        offeredLoans.forEach(loan => {
            const loanDiv = document.createElement('div');
            loanDiv.className = 'loan-card';
            loanDiv.innerHTML = `
                <h3>₹${loan.amount} - ${loan.purpose}</h3>
                <p>Borrower ID: ${loan.borrowerId}</p>
                <p>Tenure: ${loan.tenure} months</p>
                <p>Interest Rate: ${loan.interestRate}%</p>
                <p>Status: <span class="status-${loan.status}">${loan.status}</span></p>
            `;
            offeredLoansList.appendChild(loanDiv);
        });
    }
}