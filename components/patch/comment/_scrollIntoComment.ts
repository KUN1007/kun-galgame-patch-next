export const scrollIntoComment = (id: number | null) => {
  if (id === null) {
    return
  }

  const targetComment = document.getElementById(`comment-${id}`)
  if (targetComment) {
    targetComment.scrollIntoView({ behavior: 'smooth', block: 'center' })
    targetComment.classList.add('bg-default-100')
    targetComment.classList.add('px-2')
    setTimeout(() => {
      targetComment.classList.remove('bg-default-100')
      targetComment.classList.remove('px-2')
    }, 2000)
  }
}
