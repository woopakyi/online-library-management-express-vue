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
    <div class="container mt-3">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/books">Books</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">{{ book.title }}</li>
        </ol>
      </nav>
    </div>

    <!-- Back to Books button above content -->
    <div class="container my-4">
      <router-link to="/books" class="btn btn-outline-secondary">
        &larr; Back to Books
      </router-link>
    </div>

    <!-- Main container -->
    <div class="container my-5">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
      </div>

      <div v-else class="row">
        <!-- Left: Book info card -->
        <div class="col-md-8">
          <div class="card position-relative shadow-sm">
            <div class="text-center">
              <img
                :src="book.coverImage || 'https://picsum.photos/id/237/400/400'"
                class="book-cover card-img-top"
                :alt="book.title"
                @error="handleImageError"
              />
            </div>

            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="card-title mb-0">{{ book.title }}</h2>
                <div>
                  <router-link
                    v-if="user?.role === 'admin'"
                    :to="`/book/edit/${book._id}`"
                    class="btn btn-sm btn-primary me-2"
                  >
                    Edit
                  </router-link>

                  <!-- Delete button only for admin -->
                  <button
                    v-if="user?.role === 'admin'"
                    class="btn btn-sm btn-danger"
                    @click="deleteBook"
                    :disabled="deleting"
                  >
                    <span v-if="deleting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Delete
                  </button>
                </div>
              </div>

              <span v-if="book.isHighlighted" class="badge bg-warning text-dark my-2 d-inline-block">Featured</span>

              <p class="card-text">{{ book.description || 'No description available' }}</p>

              <!-- Book details -->
              <div class="mb-2"><strong>ISBN:</strong> {{ book.isbn || 'N/A' }}</div>
              <div class="mb-2"><strong>Author:</strong> {{ book.author || 'N/A' }}</div>
              <div class="mb-2"><strong>Publisher:</strong> {{ book.publisher || 'N/A' }}</div>
              <div class="mb-2"><strong>Year:</strong> {{ book.year || 'N/A' }}</div>
              <div class="mb-2"><strong>Category:</strong> {{ book.category || 'N/A' }}</div>
              <div class="mb-2"><strong>Location:</strong> {{ book.location || 'N/A' }}</div>

              <!-- Borrow buttons -->
              <div class="d-flex justify-content-between mt-3">
                <button
                  v-if="user && !borrowing"
                  @click="borrowBook"
                  class="btn btn-primary"
                >
                  Borrow
                </button>

                <button
                  v-if="user && borrowing"
                  @click="returnBook"
                  class="btn btn-success"
                >
                  Return
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Borrow History (admin only) -->
        <div v-if="user?.role === 'admin'" class="col-md-4">
          <h4 class="mb-3">Borrow History</h4>

          <div v-if="loadingHistory" class="text-center py-3">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>

          <div v-else>
            <!-- Simple search input -->
            <input
              v-model="searchTerm"
              placeholder="Search user name or status"
              class="form-control form-control-sm mb-2"
              type="text"
            />

            <table class="table table-sm table-bordered table-hover">
              <thead class="table-light">
                <tr>
                  <th @click="sortTable('userName')" style="cursor:pointer">
                    User Name
                    <small v-if="sortKey === 'userName'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</small>
                  </th>
                  <th @click="sortTable('borrowDate')" style="cursor:pointer">
                    Borrow Date
                    <small v-if="sortKey === 'borrowDate'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</small>
                  </th>
                  <th @click="sortTable('dueDate')" style="cursor:pointer">
                    Due Date
                    <small v-if="sortKey === 'dueDate'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</small>
                  </th>
                  <th @click="sortTable('returnDate')" style="cursor:pointer">
                    Return Date
                    <small v-if="sortKey === 'returnDate'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</small>
                  </th>
                  <th @click="sortTable('status')" style="cursor:pointer">
                    Status
                    <small v-if="sortKey === 'status'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in filteredAndSortedHistory" :key="record._id">
                  <td>{{ record.userName }}</td>
                  <td>{{ formatDate(record.borrowDate) }}</td>
                  <td>{{ formatDate(record.dueDate) }}</td>
                  <td>
                    <span v-if="record.returnDate">{{ formatDate(record.returnDate) }}</span>
                    <span v-else class="text-warning fst-italic">Not returned</span>
                  </td>
                  <td>
                    {{ record.returnDate ? 'Returned' : 'Borrowed' }}
                  </td>
                </tr>
                <tr v-if="filteredAndSortedHistory.length === 0">
                  <td colspan="5" class="text-center text-muted">No records found.</td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <nav aria-label="Borrow history pagination" class="mt-3">
              <ul class="pagination justify-content-center mb-0">
                <li
                  :class="['page-item', { disabled: historyPage === 1 }]"
                  @click="goToPage(historyPage - 1)"
                  style="cursor: pointer;"
                >
                  <span class="page-link">Previous</span>
                </li>
                <li
                  v-for="pageNum in historyTotalPages"
                  :key="pageNum"
                  :class="['page-item', { active: historyPage === pageNum }]"
                  @click="goToPage(pageNum)"
                  style="cursor: pointer;"
                >
                  <span class="page-link">{{ pageNum }}</span>
                </li>
                <li
                  :class="['page-item', { disabled: historyPage === historyTotalPages }]"
                  @click="goToPage(historyPage + 1)"
                  style="cursor: pointer;"
                >
                  <span class="page-link">Next</span>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <!-- Related books (below) -->
      <div v-if="relatedBooks && relatedBooks.length > 0" class="related-books">
        <h3 class="mb-4">More in {{ book.category || 'this category' }}</h3>
        <div class="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
          <div
            v-for="relatedBook in relatedBooks"
            :key="relatedBook._id"
            class="col"
            @click="goToBook(relatedBook._id)"
            style="cursor: pointer;"
          >
            <div class="card h-100 related-book-card">
              <img
                :src="relatedBook.coverImage || 'https://picsum.photos/id/237/300/180'"
                class="card-img-top"
                :alt="relatedBook.title"
                style="height: 200px; object-fit: cover;"
                @error="handleImageError"
              />
              <div class="card-body">
                <h5 class="card-title">{{ relatedBook.title }}</h5>
                <p class="card-text text-muted"><small>by {{ relatedBook.author }}</small></p>
              </div>
              <div class="card-footer bg-transparent">
                <span v-if="relatedBook.category" class="badge bg-info text-dark">{{ relatedBook.category }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const book = ref({});
const relatedBooks = ref([]);
const loading = ref(true);
const user = ref(null);
const borrowing = ref(null);
const deleting = ref(false);

const borrowHistory = ref([]);
const loadingHistory = ref(false);
const historyPage = ref(1);
const historyTotalPages = ref(1);

const searchTerm = ref('');
const sortKey = ref('borrowDate');
const sortOrder = ref('desc'); // 'asc' or 'desc'

function sortTable(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
}

const filteredAndSortedHistory = computed(() => {
  let filtered = borrowHistory.value.filter((record) => {
    if (!searchTerm.value) return true;
    const term = searchTerm.value.toLowerCase();
    return (
      (record.userName && record.userName.toLowerCase().includes(term)) ||
      (record.returnDate ? 'returned' : 'borrowed').includes(term)
    );
  });

  filtered.sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];

    if (['borrowDate', 'dueDate', 'returnDate'].includes(sortKey.value)) {
      valA = valA ? new Date(valA) : null;
      valB = valB ? new Date(valB) : null;
    }

    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });

  return filtered;
});

const fetchBookDetails = async () => {
  loading.value = true;
  try {
    const bookId = route.params.id;
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch book info
    const resBook = await fetch(`/api/books/${bookId}`, { headers });
    if (!resBook.ok) throw new Error('Failed to fetch book details');
    book.value = await resBook.json();

    // Fetch related books by category
    if (book.value.category) {
      const resRelated = await fetch(
        `/api/books?category=${encodeURIComponent(book.value.category)}&page=1&perPage=5`,
        { headers }
      );
      if (resRelated.ok) {
        const data = await resRelated.json();
        relatedBooks.value = data.data.filter(b => b._id !== book.value._id);
      }
    }

    // Fetch current user's active borrowing record (if any)
    if (user.value) {
      const borrowStatusRes = await fetch(`/api/books/${bookId}/borrow-status`, { headers });
      if (borrowStatusRes.ok) {
        borrowing.value = await borrowStatusRes.json();
      } else {
        borrowing.value = null;
      }
    }

    // If admin, fetch borrow history
    if (user.value?.role === 'admin') {
      await fetchBorrowHistory(1);
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleImageError = event => {
  event.target.src = 'https://picsum.photos/id/237/400/400';
};

const formatDate = dateString => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const goToBook = id => {
  router.push(`/book/detail/${id}`);
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
  // stay on page
};

const borrowBook = async () => {
  if (!user.value) {
    alert('Please login to borrow this book.');
    return;
  }
  try {
    const res = await fetch(`/api/books/${book.value._id}/borrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      alert(`Error: ${errText || 'Failed to borrow book'}`);
      console.error('Borrow response error:', errText);
      return;
    }
    borrowing.value = await res.json();
  } catch (e) {
    alert('Unexpected error borrowing book');
    console.error(e);
  }
};

const returnBook = async () => {
  try {
    const res = await fetch(`/api/books/${book.value._id}/return`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({})
    });
    if (!res.ok) {
      const errData = await res.json();
      alert(`Error: ${errData.message || 'Failed to return book'}`);
      return;
    }
    borrowing.value = null;
  } catch (e) {
    alert('Unexpected error returning book');
    console.error(e);
  }
};

const fetchBorrowHistory = async (page = 1) => {
  if (!user.value || user.value.role !== 'admin') return;

  loadingHistory.value = true;
  try {
    const bookId = route.params.id;
    const res = await fetch(`/api/books/${bookId}/borrow-history?page=${page}&limit=5`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) throw new Error('Failed to fetch borrow history');
    const data = await res.json();
    borrowHistory.value = data.data;
    historyPage.value = data.pagination.page;
    historyTotalPages.value = data.pagination.totalPages;
  } catch (err) {
    console.error(err);
  } finally {
    loadingHistory.value = false;
  }
};

const goToPage = async (page) => {
  if (page < 1 || page > historyTotalPages.value) return;
  await fetchBorrowHistory(page);
};

// Delete Book
const deleteBook = async () => {
  if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
    return;
  }
  try {
    deleting.value = true;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/books/${book.value._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const errData = await res.json();
      alert(`Failed to delete book: ${errData.error?.message || res.statusText}`);
      deleting.value = false;
      return;
    }
    alert('Book deleted successfully.');
    router.push('/books');
  } catch (error) {
    alert('An error occurred while deleting the book.');
    console.error(error);
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) user.value = JSON.parse(storedUser);

  fetchBookDetails();
});
</script>

<style scoped>
.related-books {
  margin-top: 40px;
}

.related-book-card {
  transition: transform 0.2s;
  height: 100%;
}
.related-book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.book-cover {
  height: 400px;
  object-fit: cover;
}
</style>
