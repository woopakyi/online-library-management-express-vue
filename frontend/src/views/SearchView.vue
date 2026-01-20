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
              <router-link class="nav-link" to="/books">Books</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link active" aria-current="page" to="/search">Search</router-link>
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

    <div class="container-fluid mt-4">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/">Home</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Search</li>
        </ol>
      </nav>

      <div class="main-container">
        <!-- Left Column (Books) -->
        <div class="left-column">
          <!-- Results Count -->
          <div v-if="bookings.length > 0" class="results-count">
            Showing
            {{ (pagination.currentPage - 1) * pagination.perPage + 1 }} -
            {{ Math.min(pagination.currentPage * pagination.perPage, pagination.totalBooks) }}
            of {{ pagination.totalBooks }} results
          </div>

          <!-- Search Results -->
          <div v-if="bookings.length === 0 && !loading" class="no-results">
            <h4>No books found matching your search criteria</h4>
            <p>Try adjusting your search filters</p>
            <router-link to="/books" class="btn btn-outline-primary">Browse All Books</router-link>
          </div>

          <div v-else>
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>

            <div v-if="!loading" class="books-container">
              <div v-for="book in bookings" :key="book._id" class="card book-card">
                <img
                  :src="book.coverImage || 'https://picsum.photos/id/237/300/180'"
                  class="card-img-top"
                  :alt="book.title"
                  @click="$router.push(`/book/detail/${book._id}`)"
                />
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title">{{ book.title }}</h5>
                  <p class="card-text text-muted mb-1">
                    <small>by {{ book.author }}</small>
                  </p>
                  <p v-if="book.description" class="card-text">
                    {{ truncateDescription(book.description) }}
                  </p>

                  <div class="mt-auto">
                    <div class="d-flex justify-content-between align-items-center">
                      <small class="text-muted" v-if="book.updatedAt">
                        Last updated {{ timeSince(book.updatedAt) }}
                      </small>

                      <!-- Show Edit button only for admin -->
                      <router-link
                        v-if="user?.role === 'admin'"
                        :to="`/book/edit/${book._id}`"
                        class="btn btn-outline-primary btn-sm"
                      >
                        Edit
                      </router-link>
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
                  <a
                    class="page-link"
                    href="#"
                    @click.prevent="changePage(pagination.currentPage - 1)"
                  >
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

                <li
                  class="page-item"
                  :class="{ disabled: pagination.currentPage >= pagination.totalPages }"
                >
                  <a
                    class="page-link"
                    href="#"
                    @click.prevent="changePage(pagination.currentPage + 1)"
                  >
                    Next
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <!-- Right Column (Search Form) -->
        <div class="right-column">
          <div class="search-card">
            <h5 class="mb-4">Search Books</h5>
            <form @submit.prevent="submitSearch">
              <div class="mb-3">
                <label for="keywords" class="form-label">Keywords</label>
                <input
                  type="text"
                  class="form-control"
                  id="keywords"
                  placeholder="Title, author, isbn, description"
                  v-model="searchParams.keywords"
                />
              </div>

              <div class="mb-3">
                <label for="category" class="form-label">Category</label>
                <select class="form-select" id="category" v-model="searchParams.category">
                  <option value="">All Categories</option>
                  <option v-for="category in categories" :key="category" :value="category">
                    {{ category }}
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label for="location" class="form-label">Location</label>
                <select class="form-select" id="location" v-model="searchParams.location">
                  <option value="">All Locations</option>
                  <option v-for="location in locations" :key="location" :value="location">
                    {{ location }}
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label for="sort" class="form-label">Sort By</label>
                <select class="form-select" id="sort" v-model="searchParams.sort">
                  <option value="">Default</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="-title">Title (Z-A)</option>
                  <option value="author">Author (A-Z)</option>
                  <option value="-author">Author (Z-A)</option>
                  <option value="year">Year (Oldest)</option>
                  <option value="-year">Year (Newest)</option>
                  <option value="updatedAt">Recently Modified</option>
                </select>
              </div>

              <div class="mb-4">
                <label for="perPage" class="form-label">Items per page</label>
                <select class="form-select" id="perPage" v-model="searchParams.perPage">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div class="d-grid gap-2">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  <span
                    v-if="loading"
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Search
                </button>
                <button type="button" class="btn btn-outline-secondary" @click="resetForm">
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const user = ref(null); // For user info like role, name

// Data
const bookings = ref([]);
const categories = ref([]);
const locations = ref([]);
const loading = ref(false);

const searchParams = ref({
  keywords: '',
  category: '',
  location: '',
  sort: '',
  perPage: 10,
  page: 1
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

// API Functions
const fetchBooks = async () => {
  try {
    loading.value = true;
    bookings.value = [];

    const params = new URLSearchParams();

    if (searchParams.value.keywords) {
      params.append('title', searchParams.value.keywords);
    }
    if (searchParams.value.category) {
      params.append('category', searchParams.value.category);
    }
    if (searchParams.value.location) {
      params.append('location', searchParams.value.location);
    }
    if (searchParams.value.sort) {
      params.append('sort', searchParams.value.sort);
    }
    params.append('page', searchParams.value.page);
    params.append('perPage', searchParams.value.perPage);

    // Compose headers conditionally
    const headers = {};

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/books?${params.toString()}`, {
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch books');
    }

    const data = await response.json();

    bookings.value = data.data || [];
    pagination.value = {
      currentPage: data.pagination?.page || 1,
      perPage: data.pagination?.perPage || 10,
      totalBooks: data.pagination?.total || 0,
      totalPages: data.pagination?.totalPages || 1
    };

    // Only update route query if still on /search and query differs
    if (route.path === '/search') {
      // Build new query object you want to set
      const newQuery = {
        keywords: searchParams.value.keywords || undefined,
        category: searchParams.value.category || undefined,
        location: searchParams.value.location || undefined,
        sort: searchParams.value.sort || undefined,
        page: String(searchParams.value.page) || undefined,
        perPage: String(searchParams.value.perPage) || undefined
      };

      // Remove undefined keys (router ignores them)
      Object.keys(newQuery).forEach(key => newQuery[key] === undefined && delete newQuery[key]);

      // Compare current route.query and newQuery shallowly
      const queriesAreEqual = Object.keys(newQuery).length === Object.keys(route.query).length &&
        Object.entries(newQuery).every(([key, val]) => route.query[key] === val);

      if (!queriesAreEqual) {
        router.replace({ path: '/search', query: newQuery });
      }
    }
  } catch (err) {
    console.error('Error fetching books:', err);
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const response = await fetch('/api/books/stats/category');
    if (response.ok) {
      const stats = await response.json();
      categories.value = stats.map(stat => stat._id).filter(Boolean);
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
};

const fetchLocations = async () => {
  try {
    const response = await fetch('/api/books/stats/location');
    if (response.ok) {
      const stats = await response.json();
      locations.value = stats.map(stat => stat._id).filter(Boolean);
    } else {
      // Fallback to extracting from books
      const booksResponse = await fetch('/api/books?perPage=1000');
      if (booksResponse.ok) {
        const booksData = await booksResponse.json();
        locations.value = [...new Set(booksData.data.map(book => book.location).filter(Boolean))];
      }
    }
  } catch (err) {
    console.error('Error fetching locations:', err);
  }
};

// Form handlers
const submitSearch = () => {
  searchParams.value.page = 1;
  fetchBooks();
};

const resetForm = () => {
  searchParams.value = {
    keywords: '',
    category: '',
    location: '',
    sort: '',
    perPage: 10,
    page: 1
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
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
    } catch (err) {
      console.error('Logout API error:', err);
    }
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  user.value = null;
  // Stay on the current page
};

// Initialization
onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }

  if (Object.keys(route.query).length) {
    searchParams.value = {
      ...searchParams.value,
      ...route.query,
      page: parseInt(route.query.page) || 1,
      perPage: parseInt(route.query.perPage) || 10
    };
  }

  fetchBooks();
  fetchCategories();
  fetchLocations();
});

// Watch URL changes (back/forward)
watch(
  () => route.query,
  (newQuery) => {
    if (Object.keys(newQuery).length) {
      searchParams.value = {
        ...searchParams.value,
        ...newQuery,
        page: parseInt(newQuery.page) || 1,
        perPage: parseInt(newQuery.perPage) || 10
      };
      fetchBooks();
    }
  }
);
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
  position: sticky;
  top: 20px;
  height: fit-content;
  margin-bottom: 30px;
}

.no-results {
  text-align: center;
  padding: 50px;
  color: #6c757d;
}

.book-card {
  transition: transform 0.2s;
  width: 100%;
  margin-bottom: 20px;
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

.books-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.main-container {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.left-column {
  flex: 1;
  min-width: 0;
  padding-right: 20px;
}

.right-column {
  width: 350px;
  flex-shrink: 0;
}

/* Mobile layout */
@media (max-width: 992px) {
  .main-container {
    flex-direction: column;
  }
  .right-column {
    width: 100%;
    order: -1;
  }
  .left-column {
    padding-right: 0;
  }
  .search-card {
    position: static;
  }
}
</style>