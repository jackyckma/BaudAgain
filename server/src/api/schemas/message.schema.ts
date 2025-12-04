/**
 * JSON Schema definitions for message and message base endpoints
 */

export const listMessageBasesSchema = {
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
        enum: ['name', 'sortOrder', 'postCount', 'lastPostAt'],
        default: 'sortOrder',
        description: 'Field to sort by'
      },
      order: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'asc',
        description: 'Sort order'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        messageBases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: ['string', 'null'] },
              accessLevelRead: { type: 'number' },
              accessLevelWrite: { type: 'number' },
              postCount: { type: 'number' },
              lastPostAt: { type: ['string', 'null'] },
              sortOrder: { type: 'number' }
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

export const getMessageBaseSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Message base ID'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] },
        accessLevelRead: { type: 'number' },
        accessLevelWrite: { type: 'number' },
        postCount: { type: 'number' },
        lastPostAt: { type: ['string', 'null'] },
        sortOrder: { type: 'number' },
        permissions: {
          type: 'object',
          properties: {
            canRead: { type: 'boolean' },
            canWrite: { type: 'boolean' }
          }
        }
      }
    }
  }
};

export const createMessageBaseSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Message base name'
      },
      description: {
        type: 'string',
        maxLength: 500,
        description: 'Message base description'
      },
      accessLevelRead: {
        type: 'number',
        minimum: 0,
        maximum: 255,
        default: 0,
        description: 'Minimum access level to read'
      },
      accessLevelWrite: {
        type: 'number',
        minimum: 0,
        maximum: 255,
        default: 10,
        description: 'Minimum access level to write'
      },
      sortOrder: {
        type: 'number',
        minimum: 0,
        default: 0,
        description: 'Sort order for display'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] },
        accessLevelRead: { type: 'number' },
        accessLevelWrite: { type: 'number' },
        postCount: { type: 'number' },
        lastPostAt: { type: ['string', 'null'] },
        sortOrder: { type: 'number' }
      }
    }
  }
};

export const updateMessageBaseSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Message base ID'
      }
    },
    additionalProperties: false
  },
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Message base name'
      },
      description: {
        type: 'string',
        maxLength: 500,
        description: 'Message base description'
      },
      accessLevelRead: {
        type: 'number',
        minimum: 0,
        maximum: 255,
        description: 'Minimum access level to read'
      },
      accessLevelWrite: {
        type: 'number',
        minimum: 0,
        maximum: 255,
        description: 'Minimum access level to write'
      },
      sortOrder: {
        type: 'number',
        minimum: 0,
        description: 'Sort order for display'
      }
    },
    additionalProperties: false
  }
};

export const deleteMessageBaseSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Message base ID'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  }
};

export const listMessagesSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Message base ID'
      }
    },
    additionalProperties: false
  },
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
        enum: ['createdAt'],
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
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              baseId: { type: 'string' },
              parentId: { type: ['string', 'null'] },
              userId: { type: 'string' },
              authorHandle: { type: 'string' },
              subject: { type: 'string' },
              body: { type: 'string' },
              createdAt: { type: 'string' },
              editedAt: { type: ['string', 'null'] }
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

export const getMessageSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Message ID'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        baseId: { type: 'string' },
        parentId: { type: ['string', 'null'] },
        userId: { type: 'string' },
        authorHandle: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
        createdAt: { type: 'string' },
        editedAt: { type: ['string', 'null'] }
      }
    }
  }
};

export const postMessageSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Message base ID'
      }
    },
    additionalProperties: false
  },
  body: {
    type: 'object',
    required: ['subject', 'body'],
    properties: {
      subject: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Message subject'
      },
      body: {
        type: 'string',
        minLength: 1,
        maxLength: 10000,
        description: 'Message body'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        baseId: { type: 'string' },
        parentId: { type: ['string', 'null'] },
        userId: { type: 'string' },
        authorHandle: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
        createdAt: { type: 'string' }
      }
    }
  }
};

export const postReplySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: {
        type: 'string',
        description: 'Parent message ID'
      }
    },
    additionalProperties: false
  },
  body: {
    type: 'object',
    required: ['subject', 'body'],
    properties: {
      subject: {
        type: 'string',
        minLength: 1,
        maxLength: 200,
        description: 'Reply subject'
      },
      body: {
        type: 'string',
        minLength: 1,
        maxLength: 10000,
        description: 'Reply body'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        baseId: { type: 'string' },
        parentId: { type: ['string', 'null'] },
        userId: { type: 'string' },
        authorHandle: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
        createdAt: { type: 'string' }
      }
    }
  }
};
