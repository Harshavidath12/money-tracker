// @ts-nocheck
import './style.css'
import Alpine from 'alpinejs'
import axios from 'axios'
import { setToken } from './auth'

window.Alpine = Alpine

axios.defaults.baseURL = 'http://localhost:8000/api'
axios.defaults.headers.common['Accept'] = 'application/json'

// Redirect already-logged-in users
if (localStorage.getItem('auth_token')) {
  window.location.href = '/'
}

document.addEventListener('alpine:init', () => {
  Alpine.data('registerPage', () => ({
    form: { name: '', email: '', password: '', password_confirmation: '' },
    loading: false,
    errorMsg: '',

    async register() {
      this.loading = true
      this.errorMsg = ''
      try {
        const res = await axios.post('/auth/register', this.form)
        setToken(res.data.token)
        localStorage.setItem('auth_user', JSON.stringify(res.data.user))
        window.location.href = '/'
      } catch (err) {
        if (err.response?.data?.errors) {
          const msgs = Object.values(err.response.data.errors).flat()
          this.errorMsg = msgs[0]
        } else if (err.response?.data?.message) {
          this.errorMsg = err.response.data.message
        } else {
          this.errorMsg = 'Registration failed. Please try again.'
        }
      } finally {
        this.loading = false
      }
    }
  }))
})

Alpine.start()
