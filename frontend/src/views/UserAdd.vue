<template>
  <div>
    <!-- Navbar same as UserEdit -->
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

    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="my-3 ms-3">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <router-link to="/admin/users">Users</router-link>
        </li>
        <li class="breadcrumb-item active" aria-current="page">Add User</li>
      </ol>
    </nav>

    <main class="container my-4" style="max-width: 600px">
      <h2>Add New User</h2>

      <form @submit.prevent="handleSubmit" novalidate>
        <div class="mb-3">
          <label for="email" class="form-label">Email *</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            class="form-control"
            required
          />
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">Password *</label>
          <input
            id="password"
            v-model.trim="form.password"
            type="password"
            class="form-control"
            required
          />
        </div>

        <div class="mb-3">
          <label for="confirmPassword" class="form-label">Confirm Password *</label>
          <input
            id="confirmPassword"
            v-model.trim="form.confirmPassword"
            type="password"
            class="form-control"
            required
          />
        </div>

        <div class="mb-3">
          <label for="firstName" class="form-label">First Name *</label>
          <input
            id="firstName"
            v-model.trim="form.firstName"
            type="text"
            class="form-control"
            required
          />
        </div>

        <div class="mb-3">
          <label for="lastName" class="form-label">Last Name *</label>
          <input
            id="lastName"
            v-model.trim="form.lastName"
            type="text"
            class="form-control"
            required
          />
        </div>

        <div class="mb-3">
          <label for="role" class="form-label">Role *</label>
          <select
            id="role"
            v-model="form.role"
            class="form-select"
            required
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div v-if="formError" class="alert alert-danger">
          {{ formError }}
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create User' }}
        </button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const loading = ref(false)
const formError = ref('')

const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  role: 'user',
})

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
    }
  } catch {
    router.replace('/')
  }
})

async function handleSubmit() {
  formError.value = ''

  if (!form.value.email) {
    formError.value = 'Email is required.'
    return
  }

  if (!form.value.password) {
    formError.value = 'Password is required.'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    formError.value = 'Passwords do not match.'
    return
  }

  if (!form.value.firstName) {
    formError.value = 'First Name is required.'
    return
  }

  if (!form.value.lastName) {
    formError.value = 'Last Name is required.'
    return
  }

  loading.value = true

  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('No auth token')

    // payload for registration (matching your backend shape)
    const payload = {
      email: form.value.email,
      password: form.value.password,
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      role: ['user', 'admin'].includes(form.value.role) ? form.value.role : 'user',
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.message || 'Failed to create user')
    }

    alert('User created successfully!')
    router.push('/admin/users')
  } catch (err) {
    formError.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* optional styling */
</style>