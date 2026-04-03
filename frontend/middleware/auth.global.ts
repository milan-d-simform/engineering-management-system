export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  // Hydrate from localStorage on client
  if (import.meta.client) {
    authStore.hydrateFromStorage();
  }

  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(to.path);

  if (!authStore.isAuthenticated && !isPublicRoute) {
    return navigateTo('/login');
  }

  if (authStore.isAuthenticated && isPublicRoute) {
    return navigateTo('/dashboard');
  }
});
