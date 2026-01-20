<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const user = ref(null)
const users = ref([])

const keyword = ref('')
const roleFilter = ref('')
const sortBy = ref('createdAt')
const sortOrder = ref('desc')

const loading = ref(false)
const errorMessage = ref('')

const deletingId = ref(null);

const pagination = ref({
  currentPage: 1,
  perPage: 10,
  totalBooks: 0,
  totalPages: 1,
});

// Read user from localStorage and redirect non-admin / anonymous
onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) {
    router.replace('/')
    return
  }

  try {
    user.value = JSON.parse(storedUser)
    if (user.value.role !== 'admin') {
      router.replace('/')
    } else {
      loadUsers()
    }
  } catch {
    router.replace('/')
  }
})

// Fetch users from API with query params: page, limit, role, keyword, sortBy, sortOrder
async function loadUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/')
      return
    }

    const params = new URLSearchParams()

    params.append('page', pagination.value.currentPage)
    params.append('limit', pagination.value.perPage)

    if (keyword.value.trim()) {
      params.append('keyword', keyword.value.trim())
    }
    if (roleFilter.value) {
      params.append('role', roleFilter.value)
    }

    const allowedSorts = ['email', 'role']
    if (allowedSorts.includes(sortBy.value)) {
      params.append('sortBy', sortBy.value)
      params.append('sortOrder', sortOrder.value)
    } else {
      params.append('sortBy', 'email')
      params.append('sortOrder', 'asc')
    }

    const res = await fetch(`/api/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        router.replace('/')
        return
      }
      const errData = await res.json()
      throw new Error(errData.message || 'Failed to load users')
    }

    const data = await res.json()
    users.value = data.data || []
    pagination.value.totalBooks = data.total || users.value.length
    pagination.value.totalPages = Math.ceil(pagination.value.totalBooks / pagination.value.perPage)

  } catch (err) {
    errorMessage.value = err.message
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Handle table header click: sort asc/desc toggle
function toggleSort(field) {
  const allowed = ['email', 'role']
  if (!allowed.includes(field)) return

  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'asc'
  }
  pagination.value.currentPage = 1
  loadUsers()
}

function changePage(page) {
  if (page < 1 || page > pagination.value.totalPages) return
  pagination.value.currentPage = page
  loadUsers()
}

watch([keyword, roleFilter, () => pagination.value.currentPage], () => {
  loadUsers()
})

function onSearchSubmit(e) {
  e.preventDefault()
  pagination.value.currentPage = 1
  loadUsers()
}

// Logout method (like in login page)
function logout() {
  const token = localStorage.getItem('token')
  if (token) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token }
    }).catch(console.error)
  }
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

async function handleDelete(userId) {
  if (!confirm('Are you sure you want to DELETE this user? This action is irreversible.')) {
    return;
  }

  deletingId.value = userId;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in as admin to delete users.');
      return;
    }

    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to delete user');
    }

    alert('User deleted successfully!');
    await loadUsers(); // refresh the list
  } catch (err) {
    alert(`Delete failed: ${err.message}`);
  } finally {
    deletingId.value = null;
  }
}
</script>

<template>
  <div>
    <!-- Navbar (similar to login page) -->
    <nav class="navbar navbar-expand-lg bg-body-tertiary">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/">Online Library</router-link>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/books">Books</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/search">Search</router-link>
            </li>
            <li v-if="user?.role === 'admin'" class="nav-item">
              <router-link class="nav-link" to="/book/add">Add Book</router-link>
            </li>
            <li v-if="user?.role === 'admin'" class="nav-item active">
              <router-link class="nav-link" to="/admin/users">User Management</router-link>
            </li>
          </ul>

          <ul class="navbar-nav ms-auto align-items-center">
            <li v-if="!user" class="nav-item">
              <router-link class="btn btn-primary" to="/login">Sign In</router-link>
            </li>

            <li v-else class="nav-item d-flex align-items-center">
              <span class="navbar-text me-3">
                {{ user.firstName }} {{ user.lastName }}
              </span>
              <button @click="logout" class="btn btn-outline-danger btn-sm">Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="container my-4">
      <h2>User Management</h2>

      <form @submit="onSearchSubmit" class="row g-3 mb-3 align-items-center">
        <div class="col-auto">
          <input
            type="text"
            class="form-control"
            placeholder="Search by keyword"
            v-model="keyword"
          />
        </div>
        <div class="col-auto">
          <select class="form-select" v-model="roleFilter">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div class="col-auto">
          <button type="submit" class="btn btn-primary">Search</button>
        </div>
      </form>

      <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
        <span class="visually-hidden">Loading users...</span>
      </div>

<div class="d-flex justify-content-between align-items-center mb-3">
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb mb-0">
      <li class="breadcrumb-item active" aria-current="page">Users</li>
      <li class="breadcrumb-item" ></li>
    </ol>
  </nav>

  <router-link to="/admin/users/create" class="btn btn-success">
    Add User
  </router-link>
</div>

      <table v-if="users.length && !loading" class="table table-striped">
    <thead>
      <tr>
        <th @click="toggleSort('email')" style="cursor:pointer">
          Email
          <span v-if="sortBy === 'email'">({{ sortOrder }})</span>
        </th>
        <th>First Name</th>
        <th>Last Name</th>
        <th @click="toggleSort('role')" style="cursor:pointer">
          Role
          <span v-if="sortBy === 'role'">({{ sortOrder }})</span>
        </th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="u in users" :key="u._id">
        <td>{{ u.email }}</td>
        <td>{{ u.firstName }}</td>
        <td>{{ u.lastName }}</td>
        <td>{{ u.role }}</td>
        <td>
          <div v-if="user?.role === 'admin'" class="d-flex gap-2">
            <router-link
              :to="`/admin/users/edit/${u._id}`"
              class="btn btn-outline-primary btn-sm"
              >Edit</router-link
            >
            <button
              class="btn btn-outline-danger btn-sm"
              @click="handleDelete(u._id)"
              :disabled="deletingId === u._id"
              title="Delete User"
            >
              <span
                v-if="deletingId === u._id"
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <span v-else>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

      <nav
        v-if="users.length > 0 && pagination.totalPages > 1"
        aria-label="Page navigation"
        class="my-4"
        >
        <ul class="pagination justify-content-center">
            <li :class="['page-item', { disabled: pagination.currentPage <= 1 }]">
            <a class="page-link" href="#" @click.prevent="changePage(pagination.currentPage - 1)">
                Previous
            </a>
            </li>

            <li 
            v-for="i in pagination.totalPages"
            :key="i"
            :class="['page-item', { active: i === pagination.currentPage }]"
            >
            <a class="page-link" href="#" @click.prevent="changePage(i)">{{ i }}</a>
            </li>

            <li :class="['page-item', { disabled: pagination.currentPage >= pagination.totalPages }]">
            <a class="page-link" href="#" @click.prevent="changePage(pagination.currentPage + 1)">
                Next
            </a>
            </li>
        </ul>
        </nav>

      <div class="text-muted text-center mt-2">
        Total users: {{ pagination.totalBooks }}
      </div>
    </main>
  </div>
</template>

<style scoped>
th {
  user-select: none;
}
</style>