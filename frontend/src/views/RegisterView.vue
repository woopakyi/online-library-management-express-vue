<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const newUser = ref({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'user' // default role
});

const register = async () => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser.value)
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message);

    alert('Account created successfully. You can now log in.');
    router.push('/login');
  } catch (error) {
    alert(error.message);
  }
};

const goBack = () => {
  router.back(); // navigates back one step in browser history
  // Or use: router.push('/login'); to go explicitly to login page
};
</script>

<template>
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
          </ul>
        </div>
      </div>
    </nav>


  <main 
    class="d-flex justify-content-center align-items-center"
    style="min-height: 100vh;"
  >
<form @submit.prevent="register" class="border p-4 rounded shadow" style="min-width: 320px; max-width: 400px; width: 100%;">
  <h2 class="mb-4 text-center">Create Account</h2>

  <div class="mb-3">
    <label>Email address</label>
    <input type="email" class="form-control" v-model="newUser.email" required />
  </div>

  <div class="mb-3">
    <label>Password</label>
    <input type="password" class="form-control" v-model="newUser.password" required />
  </div>

  <div class="mb-3">
    <label>First Name</label>
    <input type="text" class="form-control" v-model="newUser.firstName" />
  </div>

  <div class="mb-3">
    <label>Last Name</label>
    <input type="text" class="form-control" v-model="newUser.lastName" />
  </div>
  <button type="submit" class="btn btn-primary w-100">Create Account</button>
  
  <!-- Go Back button -->
<button 
  type="button" 
  class="btn btn-outline-secondary w-100 mt-2" 
  @click="goBack"
  style="cursor: pointer;"
>
  Go Back
</button>
</form>
  </main>
</template>