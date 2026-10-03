import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createBezierCurvePath } from '../src/utils/routePath.js'

test('returns original path when there are fewer than two points', () => {
  const onePointPath = [[75, 39]]

  assert.deepEqual(createBezierCurvePath(onePointPath), onePointPath)
})

test('keeps original start and end points while adding intermediate curve points', () => {
  const path = [
    [75, 39],
    [80, 40],
    [85, 38],
  ]

  const curvedPath = createBezierCurvePath(path)

  assert.deepEqual(curvedPath[0], path[0])
  assert.deepEqual(curvedPath.at(-1), path.at(-1))
  assert.ok(curvedPath.length > path.length)
})
