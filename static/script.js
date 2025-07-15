import Home from './components/Home.js'
import Login from './components/Login.js'
import Register from './components/Register.js'
import Navbar from './components/Navbar.js'
import Footer from './components/Footer.js'
import Dashboard from './components/Dashboard.js'
import Admin from './components/Admin.js'

const routes = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/dashboard', component: Dashboard },
    { path: '/admin', component: Admin },
]

const router = new VueRouter({
    mode: 'hash', 
    routes
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    
    const protectedRoutes = ['/dashboard', '/admin']
    
    if (protectedRoutes.includes(to.path)) {
        if (!token) {
            next('/login')
            return
        }
    
        if (to.path === '/admin' && role !== 'admin') {

            next('/dashboard')
            return
        }
        
        if (to.path === '/dashboard' && role !== 'user') {
            
            next('/admin')
            return
        }
    }
    
    
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
        
        if (localStorage.getItem('token')) {
            this.loggedIn = true
        }
        
    
        window.addEventListener('storage', this.handleStorageChange)
    },
    beforeDestroy() {
        
        window.removeEventListener('storage', this.handleStorageChange)
    },
    methods: {
        handleLogout() {
            this.loggedIn = false
            
            localStorage.removeItem('token')
            localStorage.removeItem('role')
            localStorage.removeItem('user')
        
            this.$router.push('/')
        },
        handleLogin() {
            this.loggedIn = true
        },
        handleStorageChange(e) {
            
            if (e.key === 'token' && !e.newValue) {
                this.loggedIn = false
                this.$router.push('/')
            }
        
            if (e.key === 'token' && e.newValue) {
                this.loggedIn = true
            }
        }
    }
})