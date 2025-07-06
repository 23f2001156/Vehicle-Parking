export default {
  template: `
    <div class="dashboard-container">
      <h2 class="dashboard-title">User Dashboard</h2>

      <ul class="nav nav-tabs mb-4">
        <li class="nav-item" v-for="tab in tabs" :key="tab.key">
          <a class="nav-link" :class="{ active: activeTab === tab.key }" 
             @click="activeTab = tab.key">{{ tab.name }}</a>
        </li>
      </ul>

      <!-- Cards Row (example, you can add more cards as needed) -->
      <div class="dashboard-cards mb-4">
        <div class="dashboard-card">
          <div class="dashboard-card-title">Total Bookings</div>
          <div class="dashboard-card-value">{{ history.length }}</div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card-title">Active Sessions</div>
          <div class="dashboard-card-value">{{ history.filter(h => !h.out).length }}</div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card-title">Registered Vehicles</div>
          <div class="dashboard-card-value">{{ vehicles.length }}</div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="dashboard-table-section">
        <div class="dashboard-table-title">Parking History</div>
        <button class="btn btn-outline-primary btn-sm mb-2" @click="userCsvExport">
          Export My Data as CSV
        </button>
        <div v-if="loading.history" class="text-muted">Loading...</div>
        <div v-else>
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>ID</th><th>Location</th><th>Vehicle</th><th>In</th><th>Out</th><th>Duration</th><th>Cost</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in history" :key="h.id">
                <td>{{ h.id }}</td>
                <td>{{ h.location }}</td>
                <td>{{ h.vehicle_no }}</td>
                <td>{{ formatTime(h.in) }}</td>
                <td>{{ formatTime(h.out) }}</td>
                <td>{{ getDuration(h.in, h.out) }}</td>
                <td>{{ h.cost+'$' }}</td>
                <td>
                  <button v-if="!h.out" class="btn btn-sm btn-warning" @click="openRelease(h)">Release</button>
                  <span v-else class="badge bg-success">Completed</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="error.history" class="text-danger small">{{ error.history }}</div>
        </div>
      </div>

      <!-- Book Tab -->
      <div v-if="activeTab === 'book'" class="dashboard-table-section">
        <div class="dashboard-table-title">Book Parking Spot</div>
        <input class="form-control mb-3" v-model="search" placeholder="Search location...">
        <div v-if="vehicles.length === 0" class="alert alert-warning">
          No vehicles registered. <button class="btn btn-sm btn-primary ms-2" @click="showVehicleModal=true">Add Vehicle</button>
        </div>
        <div v-if="loading.lots" class="text-muted">Loading...</div>
        <div v-else>
          <table class="dashboard-table">
            <thead>
              <tr><th>ID</th><th>Location</th><th>Address</th><th>Available</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr v-for="lot in filteredLots" :key="lot.id">
                <td>{{ lot.id }}</td>
                <td>{{ lot.prime_location_name }}</td>
                <td>{{ lot.address }}</td>
                <td>{{ lot.available }}</td>
                <td>
                  <button class="btn btn-sm btn-primary" :disabled="lot.available===0 || vehicles.length===0" @click="openBook(lot)">
                    Book
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="error.lots" class="text-danger small">{{ error.lots }}</div>
          <button class="btn btn-outline-success btn-sm mt-2" @click="showVehicleModal=true">Add Vehicle</button>
        </div>
      </div>

      <!-- Vehicles Tab -->
      <div v-if="activeTab === 'vehicles'" class="dashboard-table-section">
        <div class="dashboard-table-title">My Vehicles</div>
        <button class="btn btn-success btn-sm mb-3" @click="showVehicleModal=true">Add Vehicle</button>
        <div v-if="loading.vehicles" class="text-muted">Loading...</div>
        <div v-else>
          <table class="dashboard-table">
            <thead>
              <tr><th>#</th><th>Vehicle Number</th><th>Model</th><th>Color</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr v-for="(v, idx) in vehicles" :key="v.id">
                <td>{{ idx+1 }}</td>
                <td>{{ v.vehicle_number }}</td>
                <td>{{ v.model }}</td>
                <td>{{ v.color }}</td>
                <td><button class="btn btn-danger btn-sm" @click="deleteVehicle(v.id)">Delete</button></td>
              </tr>
              <tr v-if="vehicles.length === 0">
                <td colspan="5" class="text-center text-muted">No vehicles registered.</td>
              </tr>
            </tbody>
          </table>
          <div v-if="error.vehicleList" class="text-danger small">{{ error.vehicleList }}</div>
        </div>
      </div>

      <!-- Summary Tab -->
      <div v-if="activeTab === 'summary'" class="dashboard-charts">
        <div class="dashboard-chart">
          <div class="dashboard-table-title">Parking Locations</div>
          <canvas id="locationChart" width="400" height="200"></canvas>
        </div>
        <div class="dashboard-chart">
          <div class="dashboard-table-title">Average Duration by Location</div>
          <canvas id="durationChart" width="400" height="200"></canvas>
        </div>
      </div>

      <!-- Book Modal -->
      <div v-if="showBook" class="modal d-block" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5>Book Parking Spot</h5>
              <button class="btn-close" @click="showBook=false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">Lot: <b>{{ bookForm.lot_name }}</b></div>
              <div class="mb-3">
                <label>Select Vehicle:</label>
                <select class="form-select" v-model="bookForm.vehicle_id">
                  <option v-for="v in vehicles" :key="v.id" :value="v.id">
                    {{ v.vehicle_number }} ({{ v.model }})
                  </option>
                </select>
              </div>
              <div v-if="error.book" class="text-danger small">{{ error.book }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" @click="reserveSpot" :disabled="!bookForm.vehicle_id">Book</button>
              <button class="btn btn-secondary" @click="showBook=false">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Release Modal -->
      <div v-if="showRelease" class="modal d-block" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5>Release Parking Spot</h5>
              <button class="btn-close" @click="showRelease=false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-2">Spot ID: <b>{{ releaseForm.spot_id }}</b></div>
              <div class="mb-2">Vehicle: <b>{{ releaseForm.vehicle_no }}</b></div>
              <div class="mb-2">Parked: <b>{{ formatTime(releaseForm.in) }}</b></div>
              <div class="mb-2">Cost: <b>{{ releaseForm.cost }}</b></div>
              <div v-if="error.release" class="text-danger small">{{ error.release }}</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-warning" @click="releaseSpot" :disabled="releaseForm.loading">Release</button>
              <button class="btn btn-secondary" @click="showRelease=false">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Vehicle Modal -->
      <div v-if="showVehicleModal" class="modal d-block" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5>Add Vehicle</h5>
              <button class="btn-close" @click="closeVehicleModal"></button>
            </div>
            <form @submit.prevent="addVehicle">
              <div class="modal-body">
                <div class="mb-3">
                  <label>Vehicle Number <span class="text-danger">*</span></label>
                  <input class="form-control" v-model="vehicleForm.number" required maxlength="20">
                </div>
                <div class="mb-3">
                  <label>Model</label>
                  <input class="form-control" v-model="vehicleForm.model" maxlength="50">
                </div>
                <div class="mb-3">
                  <label>Color</label>
                  <input class="form-control" v-model="vehicleForm.color" maxlength="30">
                </div>
                <div v-if="error.vehicle" class="text-danger small">{{ error.vehicle }}</div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-primary" type="submit">Add</button>
                <button class="btn btn-secondary" @click="closeVehicleModal" type="button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      activeTab: 'history',
      history: [],
      lots: [],
      vehicles: [],
      search: '',
      showBook: false,
      showRelease: false,
      showVehicleModal: false,
      bookForm: { lot_id: '', lot_name: '', vehicle_id: '' },
      releaseForm: { reservation_id: '', spot_id: '', vehicle_no: '', in: '', cost: '', loading: false },
      vehicleForm: { number: '', model: '', color: '', loading: false },
      loading: { history: false, lots: false, vehicles: false },
      error: { history: '', lots: '', book: '', release: '', vehicle: '', vehicleList: '' }
    }
  },

  computed: {
    tabs() {
      return [
        { key: 'history', name: 'History' },
        { key: 'book', name: 'Book Spot' },
        { key: 'vehicles', name: 'My Vehicles' },
        { key: 'summary', name: 'Analytics' }
      ]
    },
    filteredLots() {
      if (!this.search) return this.lots;
      const searchTerm = this.search.toLowerCase();
      return this.lots.filter(lot => 
        lot.address.toLowerCase().includes(searchTerm) || 
        lot.prime_location_name.toLowerCase().includes(searchTerm)
      );
    }
  },

  created() {
    this.loadData()
  },

  methods: {
    async loadData() {
      try {
        await Promise.all([this.loadHistory(), this.loadVehicles()])
      } catch (error) {
        alert('Error loading data: ' + error.message)
      }
    },

    async apiCall(endpoint, options = {}) {
      try {
        const response = await fetch(endpoint, {
          headers: { 
            'Authentication-Token': localStorage.getItem('token'), 
            'Content-Type': 'application/json',
            ...options.headers 
          },
          ...options
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        
        return response.json()
      } catch (error) {
        console.error('API call failed:', endpoint, error)
        throw error
      }
    },

    formatTime(utcString) {
      if (!utcString) return '-';
      const date = new Date(utcString);
      return isNaN(date) ? utcString : date.toLocaleString();
    },

    getDuration(inTime, outTime) {
      if (!inTime) return '-';
      if (!outTime) return 'Active';
      
      const start = new Date(inTime);
      const end = new Date(outTime);
      
      if (isNaN(start) || isNaN(end)) return '-';
      
      const diffMs = end - start;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    },

    async loadHistory() {
      this.loading.history = true;
      this.error.history = '';
      try {
        this.history = await this.apiCall('/api/user/history');
      } catch (e) {
        this.error.history = e.message;
      }
      this.loading.history = false;
    },

    async loadLots() {
      this.loading.lots = true;
      this.error.lots = '';
      try {
        this.lots = await this.apiCall('/api/user/lots');
      } catch (e) {
        this.error.lots = e.message;
      }
      this.loading.lots = false;
    },

    async loadVehicles() {
      this.loading.vehicles = true;
      this.error.vehicleList = '';
      try {
        this.vehicles = await this.apiCall('/api/user/vehicles');
      } catch (e) {
        this.error.vehicleList = e.message;
        this.vehicles = [];
      }
      this.loading.vehicles = false;
    },

    async deleteVehicle(id) {
      if (!confirm('Delete this vehicle?')) return;
      
      try {
        await this.apiCall(`/api/user/vehicles/${id}`, { method: 'DELETE' });
        await this.loadVehicles();
      } catch (e) {
        this.error.vehicleList = e.message;
      }
    },

    closeVehicleModal() {
      this.showVehicleModal = false;
      this.vehicleForm = { number: '', model: '', color: '', loading: false };
      this.error.vehicle = '';
    },

    async addVehicle() {
      this.vehicleForm.loading = true;
      this.error.vehicle = '';
      
      try {
        await this.apiCall('/api/user/vehicles', {
          method: 'POST',
          body: JSON.stringify({
            vehicle_number: this.vehicleForm.number,
            model: this.vehicleForm.model,
            color: this.vehicleForm.color
          })
        });
        
        this.closeVehicleModal();
        await this.loadVehicles();
      } catch (e) {
        this.error.vehicle = e.message;
      }
      
      this.vehicleForm.loading = false;
    },

    openBook(lot) {
      this.bookForm = { lot_id: lot.id, lot_name: lot.prime_location_name, vehicle_id: '' };
      this.error.book = '';
      this.showBook = true;
      this.loadVehicles();
    },

    async reserveSpot() {
      try {
        await this.apiCall('/api/user/book', {
          method: 'POST',
          body: JSON.stringify({
            lot_id: this.bookForm.lot_id,
            vehicle_id: this.bookForm.vehicle_id
          })
        });
        
        this.showBook = false;
        await this.loadHistory();
        await this.loadLots();
      } catch (e) {
        this.error.book = e.message;
      }
    },

    openRelease(h) {
      this.releaseForm = {
        reservation_id: h.id,
        spot_id: h.spot_id,
        vehicle_no: h.vehicle_no,
        in: h.in,
        cost: h.cost || '',
        loading: false
      };
      this.error.release = '';
      this.showRelease = true;
    },

    async releaseSpot() {
      this.releaseForm.loading = true;
      this.error.release = '';
      
      try {
        const data = await this.apiCall('/api/user/release', {
          method: 'POST',
          body: JSON.stringify({ reservation_id: this.releaseForm.reservation_id })
        });
        
        this.releaseForm.cost = data.cost;
        this.showRelease = false;
        await this.loadHistory();
        await this.loadLots();
      } catch (e) {
        this.error.release = e.message;
      }
      
      this.releaseForm.loading = false;
    },

    prepareLocationData() {
      const counts = {};
      this.history.forEach(h => {
        counts[h.location] = (counts[h.location] || 0) + 1;
      });
      return {
        labels: Object.keys(counts),
        data: Object.values(counts)
      };
    },

    prepareDurationData() {
      const completedSessions = this.history.filter(h => h.in && h.out);
      const locationAverages = {};
      
      completedSessions.forEach(h => {
        const start = new Date(h.in);
        const end = new Date(h.out);
        const durationHours = (end - start) / (1000 * 60 * 60);
        
        if (!locationAverages[h.location]) {
          locationAverages[h.location] = { total: 0, count: 0 };
        }
        locationAverages[h.location].total += durationHours;
        locationAverages[h.location].count += 1;
      });
      
      const labels = Object.keys(locationAverages);
      const data = labels.map(location => 
        (locationAverages[location].total / locationAverages[location].count).toFixed(1)
      );
      
      return { labels, data };
    },

    showCharts() {
      // Location pie chart
      if (this.locationChart) this.locationChart.destroy();
      const locationCanvas = document.getElementById('locationChart');
      if (locationCanvas) {
        const { labels, data } = this.prepareLocationData();
        const colors = ['#FFB3BA', '#FFE4B3', '#BAE1FF', '#FFFFBA', '#FFB3F7', '#B3FFE6', '#FFD4B3', '#E6B3FF', '#B3D4FF', '#FFE6B3'];
        this.locationChart = new Chart(locationCanvas, {
          type: 'pie',
          data: {
            labels,
            datasets: [{ data, backgroundColor: labels.map((_, i) => colors[i % colors.length]) }]
          },
          options: { responsive: true, plugins: { legend: { display: true, position: 'bottom' } } }
        });
      }
      
      // Duration bar chart
      if (this.durationChart) this.durationChart.destroy();
      const durationCanvas = document.getElementById('durationChart');
      if (durationCanvas) {
        const { labels, data } = this.prepareDurationData();
        this.durationChart = new Chart(durationCanvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Average Duration (hours)',
              data,
              backgroundColor: '#2196f3',
              borderColor: '#1976d2',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Hours' }
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    },

    userCsvExport() {
      fetch('/api/user/export', {
        headers: { 'Authentication-Token': localStorage.getItem('token') }
      })
      .then(response => response.json())
      .then(data => {
        window.location.href = `/api/user/csv_result/${data.id}`
      });
    }
  },

  watch: {
    activeTab(newTab) {
      if (newTab === 'book') {
        this.loadLots();
        this.loadVehicles();
      }
      if (newTab === 'summary') {
        this.$nextTick(() => {
          this.showCharts();
        });
      }
    },
    history() {
      if (this.activeTab === 'summary') {
        this.$nextTick(() => {
          this.showCharts();
        });
      }
    }
  }
}
