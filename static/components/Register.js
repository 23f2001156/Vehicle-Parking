export default {
  name: 'Register',
  data() {
    return {
      email: '',
      username: '',
      password: '',
      error: '',
      success: ''
    }
  },
  methods: {
    async handleRegister() {
      this.error = ''
      this.success = ''
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.email,
            username: this.username,
            password: this.password
          }),
        })

        const data = await response.json()
        if (!response.ok) {
           if (response.status === 409) {
            this.error = 'Email is already registered.';
          } else {
            this.error = data.message || 'Registration failed';
          }
          return
        }

        this.success = 'Registration successful! You can now log in.'
        this.email = ''
        this.username = ''
        this.password = ''
      } catch (err) {
        this.error = 'Error connecting to server.'
      }
    }
  },
  template: `
    <div class="container mt-5" style="max-width: 400px;">
      <h3>Register</h3>
      <form @submit.prevent="handleRegister">
        <div class="mb-3">
          <label>Email</label>
          <input v-model="email" type="email" class="form-control" required />
        </div>
        <div class="mb-3">
          <label>Username</label>
          <input v-model="username" type="text" class="form-control" required />
        </div>
        <div class="mb-3">
          <label>Password</label>
          <input v-model="password" type="password" class="form-control" required />
        </div>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>
        <button class="btn btn-primary">Register</button>
      </form>
    </div>
  `
}
