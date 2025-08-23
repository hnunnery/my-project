const crypto = require('crypto')

// Generate a secure random string for NEXTAUTH_SECRET
const secret = crypto.randomBytes(32).toString('hex')
console.log('Generated NEXTAUTH_SECRET:')
console.log(secret)
console.log('\nAdd this to your .env.local file:')
console.log(`NEXTAUTH_SECRET=${secret}`)
