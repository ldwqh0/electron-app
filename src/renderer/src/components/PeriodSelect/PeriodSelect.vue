<template>
  <div style="display: flex; gap: 8px;">
    <el-select v-model="state.year" placeholder="选择年份" style="width: 120px">
      <el-option v-for="year in yearOptions"
                 :key="year"
                 :label="`${year}年`"
                 :value="year" />
    </el-select>
    <el-select v-model="state.period" placeholder="选择期间" style="width: 120px">
      <el-option v-for="i in 13"
                 :key="i"
                 :label="`${i}`"
                 :value="i" />
    </el-select>
  </div>
</template>

<script lang="ts" setup>
  import { computed, reactive, watch } from 'vue'

  const props = defineProps<{
    modelValue?: string
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: string]
  }>()

  const state = reactive<{
    year: number,
    period: number
  }>({
    year: new Date().getFullYear(),
    period: new Date().getMonth() + 1
  })

  // 解析 modelValue，格式：201201 (年月)
  function init () {
    if (props.modelValue && props.modelValue.length === 6) {
      const year = parseInt(props.modelValue.substring(0, 4))
      const period = parseInt(props.modelValue.substring(4, 6))
      state.year = year
      state.period = period
    }
  }

  // 生成年份选项（2010年到当前年）
  const yearOptions = computed(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: currentYear - 2010 + 1 }, (_, i) => 2010 + i)
  })

  // 监听内部值变化，通知父组件
  watch(state, ({ year, period }) => {
    const yearStr = year.toString()
    const periodStr = period.toString().padStart(2, '0')
    emit('update:modelValue', `${yearStr}${periodStr}`)
  }, {
    deep: true
  })

  init()

  emit('update:modelValue', `${state.year}${state.period.toString().padStart(2, '0')}`)

</script>

<style lang="less" scoped>

</style>
