export default {
  template: `
    <footer v-if="showFooter" class="bg-light text-center mt-5 p-3">
      <p>© 2025 Fast Logistics Parking App</p>
    </footer>
  `,
  computed:{
    showFooter(){
      return ['/login','/register','/'].includes(this.$route.path)
    }
  }
}
