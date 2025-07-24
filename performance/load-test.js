import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Authentication token (you would get this from login)
let authToken = ''

export function setup() {
  // Login to get authentication token
  const loginResponse = http.post(`${BASE_URL}/api/auth/signin`, {
    email: 'test@example.com',
    password: 'password123',
  })
  
  if (loginResponse.status === 200) {
    const cookies = loginResponse.cookies
    authToken = cookies['next-auth.session-token']?.[0]?.value || ''
  }
  
  return { authToken }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `next-auth.session-token=${data.authToken}`,
  }

  // Test scenarios
  const scenarios = [
    testDashboard,
    testCustomersList,
    testCustomerDetails,
    testCreateCustomer,
    testDealsList,
    testTasksList,
    testAnalytics,
  ]

  // Randomly select a scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
  scenario(headers)

  sleep(1)
}

function testDashboard(headers) {
  const response = http.get(`${BASE_URL}/api/dashboard/stats`, { headers })
  
  const success = check(response, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 500ms': (r) => r.timings.duration < 500,
    'dashboard has stats data': (r) => {
      try {
        const data = JSON.parse(r.body)
        return data.success && data.stats
      } catch {
        return false
      }
    },
  })
  
  errorRate.add(!success)
}

function testCustomersList(headers) {
  const response = http.get(`${BASE_URL}/api/customers?page=1&limit=20`, { headers })
  
  const success = check(response, {
    'customers list status is 200': (r) => r.status === 200,
    'customers list response time < 300ms': (r) => r.timings.duration < 300,
    'customers list has data': (r) => {
      try {
        const data = JSON.parse(r.body)
        return data.success && Array.isArray(data.customers)
      } catch {
        return false
      }
    },
  })
  
  errorRate.add(!success)
}

function testCustomerDetails(headers) {
  const response = http.get(`${BASE_URL}/api/customers/test-customer-1`, { headers })
  
  const success = check(response, {
    'customer details status is 200': (r) => r.status === 200,
    'customer details response time < 200ms': (r) => r.timings.duration < 200,
    'customer details has data': (r) => {
      try {
        const data = JSON.parse(r.body)
        return data.success && data.customer
      } catch {
        return false
      }
    },
  })
  
  errorRate.add(!success)
}

function testCreateCustomer(headers) {
  const customerData = {
    firstName: `Test${Math.random().toString(36).substr(2, 9)}`,
    lastName: 'Customer',
    email: `test${Math.random().toString(36).substr(2, 9)}@example.com`,
    company: 'Load Test Company',
  }

  const response = http.post(`${BASE_URL}/api/customers`, JSON.stringify(customerData), { headers })
  
  const success = check(response, {
    'create customer status is 201': (r) => r.status === 201,
    'create customer response time < 1000ms': (r) => r.timings.duration < 1000,
    'create customer returns data': (r) => {
      try {
        const data = JSON.parse(r.body)
        return data.success && data.customer
      } catch {
        return false
      }
    },
  })
  
  errorRate.add(!success)
}

function testDealsList(headers) {
  const response = http.get(`${BASE_URL}/api/deals?page=1&limit=20`, { headers })
  
  const success = check(response, {
    'deals list status is 200': (r) => r.status === 200,
    'deals list response time < 400ms': (r) => r.timings.duration < 400,
    'deals list has data': (r) => {
      try {
        const data = JSON.parse(r.body)
        return data.success && Array.isArray(data.deals)
      } catch {
        return false
      }
    },
  })
  
  errorRate.add(!success)
}

function testTasksList(headers) {
  const response = http.get(`${BASE_URL}/api/tasks?page=1&limit=20`, { headers })
  
  const success = check(response, {
    'tasks list status is 200': (r) => r.status === 200,
    'tasks list response time < 300ms': (r) => r.timings.duration < 300,
    'tasks list has data': (r) => {
      try {
        const data = JSON.parse(r.body)
        return data.success && Array.isArray(data.tasks)
      } catch {
        return false
      }
    },
  })
  
  errorRate.add(!success)
}

function testAnalytics(headers) {
  const response = http.get(`${BASE_URL}/api/analytics/sales-performance`, { headers })
  
  const success = check(response, {
    'analytics status is 200': (r) => r.status === 200,
    'analytics response time < 800ms': (r) => r.timings.duration < 800,
    'analytics has data': (r) => {
      try {
        const data = JSON.parse(r.body)
        return data.success && data.analytics
      } catch {
        return false
      }
    },
  })
  
  errorRate.add(!success)
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Load test completed')
}