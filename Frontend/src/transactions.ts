// @ts-nocheck
import './style.css'
import Alpine from 'alpinejs'
import { requireAuth, removeToken, axios } from './auth'

window.Alpine = Alpine

if (!requireAuth()) throw new Error('Not authenticated')

document.addEventListener('alpine:init', () => {
  Alpine.data('ledger', () => ({
    user: JSON.parse(localStorage.getItem('auth_user') || '{}'),
    transactions: [],
    searchQuery: '',
    filterType: '',

    formatCurrency(value) {
      return 'Rs ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
    },

    async logout() {
      try { await axios.post('/auth/logout') } catch (e) {}
      removeToken()
      window.location.href = '/login.html'
    },

    async init() {
      await this.fetchTransactions()
    },

    async fetchTransactions() {
      try {
        const params = {}
        if (this.searchQuery) params.search = this.searchQuery
        if (this.filterType) params.type = this.filterType
        const response = await axios.get('/transactions', { params })
        this.transactions = response.data
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }
  }))
})

Alpine.start()
