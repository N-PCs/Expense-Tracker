document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeCheckbox = document.getElementById('theme-checkbox');
    const transactionForm = document.getElementById('transaction-form');
    const transactionsContainer = document.getElementById('transactions');
    const balanceElement = document.getElementById('balance');
    const incomeAmountElement = document.getElementById('income-amount');
    const expenseAmountElement = document.getElementById('expense-amount');
    const exportBtn = document.getElementById('export-btn');
    
    // Format currency as INR
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Chart initialization
    const ctx = document.getElementById('chart').getContext('2d');
    let chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Food', 'Rent', 'Transport', 'Entertainment', 'Shopping', 'Other'],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0], // Initialize with zeros
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'var(--text-color)'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
    
    // Theme toggle
    themeCheckbox.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        updateChartColors();
        localStorage.setItem('darkMode', this.checked);
    });
    
    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'true') {
        themeCheckbox.checked = true;
        document.body.classList.add('dark-mode');
    }
    
    // Transactions array
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    // Initialize app
    updateBalance();
    updateTransactions();
    updateChart();
    
    // Add transaction
    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const text = document.getElementById('text').value.trim();
        const amount = +document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const type = document.querySelector('input[name="type"]:checked').value;
        
        if (!text || amount <= 0) {
            alert('Please enter valid description and amount');
            return;
        }
        
        const transaction = {
            id: generateID(),
            text,
            amount,
            category,
            type,
            date: new Date().toISOString()
        };
        
        transactions.push(transaction);
        updateLocalStorage();
        updateBalance();
        updateTransactions();
        updateChart();
        
        // Reset form
        this.reset();
        document.getElementById('text').focus();
    });
    
    // Delete transaction
    transactionsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.closest('.transaction').id;
            if (confirm('Are you sure you want to delete this transaction?')) {
                deleteTransaction(id);
            }
        }
    });
    
    // Export to CSV
    exportBtn.addEventListener('click', exportToCSV);
    
    // Functions
    function generateID() {
        return Math.floor(Math.random() * 1000000000);
    }
    
    function deleteTransaction(id) {
        transactions = transactions.filter(transaction => transaction.id != id);
        updateLocalStorage();
        updateBalance();
        updateTransactions();
        updateChart();
    }
    
    function updateLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    function updateBalance() {
        const amounts = transactions.map(transaction => 
            transaction.type === 'income' ? transaction.amount : -transaction.amount
        );
        
        const total = amounts.reduce((acc, item) => acc + item, 0);
        const income = amounts
            .filter(item => item > 0)
            .reduce((acc, item) => acc + item, 0);
        const expense = amounts
            .filter(item => item < 0)
            .reduce((acc, item) => acc + item, 0) * -1;
        
        balanceElement.textContent = formatCurrency(total);
        incomeAmountElement.textContent = formatCurrency(income);
        expenseAmountElement.textContent = formatCurrency(expense);
    }
    
    function updateTransactions() {
        transactionsContainer.innerHTML = '';
        
        if (transactions.length === 0) {
            transactionsContainer.innerHTML = '<p class="no-transactions">No transactions yet</p>';
            return;
        }
        
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        transactions.forEach(transaction => {
            const transactionElement = document.createElement('div');
            transactionElement.classList.add('transaction', transaction.type);
            transactionElement.id = transaction.id;
            
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            
            transactionElement.innerHTML = `
                <div class="transaction-name">
                    <span>${transaction.text}</span>
                    <div class="transaction-category">${transaction.category} • ${formattedDate}</div>
                </div>
                <span class="transaction-amount">
                    ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}
                </span>
                <button class="delete-btn" title="Delete transaction"><i class="fas fa-trash-alt"></i></button>
            `;
            
            transactionsContainer.appendChild(transactionElement);
        });
    }
    
    function updateChart() {
        // Initialize all categories with 0
        const categories = {
            food: 0,
            rent: 0,
            transport: 0,
            entertainment: 0,
            shopping: 0,
            other: 0
        };
        
        // Sum expenses by category
        transactions
            .filter(t => t.type === 'expense')
            .forEach(transaction => {
                categories[transaction.category] += transaction.amount;
            });
        
        // Convert to arrays for Chart.js
        const labels = Object.keys(categories).map(category => {
            // Capitalize first letter
            return category.charAt(0).toUpperCase() + category.slice(1);
        });
        
        const data = Object.values(categories);
        
        // Update chart data
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
        
        updateChartColors();
    }
    
    function updateChartColors() {
        if (chart) {
            chart.options.plugins.legend.labels.color = getComputedStyle(document.body).getPropertyValue('--text-color');
            chart.update();
        }
    }
    
    function exportToCSV() {
        if (transactions.length === 0) {
            alert('No transactions to export');
            return;
        }
        
        let csv = 'Type,Description,Amount,Category,Date\n';
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('en-IN');
            
            csv += `${transaction.type},${transaction.text},${formatCurrency(transaction.amount)},${transaction.category},${formattedDate}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `expense-tracker-${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});