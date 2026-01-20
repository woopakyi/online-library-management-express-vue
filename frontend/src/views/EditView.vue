<template>
  <div>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
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
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Home</router-link>
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

    <div class="container mx-3">
      <!-- Success/Error Alerts -->
      <div v-if="success" class="alert alert-success alert-dismissible fade show mt-3" role="alert">
        Book updated successfully!
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
      <div v-if="error" class="alert alert-danger alert-dismissible fade show mt-3" role="alert">
        {{ error }}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>

      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mt-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/books">Books</router-link></li>
          <li class="breadcrumb-item">
            <router-link :to="`/book/detail/${book._id}`">{{ book.title }}</router-link>
          </li>
          <li class="breadcrumb-item active" aria-current="page">Edit</li>
        </ol>
      </nav>

      <!-- Form -->
      <form @submit.prevent="submitForm">
        <!-- Title (left) and Location (right) -->
        <div class="row form-gap">
          <div class="col-md-8">
            <label for="title" class="form-label">Title</label>
            <input type="text" class="form-control" id="title" v-model="book.title" required />
          </div>
          <div class="col-md-4">
            <label for="location" class="form-label">Location</label>
            <select class="form-select" id="location" v-model="book.location" required>
              <option value="">Select location</option>
              <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
            </select>
          </div>
        </div>

        <!-- Description (full width) -->
        <div class="form-gap">
          <label for="description" class="form-label">Description</label>
          <textarea class="form-control" id="description" v-model="book.description" rows="3" required></textarea>
        </div>

        <!-- ISBN (left), Author (middle), Year (right) -->
        <div class="row form-gap">
          <div class="col-md-4">
            <label for="isbn" class="form-label">ISBN</label>
            <input
              type="text"
              class="form-control"
              id="isbn"
              v-model="book.isbn"
              :class="{ 'is-invalid': isbnError }"
              @input="clearIsbnError"
              @blur="async () => {
                const unique = await checkIsbn();
                if (!unique) {
                  isbnError = true;
                  error = 'A book with this ISBN already exists';
                } else {
                  isbnError = false;
                  error = '';
                }
              }"
              required
            />
            <div class="invalid-feedback" v-if="isbnError">A book with this ISBN already exists.</div>
          </div>
          <div class="col-md-4">
            <label for="author" class="form-label">Author</label>
            <input type="text" class="form-control" id="author" v-model="book.author" required />
          </div>
          <div class="col-md-4">
            <label for="year" class="form-label">Year</label>
            <input type="number" class="form-control" id="year" v-model="book.year" min="1000" max="3000" required />
          </div>
        </div>

        <!-- Cover URL (left), Publisher (middle), Category (right) -->
        <div class="row form-gap">
          <div class="col-md-4">
            <label for="coverImage" class="form-label">Cover Image (URL or base64)</label>
            <input type="text" class="form-control" id="coverImage" v-model="book.coverImage" required />
            <img
              :src="book.coverImage"
              alt="Cover Preview"
              class="img-thumbnail mt-2"
              v-if="book.coverImage"
              style="max-width: 200px; max-height: 300px;"
            />
          </div>
          <div class="col-md-4">
            <label for="publisher" class="form-label">Publisher</label>
            <input type="text" class="form-control" id="publisher" v-model="book.publisher" required />
          </div>
          <div class="col-md-4">
            <label for="category" class="form-label">Category</label>
            <select class="form-select" id="category" v-model="book.category" required>
              <option value="">Select category</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
        </div>

        <!-- View Count (hidden) and Highlight checkbox -->
        <input type="hidden" v-model="book.viewCount" />

        <div class="form-check mb-4">
          <input class="form-check-input" type="checkbox" id="isHighlighted" v-model="book.isHighlighted" />
          <label class="form-check-label" for="isHighlighted"> Highlight</label>
        </div>

        <!-- Form Actions -->
        <div class="d-flex justify-content-between">
          <div>
            <button type="submit" class="btn btn-primary me-2" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Save Changes
            </button>
            <router-link :to="`/book/detail/${book._id}`" class="btn btn-outline-secondary">Cancel</router-link>
          </div>
          <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="loading">
            Delete Book
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const user = ref(null);
const loading = ref(false);
const success = ref(false);
const error = ref("");
const isbnError = ref(false);
const originalIsbn = ref("");

// Book data reactive
const book = ref({
  _id: "",
  title: "",
  location: "",
  description: "",
  isbn: "",
  author: "",
  year: "",
  coverImage: "https://picsum.photos/id/237/200/300",
  publisher: "",
  category: "",
  isHighlighted: false,
  viewCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const categories = ref([
  "Science",
  "Technology",
  "Engineering",
  "Mathematics",
  "Arts",
  "Literature",
  "History",
  "Geography",
  "Philosophy",
  "Psychology",
  "Sociology",
  "Economics",
  "Business",
  "Law",
  "Medicine",
  "Health",
  "Education",
  "Politics",
  "Religion",
  "Environment",
]);

const locations = ref([
  "Shelf A1",
  "Shelf A2",
  "Shelf A3",
  "Shelf B1",
  "Shelf B2",
  "Shelf B3",
  "Shelf C1",
  "Shelf C2",
  "Shelf C3",
]);

// Route guard & load user on mount
onMounted(async () => {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.replace("/");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "admin") {
      router.replace("/");
      return;
    }

    user.value = parsedUser;

    // Load book data
    loading.value = true;
    const response = await fetch(`/api/books/${route.params.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch book");
    book.value = await response.json();
    originalIsbn.value = book.value.isbn;
  } catch (err) {
    error.value = err.message || "Error on load";
  } finally {
    loading.value = false;
  }
});

const clearIsbnError = () => {
  isbnError.value = false;
};

const checkIsbn = async () => {
  if (!book.value.isbn) return true;
  try {
    const response = await fetch(
      `/api/books/check-isbn?isbn=${encodeURIComponent(book.value.isbn)}&excludeId=${book.value._id}`
    );
    if (!response.ok) throw new Error("Failed to check ISBN");
    const data = await response.json();
    return !data.exists;
  } catch (err) {
    console.error("ISBN check error:", err);
    return true; // fallback to server validation
  }
};

const submitForm = async () => {
  try {
    loading.value = true;
    error.value = "";
    isbnError.value = false;

    if (book.value.isbn !== originalIsbn.value) {
      const isbnValid = await checkIsbn();
      if (!isbnValid) {
        isbnError.value = true;
        loading.value = false;
        return;
      }
    }

    const updateData = {
      title: book.value.title,
      description: book.value.description,
      coverImage: book.value.coverImage,
      author: book.value.author,
      isbn: book.value.isbn,
      publisher: book.value.publisher,
      year: book.value.year,
      category: book.value.category,
      location: book.value.location,
      isHighlighted: book.value.isHighlighted,
      viewCount: book.value.viewCount,
      updatedAt: new Date(),
    };

    const response = await fetch(`/api/books/${book.value._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to update book");
    }

    // Indicate success to user and redirect
    success.value = true;
    setTimeout(() => {
      router.push(`/book/detail/${book.value._id}?success=true`);
    }, 1500);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const confirmDelete = () => {
  if (confirm("Are you sure you want to permanently delete this book?")) {
    deleteBook();
  }
};

const deleteBook = async () => {
  try {
    loading.value = true;
    const response = await fetch(`/api/books/${book.value._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to delete book");
    }

    // Redirect back to books listing with a deleted flag
    router.push("/books?deleted=true");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const logout = async () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
      });
    } catch (err) {
      console.error("Logout API error:", err);
    }
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  user.value = null;
  router.push("/login");
};
</script>

<style scoped>
.form-gap {
  margin-bottom: 1rem;
}

.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  display: block;
  margin-top: 0.25rem;
}

.loading-spinner {
  display: inline-block;
  margin-right: 0.5rem;
}
</style>