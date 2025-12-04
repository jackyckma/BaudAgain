/**
 * JSON Schema definitions for user management endpoints
 */

export const listUsersSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        minimum: 1,
        default: 1,
        description: 'Page number for pagination'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 50,
        description: 'Number of items per page'
      },
      sort: {
        type: 'string',
        enum: ['handle', 'createdAt', 'lastLogin'],
        default: 'createdAt',
        description: 'Field to sort by'
      },
      order: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
        description: 'Sort order'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              handle: { type: 'string' },
              accessLevel: { type: 'number' },
              createdAt: { type: 'string' },
              lastLogin: { type: ['string', 'null'] },
              totalCalls: { type: 'number' },
              totalPosts: { type: 'number' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' }
          }
        }
      }
    }
  }
};

export const getUserSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'User ID'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        handle: { type: 'string' },
        realName: { type: ['string', 'null'] },
        location: { type: ['string', 'null'] },
        bio: { type: ['string', 'null'] },
        accessLevel: { type: 'number' },
        createdAt: { type: 'string' },
        lastLogin: { type: ['string', 'null'] },
        totalCalls: { type: 'number' },
        totalPosts: { type: 'number' }
      }
    }
  }
};

export const updateUserSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'User ID'
      }
    },
    additionalProperties: false
  },
  body: {
    type: 'object',
    properties: {
      realName: {
        type: 'string',
        maxLength: 100,
        description: 'Real name'
      },
      location: {
        type: 'string',
        maxLength: 100,
        description: 'Location'
      },
      bio: {
        type: 'string',
        maxLength: 500,
        description: 'Biography'
      },
      accessLevel: {
        type: 'number',
        minimum: 0,
        maximum: 255,
        description: 'Access level (admin only)'
      },
      preferences: {
        type: 'object',
        description: 'User preferences'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        handle: { type: 'string' },
        realName: { type: ['string', 'null'] },
        location: { type: ['string', 'null'] },
        bio: { type: ['string', 'null'] },
        accessLevel: { type: 'number' },
        preferences: { type: 'object' }
      }
    }
  }
};

export const updateAccessLevelSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'User ID'
      }
    },
    additionalProperties: false
  },
  body: {
    type: 'object',
    required: ['accessLevel'],
    properties: {
      accessLevel: {
        type: 'number',
        minimum: 0,
        maximum: 255,
        description: 'New access level'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        handle: { type: 'string' },
        accessLevel: { type: 'number' },
        createdAt: { type: 'string' },
        lastLogin: { type: ['string', 'null'] },
        totalCalls: { type: 'number' },
        totalPosts: { type: 'number' }
      }
    }
  }
};
