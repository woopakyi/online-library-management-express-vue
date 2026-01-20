<template>
  <nav class="navbar navbar-expand-lg bg-body-tertiary mb-4">
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
            <router-link class="nav-link" to="/">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/books">Books</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/search">Search</router-link>
          </li>
        </ul>

        <ul class="navbar-nav ms-auto align-items-center">
          <li v-if="user" class="nav-item me-3">
            <span>Welcome, {{ user.firstName }}!</span>
          </li>
          <li v-if="user" class="nav-item">
            <button class="btn btn-outline-secondary" @click="logout">Logout</button>
          </li>
          <li v-else class="nav-item">
            <router-link class="btn btn-primary" to="/login">Login</router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const user = ref(null);
const router = useRouter();

const checkUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      user.value = JSON.parse(userStr);
    } catch {
      user.value = null;
    }
  } else {
    user.value = null;
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  user.value = null;
  router.push('/login');
};

onMounted(() => {
  checkUser();
});
</script>