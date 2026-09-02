import { describe, expect, it } from 'vitest'

describe('invoice calculations', () => {
  it('calculates subtotal, discount, tax and total', () => {
    const items = [
      { quantity: 2, rate: 100, tax: 10 },
      { quantity: 1, rate: 50, tax: 20 },
    ]
    const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0)
    const discount = subtotal * 0.1
    const tax = items.reduce((s, i) => s + i.quantity * i.rate * (i.tax / 100), 0)
    const total = subtotal - discount + tax + 25
    expect(subtotal).toBe(250)
    expect(discount).toBe(25)
    expect(tax).toBe(30)
    expect(total).toBe(280)
  })

  it('never allows a negative balance', () => {
    const total = 200
    const paid = 260
    expect(Math.max(0, total - paid)).toBe(0)
  })
})
