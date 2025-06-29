import Home from './components/Home.js'
import Login from './components/Login.js'
import Register from './components/Register.js'
import Navbar from './components/Navbar.js'
import Footer from './components/Footer.js'
import Dashboard from './components/Dashboard.js'
import Update from './components/Update.js'
import Admin from './components/Admin.js'

const routes = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/dashboard', component: Dashboard },
    { path: '/admin', component: Admin },
    { path: '/update/:id/', name: 'update', component: Update }
]

const router = new VueRouter({
    mode: 'hash', 
    routes
})

// Add route guards to protect authenticated routes
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    
    // Routes that require authentication
    const protectedRoutes = ['/dashboard', '/admin']
    
    if (protectedRoutes.includes(to.path)) {
        if (!token) {
            // Redirect to login if not authenticated
            next('/login')
            return
        }
        
        // Check role-based access
        if (to.path === '/admin' && role !== 'admin') {
            // Redirect regular users away from admin panel
            next('/dashboard')
            return
        }
        
        if (to.path === '/dashboard' && role !== 'user') {
            // Redirect admins to their panel instead of user dashboard
            next('/admin')
            return
        }
    }
    
    // Redirect logged-in users away from login/register pages
    if ((to.path === '/login' || to.path === '/register') && token) {
        if (role === 'admin') {
            next('/admin')
        } else {
            next('/dashboard')
        }
        return
    }
    
    next()
})

const app = new Vue({
    el: '#app',
    router,
    template: `
    <div class="container">
        <nav-bar :loggedIn="loggedIn" @logout="handleLogout"></nav-bar>
        <router-view :loggedIn="loggedIn" @login="handleLogin"></router-view>
        <foot></foot>
    </div>
    `,
    data: {
        loggedIn: false
    },
    components: {
        'nav-bar': Navbar,
        'foot': Footer
    },
    created() {
        // Check if user is already logged in when app starts
        if (localStorage.getItem('token')) {
            this.loggedIn = true
        }
        
        // Listen for storage changes (useful for multiple tabs)
        window.addEventListener('storage', this.handleStorageChange)
    },
    beforeDestroy() {
        // Clean up event listener
        window.removeEventListener('storage', this.handleStorageChange)
    },
    methods: {
        handleLogout() {
            this.loggedIn = false
            // Clear all auth-related data
            localStorage.removeItem('token')
            localStorage.removeItem('role')
            localStorage.removeItem('user')
            // Redirect to home page
            this.$router.push('/')
        },
        handleLogin() {
            this.loggedIn = true
        },
        handleStorageChange(e) {
            // Handle logout in other tabs
            if (e.key === 'token' && !e.newValue) {
                this.loggedIn = false
                this.$router.push('/')
            }
            // Handle login in other tabs
            if (e.key === 'token' && e.newValue) {
                this.loggedIn = true
            }
        }
    }
})