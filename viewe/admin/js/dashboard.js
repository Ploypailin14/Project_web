document.addEventListener('DOMContentLoaded', () => {

    // --- Navigation System ---
    const backBtn = document.getElementById('back-btn');

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // Navigate back to the main admin welcome page
            window.location.href = 'dashboard.html'; 
        });
    }

    // --- Dashboard Data Fetching (Mockup for future API connection) ---
    async function loadDashboardStats() {
        try {
            // Future implementation: 
            // const response = await fetch('/api/stats');
            // const data = await response.json();
            
            // Mock data simulating a database response
            const statData = {
                customers: 80,
                revenue: "15,000",
                currency: "B"
            };

            const customerElement = document.getElementById('customer-count');
            const revenueElement = document.getElementById('revenue-amount');

            if (customerElement && revenueElement) {
                customerElement.textContent = statData.customers;
                revenueElement.textContent = `${statData.revenue}${statData.currency}`;
            }

        } catch (error) {
            console.error('Failed to load dashboard statistics:', error);
        }
    }

    // Initialize data loading (Optional: uncomment to use)
    // loadDashboardStats();

});