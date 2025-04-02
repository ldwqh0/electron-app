<template>
  <input ref="fileInput"
         :accept="props.accept"
         :multiple="props.multiple"
         class="file"
         type="file"
         @change="onFileChange">
  <span class="upload-button" @click="triggerFileSelect">
    <slot name="default">
      <span>点击上传</span>
    </slot>
  </span>
  <slot v-if="props.showProgress" :items="tasks" name="list">
    <div v-for="t in tasks" :key="t.id" class="task-list">
      <div class="task-item">
        {{ t.file.name }} - {{ t.progress }}
      </div>
    </div>
  </slot>
</template>

<script lang="ts" setup>
  import TaskExecutor from './TaskExecutor'
  import { Status, Task } from './Task'
  import axios, { AxiosInstance } from 'axios'
  import { reactive, ref } from 'vue'

  type FilterFunction = (file: File) => boolean

  const fileInput = ref<HTMLInputElement | null>(null)
  const emit = defineEmits(['completed', 'change', 'item-progress', 'item-complete', 'item-success', 'item-error', 'item-cancel', 'item-add'])

  const tasks = reactive<Task[]>([])

  const props = withDefaults(defineProps<{
    accept?: string
    autoUpload?: boolean
    multiple?: boolean
    url: string
    maxThreads?: number
    filter?: RegExp | FilterFunction
    chunkSize?: number
    showProgress?: boolean
    // eslint-disable-next-line
  http?: AxiosInstance | Function
    params?: Record<string, string>
  }>(), {
    accept: '*',
    autoUpload: false,
    multiple: false,
    maxThreads: 3,
    chunkSize: 0,
    showProgress: true,
    params: () => ({}),
    http: () => axios.create(),
    filter () { return () => true }
  })
  const taskExecutor = new TaskExecutor({ maxThread: props.maxThreads })
  taskExecutor.onComplete = () => emit('completed')

  function uploadAll (): void {
    tasks.filter(it => it.state === Status.new).forEach(task => {
      taskExecutor.post(task)
    })
  }

  function removeItem (task: Task): void {
    for (const i in tasks) {
      // TODO 这里要处理
      if (tasks[i] === task) {
        tasks.splice(Number(i), 1)
        emit('change', tasks)
        return
      }
    }
  }

  function cancelAll (): void {
    tasks.forEach(it => it.cancel('用户取消操作'))
  }

  function triggerFileSelect (): void {
    fileInput.value?.click()
  }

  function doFilter (file: File): boolean {
    if (props.filter instanceof RegExp) {
      return props.filter.test(file.name)
    } else if (props.filter instanceof Function) {
      return props.filter(file)
    } else {
      return false
    }
  }

  function onFileChange (e: Event): void {
    const fileInput: HTMLInputElement | undefined | null = e?.target as HTMLInputElement | undefined | null
    const files = fileInput?.files ?? []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (doFilter(file)) { // 校验文件是否符合规则，如果符合规则，添加到文件列表，如果不符合，不添加
        const task = new Task({
          file,
          url: props.url,
          params: props.params,
          chunkSize: props.chunkSize,
          http: props.http as AxiosInstance,
          onProgress (progress) {
            emit('item-progress', task, progress)
          },
          onComplete () {
            emit('item-complete', task)
          },
          onSuccess (response) {
            emit('item-success', task, response)
          },
          onError (e) {
            emit('item-error', task, e)
          },
          onCancel () {
            removeItem(task)
            emit('item-cancel', task)
          }
        })
        const length = tasks.push(task)
        const t2 = tasks[length - 1]
        emit('item-add', task)
        if (props.autoUpload) {
          taskExecutor.post(t2)
        } else {
        // task.uploadItem = () => this.taskExecutor.post(task)
        }
      }
    }
    if (fileInput) {
      fileInput.value = ''
    }
    emit('change', tasks)
  }

  defineExpose({
    uploadAll,
    cancelAll
  })
</script>
<style lang="less" scoped>
.file {
  width: 0;
  height: 0;
  padding: 0;
  margin: 0;
  float: right;
}

.upload-button {
  cursor: pointer;
}
</style>
