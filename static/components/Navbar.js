export default {
  props: ['loggedIn'],
  methods: {
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
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
            <li class="nav-item" v-if="!loggedIn">
              <router-link class="nav-link" to="/login">Login</router-link>
            </li>
            <li class="nav-item" v-if="!loggedIn">
              <router-link class="nav-link" to="/register">Register</router-link>
            </li>
            <li class="nav-item" v-if="loggedIn && localStorage.getItem('role') === 'user'">
              <router-link class="nav-link" to="/dashboard">Dashboard</router-link>
            </li>
            <li class="nav-item" v-if="loggedIn && localStorage.getItem('role') === 'admin'">
              <router-link class="nav-link" to="/admin">Admin Panel</router-link>
            </li>
            <li class="nav-item" v-if="loggedIn">
              <a class="nav-link" href="#" @click.prevent="logout">Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `
}
