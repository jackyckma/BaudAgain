/**
 * JSON Schema definitions for system administration endpoints
 */

export const dashboardSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        currentCallers: { type: 'number' },
        totalUsers: { type: 'number' },
        messagesToday: { type: 'number' },
        recentActivity: { type: 'array' },
        uptime: { type: 'number' },
        nodeUsage: {
          type: 'object',
          properties: {
            active: { type: 'number' },
            total: { type: 'number' }
          }
        }
      }
    }
  }
};

export const aiSettingsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        provider: { type: 'string' },
        model: { type: 'string' },
        sysop: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            welcomeNewUsers: { type: 'boolean' },
            participateInChat: { type: 'boolean' },
            chatFrequency: { type: 'string' },
            personality: { type: 'string' }
          }
        },
        doors: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            maxTokensPerTurn: { type: 'number' }
          }
        }
      }
    }
  }
};

export const systemAnnouncementSchema = {
  body: {
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'string',
        minLength: 1,
        maxLength: 500,
        description: 'Announcement message'
      },
      priority: {
        type: 'string',
        enum: ['low', 'normal', 'high', 'critical'],
        default: 'normal',
        description: 'Announcement priority level'
      },
      expiresAt: {
        type: 'string',
        format: 'date-time',
        description: 'Optional expiration date for the announcement'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        announcement: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            priority: { type: 'string' },
            expiresAt: { type: ['string', 'null'] },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }
};

export const pageSysOpSchema = {
  body: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        maxLength: 500,
        description: 'Optional question for the AI SysOp'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        response: { type: 'string' },
        responseTime: { type: 'number' }
      }
    }
  }
};
