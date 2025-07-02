export default {
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>User Dashboard</h2>
        <button class="btn btn-outline-secondary btn-sm" @click="editProfile">Edit Profile</button>
      </div>
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item" v-for="tab in tabs" :key="tab.key">
          <a class="nav-link" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">{{ tab.name }}</a>
        </li>
      </ul>
      <div v-if="activeTab === 'history'">
        <h5>Recent Parking History</h5>
        <div v-if="loading.history" class="text-muted">Loading...</div>
        <div v-else>
          <table class="table table-sm table-bordered">
            <thead><tr><th>ID</th><th>Location</th><th>Vehicle</th><th>In</th><th>Out</th><th>Action</th><th>Cost</th></tr></thead>
            <tbody>
              <tr v-for="h in history" :key="h.id">
                <td>{{ h.id }}</td>
                <td>{{ h.location }}</td>
                <td>{{ h.vehicle_no }}</td>
                <td>{{ formatLocalTime(h.in) }}</td>
                <td>{{ formatLocalTime(h.out) }}</td>
                
                <td>
                  <button v-if="!h.out" class="btn btn-sm btn-warning" @click="openRelease(h)">Release</button>
                  <span v-else class="badge bg-success">Parked Out</span>
                </td>
                <td>{{ h.cost+'$' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="error.history" class="text-danger small">{{ error.history }}</div>
        </div>
      </div>
      <div v-if="activeTab === 'book'">
        <h5>Parking Lots</h5>
        <input class="form-control mb-2" v-model="search" placeholder="Search location/pin...">
        <div v-if="vehicles.length === 0 && !showVehicleModal" class="alert alert-warning p-2">
          No vehicles registered. <button class="btn btn-sm btn-primary ms-2" @click="showVehicleModal=true">Register Vehicle</button>
        </div>
        <div v-if="loading.lots" class="text-muted">Loading...</div>
        <div v-else>
          <table class="table table-sm table-bordered">
            <thead><tr><th>ID</th><th>Address</th><th>Available</th><th>Action</th></tr></thead>
            <tbody>
              <tr v-for="lot in filteredLots" :key="lot.id">
                <td>{{ lot.id }}</td>
                <td>{{ lot.address }}</td>
                <td>{{ lot.available }}</td>
                <td><button class="btn btn-sm btn-primary" :disabled="lot.available===0 || vehicles.length===0" @click="openBook(lot)">Book</button></td>
              </tr>
            </tbody>
          </table>
          <div v-if="error.lots" class="text-danger small">{{ error.lots }}</div>
          <button class="btn btn-outline-success btn-sm mt-2" @click="showVehicleModal=true">Register New Vehicle</button>
        </div>
      </div>
      <div v-if="activeTab === 'vehicles'">
        <h5>My Vehicles</h5>
        <button class="btn btn-success btn-sm mb-2" @click="showVehicleModal=true">Register New Vehicle</button>
        <div v-if="loading.vehicles" class="text-muted">Loading...</div>
        <div v-else>
          <table class="table table-sm table-bordered">
            <thead><tr><th>#</th><th>Vehicle Number</th><th>Model</th><th>Color</th><th>Action</th></tr></thead>
            <tbody>
              <tr v-for="(v, idx) in vehicles" :key="v.id">
                <td>{{ idx+1 }}</td>
                <td>{{ v.vehicle_number }}</td>
                <td>{{ v.model }}</td>
                <td>{{ v.color }}</td>
                <td><button class="btn btn-danger btn-sm" @click="deleteVehicle(v.id)">Delete</button></td>
              </tr>
              <tr v-if="vehicles.length === 0"><td colspan="5" class="text-center text-muted">No vehicles registered.</td></tr>
            </tbody>
          </table>
          <div v-if="error.vehicleList" class="text-danger small">{{ error.vehicleList }}</div>
        </div>
      </div>
      <div v-if="activeTab === 'summary'">
        <h5>Parking Summary</h5>
        <div style="max-width:250px; margin:auto;">
         <canvas id="userSummaryChart" width="250" height="120"></canvas>
        </div>
      </div>
      <!-- Book Modal -->
      <div v-if="showBook" class="modal d-block" style="background:rgba(0,0,0,0.3)">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5>Book Parking Spot</h5><button class="btn-close" @click="showBook=false"></button></div>
          <div class="modal-body">
            <div class="mb-2">Lot: <b>{{ bookForm.lot_name }}</b></div>
            <div class="mb-2">Select Vehicle:
              <select class="form-select" v-model="bookForm.vehicle_id">
                <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.vehicle_number }} ({{ v.model }})</option>
              </select>
            </div>
            <div v-if="error.book" class="text-danger small">{{ error.book }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="reserveSpot" :disabled="!bookForm.vehicle_id">Reserve</button>
            <button class="btn btn-secondary" @click="showBook=false">Cancel</button>
          </div>
        </div></div>
      </div>
      <!-- Release Modal -->
      <div v-if="showRelease" class="modal d-block" style="background:rgba(0,0,0,0.3)">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5>Release Parking Spot</h5><button class="btn-close" @click="showRelease=false"></button></div>
          <div class="modal-body">
            <div class="mb-2">Spot ID: <b>{{ releaseForm.spot_id }}</b></div>
            <div class="mb-2">Vehicle No: <b>{{ releaseForm.vehicle_no }}</b></div>
           <div class="mb-2">Parking Time: <b>{{ formatLocalTime(releaseForm.in) }}</b></div>
           <div class="mb-2">Releasing Time: <b>{{ formatLocalTime(releaseForm.out) }}</b></div>
            <div class="mb-2">Total Cost: <b>{{ releaseForm.cost }}</b></div>
            <div v-if="error.release" class="text-danger small">{{ error.release }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-warning" @click="releaseSpot" :disabled="releaseForm.loading">Release</button>
            <button class="btn btn-secondary" @click="showRelease=false">Cancel</button>
          </div>
        </div></div>
      </div>
      <!-- Register Vehicle Modal -->
      <div v-if="showVehicleModal" class="modal d-block" style="background:rgba(0,0,0,0.3)">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header"><h5>Register Vehicle</h5><button class="btn-close" @click="closeVehicleModal"></button></div>
          <form @submit.prevent="registerVehicle">
            <div class="modal-body">
              <div class="mb-2">
                <label>Vehicle Number <span class="text-danger">*</span></label>
                <input class="form-control" v-model="vehicleForm.vehicle_number" required maxlength="20">
              </div>
              <div class="mb-2">
                <label>Model</label>
                <input class="form-control" v-model="vehicleForm.model" maxlength="50">
              </div>
              <div class="mb-2">
                <label>Color</label>
                <input class="form-control" v-model="vehicleForm.color" maxlength="30">
              </div>
              <div v-if="error.vehicle" class="text-danger small">{{ error.vehicle }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-success" type="submit" :disabled="vehicleForm.loading">Register</button>
              <button class="btn btn-secondary" @click="closeVehicleModal" type="button">Cancel</button>
            </div>
          </form>
        </div></div>
      </div>
    </div>
  `,
  data() {
    return {
      activeTab: 'history',
      tabs: [
        { key: 'history', name: 'History' },
        { key: 'book', name: 'Book Spot' },
        { key: 'vehicles', name: 'My Vehicles' },
        { key: 'summary', name: 'Summary' }
      ],
      history: [],
      lots: [],
      vehicles: [],
      search: '',
      showBook: false,
      showRelease: false,
      showVehicleModal: false,
      bookForm: { lot_id: '', lot_name: '', vehicle_id: '' },
      releaseForm: { reservation_id: '', spot_id: '', vehicle_no: '', in: '', out: '', cost: '', loading: false },
      vehicleForm: { vehicle_number: '', model: '', color: '', loading: false },
      loading: { history: false, lots: false, vehicles: false },
      error: { history: '', lots: '', book: '', release: '', vehicle: '', vehicleList: '' }
    }
  },
  computed: {
    filteredLots() {
      if (!this.search) return this.lots;
      return this.lots.filter(l => l.address.toLowerCase().includes(this.search.toLowerCase()) || l.prime_location_name.toLowerCase().includes(this.search.toLowerCase()));
    }
  },
  methods: {
    editProfile() { alert('Profile edit not implemented.'); },
    formatLocalTime(utcString) {
      if (!utcString) return '-';
      const date = new Date(utcString);
      if (isNaN(date)) return utcString;
      return date.toLocaleString();
    },
     prepareChartData() {
      const counts = {};
      this.history.forEach(h => {
        counts[h.location] = (counts[h.location] || 0) + 1;
      });
      return {
        labels: Object.keys(counts),
        data: Object.values(counts)
      };
    },
    renderChart() {
      if (!window.Chart) return;
      const ctx = document.getElementById('userSummaryChart');
      if (!ctx) return;
      const { labels, data } = this.prepareChartData();
      if (this._chart) this._chart.destroy();
      
      const colors = [
        '#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#ffc107', '#8bc34a', '#f44336', '#607d8b'
      ];
      this._chart = new window.Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{ data, backgroundColor: labels.map((_, i) => colors[i % colors.length]) }]
        },
        options: { responsive: true, plugins: { legend: { display: true, position: 'bottom' } } }
      });
    },
    async fetchHistory() {
      this.loading.history = true; this.error.history = '';
      try {
        const res = await fetch('/api/user/history', { headers: { 'Authentication-Token': localStorage.getItem('token') } });
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) throw new Error('Server returned non-JSON response (are you logged in?)');
        this.history = await res.json();
      } catch (e) { this.error.history = e.message; }
      this.loading.history = false;
    },
    async fetchLots() {
      this.loading.lots = true; this.error.lots = '';
      try {
        const res = await fetch('/api/user/lots', { headers: { 'Authentication-Token': localStorage.getItem('token') } });
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) throw new Error('Server returned non-JSON response (are you logged in?)');
        this.lots = await res.json();
      } catch (e) { this.error.lots = e.message; }
      this.loading.lots = false;
    },
    async fetchVehicles() {
      this.loading.vehicles = true; this.error.vehicleList = '';
      try {
        const res = await fetch('/api/user/vehicles', { headers: { 'Authentication-Token': localStorage.getItem('token') } });
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) throw new Error('Server returned non-JSON response (are you logged in?)');
        this.vehicles = await res.json();
      } catch (e) { this.error.vehicleList = e.message; this.vehicles = []; }
      this.loading.vehicles = false;
    },
    async deleteVehicle(id) {
      if (!confirm('Are you sure you want to delete this vehicle?')) return;
      this.error.vehicleList = '';
      try {
        const res = await fetch(`/api/user/vehicles/${id}`, {
          method: 'DELETE',
          headers: { 'Authentication-Token': localStorage.getItem('token') }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Delete failed');
        await this.fetchVehicles();
      } catch (e) { this.error.vehicleList = e.message; }
    },
    closeVehicleModal() {
      this.showVehicleModal = false;
      this.vehicleForm = { vehicle_number: '', model: '', color: '', loading: false };
      this.error.vehicle = '';
    },
    async registerVehicle() {
      this.vehicleForm.loading = true; this.error.vehicle = '';
      try {
        const res = await fetch('/api/user/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authentication-Token': localStorage.getItem('token') },
          body: JSON.stringify({
            vehicle_number: this.vehicleForm.vehicle_number,
            model: this.vehicleForm.model,
            color: this.vehicleForm.color
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        this.closeVehicleModal();
        await this.fetchVehicles();
      } catch (e) { this.error.vehicle = e.message; }
      this.vehicleForm.loading = false;
    },
    openBook(lot) {
      this.bookForm = { lot_id: lot.id, lot_name: lot.prime_location_name, vehicle_id: '' };
      this.error.book = '';
      this.showBook = true;
      this.fetchVehicles();
    },
    async reserveSpot() {
      this.error.book = '';
      try {
        const res = await fetch('/api/user/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authentication-Token': localStorage.getItem('token') },
          body: JSON.stringify({ lot_id: this.bookForm.lot_id, vehicle_id: this.bookForm.vehicle_id })
        });
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response (are you logged in?)');
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Booking failed');
        this.showBook = false;
        await this.fetchHistory();
        await this.fetchLots();
      } catch (e) { this.error.book = e.message; }
    },
    openRelease(h) {
      this.releaseForm = {
        reservation_id: h.id,
        spot_id: h.spot_id,
        vehicle_no: h.vehicle_no,
        in: h.in,
        out: new Date().toISOString().slice(0,16).replace('T',' '),
        cost: h.cost || '',
        loading: false
      };
      this.error.release = '';
      this.showRelease = true;
    },
    async releaseSpot() {
      this.releaseForm.loading = true; this.error.release = '';
      try {
        const res = await fetch('/api/user/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authentication-Token': localStorage.getItem('token') },
          body: JSON.stringify({ reservation_id: this.releaseForm.reservation_id })
        });
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response (are you logged in?)');
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Release failed');
        this.releaseForm.cost = data.cost;
        this.showRelease = false;
        await this.fetchHistory();
        await this.fetchLots();
      } catch (e) { this.error.release = e.message; }
      this.releaseForm.loading = false;
    }
  },
  watch: {
    activeTab(val) {
      if (val === 'history') this.fetchHistory();
      if (val === 'book') { this.fetchLots(); this.fetchVehicles(); }
      if (val === 'vehicles') this.fetchVehicles();
      if (val === 'summary') this.$nextTick(() => this.renderChart());
    },
    history() {
      if (this.activeTab === 'summary') this.$nextTick(() => this.renderChart());
    }
  },
  mounted() {
    this.fetchHistory();
    this.fetchVehicles();
    if (window.Chart) {
      setTimeout(() => {
        const ctx = document.getElementById('userSummaryChart');
        if (ctx) {
          new window.Chart(ctx, {
            type: 'bar',
            data: {
              labels: this.history.map(h => h.location),
              datasets: [{ label: 'Visits', data: this.history.reduce((acc, h) => { acc[h.location] = (acc[h.location]||0)+1; return acc; }, {}), backgroundColor: ['#4caf50','#2196f3'] }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
          });
        }
      }, 500);
    }
  }
}
