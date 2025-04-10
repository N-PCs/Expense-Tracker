document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const themeCheckbox = document.getElementById('theme-checkbox');
    const transactionForm = document.getElementById('transaction-form');
    const transactionsContainer = document.getElementById('transactions');
    const balanceElement = document.getElementById('balance');
    const incomeAmountElement = document.getElementById('income-amount');
    const expenseAmountElement = document.getElementById('expense-amount');
    const exportBtn = document.getElementById('export-btn');
    
    // Chart initialization
    const ctx = document.getElementById('chart').getContext('2d');
    let chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
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
        
        const text = document.getElementById('text').value;
        const amount = +document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const type = document.querySelector('input[name="type"]:checked').value;
        
        const transaction = {
            id: generateID(),
            text,
            amount,
            category,
            type
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
            deleteTransaction(id);
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
        
        const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
        const income = amounts
            .filter(item => item > 0)
            .reduce((acc, item) => acc + item, 0)
            .toFixed(2);
        const expense = (amounts
            .filter(item => item < 0)
            .reduce((acc, item) => acc + item, 0) * -1)
            .toFixed(2);
        
        balanceElement.textContent = `$${total}`;
        incomeAmountElement.textContent = `$${income}`;
        expenseAmountElement.textContent = `$${expense}`;
    }
    
    function updateTransactions() {
        transactionsContainer.innerHTML = '';
        
        if (transactions.length === 0) {
            transactionsContainer.innerHTML = '<p class="no-transactions">No transactions yet</p>';
            return;
        }
        
        transactions.forEach(transaction => {
            const transactionElement = document.createElement('div');
            transactionElement.classList.add('transaction', transaction.type);
            transactionElement.id = transaction.id;
            
            transactionElement.innerHTML = `
                <div class="transaction-name">
                    <span>${transaction.text}</span>
                    <div class="transaction-category">${transaction.category}</div>
                </div>
                <span class="transaction-amount">
                    ${transaction.type === 'income' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
                </span>
                <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
            `;
            
            transactionsContainer.appendChild(transactionElement);
        });
    }
    
    function updateChart() {
        const categories = {};
        
        transactions
            .filter(t => t.type === 'expense')
            .forEach(transaction => {
                if (!categories[transaction.category]) {
                    categories[transaction.category] = 0;
                }
                categories[transaction.category] += transaction.amount;
            });
        
        const labels = Object.keys(categories);
        const data = Object.values(categories);
        
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
            csv += `${transaction.type},${transaction.text},${transaction.amount},${transaction.category}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'expense-tracker-export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});