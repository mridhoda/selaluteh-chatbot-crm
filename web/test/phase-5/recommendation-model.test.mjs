import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterRecommendations,
  recommendationProduct,
} from '../../src/features/public-store/utils/recommendationModel.js'

test('recommendation model excludes unavailable and duplicate cart targets and caps three results', () => {
  const recommendations = filterRecommendations(
    [
      { id: 'in-cart', name: 'Already added' },
      { id: 'unavailable', name: 'Unavailable', isAvailable: false },
      { id: 'target-1', name: 'One' },
      { id: 'target-1', name: 'Duplicate' },
      { id: 'target-2', name: 'Two' },
      { id: 'target-3', name: 'Three' },
      { id: 'target-4', name: 'Four' },
    ],
    ['in-cart']
  )

  assert.deepEqual(
    recommendations.map((item) => item.productId),
    ['target-1', 'target-2', 'target-3']
  )
})

test('recommendation product preserves modifier options for the existing sheet', () => {
  const product = recommendationProduct({
    id: 'target-1',
    name: 'Tea',
    unit_price: 12000,
    modifiers: [
      { id: 'size', required: true, options: [{ id: 'large', name: 'Large' }] },
    ],
  })

  assert.equal(product.id, 'target-1')
  assert.equal(product.basePriceMinor, 12000)
  assert.equal(product.modifierGroups[0].isRequired, true)
  assert.equal(product.modifierGroups[0].options[0].isAvailable, true)
})

test('recommendation model preserves an explicit replace-source upgrade action', () => {
  const [upgrade] = filterRecommendations([
    {
      id: 'jumbo',
      source_product_id: 'medium',
      action_type: 'replace_source',
      name: 'Selkop Aren Creamy Jumbo',
    },
  ])

  assert.equal(upgrade.actionType, 'replace_source')
  assert.equal(upgrade.sourceProductId, 'medium')
})
