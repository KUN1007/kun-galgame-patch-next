import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Code2,
  Code
} from 'lucide-react'
import {
  toggleStrongCommand,
  toggleEmphasisCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  insertHrCommand,
  createCodeBlockCommand,
  toggleInlineCodeCommand
} from '@milkdown/preset-commonmark'
import { toggleStrikethroughCommand } from '@milkdown/preset-gfm'

export const createButtons = (call: Function) => [
  {
    tooltip: '加粗文本',
    icon: Bold,
    onClick: () => call(toggleStrongCommand.key),
    ariaLabel: '加粗文本'
  },
  {
    tooltip: '斜体',
    icon: Italic,
    onClick: () => call(toggleEmphasisCommand.key),
    ariaLabel: '斜体'
  },
  {
    tooltip: '删除线',
    icon: Strikethrough,
    onClick: () => call(toggleStrikethroughCommand.key),
    ariaLabel: '删除线'
  },
  {
    tooltip: '无序列表',
    icon: List,
    onClick: () => call(wrapInBulletListCommand.key),
    ariaLabel: '无序列表'
  },
  {
    tooltip: '有序列表',
    icon: ListOrdered,
    onClick: () => call(wrapInOrderedListCommand.key),
    ariaLabel: '有序列表'
  },
  {
    tooltip: '引用文本',
    icon: Quote,
    onClick: () => call(wrapInBlockquoteCommand.key),
    ariaLabel: '引用文本'
  },
  {
    tooltip: '水平分割线',
    icon: Minus,
    onClick: () => call(insertHrCommand.key),
    ariaLabel: '水平分割线'
  },
  {
    tooltip: '代码块',
    icon: Code2,
    onClick: () => call(createCodeBlockCommand.key, 'javascript'),
    ariaLabel: '代码块'
  },
  {
    tooltip: '行内代码',
    icon: Code,
    onClick: () => call(toggleInlineCodeCommand.key),
    ariaLabel: '行内代码'
  }
]
