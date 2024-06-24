import { strict as assert } from "assert"
import { describe, it } from "mocha"
import { add } from "./math"

describe("app", () => {
	it("add", () => {
		assert.equal(add(1, 2), 3)
	})
})
