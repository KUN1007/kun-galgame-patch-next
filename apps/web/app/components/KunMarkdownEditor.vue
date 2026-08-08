<script setup lang="ts">
import type { KunToolbarItem } from '@kungal/editor-vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    image?: boolean
    locale?: string
    placeholder?: string
  }>(),
  { image: true, locale: 'zh-cn', placeholder: '' }
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const adapters = useKunEditorAdapters({ image: props.image })

const onUpdate = (value: string) => emit('update:modelValue', value)

const editorViews: ('wysiwyg' | 'source')[] = ['wysiwyg', 'source']

const toolbarItems: KunToolbarItem[] = [
  'heading',
  '|',
  'bold',
  'italic',
  'strike',
  'code',
  'link',
  '|',
  'bulletList',
  'orderedList',
  'quote',
  'codeBlock',
  'hr',
  '|',
  'spoiler',
  '|',
  'picker'
]
</script>

<template>
  <KunEditor
    :model-value="modelValue"
    :adapters="adapters"
    :locale="locale"
    :placeholder="placeholder"
    :views="editorViews"
    @update:model-value="onUpdate"
  >
    <template #view-switch="s">
      <KunEditorViewSwitch v-bind="s" />
    </template>
    <template #toolbar="api">
      <div class="flex flex-wrap items-center gap-0.5">
        <KunEditorToolbar v-bind="api" :items="toolbarItems" />
        <template v-if="api.adapters.uploadImage">
          <span class="bg-default-200 mx-1 h-5 w-px" aria-hidden="true" />
          <KunMarkdownImageDialog :api="api" :upload="api.adapters.uploadImage!" />
        </template>
      </div>
    </template>
  </KunEditor>
</template>
