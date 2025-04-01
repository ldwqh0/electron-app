import { type Router, type RouteRecordRaw } from 'vue-router'

import home from './home'


export interface ModuleOptions {
  router?: Router
}

interface BModule {
  name: string
  routes?: RouteRecordRaw[]
}

export function registryModule (module: BModule, { router }: ModuleOptions): void {
  module.routes?.forEach(it => router?.addRoute(it))
}

export {
  home
}
