// @ts-nocheck
import './style.css'
import Alpine from 'alpinejs'
import { requireAuth, removeToken, axios } from './auth'

window.Alpine = Alpine

if (!requireAuth()) throw new Error('Not authenticated')

document.addEventListener('alpine:init', () => {
  Alpine.data('categoriesPage', () => ({
    user: JSON.parse(localStorage.getItem('auth_user') || '{}'),
    categories: [],
    showModal: false,
    editingCategory: null,
    form: { name: '', type: 'expense', monthly_budget: 0 },

    formatCurrency(value) {
      return 'Rs ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
    },

    async logout() {
      try { await axios.post('/auth/logout') } catch (e) {}
      removeToken()
      window.location.href = '/login.html'
    },

    async init() {
      await this.fetchCategories()
    },

    async fetchCategories() {
      try {
        const response = await axios.get('/categories')
        this.categories = response.data
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    },

    openModal(category = null) {
      this.editingCategory = category
      if (category) {
        this.form = { name: category.name, type: category.type, monthly_budget: category.monthly_budget }
      } else {
        this.form = { name: '', type: 'expense', monthly_budget: 0 }
      }
      this.showModal = true
    },

    async saveCategory() {
      try {
        if (this.editingCategory) {
          await axios.put(`/categories/${this.editingCategory.id}`, this.form)
        } else {
          await axios.post('/categories', this.form)
        }
        this.showModal = false
        await this.fetchCategories()
      } catch (error) {
        console.error("Failed to save category", error)
        alert('Failed to save category.')
      }
    },

    async deleteCategory(id) {
      if (!confirm('Are you sure you want to delete this category?')) return
      try {
        await axios.delete(`/categories/${id}`)
        await this.fetchCategories()
      } catch (error) {
        console.error("Failed to delete category", error)
        alert('Failed to delete category.')
      }
    }
  }))
})

Alpine.start()
