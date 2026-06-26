// @ts-nocheck
import './style.css'
import Alpine from 'alpinejs'
import { requireAuth, removeToken, axios } from './auth'
import Chart from 'chart.js/auto'

window.Alpine = Alpine
window.axios = axios

if (!requireAuth()) {
  // requireAuth already redirects
  throw new Error('Not authenticated')
}

document.addEventListener('alpine:init', () => {
  Alpine.data('dashboard', () => ({
    user: JSON.parse(localStorage.getItem('auth_user') || '{}'),
    summary: { totalIncome: 0, totalExpense: 0, netBalance: 0, monthlyIncome: 0, monthlyExpense: 0 },
    categories: [],
    chartData: { labels: [], income: [], expense: [] },
    showTransactionModal: false,
    chartInstance: null,
    newTx: {
      type: 'expense',
      amount: '',
      category_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: ''
    },

    get filteredCategories() {
      return this.categories.filter(c => c.type === this.newTx.type)
    },

    formatCurrency(value) {
      return 'Rs ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
    },

    getBudgetColor(spent, budget) {
      const percentage = (spent / budget) * 100
      if (percentage >= 100) return 'bg-red-500 animate-pulse'
      if (percentage >= 80) return 'bg-yellow-500'
      return 'bg-green-500'
    },

    async logout() {
      try { await axios.post('/auth/logout') } catch (e) {}
      removeToken()
      window.location.href = '/login.html'
    },

    async init() {
      await this.fetchDashboardData()
      this.initChart()
    },

    async fetchDashboardData() {
      try {
        const response = await axios.get('/dashboard')
        this.summary = response.data.summary
        this.categories = response.data.categories
        this.chartData = response.data.chartData
        this.updateChart()
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      }
    },

    initChart() {
      const ctx = document.getElementById('trendsChart')
      if (!ctx) return
      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.chartData.labels,
          datasets: [
            {
              label: 'Income',
              data: this.chartData.income,
              borderColor: '#4ade80',
              backgroundColor: 'rgba(74, 222, 128, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Expenses',
              data: this.chartData.expense,
              borderColor: '#f87171',
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
          }
        }
      })
    },

    updateChart() {
      if (this.chartInstance) {
        this.chartInstance.data.labels = this.chartData.labels
        this.chartInstance.data.datasets[0].data = this.chartData.income
        this.chartInstance.data.datasets[1].data = this.chartData.expense
        this.chartInstance.update()
      }
    },

    async saveTransaction() {
      try {
        await axios.post('/transactions', this.newTx)
        this.showTransactionModal = false
        this.newTx.amount = ''
        this.newTx.description = ''
        await this.fetchDashboardData()
      } catch (error) {
        console.error("Failed to save transaction", error)
        alert('Failed to save transaction.')
      }
    }
  }))
})

Alpine.start()
