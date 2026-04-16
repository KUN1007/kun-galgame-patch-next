export const dotVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 }
}

export const bellShakeVariants = {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 2
    }
  }
}
