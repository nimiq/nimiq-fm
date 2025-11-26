import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const nodeRpcUrl = config.nimiqRpcUrl

  const response = await fetch(nodeRpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getActiveValidators',
      params: [],
      id: 1,
    }),
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  const validators = data.result.data
  const validatorCount = Array.isArray(validators) ? validators.length : 0

  return {
    count: validatorCount,
    validators,
  }
})
