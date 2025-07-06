export default {
  template: `
    <div class="container-fluid mt-4">
      <h2 class="mb-4">Admin Dashboard</h2>

      <div class="row mb-4">
        <div class="col-md-3" v-for="(card, index) in summaryCards" :key="index">
          <div class="card text-white" :class="card.class">
            <div class="card-body">
              <h5 class="card-title">{{ card.title }}</h5>
              <h3>{{ card.value }}</h3>
            </div>
          </div>
        </div>
      </div>

      <ul class="nav nav-tabs mb-4">
        <li class="nav-item" v-for="tab in tabs" :key="tab.key">
          <a class="nav-link" :class="{ active: activeTab === tab.key }" 
             @click="activeTab = tab.key">{{ tab.name }}</a>
        </li>
      </ul>

      <div v-if="activeTab === 'lots'">
        <div class="d-flex justify-content-between mb-3">
          <h4>Manage Parking Lots</h4>
          <button class="btn btn-primary" @click="openLotModal()">Add New Lot</button>
        </div>
         <input class="form-control mb-3" v-model="lotSearch" placeholder="Search lots">
        
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th><th>Location</th><th>Address</th><th>Pin</th><th>Price/Hr</th><th>Total</th><th>Available</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>

              <tr v-for="lot in filteredParkingLots" :key="lot.id">
              <td>{{ lot.id }}</td>
              <td>{{ lot.prime_location_name }}</td>
              <td>{{ lot.address }}</td>
              <td>{{ lot.pin_code }}</td>
              <td>{{ lot.price_per_hour }}</td>
              <td>{{ lot.number_of_spots }}</td>
              <td>{{ lot.available_spots }}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" @click="editLot(lot)">Edit</button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteLot(lot.id)" 
                        :disabled="lot.available_spots < lot.number_of_spots">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'spots'">
        <h4>Parking Spots Status</h4>
        <select class="form-select mb-3" v-model="selectedLotId" @change="loadSpots">
          <option value="">Select a parking lot</option>
          <option v-for="lot in parkingLots" :key="lot.id" :value="lot.id">{{ lot.prime_location_name }}</option>
        </select>
        
         <select class="form-select mb-3" v-model="spotStatusFilter">
          <option value="">All</option>
          <option value="A">Available</option>
          <option value="O">Occupied</option>
        </select>

        <div v-if="selectedLotId" class="row">
          <div class="col-md-4 mb-2" v-for="spot in filteredParkingSpots" :key="spot.id">
            <div class="card" :class="spot.status === 'A' ? 'border-success' : 'border-danger'">
              <div class="card-body text-center">
                <h6>Spot #{{ spot.id }}</h6>
                <span class="badge" :class="spot.status === 'A' ? 'bg-success' : 'bg-danger'">
                  {{ spot.status === 'A' ? 'Available' : 'Occupied' }}
                </span>
                <div v-if="spot.status === 'O' && spot.current_reservation" class="mt-2 small">
                  <strong>User:</strong> {{ spot.current_reservation.user_email }}<br>
                  <strong>Since:</strong> {{ new Date(spot.current_reservation.parking_timestamp).toLocaleString() }} <br>
                  <strong>Vehicle:</strong> {{ spot.current_reservation.vehicle_no || 'N/A' }} {{ spot.current_reservation.vehicle_model || 'N/A' }} {{ spot.current_reservation.vehicle_color || 'N/A' }}
                  <br>
                
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'users'" >
        <h4>Registered Users</h4>
        <table class="table table-striped">
          <thead>
            <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Reservations</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span v-for="role in user.roles" :key="role.id" class="badge bg-secondary me-1">{{ role.name }}</span>
              </td>
              <td>
                <span class="badge" :class="user.active ? 'bg-success' : 'bg-danger'">
                  {{ user.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>{{ user.reservation_count || 0 }}</td>
              <td>
                <button v-if="user.active" class="btn btn-sm btn-outline-danger me-1" @click="blockUser(user.id)">Block</button>
                <button v-else class="btn btn-sm btn-outline-success me-1" @click="unblockUser(user.id)">Unblock</button>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="activeTab === 'vehicles'">
        <h4>Registered Vehicles</h4>  
        <table class="table table-striped">
          <thead>
            <tr><th>ID</th><th>Owner</th><th>Vehicle Number</th><th>Model</th><th>Color</th></tr>
          </thead>
          <tbody>
          <tr v-for="vehicle in vehicles" :key="vehicle.id">
            <td>{{ vehicle.id }}</td>
            <td>{{ vehicle.user_id }}</td> 
            <td>{{ vehicle.vehicle_number }}</td>
            <td>{{ vehicle.model }}</td>
            <td>{{ vehicle.color }}</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div v-if="activeTab === 'charts'">
        <h4>Summary Reports</h4>
        <div class="text-end">
          <button @click="csvExport" class="btn btn-secondary">Download CSV report</button>
        </div><br>
        <div class="row">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header"><h5>Occupancy Rate by Parking Lot</h5></div>
              <div class="card-body"><canvas id="occupancyChart" width="400" height="200"></canvas></div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-header"><h5>Revenue by Parking Lot</h5></div>
              <div class="card-body"><canvas id="revenueChart" width="400" height="200"></canvas></div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showLotModal" class="modal d-block" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5>{{ editingLot ? 'Edit' : 'Add' }} Parking Lot</h5>
              <button type="button" class="btn-close" @click="closeLotModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Location Name</label>
                <input type="text" class="form-control" v-model="lotForm.prime_location_name" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Address</label>
                <textarea class="form-control" v-model="lotForm.address" rows="2"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Pin Code</label>
                <input type="text" class="form-control" v-model="lotForm.pin_code">
              </div>
              <div class="mb-3">
                <label class="form-label">Price per Hour ($)</label>
                <input type="number" step="0.01" class="form-control" v-model="lotForm.price_per_hour" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Number of Spots</label>
                <input type="number" class="form-control" v-model="lotForm.number_of_spots" required>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeLotModal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="saveLot">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  
  data() {
    return {
      activeTab: 'lots',
      summary: { totalLots: 0, availableSpots: 0, occupiedSpots: 0, totalUsers: 0 },
      parkingLots: [],
      parkingSpots: [],
      users: [],
      vehicles: [],
      selectedLotId: '',
      showLotModal: false,
      editingLot: false,
      lotForm: { id: null, prime_location_name: '', address: '', pin_code: '', price_per_hour: 0, number_of_spots: 0 },
      spotStatusFilter: '',
      lotSearch: ''
    }
  },
  
  computed: {
    summaryCards() {
      return [
        { title: 'Total Parking Lots', value: this.summary.totalLots, class: 'bg-primary' },
        { title: 'Available Spots', value: this.summary.availableSpots, class: 'bg-success' },
        { title: 'Occupied Spots', value: this.summary.occupiedSpots, class: 'bg-warning' },
        { title: 'Total Users', value: this.summary.totalUsers, class: 'bg-info' }
      ]
    },

    tabs() {
      return [
        { key: 'lots', name: 'Parking Lots' },
        { key: 'spots', name: 'Parking Spots' },
        { key: 'users', name: 'Users' },
        { key: 'vehicles', name: 'Vehicles' },
        { key: 'charts', name: 'Reports' }
      ]
    },
    filteredParkingSpots() {
      if (!this.spotStatusFilter) return this.parkingSpots;
      return this.parkingSpots.filter(spot => spot.status === this.spotStatusFilter);
    },
    filteredParkingLots() {
      if (!this.lotSearch) return this.parkingLots;
      const term = this.lotSearch.toLowerCase();
      return this.parkingLots.filter(lot =>
        lot.prime_location_name.toLowerCase().includes(term) ||
        (lot.address && lot.address.toLowerCase().includes(term)) ||
        (lot.pin_code && lot.pin_code.toString().includes(term))
      );
    }
  },
  
  created() {
    this.loadData()
  },
  
  methods: {
    async loadData() {
      try {
        await Promise.all([this.loadSummary(), this.loadLots(), this.loadUsers(), this.loadVehicles()])
      } catch (error) {
        alert('Error loading data: ' + error.message)
      }
    },

    
    async apiCall(endpoint, options = {}) {
      try {
        const response = await fetch(endpoint, {
          headers: { 'Authentication-Token': localStorage.getItem('token'), ...options.headers },
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
     csvExport(){
      fetch('/api/export')
      .then(response => response.json())
      .then(data => {
        window.location.href = `/api/csv_result/${data.id}`
      });
    },
    
    async loadSummary() {
      this.summary = await this.apiCall('/api/admin/summary')
    },
    
    async loadLots() {
      this.parkingLots = await this.apiCall('/api/admin/parking-lots')
    },
    
    async loadSpots() {
      if (!this.selectedLotId) return
      this.parkingSpots = await this.apiCall(`/api/admin/parking-lots/${this.selectedLotId}/spots`)
  
    },
    
    async loadUsers() {
      this.users = await this.apiCall('/api/admin/users')
    },
    async loadVehicles() {
      this.vehicles = await this.apiCall('/api/admin/vehicles', { method: 'GET' })

    },
    async blockUser(userId) {
      await this.apiCall(`/api/admin/users/${userId}/block`, { method: 'POST' })
      await this.loadUsers() 
    },
    async unblockUser(userId) {
      await this.apiCall(`/api/admin/users/${userId}/unblock`, { method: 'POST' })
      await this.loadUsers() 
    },

    openLotModal(lot = null) {
      this.editingLot = !!lot
      this.lotForm = lot ? { ...lot } : { id: null, prime_location_name: '', address: '', pin_code: '', price_per_hour: 0, number_of_spots: 0 }
      this.showLotModal = true
    },
    
    editLot(lot) {
      this.openLotModal(lot)
    },
    
    async saveLot() {
     
      console.log('editingLot at start of saveLot:', this.editingLot);

      if (!this.lotForm.prime_location_name || !this.lotForm.price_per_hour || !this.lotForm.number_of_spots) {
        alert('Please fill in all required fields')
        return
      }

     
      if (this.lotForm.price_per_hour <= 0 || this.lotForm.number_of_spots <= 0) {
        alert('Price and number of spots must be positive numbers')
        return
      }

      try {
        console.log('Saving lot:', this.lotForm) 
        const url = this.editingLot ? `/api/admin/parking-lots/${this.lotForm.id}` : '/api/admin/parking-lots'
        const method = this.editingLot ? 'PUT' : 'POST';
        
        
        const successMessage = this.editingLot ? 'Lot updated successfully' : 'Lot created successfully';

        const result = await this.apiCall(url, {
          method: method,
          headers: { 'Authentication-Token': localStorage.getItem('token'), 'Content-Type': 'application/json' },
          body: JSON.stringify(this.lotForm)
        })
        
        console.log('Save result:', result) 
        this.closeLotModal() 
        await this.loadLots()
        await this.loadSummary()
        alert(successMessage) 
      } catch (error) {
        console.error('Save lot error:', error)
        alert('Error saving lot: ' + error.message)
      }
    },
    
    async deleteLot(lotId) {
      if (!confirm('Are you sure you want to delete this parking lot?')) return
      
      try {
        await this.apiCall(`/api/admin/parking-lots/${lotId}`, { method: 'DELETE' })
        await this.loadLots()
        await this.loadSummary()
        alert('Lot deleted successfully')
      } catch (error) {
        alert('Error deleting lot: ' + error.message)
      }
    },
    
    closeLotModal() {
      this.showLotModal = false
      this.editingLot = false 
    },
     showCharts() {
      
      if (this.occupancyChart) this.occupancyChart.destroy();
      const occCanvas = document.getElementById('occupancyChart');
      if (occCanvas) {
        const occCtx = occCanvas.getContext('2d');
        this.occupancyChart = new Chart(occCtx, {
          type: 'bar',
          data: {
            labels: this.parkingLots.map(lot => lot.prime_location_name),
            datasets: [
              {
                label: 'Occupied',
                data: this.parkingLots.map(lot => lot.number_of_spots - lot.available_spots),
                backgroundColor: 'rgba(255, 99, 132, 0.5)'
              },
              {
                label: 'Available',
                data: this.parkingLots.map(lot => lot.available_spots),
                backgroundColor: 'rgba(75, 192, 192, 0.5)'
              }
            ]
          }
        });
      }
      
      if (this.revenueChart) this.revenueChart.destroy();
      const revCanvas = document.getElementById('revenueChart');
      if (revCanvas) {
        const revCtx = revCanvas.getContext('2d');
        this.revenueChart = new Chart(revCtx, {
          type: 'bar',
          data: {
            labels: this.parkingLots.map(lot => lot.prime_location_name),
            datasets: [
              {
                label: 'Revenue ($)',
                data: this.parkingLots.map(lot => lot.revenue || 0),
                backgroundColor: 'rgba(54, 162, 235, 0.5)'
              }
            ]
          }
        });
      }
    }
  },
  watch: {
    activeTab(newTab) {
      if (newTab === 'charts') {
        this.$nextTick(() => {
          this.showCharts();
        });
      }
    },
    parkingLots() {
      if (this.activeTab === 'charts') {
        this.$nextTick(() => {
          this.showCharts();
        });
      }
    }
  }
}

