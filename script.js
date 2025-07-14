// Expense Tracker JavaScript

class ExpenseTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        this.currentTransactionId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateSummary();
        this.displayTransactions();
        this.populateFilterCategories();
        this.setDefaultDate();
    }

    bindEvents() {
        // Form submission
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Transaction type change
        document.getElementById('transaction-type').addEventListener('change', (e) => {
            this.toggleCategories(e.target.value);
        });

        // Filter controls
        document.getElementById('filter-type').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('filter-category').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Clear all transactions
        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAllTransactions();
        });

        // Modal events
        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.deleteTransaction(this.currentTransactionId);
            this.hideModal();
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.hideModal();
        });

        // Close modal when clicking outside
        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                this.hideModal();
            }
        });
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    toggleCategories(type) {
        const incomeCategories = document.getElementById('income-categories');
        const expenseCategories = document.getElementById('expense-categories');
        const categorySelect = document.getElementById('category');

        // Reset category selection
        categorySelect.value = '';

        if (type === 'income') {
            incomeCategories.style.display = 'block';
            expenseCategories.style.display = 'none';
        } else if (type === 'expense') {
            incomeCategories.style.display = 'none';
            expenseCategories.style.display = 'block';
        } else {
            incomeCategories.style.display = 'none';
            expenseCategories.style.display = 'none';
        }
    }

    addTransaction() {
        const formData = this.getFormData();
        
        if (!this.validateFormData(formData)) {
            return;
        }

        const transaction = {
            id: this.generateId(),
            ...formData,
            amount: parseFloat(formData.amount),
            timestamp: new Date().toISOString()
        };

        this.transactions.push(transaction);
        this.saveTransactions();
        this.updateSummary();
        this.displayTransactions();
        this.resetForm();
        this.populateFilterCategories();
        this.showSuccessMessage();
    }

    getFormData() {
        return {
            type: document.getElementById('transaction-type').value,
            description: document.getElementById('description').value.trim(),
            amount: document.getElementById('amount').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value
        };
    }

    validateFormData(data) {
        if (!data.type || !data.description || !data.amount || !data.category || !data.date) {
            this.showErrorMessage('Please fill in all fields');
            return false;
        }

        if (data.amount <= 0) {
            this.showErrorMessage('Amount must be greater than 0');
            return false;
        }

        return true;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    updateSummary() {
        const income = this.calculateTotal('income');
        const expenses = this.calculateTotal('expense');
        const balance = income - expenses;

        document.getElementById('total-income').textContent = this.formatCurrency(income);
        document.getElementById('total-expenses').textContent = this.formatCurrency(expenses);
        document.getElementById('balance').textContent = this.formatCurrency(balance);

        // Update balance color based on positive/negative
        const balanceElement = document.getElementById('balance');
        balanceElement.className = 'amount';
        if (balance > 0) {
            balanceElement.style.color = '#10b981';
        } else if (balance < 0) {
            balanceElement.style.color = '#ef4444';
        } else {
            balanceElement.style.color = '#3b82f6';
        }
    }

    calculateTotal(type) {
        return this.transactions
            .filter(transaction => transaction.type === type)
            .reduce((total, transaction) => total + transaction.amount, 0);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }

    displayTransactions(transactionsToShow = null) {
        const transactions = transactionsToShow || this.transactions;
        const container = document.getElementById('transactions-list');
        const noTransactions = document.getElementById('no-transactions');

        if (transactions.length === 0) {
            container.innerHTML = '';
            noTransactions.style.display = 'block';
            return;
        }

        noTransactions.style.display = 'none';

        // Sort transactions by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date) || new Date(b.timestamp) - new Date(a.timestamp)
        );

        container.innerHTML = sortedTransactions.map(transaction => 
            this.createTransactionHTML(transaction)
        ).join('');

        // Bind delete events
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentTransactionId = e.target.dataset.id;
                this.showModal();
            });
        });
    }

    createTransactionHTML(transaction) {
        const categoryName = this.getCategoryDisplayName(transaction.category);
        const formattedDate = this.formatDate(transaction.date);
        const sign = transaction.type === 'income' ? '+' : '-';

        return `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-details">
                    <div class="transaction-header">
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-amount ${transaction.type}">
                            ${sign}${this.formatCurrency(transaction.amount)}
                        </div>
                    </div>
                    <div class="transaction-meta">
                        <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                        <span class="transaction-category">${categoryName}</span>
                    </div>
                </div>
                <div class="transaction-actions">
                    <button class="delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    getCategoryDisplayName(category) {
        const categoryMap = {
            // Income categories
            'salary': 'Salary',
            'freelance': 'Freelance',
            'business': 'Business',
            'investment': 'Investment',
            'gift': 'Gift',
            'other-income': 'Other Income',
            // Expense categories
            'food': 'Food & Dining',
            'transportation': 'Transportation',
            'entertainment': 'Entertainment',
            'shopping': 'Shopping',
            'bills': 'Bills & Utilities',
            'healthcare': 'Healthcare',
            'education': 'Education',
            'travel': 'Travel',
            'groceries': 'Groceries',
            'other-expense': 'Other Expense'
        };
        return categoryMap[category] || category;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(transaction => transaction.id !== id);
        this.saveTransactions();
        this.updateSummary();
        this.displayTransactions();
        this.populateFilterCategories();
        this.showSuccessMessage('Transaction deleted successfully');
    }

    clearAllTransactions() {
        if (this.transactions.length === 0) {
            this.showErrorMessage('No transactions to clear');
            return;
        }

        if (confirm('Are you sure you want to delete all transactions? This action cannot be undone.')) {
            this.transactions = [];
            this.saveTransactions();
            this.updateSummary();
            this.displayTransactions();
            this.populateFilterCategories();
            this.clearFilters();
            this.showSuccessMessage('All transactions cleared successfully');
        }
    }

    filterTransactions() {
        const typeFilter = document.getElementById('filter-type').value;
        const categoryFilter = document.getElementById('filter-category').value;

        let filteredTransactions = [...this.transactions];

        if (typeFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
        }

        if (categoryFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
        }

        this.displayTransactions(filteredTransactions);
    }

    populateFilterCategories() {
        const filterCategory = document.getElementById('filter-category');
        const categories = [...new Set(this.transactions.map(t => t.category))];
        
        // Clear existing options except "All Categories"
        filterCategory.innerHTML = '<option value="all">All Categories</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = this.getCategoryDisplayName(category);
            filterCategory.appendChild(option);
        });
    }

    clearFilters() {
        document.getElementById('filter-type').value = 'all';
        document.getElementById('filter-category').value = 'all';
        this.displayTransactions();
    }

    resetForm() {
        document.getElementById('transaction-form').reset();
        this.setDefaultDate();
        this.toggleCategories('');
    }

    showModal() {
        document.getElementById('delete-modal').classList.add('show');
    }

    hideModal() {
        document.getElementById('delete-modal').classList.remove('show');
        this.currentTransactionId = null;
    }

    showSuccessMessage(message = 'Transaction added successfully') {
        this.showToast(message, 'success');
    }

    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add toast styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
        `;

        // Add animation keyframes
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    }

    saveTransactions() {
        localStorage.setItem('expense-tracker-transactions', JSON.stringify(this.transactions));
    }

    loadTransactions() {
        const saved = localStorage.getItem('expense-tracker-transactions');
        return saved ? JSON.parse(saved) : [];
    }

    // Export transactions to CSV
    exportToCSV() {
        if (this.transactions.length === 0) {
            this.showErrorMessage('No transactions to export');
            return;
        }

        const headers = ['Date', 'Type', 'Description', 'Category', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...this.transactions.map(t => [
                t.date,
                t.type,
                `"${t.description}"`,
                `"${this.getCategoryDisplayName(t.category)}"`,
                t.amount
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expense-tracker-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showSuccessMessage('Transactions exported successfully');
    }
}

// Initialize the expense tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.expenseTracker = new ExpenseTracker();
    
    // Add export functionality to clear all button context menu
    document.getElementById('clear-all').addEventListener('contextmenu', (e) => {
        e.preventDefault();
        window.expenseTracker.exportToCSV();
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N for new transaction
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('description').focus();
    }
    
    // Escape to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('delete-modal');
        if (modal.classList.contains('show')) {
            window.expenseTracker.hideModal();
        }
    }
});
