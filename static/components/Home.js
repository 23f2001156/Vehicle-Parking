export default {
  template: `
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Welcome to ParkPal</h1>
          <p class="hero-subtitle">Your Smart Vehicle Parking Solution</p>
          <p class="hero-description">
            Reserve parking spots instantly, track your vehicle, and enjoy hassle-free parking 
            with our advanced parking management system.
          </p>
          <div class="hero-buttons">
            <button class="btn-primary" @click="$router.push('/register')">
              Get Started
            </button>
            <button class="btn-secondary" @click="scrollToFeatures">
              Learn More
            </button>
          </div>
        </div>
        <div class="hero-image">
          <div class="parking-icon">🚗</div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section" id="features">
        <h2 class="section-title">Why Choose ParkPal?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Quick Booking</h3>
            <p>Reserve your parking spot in seconds with our streamlined booking process.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Secure & Safe</h3>
            <p>Your vehicle and data are protected with industry-standard security measures.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Real-time Updates</h3>
            <p>Get live updates on parking availability and your reservation status.</p>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats-section">
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-number">1000+</div>
            <div class="stat-label">Happy Users</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">50+</div>
            <div class="stat-label">Parking Locations</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">24/7</div>
            <div class="stat-label">Support Available</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">99%</div>
            <div class="stat-label">Uptime</div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="cta-content">
          <h2>Ready to Start Parking Smarter?</h2>
          <p>Join thousands of users who trust ParkPal for their parking needs.</p>
          <button class="btn-primary btn-large" @click="$router.push('/dashboard')">
            Start Parking Now
          </button>
        </div>
      </section>
    </div>
  `,
  methods: {
    scrollToFeatures() {
      window.location.hash = '#features';
    }
  }
}
