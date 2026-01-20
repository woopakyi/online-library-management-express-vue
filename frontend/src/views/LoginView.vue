<script setup>
// imports
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const credentials = ref({
  email: '',
  password: ''
});

const user = ref(null);
const router = useRouter();

onMounted(() => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  if (token && userData) {
    user.value = JSON.parse(userData);
    router.replace('/'); // Redirect if already logged in
  }
});


// methods
const login = async () => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials.value)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    user.value = data.user;  // update user reactive state

    router.push('/');
  } catch (error) {
    alert(error);
  }
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<template>
  <div>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg bg-body-tertiary">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/">Online Library</router-link>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <router-link class="nav-link active" aria-current="page" to="/">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/books">Books</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/search">Search</router-link>
            </li>

            <!-- Only show Add Book to admins -->
            <li v-if="user && user.role === 'admin'" class="nav-item">
              <router-link class="nav-link" to="/book/add">Add Book</router-link>
            </li>

            <!-- Only show User Management to admins -->
            <li v-if="user && user.role === 'admin'" class="nav-item">
              <router-link class="nav-link" to="/admin/users">User Management</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Login Form -->
    <main 
      class="d-flex justify-content-center align-items-center"
      style="min-height: 100vh;"
    >
      <form @submit.prevent="login" class="border p-4 rounded shadow" style="min-width: 320px; max-width: 400px; width: 100%;">
        <h2 class="mb-4 text-center">Login</h2>
        <div class="mb-3">
          <label for="exampleInputEmail1" class="form-label">Email address</label>
          <input 
            type="email" 
            class="form-control" 
            v-model="credentials.email" 
            id="exampleInputEmail1" 
            aria-describedby="emailHelp" 
            placeholder="email@example.com"
            required
          >
        </div>

        <div class="mb-3">
          <label for="exampleInputPassword1" class="form-label">Password</label>
          <input 
            type="password" 
            class="form-control" 
            v-model="credentials.password" 
            id="exampleInputPassword1" 
            placeholder="Password"
            required
          >
        </div>

        <div class="mb-3 form-check">
          <input type="checkbox" class="form-check-input" id="exampleCheck1">
          <label class="form-check-label" for="exampleCheck1">Remember me</label>
        </div>

        <button type="submit" class="btn btn-primary w-100">Sign in</button>

        <!-- Create Account button -->
        <button 
          type="button" 
          class="btn btn-outline-secondary w-100 mt-2" 
          @click="goToRegister"
          style="cursor: pointer;"
        >
          Create Account
        </button>
      </form>
    </main>
  </div>
</template>