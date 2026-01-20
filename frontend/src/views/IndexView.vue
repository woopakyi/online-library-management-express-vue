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
          <router-link class="nav-link" to="/books" @click.prevent="navigateToBooks">Books</router-link>
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
        <!-- Show Login if no user -->
        <li v-if="!user" class="nav-item">
          <router-link class="btn btn-primary" to="/login">Sign in</router-link>
        </li>

        <!-- Show user full name + Profile & Logout buttons if logged in -->
        <li v-else class="nav-item d-flex align-items-center">
          <span class="navbar-text me-3">
            {{ user.firstName }} {{ user.lastName }}
          </span>

          <router-link
            class="btn btn-outline-primary btn-sm me-2"
            to="/profile"
            role="button"
          >
            Profile
          </router-link>

          <button @click="logout" class="btn btn-outline-danger btn-sm">
            Logout
          </button>
        </li>
      </ul>
    </div>
  </div>
</nav>

    <!-- Carousel for Highlighted Books -->
    <div id="carouselExampleAutoplaying" class="carousel slide" data-bs-ride="carousel">
      <div class="carousel-inner">
        <template v-if="highlightedBooks.length > 0">
          <div
            v-for="(book, index) in highlightedBooks"
            :key="book._id"
            class="carousel-item"
            :class="{ active: index === 0 }"
          >
            <img
              :src="book.coverImage || getFallbackImage(index, '800/200')"
              class="d-block w-100"
              :alt="book.title || `Book ${index + 1}`"
              @error="handleImageError($event, index, '800/200')"
            />
          </div>
        </template>
        <template v-else>
          <div class="carousel-item active">
            <img
              src="https://picsum.photos/id/661/800/200"
              class="d-block w-100"
              alt="Featured books coming soon"
            />
          </div>
        </template>
      </div>
      <button
        class="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExampleAutoplaying"
        data-bs-slide="prev"
      >
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button
        class="carousel-control-next"
        type="button"
        data-bs-target="#carouselExampleAutoplaying"
        data-bs-slide="next"
      >
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>

    <br />

    <!-- Tabs (optional for UI; you can add click handlers for tabbing) -->
    <ul class="nav nav-tabs mx-3">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'new' }"
          href="#"
          @click.prevent="activeTab = 'new'"
          >New</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'trending' }"
          href="#"
          @click.prevent="activeTab = 'trending'"
          >Trending</a
        >
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'hot' }"
          href="#"
          @click.prevent="activeTab = 'hot'"
          >Hot</a
        >
      </li>
    </ul>
    <!-- Book Lists depending on active tab -->
    <div class="container mx-3 my-3">
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else>
        <!-- New Books -->
        <div v-if="activeTab === 'new'">
          <h4>Latest Books</h4>
          <div
            v-for="(book, index) in latestBooks"
            :key="book._id"
            class="d-flex align-items-center py-3 border-bottom"
          >
            <router-link :to="`/book/detail/${book._id}`" class="me-3">
              <img
                :src="book.coverImage || getFallbackImage(index, '64')"
                class="book-list-img"
                :alt="book.title || 'Book cover'"
                @error="handleImageError($event, index, '64')"
              />
            </router-link>
            <div>
              <h5 class="mb-1">
                <router-link
                  :to="`/book/detail/${book._id}`"
                  class="text-decoration-none text-dark"
                >
                  {{ book.title || `Book ${index + 1}` }}
                </router-link>
              </h5>
              <p v-if="book.description" class="mb-0 text-muted small">
                {{ truncateDescription(book.description) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Trending Books -->
        <div v-if="activeTab === 'trending'">
          <h4>Trending Books</h4>
          <div v-if="trendingBooks.length > 0">
            <div
              v-for="(book, index) in trendingBooks"
              :key="book._id"
              class="d-flex align-items-center py-3 border-bottom"
            >
              <router-link :to="`/book/detail/${book._id}`" class="me-3">
                <img
                  :src="book.coverImage || getFallbackImage(index, '64')"
                  class="small-square-img"
                  :alt="book.title || 'Book cover'"
                  @error="handleImageError($event, index, '64')"
                />
              </router-link>
              <div>
                <h5 class="mb-1">
                  <router-link
                    :to="`/book/detail/${book._id}`"
                    class="text-decoration-none text-dark"
                  >
                    {{ book.title }}
                  </router-link>
                </h5>
                <p v-if="book.description" class="mb-0 text-muted small">
                  {{ truncateDescription(book.description) }}
                </p>
              </div>
            </div>
          </div>
          <p v-else>No trending books found.</p>
        </div>

        <!-- Hot Books -->
        <div v-if="activeTab === 'hot'">
          <h4>Hot Books</h4>
          <div v-if="hotBooks.length > 0">
            <div
              v-for="(book, index) in hotBooks"
              :key="book._id"
              class="d-flex align-items-center py-3 border-bottom"
            >
              <router-link :to="`/book/detail/${book._id}`" class="me-3">
                <img
                  :src="book.coverImage || getFallbackImage(index, '64')"
                  class="small-square-img"
                  :alt="book.title || 'Book cover'"
                  @error="handleImageError($event, index, '64')"
                />
              </router-link>
              <div>
                <h5 class="mb-1">
                  <router-link
                    :to="`/book/detail/${book._id}`"
                    class="text-decoration-none text-dark"
                  >
                    {{ book.title }}
                  </router-link>
                </h5>
                <p v-if="book.description" class="mb-0 text-muted small">
                  {{ truncateDescription(book.description) }}
                </p>
              </div>
            </div>
          </div>
          <p v-else>No hot books found.</p>
        </div>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(null);
const books = ref([]);
const latestBooks = ref([]);
const highlightedBooks = ref([]);
const trendingBooks = ref([]);
const hotBooks = ref([]);
const loading = ref(true);
const error = ref(null);

const activeTab = ref('new');

const navigateToBooks = () => {
  // Force a full navigation to /books
  window.location.href = '/books';
};

const getFallbackImage = (index, dimensions = '64') => {
  return `https://picsum.photos/id/${661 + index}/${dimensions}`;
};

const handleImageError = (event, index, dimensions) => {
  event.target.src = getFallbackImage(index, dimensions);
};

const truncateDescription = (description) => {
  return description.length > 100 ? description.substring(0, 100) + '...' : description;
};

const fetchAllBooks = async () => {
  try {
    let allBooks = [];
    let currentPage = 1;
    let totalPages = 1;
    const token = localStorage.getItem('token');

    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};

    // Fetch all pages of books
    do {
      const response = await fetch(`/api/books?page=${currentPage}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();

      allBooks = [...allBooks, ...(data.data || [])];
      totalPages = data.pagination?.totalPages || 1;
      currentPage++;
    } while (currentPage <= totalPages);

    books.value = allBooks;

    // Get latest 6 books (sorted by createdAt)
    latestBooks.value = [...books.value]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    // Get highlighted books (isHighlighted: true)
    highlightedBooks.value = books.value.filter((book) => book.isHighlighted === true).slice(0, 6);
  } catch (err) {
    error.value = err.message;
    console.error('API fetch error:', err);
  }
};

const fetchTrendingBooks = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};

    const response = await fetch('/api/books/trending?limit=6', { headers });
    if (!response.ok) throw new Error('Failed to fetch trending books');
    const data = await response.json();
    trendingBooks.value = data.data || [];
  } catch (err) {
    error.value = err.message;
    console.error('Trending fetch error:', err);
  }
};

const fetchHotBooks = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};

    const response = await fetch('/api/books/hot?limit=6', { headers });
    if (!response.ok) throw new Error('Failed to fetch hot books');
    const data = await response.json();
    hotBooks.value = data.data || [];
  } catch (err) {
    error.value = err.message;
    console.error('Hot fetch error:', err);
  }
};

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user.value = JSON.parse(storedUser);
  }

  loading.value = true;
  await Promise.all([fetchAllBooks(), fetchTrendingBooks(), fetchHotBooks()]);
  loading.value = false;

  // Initialize Bootstrap carousel after data is loaded
  if (window.bootstrap) {
    setTimeout(() => {
      new window.bootstrap.Carousel(document.getElementById('carouselExampleAutoplaying'), {
        interval: 5000,
        ride: 'carousel',
      });
    }, 100);
  }
});

const logout = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
    } catch (err) {
      console.error('Logout API error:', err);
    }
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  user.value = null;
};

</script>

<style scoped>
.carousel-inner {
  height: 200px;
  overflow: hidden;
}

.carousel-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.book-list-img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  flex-shrink: 0;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.error-message {
  color: red;
  text-align: center;
  padding: 2rem;
}

/* Card truncation */
.card-text.text-truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.small-square-img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 4px; /* optional rounded corners */
}
</style>