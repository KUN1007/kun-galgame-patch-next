export const toastVariants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.5,
    rotateX: 45
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.4,
      type: 'spring',
      stiffness: 200,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    rotateX: -45,
    transition: {
      duration: 0.3,
      ease: 'anticipate'
    }
  }
}

export const iconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
      delay: 0.2
    }
  }
}

export const textVariants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      delay: 0.2
    }
  }
}
