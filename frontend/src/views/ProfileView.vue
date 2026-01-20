<template>
  <main class="container py-4">
    <h1>Profile</h1>

    <div v-if="user" class="card p-4" style="max-width: 400px;">
      <p><strong>First Name:</strong> {{ user.firstName || '-' }}</p>
      <p><strong>Last Name:</strong> {{ user.lastName || '-' }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Role:</strong> {{ user.role }}</p>
      <p><strong>Account created:</strong> {{ formattedDate(user.createdAt) }}</p>
      <p><strong>Status:</strong> {{ user.isActive ? 'Active' : 'Inactive' }}</p>
    </div>

    <div v-else class="alert alert-warning">
      No user data found. Please <router-link to="/login">login</router-link>.
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const user = ref(null);
const router = useRouter();

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  } else {
    // No user in localStorage, redirect to login
    router.push('/login');
  }
});

const formattedDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};
</script>

<style scoped>
.card {
  background-color: #f8f9fa;
  border-radius: 0.3rem;
}
</style>