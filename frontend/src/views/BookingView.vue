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
            <li class="nav-item"><router-link class="nav-link" to="/">Home</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/books">Books</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/search">Search</router-link></li>

            <li v-if="user && user.role === 'admin'" class="nav-item">
              <router-link class="nav-link" to="/book/add">Add Book</router-link>
            </li>
            <li v-if="user && user.role === 'admin'" class="nav-item">
              <router-link class="nav-link" to="/admin/users">User Management</router-link>
            </li>
          </ul>

          <ul class="navbar-nav ms-auto align-items-center">
            <li v-if="!user" class="nav-item">
              <router-link class="btn btn-primary" to="/login">Sign In</router-link>
            </li>
            <li v-else class="nav-item d-flex align-items-center">
              <span class="navbar-text me-3">{{ user.firstName }} {{ user.lastName }}</span>
              <button @click="logout" class="btn btn-outline-danger btn-sm">Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="container mx-3">
      <!-- Success Message -->
      <div
        v-if="successMessage"
        class="alert alert-success alert-dismissible fade show mt-3"
        role="alert"
      >
        {{ successMessage }}
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="alert"
          aria-label="Close"
          @click="successMessage = ''"
        ></button>
      </div>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="alert alert-danger alert-dismissible fade show mt-3"
        role="alert"
      >
        {{ errorMessage }}
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="alert"
          aria-label="Close"
          @click="errorMessage = ''"
        ></button>
      </div>

      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="my-3">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/books">Books</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Add New Book</li>
        </ol>
      </nav>

      <!-- Form -->
      <form @submit.prevent="submitBook">
        <!-- Title and Location -->
        <div class="row form-gap">
          <div class="col-md-8">
            <label for="title" class="form-label">Title</label>
            <input
              type="text"
              id="title"
              class="form-control"
              v-model="book.title"
              required
            />
          </div>
          <div class="col-md-4">
            <label for="location" class="form-label">Location</label>
            <select id="location" class="form-select" v-model="book.location" required>
              <option value="">Select location</option>
              <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
            </select>
          </div>
        </div>

        <!-- Description -->
        <div class="form-gap">
          <label for="description" class="form-label">Description</label>
          <textarea
            id="description"
            class="form-control"
            rows="3"
            v-model="book.description"
            required
          ></textarea>
        </div>

        <!-- ISBN, Author, Year -->
        <div class="row form-gap">
          <div class="col-md-4">
            <label for="isbn" class="form-label">ISBN</label>
            <input
              type="text"
              id="isbn"
              class="form-control"
              v-model="book.isbn"
              :class="{ 'is-invalid': isbnError }"
              @input="clearIsbnError"
              @blur="onBlurIsbnCheck"
              required
            />
            <div class="invalid-feedback" v-if="isbnError">
              A book with this ISBN already exists.
            </div>
          </div>
          <div class="col-md-4">
            <label for="author" class="form-label">Author</label>
            <input
              type="text"
              id="author"
              class="form-control"
              v-model="book.author"
              required
            />
          </div>
          <div class="col-md-4">
            <label for="year" class="form-label">Year</label>
            <input
              type="number"
              id="year"
              class="form-control"
              v-model="book.year"
              min="1000"
              max="3000"
              required
            />
          </div>
        </div>

        <!-- Cover Image, Publisher, Category -->
        <div class="row form-gap">
          <div class="col-md-4">
            <label for="coverImage" class="form-label">Cover Image URL</label>
            <input
              type="text"
              id="coverImage"
              class="form-control"
              v-model="book.coverImage"
              required
            />
            <img
              v-if="book.coverImage"
              :src="book.coverImage"
              alt="Cover Preview"
              class="img-thumbnail mt-2"
              style="max-width: 200px; max-height: 300px;"
            />
          </div>
          <div class="col-md-4">
            <label for="publisher" class="form-label">Publisher</label>
            <input
              type="text"
              id="publisher"
              class="form-control"
              v-model="book.publisher"
              required
            />
          </div>
          <div class="col-md-4">
            <label for="category" class="form-label">Category</label>
            <select
              id="category"
              class="form-select"
              v-model="book.category"
              required
            >
              <option value="">Select category</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
        </div>

        <!-- Hidden View Count and Highlighted checkbox -->
        <input type="hidden" v-model="book.viewCount" />

        <div class="form-check mb-4">
          <input
            type="checkbox"
            id="isHighlighted"
            class="form-check-input"
            v-model="book.isHighlighted"
          />
          <label class="form-check-label" for="isHighlighted">Highlighted Book</label>
        </div>

        <!-- Buttons -->
        <div class="d-flex justify-content-between">
          <div>
            <button :disabled="loading" type="submit" class="btn btn-primary me-2">
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              Save Book
            </button>
            <router-link to="/books" class="btn btn-outline-secondary">Cancel</router-link>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const user = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const isbnError = ref(false);

const book = ref({
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

const clearIsbnError = () => {
  isbnError.value = false;
  errorMessage.value = "";
};

const checkIsbn = async () => {
  if (!book.value.isbn) return true;

  try {
    const response = await fetch(
      `/api/books/check-isbn?isbn=${encodeURIComponent(book.value.isbn)}`
    );
    if (!response.ok) throw new Error("Failed to check ISBN");
    const data = await response.json();
    return !data.exists;
  } catch (error) {
    console.error("ISBN check error:", error);
    return true; // fallback to server validation
  }
};

// Called on blur event for ISBN input
const onBlurIsbnCheck = async () => {
  const unique = await checkIsbn();
  if (!unique) {
    isbnError.value = true;
    errorMessage.value = "A book with this ISBN already exists";
  } else {
    isbnError.value = false;
    errorMessage.value = "";
  }
};

const submitBook = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  isbnError.value = false;

  if (!book.value.title.trim() || !book.value.author.trim()) {
    errorMessage.value = "Title and author are required";
    return;
  }

  if (!book.value.isbn.trim()) {
    errorMessage.value = "ISBN is required";
    return;
  }

  loading.value = true;

  try {
    const isbnUnique = await checkIsbn();
    if (!isbnUnique) {
      isbnError.value = true;
      errorMessage.value = "A book with this ISBN already exists";
      loading.value = false;
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch("/api/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(book.value),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to create book");
    }

    const data = await response.json();
    successMessage.value = "Book created successfully! Redirecting...";

    setTimeout(() => {
      router.push(`/book/detail/${data._id}?success=true`);
    }, 1500);
  } catch (error) {
    errorMessage.value = error.message || "An error occurred while processing your request";
    console.error(error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
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
  } catch {
    router.replace("/");
  }
});

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