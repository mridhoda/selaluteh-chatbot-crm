export function classifyCommerceAmbiguity(text = '') {
  const normalized = String(text || '').toLowerCase();
  const hypothetical = /\b(harga|berapa|menu|ada apa|rekomendasi|kalau|kalo|misalnya)\b/.test(normalized);
  const explicitMutation = /\b(tambahkan|masukkan|checkout sekarang|konfirmasi pesanan|pilih outlet)\b/.test(normalized);
  return {
    mutationAllowed: explicitMutation && !hypothetical,
    reason: hypothetical && !explicitMutation ? 'hypothetical_or_menu_request' : 'explicit_customer_choice_required',
  };
}

export function buildOutletRecommendation({ outlet }) {
  return Object.freeze({
    recommendedOutletId: outlet?.id || null,
    recommendedOutletName: outlet?.name || null,
    selectedOutletId: null,
    requiresCustomerConfirmation: true,
  });
}

export function confirmRecommendedOutlet({ recommendation, customerConfirmedOutletId }) {
  if (!recommendation?.recommendedOutletId || recommendation.recommendedOutletId !== customerConfirmedOutletId) {
    const error = new Error('OUTLET_CONFIRMATION_REQUIRED');
    error.code = 'OUTLET_CONFIRMATION_REQUIRED';
    throw error;
  }
  return Object.freeze({ ...recommendation, selectedOutletId: customerConfirmedOutletId, requiresCustomerConfirmation: false });
}

export function buildCheckoutSummaryConfirmation({ cart }) {
  const items = (cart?.items || []).map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.effectivePrice ?? item.unitPrice ?? 0,
    subtotal: item.subtotal ?? item.subtotalAmount ?? 0,
  }));
  const totalAmount = cart?.total ?? cart?.totalAmount ?? items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemText = items.map((item) => `${item.quantity}x ${item.name} (${item.subtotal})`).join(', ');
  return Object.freeze({
    action: 'checkout_cart',
    cartId: cart?.id || null,
    cartVersion: cart?.version ?? null,
    outletId: cart?.outletId || null,
    items,
    totalAmount,
    confirmationText: `Konfirmasi checkout pickup: ${itemText}. Total: ${totalAmount}.`,
  });
}
