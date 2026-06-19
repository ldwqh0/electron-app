import { defineStore } from 'pinia'
import { ref } from 'vue'

const useAppStore = defineStore('app', () => {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  function setDimensions (w: number, h: number) {
    width.value = w
    height.value = h
  }

  return {
    width,
    height,
    setDimensions
  }
})

export default useAppStore
