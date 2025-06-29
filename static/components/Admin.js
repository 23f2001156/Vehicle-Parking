export default {
  template: `
    <div class="container-fluid mt-4">
      <!-- Header -->
      <div class="row">
        <div class="col-12">
          <h2 class="mb-4">Admin Dashboard</h2>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h5 class="card-title">Total Parking Lots</h5>
              <h3>{{ summary.totalLots }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h5 class="card-title">Available Spots</h5>
              <h3>{{ summary.availableSpots }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-white">
            <div class="card-body">
              <h5 class="card-title">Occupied Spots</h5>
              <h3>{{ summary.occupiedSpots }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h5 class="card-title">Total Users</h5>
              <h3>{{ summary.totalUsers }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <ul class="nav nav-tabs mb-4" role="tablist">
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'lots' }" 
             @click="activeTab = 'lots'" href="#admin" role="tab">Parking Lots</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'spots' }" 
             @click="activeTab = 'spots'" href="#admin" role="tab">Parking Spots</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'users' }" 
             @click="activeTab = 'users'" href="#admin" role="tab">Users</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'charts' }" 
             @click="activeTab = 'charts'" href="#admin" role="tab">Reports</a>
        </li>
      </ul>

      <!-- Tab Content -->
      <div class="tab-content">
        
        <!-- Parking Lots Tab -->
        <div v-if="activeTab === 'lots'" class="tab-pane active">
          <div class="d-flex justify-content-between mb-3">
            <h4>Manage Parking Lots</h4>
            <button class="btn btn-primary" @click="showLotModal = true">Add New Lot</button>
          </div>
          
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Location Name</th>
                  <th>Address</th>
                  <th>Pin Code</th>
                  <th>Price/Hour</th>
                  <th>Total Spots</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lot in parkingLots" :key="lot.id">
                  <td>{{ lot.id }}</td>
                  <td>{{ lot.prime_location_name }}</td>
                  <td>{{ lot.address }}</td>
                  <td>{{ lot.pin_code }}</td>
                  <td>\${{ lot.price_per_hour }}</td>
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
        </div>

        <!-- Parking Spots Tab -->
        <div v-if="activeTab === 'spots'" class="tab-pane active">
          <h4>Parking Spots Status</h4>
          
          <div class="mb-3">
            <select class="form-select" v-model="selectedLotId" @change="loadSpots">
              <option value="">Select a parking lot</option>
              <option v-for="lot in parkingLots" :key="lot.id" :value="lot.id">
                {{ lot.prime_location_name }}
              </option>
            </select>
          </div>

          <div v-if="selectedLotId" class="row">
            <div class="col-md-4 mb-2" v-for="spot in parkingSpots" :key="spot.id">
              <div class="card" :class="spot.status === 'A' ? 'border-success' : 'border-danger'">
                <div class="card-body text-center">
                  <h6>Spot #{{ spot.id }}</h6>
                  <span class="badge" :class="spot.status === 'A' ? 'bg-success' : 'bg-danger'">
                    {{ spot.status === 'A' ? 'Available' : 'Occupied' }}
                  </span>
                  <div v-if="spot.status === 'O' && spot.current_reservation" class="mt-2 small">
                    <strong>User:</strong> {{ spot.current_reservation.user_email }}<br>
                    <strong>Since:</strong> {{ formatDateTime(spot.current_reservation.parking_timestamp) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Users Tab -->
        <div v-if="activeTab === 'users'" class="tab-pane active">
          <h4>Registered Users</h4>
          
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active</th>
                  <th>Total Reservations</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.username }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span v-for="role in user.roles" :key="role.id" class="badge bg-secondary me-1">
                      {{ role.name }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="user.active ? 'bg-success' : 'bg-danger'">
                      {{ user.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>{{ user.reservation_count || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Charts/Reports Tab -->
        <div v-if="activeTab === 'charts'" class="tab-pane active">
          <h4>Summary Reports</h4>
          
          <div class="row">
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">
                  <h5>Occupancy Rate by Parking Lot</h5>
                </div>
                <div class="card-body">
                  <canvas id="occupancyChart" width="400" height="200"></canvas>
                </div>
              </div>
            </div>
            
            <div class="col-md-6">
              <div class="card">
                <div class="card-header">
                  <h5>Revenue by Parking Lot</h5>
                </div>
                <div class="card-body">
                  <canvas id="revenueChart" width="400" height="200"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Lot Modal -->
      <div class="modal" :class="{ 'd-block': showLotModal }" v-if="showLotModal" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingLot ? 'Edit' : 'Add' }} Parking Lot</h5>
              <button type="button" class="btn-close" @click="closeLotModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveLot">
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
              </form>
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
      summary: {
        totalLots: 0,
        availableSpots: 0,
        occupiedSpots: 0,
        totalUsers: 0
      },
      parkingLots: [],
      parkingSpots: [],
      users: [],
      selectedLotId: '',
      showLotModal: false,
      editingLot: false,
      lotForm: {
        id: null,
        prime_location_name: '',
        address: '',
        pin_code: '',
        price_per_hour: 0,
        number_of_spots: 0
      }
    }
  },
  
  created() {
    this.loadData()
  },
  
  methods: {
    async loadData() {
      try {
        await Promise.all([
          this.loadSummary(),
          this.loadLots(),
          this.loadUsers()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
        this.showError('Error loading dashboard data')
      }
    },
    
    async loadSummary() {
      try {
        const response = await fetch('/api/admin/summary', {
          headers: { 'Authentication-Token': `${localStorage.getItem('token')}` }
        })
        if (response.ok) {
          this.summary = await response.json()
        } else {
          const error = await response.json()
          console.error('Summary load error:', error)
          this.showError('Failed to load summary data')
        }
      } catch (error) {
        console.error('Summary load error:', error)
        this.showError('Failed to load summary data')
      }
    },
    
    async loadLots() {
      try {
        const response = await fetch('/api/admin/parking-lots', {
          headers: { 'Authentication-Token': `${localStorage.getItem('token')}` }
        })
        if (response.ok) {
          this.parkingLots = await response.json()
        } else {
          const error = await response.json()
          console.error('Lots load error:', error)
          this.showError('Failed to load parking lots')
        }
      } catch (error) {
        console.error('Lots load error:', error)
        this.showError('Failed to load parking lots')
      }
    },
    
    async loadSpots() {
      if (!this.selectedLotId) return
      
      try {
        const response = await fetch(`/api/admin/parking-lots/${this.selectedLotId}/spots`, {
          headers: { 'Authentication-Token': `${localStorage.getItem('token')}` }
        })
        if (response.ok) {
          this.parkingSpots = await response.json()
        } else {
          const error = await response.json()
          console.error('Spots load error:', error)
          this.showError('Failed to load parking spots')
        }
      } catch (error) {
        console.error('Spots load error:', error)
        this.showError('Failed to load parking spots')
      }
    },
    
    async loadUsers() {
      try {
        const response = await fetch('/api/admin/users', {
          headers: { 'Authentication-Token': `${localStorage.getItem('token')}` }
        })
        if (response.ok) {
          this.users = await response.json()
        } else {
          const error = await response.json()
          console.error('Users load error:', error)
          this.showError('Failed to load users')
        }
      } catch (error) {
        console.error('Users load error:', error)
        this.showError('Failed to load users')
      }
    },
    
    editLot(lot) {
      this.editingLot = true
      this.lotForm = { ...lot }
      this.showLotModal = true
    },
    
    async saveLot() {
      try {
       
        if (!this.lotForm.prime_location_name || !this.lotForm.price_per_hour || !this.lotForm.number_of_spots) {
          this.showError('Please fill in all required fields')
          return
        }

        const url = this.editingLot ? 
          `/api/admin/parking-lots/${this.lotForm.id}` : 
          '/api/admin/parking-lots'
        
        const method = this.editingLot ? 'PUT' : 'POST'
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': `${localStorage.getItem('token')}`
          },
          body: JSON.stringify(this.lotForm)
        })
        
        if (response.ok) {
          this.closeLotModal()
          await this.loadLots()
          await this.loadSummary()
          this.showSuccess(this.editingLot ? 'Lot updated successfully' : 'Lot created successfully')
        } else {
          const error = await response.json()
          this.showError(error.message || 'Error saving lot')
        }
      } catch (error) {
        console.error('Error saving lot:', error)
        this.showError('Error saving lot')
      }
    },
    
    async deleteLot(lotId) {
      if (!confirm('Are you sure you want to delete this parking lot?')) return
      
      try {
        const response = await fetch(`/api/admin/parking-lots/${lotId}`, {
          method: 'DELETE',
          headers: { 'Authentication-Token': `${localStorage.getItem('token')}` }
        })
        
        if (response.ok) {
          await this.loadLots()
          await this.loadSummary()
          this.showSuccess('Lot deleted successfully')
        } else {
          const error = await response.json()
          this.showError(error.message || 'Cannot delete lot with occupied spots')
        }
      } catch (error) {
        console.error('Error deleting lot:', error)
        this.showError('Error deleting lot')
      }
    },
    
    closeLotModal() {
      this.showLotModal = false
      this.editingLot = false
      this.lotForm = {
        id: null,
        prime_location_name: '',
        address: '',
        pin_code: '',
        price_per_hour: 0,
        number_of_spots: 0
      }
    },
    
    formatDateTime(timestamp) {
      return new Date(timestamp).toLocaleString()
    },
    
    showError(message) {
      alert('Error: ' + message)
    },
    
    showSuccess(message) {
      alert(message)
    }
  }
}