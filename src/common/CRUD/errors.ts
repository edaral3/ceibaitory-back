const existValueError = (value: string): string => {
  let message = ''
  switch (value) {
    case 'barcode':
      message = 'El codigo de barras ya existe, ingrese otro codigo de barras'
      break
    case 'name':
      message = 'El nombre ya existe, ingrese otro nombre'
      break
  }
  return message
}

export { existValueError }
