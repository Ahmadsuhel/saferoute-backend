// export const registerSchema = {
//   tags: ['Auth'],
//   summary: 'Register new user',
//   body: {
//     type: 'object',
//     required: ['name', 'email', 'phone', 'password', 'city'],
//     properties: {
//       name: {
//         type: 'string',
//         minLength: 2
//       },
//       email: {
//         type: 'string',
//         format: 'email'
//       },
//       phone: {
//         type: 'string',
//         minLength: 10,
//         maxLength: 10
//       },
//       password: {
//         type: 'string',
//         minLength: 6
//       },
//       city: {
//         type: 'string'
//       }
//     },
//     examples: [
//       {
//         name: 'Rahul Kumar',
//         email: 'rahul@gmail.com',
//         phone: '9876543210',
//         password: 'Secret@123',
//         city: 'Delhi'
//       }
//     ]
//   }
// }

// export const loginSchema = {
//   tags:    ['Auth'],
//   summary: 'Login user',
//   body: {
//     type: 'object',
//     required: ['email', 'password'],
//     properties: {
//       email:    { type: 'string', format: 'email', example: 'rahul@gmail.com' },
//       password: { type: 'string',                  example: 'Secret@123'      },
//     }
//   }
// }

// export const forgotPasswordSchema = {
//   tags:    ['Auth'],
//   summary: 'Forgot password — send OTP',
//   body: {
//     type: 'object',
//     required: ['email'],
//     properties: {
//       email: { type: 'string', format: 'email', example: 'rahul@gmail.com' }
//     }
//   }
// }

// export const verifyOtpSchema = {
//   tags:    ['Auth'],
//   summary: 'Verify OTP',
//   body: {
//     type: 'object',
//     required: ['email', 'otp'],
//     properties: {
//       email: { type: 'string', format: 'email', example: 'rahul@gmail.com' },
//       otp:   { type: 'string', minLength: 6, maxLength: 6, example: '482910' },
//     }
//   }
// }

// export const resetPasswordSchema = {
//   tags:    ['Auth'],
//   summary: 'Reset password',
//   body: {
//     type: 'object',
//     required: ['email', 'otp', 'newPassword'],
//     properties: {
//       email:       { type: 'string', format: 'email', example: 'rahul@gmail.com' },
//       otp:         { type: 'string', example: '482910'      },
//       newPassword: { type: 'string', minLength: 6, example: 'NewSecret@123' },
//     }
//   }
// }

// export const refreshSchema = {
//   tags:    ['Auth'],
//   summary: 'Refresh access token',
//   body: {
//     type: 'object',
//     required: ['refreshToken'],
//     properties: {
//       refreshToken: { type: 'string', example: 'eyJhbGci...' }
//     }
//   }
// }

// export const logoutSchema = {
//   tags:     ['Auth'],
//   summary:  'Logout',
//   security: [{ BearerAuth: [] }],
//   body: {
//     type: 'object',
//     required: ['refreshToken'],
//     properties: {
//       refreshToken: { type: 'string', example: 'eyJhbGci...' }
//     }
//   }
// }

// export const getMeSchema = {
//   tags:     ['Auth'],
//   summary:  'Get current user profile',
//   security: [{ BearerAuth: [] }],
// }




export const registerSchema = {
  tags: ['Auth'],
  summary: 'Register new user',
  body: {
    type: 'object',
    required: ['name', 'email', 'phone', 'password', 'city'],
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' },
      phone: { type: 'string', minLength: 10, maxLength: 10 },
      password: { type: 'string', minLength: 6 },
      city: { type: 'string' }
    },
    examples: [
      {
        name: 'Rahul Kumar',
        email: 'rahul@gmail.com',
        phone: '9876543210',
        password: 'Secret@123',
        city: 'Delhi'
      }
    ]
  }
}

export const loginSchema = {
  tags: ['Auth'],
  summary: 'Login user',
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
    },
    examples: [
      {
        email: 'rahul@gmail.com',
        password: 'Secret@123'
      }
    ]
  }
}

export const forgotPasswordSchema = {
  tags: ['Auth'],
  summary: 'Forgot password — send OTP',
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' }
    },
    examples: [
      {
        email: 'rahul@gmail.com'
      }
    ]
  }
}

// export const verifyOtpSchema = {
//   tags: ['Auth'],
//   summary: 'Verify OTP',
//   body: {
//     type: 'object',
//     required: ['email', 'otp'],
//     properties: {
//       email: { type: 'string', format: 'email' },
//       otp: { type: 'string', minLength: 6, maxLength: 6 }
//     },
//     examples: [
//       {
//         email: 'rahul@gmail.com',
//         otp: '482910'
//       }
//     ]
//   }
// }



export const changePasswordSchema = {
  tags:        ['Auth'],
  summary:     'Change password',
  description: 'Logged in user — old password verify karke new password set karo',
  security:    [{ BearerAuth: [] }],
  body: {
    type: 'object',
    required: ['oldPassword', 'newPassword'],
    properties: {
      oldPassword: { type: 'string', minLength: 6},
      newPassword: { type: 'string', minLength: 6},
    },
    examples: [
      {
       
        oldPassword: 'Secret@123',
        newPassword: 'NewSecret@123'
      }
    ]
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success:   { type: 'boolean' },
        message:   { type: 'string'  },
        timestamp: { type: 'string'  }
      }
    }
  }
}

export const resetPasswordSchema = {
  tags: ['Auth'],
  summary: 'Reset password',
  body: {
    type: 'object',
    required: ['email', 'otp', 'newPassword'],
    properties: {
      email: { type: 'string', format: 'email' },
      otp: { type: 'string' },
      newPassword: { type: 'string', minLength: 6 }
    },
    examples: [
      {
        email: 'rahul@gmail.com',
        otp: '482910',
        newPassword: 'NewSecret@123'
      }
    ]
  }
}

export const refreshSchema = {
  tags: ['Auth'],
  summary: 'Refresh access token',
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' }
    },
    examples: [
      {
        refreshToken: 'eyJhbGci...'
      }
    ]
  }
}

export const logoutSchema = {
  tags: ['Auth'],
  summary: 'Logout',
  security: [{ BearerAuth: [] }],
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' }
    },
    examples: [
      {
        refreshToken: 'eyJhbGci...'
      }
    ]
  }
}

export const getMeSchema = {
  tags: ['Auth'],
  summary: 'Get current user profile',
  security: [{ BearerAuth: [] }]
}