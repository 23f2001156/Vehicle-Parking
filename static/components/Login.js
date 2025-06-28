export default {
  name: 'Login',
  props: ['loggedIn'],
  data() {
    return {
      email: '',
      password: '',
      error: '',
      loading: false,
    }
  },
  methods: {
    async handleSubmit() {
      this.error = ''
      this.loading = true
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          }),
        })

        const data = await response.json()

        if (!response.ok) {
            this.error = data.error || data.message || 'Login failed'  // Check both
            this.loading = false
            return
}

        // Store token and role properly
        localStorage.setItem('token', data.token)
        localStorage.setItem('role', data.user.roles[0])
        localStorage.setItem('user', JSON.stringify(data.user))

        this.$emit('login')

        // Redirect based on role
        if (data.user.roles[0] === 'admin') {
          this.$router.push('/admin')
        } else {
          this.$router.push('/dashboard')
        }

      } catch (err) {
        console.error('Login error:', err)
        this.error = 'Error connecting to server.'
      }
      this.loading = false
    }
  },
  template: `
    <div class="container mt-5" style="max-width: 400px;">
      <h3>Login</h3>
      <form @submit.prevent="handleSubmit">
        <div class="mb-3">
          <label for="email" class="form-label">Email address</label>
          <input v-model="email" type="email" class="form-control" id="email" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Password</label>
          <input v-model="password" type="password" class="form-control" id="password" required />
        </div>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>
  `
}
