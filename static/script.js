
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
    methods: {
        handleLogout() {
            this.loggedIn = false
           
        },
        handleLogin() {
            this.loggedIn = true
            
        }
    }
})
