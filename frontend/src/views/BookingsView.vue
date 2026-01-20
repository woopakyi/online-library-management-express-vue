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
              <router-link class="nav-link" to="/">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link active" aria-current="page" to="/books">Books</router-link>
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

          <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
            <!-- Show Sign In if no user -->
            <li v-if="!user" class="nav-item">
              <router-link class="btn btn-primary" to="/login">Sign In</router-link>
            </li>

            <!-- Show user full name and Logout button if logged in -->
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

    <div class="container my-4">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Books</li>
        </ol>
      </nav>

      <!-- Search and Filter Card -->
      <div class="search-card">
        <form @submit.prevent="fetchBooks">
          <div class="row g-3">
            <div class="col-md-6">
              <label for="keywords" class="form-label">Search</label>
              <input
                type="text"
                class="form-control"
                id="keywords"
                placeholder="Title, author, isbn"
                v-model="searchParams.keywords"
              />
            </div>

            <div class="col-md-3">
              <label for="category" class="form-label">Category</label>
              <select class="form-select" id="category" v-model="searchParams.category">
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>

            <div class="col-md-3 d-flex align-items-end">
              <button type="submit" class="btn btn-primary me-2">Filter</button>
              <button type="button" class="btn btn-outline-secondary" @click="resetFilters">
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Action Bar with Add Button and Results Count -->
      <div class="action-bar">
        <div v-if="bookings.length > 0" class="results-count">
          Showing
          {{ (pagination.currentPage - 1) * pagination.perPage + 1 }} -
          {{ Math.min(pagination.currentPage * pagination.perPage, pagination.totalBooks) }} of
          {{ pagination.totalBooks }} books
        </div>

        <!-- Show Add New Book button only for admins -->
        <router-link v-if="user?.role === 'admin'" to="/book/add" class="btn btn-primary">
          Add New Book
        </router-link>
      </div>

      <!-- Cards -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="bookings.length === 0" class="text-center py-5">
        <h4>No books found</h4>
        <p class="text-muted">Try adjusting your search filters or add a new book</p>
      </div>

  <div
    v-else
    class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4"
  >
    <div v-for="book in bookings" :key="book._id" class="col">
      <div class="card h-100 book-card">
        <img
          :src="getBookCover(book)"
          class="card-img-top"
          :alt="book.title"
          @click="$router.push(`/book/detail/${book._id}`)"
        />
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">{{ book.title }}</h5>
          <p class="card-text text-muted mb-1">
            <small>by {{ book.author }}</small>
          </p>
          <p v-if="book.description" class="card-text">{{ truncateDescription(book.description) }}</p>

          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted" v-if="book.updatedAt">
                Last updated {{ timeSince(book.updatedAt) }}
              </small>

                  <!-- Edit and Delete buttons only for admin -->
                  <div>
                    <router-link
                      v-if="user?.role === 'admin'"
                      :to="`/book/edit/${book._id}`"
                      class="btn btn-outline-primary btn-sm me-2"
                    >
                      Edit
                    </router-link>

                    <button
                      v-if="user?.role === 'admin'"
                      @click="handleDelete(book._id)"
                      class="btn btn-outline-danger btn-sm"
                      :disabled="deletingId === book._id"
                      title="Delete Book"
                    >
                      <span
                        v-if="deletingId === book._id"
                        class="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      <span v-else>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <nav
        v-if="bookings.length > 0 && pagination.totalPages > 1"
        aria-label="Page navigation"
        class="my-4"
      >
        <ul class="pagination justify-content-center">
          <li class="page-item" :class="{ disabled: pagination.currentPage <= 1 }">
            <a class="page-link" href="#" @click.prevent="changePage(pagination.currentPage - 1)">
              Previous
            </a>
          </li>

          <li
            v-for="i in pagination.totalPages"
            :key="i"
            class="page-item"
            :class="{ active: i === pagination.currentPage }"
          >
            <a class="page-link" href="#" @click.prevent="changePage(i)">{{ i }}</a>
          </li>

          <li class="page-item" :class="{ disabled: pagination.currentPage >= pagination.totalPages }">
            <a class="page-link" href="#" @click.prevent="changePage(pagination.currentPage + 1)">
              Next
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const bookings = ref([]);
const categories = ref([]);
const loading = ref(false);
const deletingId = ref(null);

const user = ref(null);

const searchParams = ref({
  keywords: '',
  category: '',
  page: 1,
  perPage: 10
});

const pagination = ref({
  currentPage: 1,
  perPage: 10,
  totalBooks: 0,
  totalPages: 1
});

const timeSince = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';

  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';

  return 'just now';
};

const truncateDescription = (text, length = 100) => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const getBookCover = (book) => {
  if (book.coverImage && book.coverImage.startsWith('data:image')) {
    return book.coverImage;
  } else if (book.coverImage) {
    return book.coverImage;
  }
  return 'https://picsum.photos/id/237/300/180';
};

const fetchBooks = async () => {
  try {
    loading.value = true;

    const params = new URLSearchParams();

    // Backend expects: 
    // title, author, isbn — so for keywords, split by space and assign to those fields if possible or send keywords as title by fallback
    // Here we simply send 'title' for case-insensitive search or you may enhance server side to search all three fields
    if (searchParams.value.keywords.trim()) {
      params.append('title', searchParams.value.keywords.trim());
    }
    if (searchParams.value.category) {
      params.append('category', searchParams.value.category);
    }
    params.append('page', searchParams.value.page);
    params.append('perPage', searchParams.value.perPage);

    // Send JWT token if logged in
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch(`/api/books?${params.toString()}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch books');

    const data = await response.json();

    bookings.value = data.data || [];
    pagination.value = {
      currentPage: data.pagination?.page || 1,
      perPage: data.pagination?.perPage || 10,
      totalBooks: data.pagination?.total || 0,
      totalPages: data.pagination?.totalPages || 1
    };

    // Update URL without triggering navigation
    const newQuery = Object.fromEntries(params.entries());
    if (JSON.stringify(newQuery) !== JSON.stringify(router.currentRoute.value.query)) {
      router.replace({ query: newQuery });
    }
  } catch (err) {
    console.error('Error fetching books:', err);
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    // Combine categories from current books + stats endpoint to fill category filters
    const uniqueCategories = [...new Set(bookings.value.map(book => book.category).filter(Boolean))];
    categories.value = uniqueCategories;

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch('/api/books/stats/category', { headers });
    if (response.ok) {
      const stats = await response.json();
      categories.value = [...new Set([...categories.value, ...stats.map(stat => stat._id)])].filter(Boolean);
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
};

const handleDelete = async (bookId) => {
  if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
    return;
  }
  deletingId.value = bookId;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in as admin to delete books.');
      return;
    }
    const response = await fetch(`/api/books/${bookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'Failed to delete book');
    }
    // Refresh book list
    await fetchBooks();
  } catch (err) {
    alert(`Error deleting book: ${err.message}`);
  } finally {
    deletingId.value = null;
  }
};

const resetFilters = () => {
  searchParams.value = {
    keywords: '',
    category: '',
    page: 1,
    perPage: 10
  };
  fetchBooks();
};

const changePage = (page) => {
  if (page < 1 || page > pagination.value.totalPages) return;
  searchParams.value.page = page;
  fetchBooks();
};

const logout = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token }
      });
    } catch (err) {
      console.error('Logout API error:', err);
    }
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  user.value = null;
  // Optionally, route to login or home if you want
};

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }

  if (Object.keys(router.currentRoute.value.query).length) {
    searchParams.value = {
      ...searchParams.value,
      ...router.currentRoute.value.query,
      page: parseInt(router.currentRoute.value.query.page) || 1,
      perPage: parseInt(router.currentRoute.value.query.perPage) || 10
    };
  }

  fetchBooks().then(fetchCategories);
});
</script>

<style scoped>
body {
  margin: 0;
  padding: 0;
}

.navbar {
  margin-top: 0;
}

.card-img-top {
  background-color: #f8f9fa;
  height: 180px;
  object-fit: cover;
  cursor: pointer;
}

.search-card {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.book-card {
  transition: transform 0.2s;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.results-count {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 15px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>