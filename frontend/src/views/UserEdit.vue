<template>
  <div>
    <!-- Navbar (same as UserList/UserAdd) -->
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
        <li class="breadcrumb-item active" aria-current="page">Edit</li>
      </ol>
    </nav>

    <!-- Main Content -->
    <div class="container my-4">
      <h2>Edit User</h2>
      <div class="row">
        <!-- Left: User Edit Form -->
        <div class="col-md-6">
          <form @submit.prevent="handleSave">
            <div class="mb-3">
              <label for="email" class="form-label">Email *</label>
              <input id="email" v-model="form.email" type="email" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input id="password" v-model="form.password" type="password" class="form-control" />
              <small class="form-text text-muted">Leave blank to keep the current password unchanged.</small>
            </div>
            <div class="mb-3">
              <label for="confirmPassword" class="form-label">Confirm Password</label>
              <input id="confirmPassword" v-model="form.confirmPassword" type="password" class="form-control" />
            </div>
            <div class="mb-3">
              <label for="firstName" class="form-label">First Name *</label>
              <input id="firstName" v-model="form.firstName" type="text" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="lastName" class="form-label">Last Name *</label>
              <input id="lastName" v-model="form.lastName" type="text" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="role" class="form-label">Role *</label>
              <select id="role" v-model="form.role" class="form-select" required>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div v-if="formError" class="alert alert-danger">{{ formError }}</div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary" :disabled="loadingSave">
                {{ loadingSave ? 'Saving…' : 'Save' }}
              </button>
              <button
                type="button"
                class="btn btn-danger ms-auto"
                @click="handleDelete"
                :disabled="loadingDelete"
              >
                {{ loadingDelete ? 'Deleting…' : 'Delete' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Right: Borrow History -->
        <div class="col-md-6">
          <h4>Borrow History</h4>

          <div v-if="loadingHistory" class="text-center py-3">
            <div class="spinner-border" role="status"></div>
            <span class="visually-hidden">Loading…</span>
          </div>

          <div v-else-if="borrowHistory.length === 0" class="text-muted">
            No borrow history available.
          </div>

          <ul class="list-group" v-else>
            <li v-for="record in borrowHistory" :key="record._id" class="list-group-item">
              <strong>{{ record.bookTitle || 'Unknown Book' }}</strong><br />
              Borrowed: {{ formatDate(record.borrowDate) }}<br />
              Due: {{ formatDate(record.dueDate) }}<br />
              Returned:
              <span v-if="record.returnDate">{{ formatDate(record.returnDate) }}</span>
              <span v-else class="text-warning">Not returned</span><br />
              Status: {{ record.status }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const userId = route.params.id;

const user = ref(null);
const form = ref({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  role: 'user',
});

const borrowHistory = ref([]);
const loadingUser = ref(false);
const loadingHistory = ref(false);
const loadingSave = ref(false);
const loadingDelete = ref(false);

const formError = ref('');

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

function logout() {
  const token = localStorage.getItem('token');
  if (token) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token }
    }).catch(console.error);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
}

async function checkAuthorization() {
  // Check if user is authenticated and admin, else redirect
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    router.replace('/');
    return false;
  }
  try {
    user.value = JSON.parse(storedUser);
    if (user.value.role !== 'admin') {
      router.replace('/');
      return false;
    }
    return true;
  } catch {
    router.replace('/');
    return false;
  }
}

async function loadUser() {
  loadingUser.value = true;
  formError.value = '';
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token');

    const res = await fetch(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error(`Failed to load user: ${res.statusText}`);
    }
    const data = await res.json();

    form.value.email = data.email || '';
    form.value.firstName = data.firstName || '';
    form.value.lastName = data.lastName || '';
    form.value.role = data.role || 'user';
    // passwords intentionally left blank
  } catch (err) {
    formError.value = err.message;
  } finally {
    loadingUser.value = false;
  }
}

async function loadBorrowHistory() {
  loadingHistory.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token');

    const res = await fetch(`/api/users/${userId}/borrowings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load borrow history');
    borrowHistory.value = await res.json();
  } catch (err) {
    console.error('Error loading borrow history:', err);
  } finally {
    loadingHistory.value = false;
  }
}

async function handleSave() {
  formError.value = '';

  if (form.value.password !== form.value.confirmPassword) {
    formError.value = "Passwords do not match";
    return;
  }

  loadingSave.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token');

    const updateData = {
      email: form.value.email,
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      role: form.value.role,
    };

    if (form.value.password.trim() !== '') {
      updateData.password = form.value.password;
    }

    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Failed to update user');
    }

    alert('User updated successfully!');
    router.push('/admin/users');
  } catch (err) {
    formError.value = err.message;
  } finally {
    loadingSave.value = false;
  }
}

async function handleDelete() {
  if (!confirm('Are you sure you want to DELETE this user? This action is irreversible.')) {
    return;
  }

  loadingDelete.value = true;

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No auth token');

    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Failed to delete user');
    }

    alert('User deleted successfully!');
    router.push('/admin/users');
  } catch (err) {
    alert(`Delete failed: ${err.message}`);
  } finally {
    loadingDelete.value = false;
  }
}

onMounted(async () => {
  const authorized = await checkAuthorization();
  if (!authorized) return;

  loadUser();
  loadBorrowHistory();
});
</script>

<style scoped>
/* optional styling */
</style>