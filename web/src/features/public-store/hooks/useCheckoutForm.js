import { useState } from 'react'
import { publicStoreApi } from '../api/publicStoreApi'
import { normalizePhone } from '../utils/normalizePhone'

export function useCheckoutForm({ cart, onSuccess }) {
  const [values, setValues] = useState({ name: '', phone: '', note: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const setField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    const normalizedPhone = normalizePhone(values.phone)
    if (values.name.trim().length < 2) nextErrors.name = 'Nama minimal 2 karakter.'
    if (!normalizedPhone || normalizedPhone.length < 9) nextErrors.phone = 'Nomor WhatsApp wajib angka dan valid.'
    setErrors(nextErrors)
    return { ok: Object.keys(nextErrors).length === 0, normalizedPhone }
  }

  const submit = async () => {
    setSubmitError('')
    const result = validate()
    if (!result.ok) return null
    if (!cart?.items?.length) {
      setSubmitError('Keranjang masih kosong.')
      return null
    }

    setSubmitting(true)
    try {
      const checkout = await publicStoreApi.checkout({
        customer: {
          name: values.name.trim(),
          phone: result.normalizedPhone,
          note: values.note.trim(),
        },
        cart,
      })
      onSuccess?.(checkout)
      return checkout
    } catch {
      setSubmitError('Checkout gagal dibuat. Coba lagi.')
      return null
    } finally {
      setSubmitting(false)
    }
  }

  return { values, setField, errors, submitting, submitError, submit }
}
