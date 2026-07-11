import { useCallback, useState } from 'react'
import { phase5ApiClient } from '../api/phase5ApiClient'
import { buildCheckoutPayload, createCheckoutAttempt, resetCheckoutAttempt } from '../utils/cartIntentModel'
import { normalizePhone } from '../utils/normalizePhone'

export function useCheckoutForm({ intentItems = [], intentContext = {}, validatedCart, validateCart, onSuccess }) {
  const [values, setValues] = useState(() => {
    try {
      const customer = JSON.parse(window.localStorage.getItem('public-store-customer') || '{}')
      return { name: customer.name || '', phone: customer.phone || '', note: '' }
    } catch { return { name: '', phone: '', note: '' } }
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [attempt, setAttempt] = useState(null)

  const setField = useCallback((field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }, [])

  const validate = () => {
    const nextErrors = {}
    const normalizedPhone = normalizePhone(values.phone)
    if (values.name.trim().length < 2) nextErrors.name = 'Nama minimal 2 karakter.'
    if (!normalizedPhone || normalizedPhone.length < 9) nextErrors.phone = 'Nomor WhatsApp wajib angka dan valid.'
    setErrors(nextErrors)
    return { ok: Object.keys(nextErrors).length === 0, normalizedPhone }
  }

  const submit = async () => {
    if (submitting) return null
    setSubmitError('')
    const result = validate()
    if (!result.ok) return null
    if (!intentItems.length) {
      setSubmitError('Keranjang masih kosong.')
      return null
    }

    setSubmitting(true)
    try {
      const backendCart = validatedCart?.valid ? validatedCart : await validateCart?.()
      if (!backendCart?.valid) {
        setSubmitError('Keranjang perlu diperiksa ulang sebelum checkout.')
        return null
      }
      const nextAttempt = createCheckoutAttempt({ existingAttempt: attempt })
      setAttempt(nextAttempt)
      const checkoutResponse = await phase5ApiClient.public.checkout(buildCheckoutPayload({
        context: intentContext,
        items: intentItems,
        customer: {
          name: values.name.trim(),
          phone: result.normalizedPhone,
          note: values.note.trim(),
        },
      }), { idempotencyKey: nextAttempt.idempotencyKey })
      const checkout = {
        ...checkoutResponse,
        paymentId: checkoutResponse.paymentId || checkoutResponse.payment?.id,
        paymentUrl: checkoutResponse.paymentUrl || checkoutResponse.payment?.payment_url,
        checkoutToken: checkoutResponse.checkoutToken || checkoutResponse.order?.public_order_token,
      }
      onSuccess?.(checkout)
      setAttempt(null)
      return checkout
    } catch (error) {
      setSubmitError(error.code === 'IDEMPOTENCY_CONFLICT' ? 'Percobaan checkout bentrok. Mulai percobaan baru.' : 'Checkout gagal dibuat. Coba lagi.')
      return null
    } finally {
      setSubmitting(false)
    }
  }

  const newAttempt = useCallback(() => setAttempt(resetCheckoutAttempt()), [])

  return { values, setField, errors, submitting, submitError, submit, attempt, newAttempt }
}
