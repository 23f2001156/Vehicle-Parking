export default {
  props: ['loggedIn'],
  computed: {
    
    isUserLoggedIn() {
      return this.loggedIn || localStorage.getItem('token')
    },
    userRole() {
      return localStorage.getItem('role')
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('user')
      this.$emit('logout')
      this.$router.push('/')
    }
  },
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/">FastLogistics</router-link>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <!-- Show Login/Register only when NOT logged in -->
            <li class="nav-item" v-if="!isUserLoggedIn">
              <router-link class="nav-link" to="/login">Login</router-link>
            </li>
            <li class="nav-item" v-if="!isUserLoggedIn">
              <router-link class="nav-link" to="/register">Register</router-link>
            </li>
            
            <!-- Show Dashboard for regular users when logged in -->
            <li class="nav-item" v-if="isUserLoggedIn && userRole === 'user'">
              <router-link class="nav-link" to="/dashboard">Dashboard</router-link>
            </li>
            
            <!-- Show Admin Panel for admins when logged in -->
            <li class="nav-item" v-if="isUserLoggedIn && userRole === 'admin'">
              <router-link class="nav-link" to="/admin">Admin Panel</router-link>
            </li>
            
            <!-- Show Logout only when logged in -->
            <li class="nav-item" v-if="isUserLoggedIn">
              <a class="nav-link" href="#" @click.prevent="logout">Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `
}