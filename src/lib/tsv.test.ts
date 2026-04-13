import { describe, expect, it } from 'vitest'
import { parseTsv, serializeTsv } from './tsv'

describe('tsv helpers', () => {
  it('parses tab-delimited rows', () => {
    const result = parseTsv('Name\tId\r\nEmber March\t900')
    expect(result.headers).toEqual(['Name', 'Id'])
    expect(result.rows).toEqual([{ Name: 'Ember March', Id: '900' }])
  })

  it('serializes rows back to tab-delimited text', () => {
    const text = serializeTsv(['Name', 'Id'], [{ Name: 'Ember March', Id: '900' }])
    expect(text).toContain('Name\tId')
    expect(text).toContain('Ember March\t900')
  })
})
