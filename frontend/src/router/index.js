import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/IndexView.vue')
    },
    {
      path: '/book/add',
      name: 'booking-create',
      component: () => import('../views/BookingView.vue')
    },
    {
      path: '/book/detail/:id',
      name: 'view-booking',
      component: () => import('../views/BookDetailView.vue')
    },
    {
      path: '/book/edit/:id',
      name: 'update-booking',
      component: () => import('../views/EditView.vue')
    },
    {
      path: '/books',
      name: 'view-bookings',
      component: () => import('../views/BookingsView.vue')
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue')
    },
    {
      path: '/login',
      name: 'login',
         component: () => import('../views/LoginView.vue')
    },{
      path: '/users',
      name: 'users',
           component: () => import('../views/UsersView.vue')
    },
    {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue')
  },
  {
  path: '/profile',
  name: 'profile',
  component: () => import('../views/ProfileView.vue'),
  },
  {
  path: '/admin/users',
  name: 'userList',
  component: () => import('../views/UserList.vue'),
  },
  {
  path: '/admin/users/edit/:id',
  name: 'userEdit',
  component: () => import('../views/UserEdit.vue'),
  },
  {
  path: '/admin/users/create',
  name: 'userCreate',
  component: () => import('../views/UserAdd.vue'),
  }
  ]
})

export default router