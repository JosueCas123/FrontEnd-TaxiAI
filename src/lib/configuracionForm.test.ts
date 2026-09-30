import { describe, expect, it } from 'vitest'
import type { Configuracion } from '../api/types'
import {
  analizarRadio,
  construirPayload,
  esquemaConfiguracion,
  LIMITE_RADIO,
  TELEFONO_FICTICIO,
  tieneEdiciones,
  valoresDesdeConfiguracion,
  type ValoresFormulario,
} from './configuracionForm'

const BASE: Configuracion = {
  id: 1,
  nombreEmpresa: 'Taxi Sur',
  radioMaximoBusquedaKm: 5,
  telefonoCentroAtencion: '+59112345678',
  actualizadoEn: '2026-09-29T12:00:00.000Z',
}

const NOMBRE_100 = 'A'.repeat(100)
const NOMBRE_101 = 'A'.repeat(101)
const TELEFONO_30 = `+5914${'7'.repeat(25)}`
const TELEFONO_31 = `${TELEFONO_30}k`

function editados(cambios: Partial<ValoresFormulario> = {}): ValoresFormulario {
  return {
    nombreEmpresa: BASE.nombreEmpresa,
    radioMaximoBusquedaKm: String(BASE.radioMaximoBusquedaKm),
    telefonoCentroAtencion: BASE.telefonoCentroAtencion ?? '',
    ...cambios,
  }
}

function validar(valores: ValoresFormulario) {
  return esquemaConfiguracion.safeParse(valores)
}

describe('analizarRadio', () => {
  it.each([
    ['1', 1],
    ['5', 5],
    [String(LIMITE_RADIO), LIMITE_RADIO],
    ['  7  ', 7],
    ['5.0', 5],
    ['1e3', 1000],
  ])('acepta %j como %i', (texto, esperado) => {
    expect(analizarRadio(texto)).toBe(esperado)
  })

  it.each([
    ['vacio', ''],
    ['solo espacios', '   '],
    ['no numerico', 'cinco'],
    ['letras mezcladas', '5 km'],
    ['cero', '0'],
    ['negativo', '-1'],
    ['fraccion', '5.5'],
    ['coma decimal', '5,5'],
    ['hexadecimal', '0x10'],
    ['sobre el limite', String(LIMITE_RADIO + 1)],
    ['infinito', '1e400'],
    ['prefijo', 'km5'],
  ])('rechaza radio %s', (_caso, texto) => {
    expect(analizarRadio(texto)).toBeNull()
  })
})

describe('esquemaConfiguracion', () => {
  it('acepta los limites exactos del contrato', () => {
    const resultado = validar(editados({ nombreEmpresa: NOMBRE_100, telefonoCentroAtencion: TELEFONO_30, radioMaximoBusquedaKm: String(LIMITE_RADIO) }))
    expect(resultado.success).toBe(true)
  })

  it('recorta antes de medir y entrega valores normalizados', () => {
    const resultado = validar(editados({ nombreEmpresa: '  Taxi Sur  ', telefonoCentroAtencion: '  +59112345678  ' }))
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.nombreEmpresa).toBe('Taxi Sur')
      expect(resultado.data.telefonoCentroAtencion).toBe('+59112345678')
    }
  })

  it.each(['', '   ', '\t\n'])('rechaza nombre de solo espacios %j', (nombre) => {
    const resultado = validar(editados({ nombreEmpresa: nombre }))
    expect(resultado.success).toBe(false)
    if (!resultado.success) expect(resultado.error.issues[0].path).toEqual(['nombreEmpresa'])
  })

  it('rechaza nombre de 101 caracteres', () => {
    expect(validar(editados({ nombreEmpresa: NOMBRE_101 })).success).toBe(false)
  })

  it.each(['', '   ', 'abc', '0', '-3', '2.5', String(LIMITE_RADIO + 1)])(
    'rechaza radio %j',
    (radio) => {
      const resultado = validar(editados({ radioMaximoBusquedaKm: radio }))
      expect(resultado.success).toBe(false)
      if (!resultado.success) expect(resultado.error.issues[0].path).toEqual(['radioMaximoBusquedaKm'])
    },
  )

  it('rechaza el radio de solo espacios con el mensaje de rango', () => {
    const resultado = validar(editados({ radioMaximoBusquedaKm: '  ' }))
    expect(resultado.success).toBe(false)
    if (!resultado.success) expect(resultado.error.issues[0].message).toContain('kilómetros')
  })

  it('acepta el telefono vacio y solo rechaza el exceso de 30 caracteres', () => {
    expect(validar(editados({ telefonoCentroAtencion: '' })).success).toBe(true)
    expect(validar(editados({ telefonoCentroAtencion: '   ' })).success).toBe(true)
    expect(validar(editados({ telefonoCentroAtencion: TELEFONO_31 })).success).toBe(false)
  })

  it('no exige E.164: cualquier texto de hasta 30 caracteres es valido', () => {
    expect(validar(editados({ telefonoCentroAtencion: '4 664 2020 int 12' })).success).toBe(true)
    expect(TELEFONO_30).toHaveLength(30)
  })
})

describe('valoresDesdeConfiguracion', () => {
  it('presenta un telefono null como input vacio', () => {
    expect(valoresDesdeConfiguracion({ ...BASE, telefonoCentroAtencion: null }).telefonoCentroAtencion).toBe('')
  })

  it('carga los cinco campos del DTO sin inventar nombre ni radio', () => {
    const valores = valoresDesdeConfiguracion(BASE)
    expect(valores).toEqual({
      nombreEmpresa: 'Taxi Sur',
      radioMaximoBusquedaKm: '5',
      telefonoCentroAtencion: '+59112345678',
    })
  })

  it('conserva un nombre de 100 caracteres y un radio grande sin deformarlos', () => {
    const valores = valoresDesdeConfiguracion({
      ...BASE,
      nombreEmpresa: NOMBRE_100,
      radioMaximoBusquedaKm: LIMITE_RADIO,
    })
    expect(valores.nombreEmpresa).toBe(NOMBRE_100)
    expect(validar(valores).success).toBe(true)
  })

  it('no rellena con valores de fabrica cuando el DTO llega incompleto', () => {
    const valores = valoresDesdeConfiguracion({
      ...BASE,
      nombreEmpresa: '',
      radioMaximoBusquedaKm: null as unknown as number,
      telefonoCentroAtencion: null,
    })
    expect(valores).toEqual({ nombreEmpresa: '', radioMaximoBusquedaKm: '', telefonoCentroAtencion: '' })
  })
})

describe('construirPayload', () => {
  it('sin cambios devuelve un cuerpo vacio y nunca un id, fecha o clave ajena', () => {
    const payload = construirPayload(BASE, editados())
    expect(payload).toEqual({})
    expect(Object.keys(payload)).toHaveLength(0)
  })

  it('reproduce el ejemplo documentado: solo radio y limpieza de telefono', () => {
    const payload = construirPayload(
      BASE,
      editados({ nombreEmpresa: ' Taxi Sur ', radioMaximoBusquedaKm: '8', telefonoCentroAtencion: ' ' }),
    )
    expect(payload).toEqual({ radioMaximoBusquedaKm: 8, telefonoCentroAtencion: null })
    expect(Object.keys(payload).sort()).toEqual(['radioMaximoBusquedaKm', 'telefonoCentroAtencion'])
  })

  it('envia el radio como numero JSON, nunca como string', () => {
    const payload = construirPayload(BASE, editados({ radioMaximoBusquedaKm: '12' }))
    expect(payload.radioMaximoBusquedaKm).toBe(12)
    expect(JSON.stringify(payload)).toBe('{"radioMaximoBusquedaKm":12}')
  })

  it.each([
    ['nombre', { nombreEmpresa: 'Radio Central' }, { nombreEmpresa: 'Radio Central' }],
    ['telefono', { telefonoCentroAtencion: '+591 4 000 0000' }, { telefonoCentroAtencion: '+591 4 000 0000' }],
    ['varios campos', { nombreEmpresa: 'Radio Central', radioMaximoBusquedaKm: '9', telefonoCentroAtencion: ' 777 ' }, { nombreEmpresa: 'Radio Central', radioMaximoBusquedaKm: 9, telefonoCentroAtencion: '777' }],
  ])('campo aislado o combinado: %s', (_caso, cambios, esperado) => {
    expect(construirPayload(BASE, editados(cambios))).toEqual(esperado)
  })

  it('limpiar un telefono existente envia null; no editarlo omite la clave', () => {
    expect(construirPayload(BASE, editados({ telefonoCentroAtencion: '' }))).toEqual({
      telefonoCentroAtencion: null,
    })
    expect(construirPayload(BASE, editados({ telefonoCentroAtencion: '   ' }))).toEqual({
      telefonoCentroAtencion: null,
    })
    expect(construirPayload(BASE, editados())).toEqual({})
  })

  it('un telefono null en la base solo se envia si el usuario escribe algo', () => {
    const sinTelefono: Configuracion = { ...BASE, telefonoCentroAtencion: null }
    expect(construirPayload(sinTelefono, editados({ telefonoCentroAtencion: '' }))).toEqual({})
    expect(construirPayload(sinTelefono, editados({ telefonoCentroAtencion: '  ' }))).toEqual({})
    expect(construirPayload(sinTelefono, editados({ telefonoCentroAtencion: ' 59112345678 ' }))).toEqual({
      telefonoCentroAtencion: '59112345678',
    })
  })

  it('los espacios exteriores no generan envio cuando el valor efectivo coincide', () => {
    expect(construirPayload(BASE, editados({ nombreEmpresa: '  Taxi Sur  ' }))).toEqual({})
    expect(construirPayload(BASE, editados({ telefonoCentroAtencion: ' +59112345678 ' }))).toEqual({})
    expect(construirPayload(BASE, editados({ radioMaximoBusquedaKm: ' 5 ' }))).toEqual({})
  })

  it('un campo no editado no se envia aunque la base tenga espacios que recortar', () => {
    const baseConEspacios: Configuracion = { ...BASE, nombreEmpresa: 'Taxi Sur ' }
    const payload = construirPayload(baseConEspacios, editados({ radioMaximoBusquedaKm: '7' }))
    expect(payload).toEqual({ radioMaximoBusquedaKm: 7 })
  })

  it('un radio todavia invalido no viaja en el payload', () => {
    expect(construirPayload(BASE, editados({ radioMaximoBusquedaKm: '' }))).toEqual({})
    expect(construirPayload(BASE, editados({ radioMaximoBusquedaKm: 'abc' }))).toEqual({})
    expect(construirPayload(BASE, editados({ radioMaximoBusquedaKm: '-2' }))).toEqual({})
  })

  it('un nombre de solo espacios no genera un envio invalido', () => {
    expect(construirPayload(BASE, editados({ nombreEmpresa: '    ' }))).toEqual({})
    expect(construirPayload(BASE, editados({ nombreEmpresa: '' }))).toEqual({})
  })

  it('el payload nunca incluye id, actualizadoEn ni claves desconocidas', () => {
    const payload = construirPayload(
      BASE,
      editados({ nombreEmpresa: 'Otro', radioMaximoBusquedaKm: '3', telefonoCentroAtencion: '9' }),
    )
    for (const clave of Object.keys(payload)) {
      expect(['nombreEmpresa', 'radioMaximoBusquedaKm', 'telefonoCentroAtencion']).toContain(clave)
    }
  })

  it('un cambio externo de cache no arrastra campos que el usuario no edito', () => {
    // El cache pasa a otro nombre mientras el usuario solo edita el radio: la base
    // del inicio de la edicion manda, por eso el nombre no se envia.
    const baseInicial = { ...BASE, nombreEmpresa: 'Taxi Sur' }
    const cacheActualizada: Configuracion = { ...BASE, nombreEmpresa: 'RadioExterno' }
    const payload = construirPayload(baseInicial, editados({ radioMaximoBusquedaKm: '8' }))
    expect(payload).toEqual({ radioMaximoBusquedaKm: 8 })
    expect(cacheActualizada.nombreEmpresa).toBe('RadioExterno')
  })

  it('el telefono ficticio del prototipo se envia como cualquier otro valor', () => {
    expect(construirPayload({ ...BASE, telefonoCentroAtencion: null }, editados({ telefonoCentroAtencion: TELEFONO_FICTICIO }))).toEqual({
      telefonoCentroAtencion: TELEFONO_FICTICIO,
    })
  })
})

describe('tieneEdiciones', () => {
  it('no detecta edicion en el formulario recien cargado', () => {
    expect(tieneEdiciones(BASE, valoresDesdeConfiguracion(BASE))).toBe(false)
  })

  it('ignora solo los espacios exteriores en los tres campos', () => {
    expect(tieneEdiciones(BASE, editados({
      nombreEmpresa: `  ${BASE.nombreEmpresa}  `,
      radioMaximoBusquedaKm: ' 5 ',
      telefonoCentroAtencion: ` ${BASE.telefonoCentroAtencion} `,
    }))).toBe(false)
  })

  it('detecta cada campo editado por separado', () => {
    expect(tieneEdiciones(BASE, editados({ nombreEmpresa: 'Otro' }))).toBe(true)
    expect(tieneEdiciones(BASE, editados({ radioMaximoBusquedaKm: '6' }))).toBe(true)
    expect(tieneEdiciones(BASE, editados({ telefonoCentroAtencion: '' }))).toBe(true)
  })

  it('un valor todavia invalido cuenta como edicion para poder validarlo', () => {
    // Sin esta distincion el boton quedaria deshabilitado y el usuario nunca
    // veria el mensaje de error del campo.
    expect(tieneEdiciones(BASE, editados({ radioMaximoBusquedaKm: '' }))).toBe(true)
    expect(tieneEdiciones(BASE, editados({ radioMaximoBusquedaKm: 'abc' }))).toBe(true)
    expect(tieneEdiciones(BASE, editados({ nombreEmpresa: '     ' }))).toBe(true)
    expect(tieneEdiciones(BASE, editados({ nombreEmpresa: NOMBRE_101 }))).toBe(true)
    expect(tieneEdiciones(BASE, editados({ telefonoCentroAtencion: TELEFONO_31 }))).toBe(true)
  })

  it('el telefono null de la base se compara como vacio', () => {
    const sinTelefono: Configuracion = { ...BASE, telefonoCentroAtencion: null }
    expect(tieneEdiciones(sinTelefono, editados({ telefonoCentroAtencion: '' }))).toBe(false)
    expect(tieneEdiciones(sinTelefono, editados({ telefonoCentroAtencion: '   ' }))).toBe(false)
    expect(tieneEdiciones(sinTelefono, editados({ telefonoCentroAtencion: '+59112345678' }))).toBe(true)
  })

  it('toda edicion detectable se confirma en cambios efectivos o en un error visible', () => {
    const casos: ValoresFormulario[] = [
      editados({ nombreEmpresa: '     ' }),
      editados({ nombreEmpresa: NOMBRE_101 }),
      editados({ radioMaximoBusquedaKm: '' }),
      editados({ radioMaximoBusquedaKm: 'abc' }),
      editados({ radioMaximoBusquedaKm: '0' }),
      editados({ telefonoCentroAtencion: TELEFONO_31 }),
      editados({ telefonoCentroAtencion: '' }),
      editados({ nombreEmpresa: 'Otro' }),
      editados({ radioMaximoBusquedaKm: '6' }),
    ]
    for (const valores of casos) {
      const editable = tieneEdiciones(BASE, valores)
      const efectivo = Object.keys(construirPayload(BASE, valores)).length > 0
      const invalido = !esquemaConfiguracion.safeParse(valores).success
      expect(editable && (efectivo || invalido)).toBe(true)
    }
  })
})
