export default [{
  path: '/',
  name: 'home',
  component: () => import('./views/Home.vue')
}, {
  path: '/:taskId',
  name: 'details',
  props: true,
  component: () => import('./views/Details.vue')
}]
